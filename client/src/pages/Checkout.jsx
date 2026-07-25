import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { initiatePayment, checkAndRecoverPayment } from '../razorpay';
import { supabase } from '../supabase';
import { calcOrderTotals, FREE_SHIPPING_MIN, fetchShippingDetails, calcRazorpayTaxFee } from "../utils/shipping";
import { API_BASE } from "../config/api";
import { suggestEmailTypo } from "../utils/emailValidation";
import ReactGA from "react-ga4";
import BrandLogo from "../components/BrandLogo";
import { getFirstImage } from "../utils/imageHelpers";

const steps = ["DELIVERY", "PAYMENT", "CONFIRM"];

const cartLineKey = (item) => `${item.id}-${item.size}`;

function loadCartFromSession() {
  try {
    const data = sessionStorage.getItem("cart");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export default function CheckoutPage() {
  const [cart, setCart] = useState(loadCartFromSession);
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [delhiveryInfo, setDelhiveryInfo] = useState(null);
  const [checkingShipping, setCheckingShipping] = useState(false);

  useEffect(() => {
    if (cart.length > 0) {
      ReactGA.event("begin_checkout", {
        currency: "INR",
        value: calcOrderTotals(cart).total,
        items: cart.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.qty,
          item_variant: item.size
        }))
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setUser(data.session.user);
        setForm(p => ({
          ...p,
          name: data.session.user.user_metadata?.full_name || "",
          email: data.session.user.email || "",
          phone: data.session.user.user_metadata?.phone || "",
        }));
      }
    });
  }, []);

  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [payMethod, setPayMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  // idle | processing | verifying | success | failed | dismissed | error | recovering
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});

  const hasClearanceItem = useMemo(() => {
    return cart.some(item => item.is_clearance === true || item.type === "CLEARANCE SALE" || item.type === "CLEARANCE");
  }, [cart]);

  useEffect(() => {
    if (hasClearanceItem && (payMethod === 'cod' || payMethod === 'partial_cod')) {
      setPayMethod('razorpay');
    }
  }, [hasClearanceItem, payMethod]);

  // Effect to calculate dynamic shipping rate via Delhivery when pincode or payMethod changes
  useEffect(() => {
    const pincode = form.pincode.trim();
    if (/^\d{6}$/.test(pincode)) {
      setCheckingShipping(true);
      const paymentMode = payMethod === 'cod' ? 'COD' : payMethod === 'partial_cod' ? 'PARTIAL_COD' : 'PREPAID';
      fetchShippingDetails({ pincode, paymentMode, cart })
        .then(info => {
          setDelhiveryInfo(info);
          if (info && info.serviceable) {
            setForm(prev => ({
              ...prev,
              city: prev.city || info.city || "",
              state: prev.state || info.state || ""
            }));
          }
        })
        .finally(() => setCheckingShipping(false));
    } else {
      setDelhiveryInfo(null);
    }
  }, [form.pincode, payMethod, cart]);

  const dynamicFee = delhiveryInfo ? delhiveryInfo.totalShipping : null;
  const { subtotal, shipping, total, freeShippingGap } = calcOrderTotals(cart, dynamicFee, payMethod);

  // Partial COD: pay ₹99 delivery + half jersey price upfront, rest on delivery
  const halfJerseyPrice = Math.ceil(subtotal / 2);
  const partialCodUpfront = shipping === 0 ? 0 : (shipping + halfJerseyPrice); // shipping + half jersey
  const partialCodDoorstep = subtotal - halfJerseyPrice; // remaining half

  // COD & Shipping calculations
  const razorpayTaxFee = 0;
  const payNowOnline = cart.length === 0 ? 0
    : payMethod === "cod" ? shipping
    : payMethod === "partial_cod" ? partialCodUpfront
    : total;
  const payAtDoorstep = cart.length === 0 ? 0
    : payMethod === "cod" ? subtotal
    : payMethod === "partial_cod" ? partialCodDoorstep
    : 0;
  const payNow = payNowOnline;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter valid 10-digit number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter valid email";
    if (!user && password.length > 0 && password.length < 6) e.password = "Minimum 6 characters";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleNext = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty! Please add items before checking out.");
      navigate("/");
      return;
    }

    if (step === 0) {
      if (!validate()) return;
      if (!user && password.length >= 6) {
        const normalizedEmail = form.email.trim().toLowerCase();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: { full_name: form.name.trim(), phone: form.phone } }
        });

        if (signUpError) {
          setErrors({ email: signUpError.message });
          return;
        }
      }
    }
    setStep(s => s + 1);
  };

  const decrementStock = async () => {
    // Handled by backend now
  };

  const handlePlace = async () => {
    setLoading(true);
    setPaymentStatus('idle');
    try {
      const razorpayReady = await loadRazorpayScript();
      if (!razorpayReady) {
        alert('Unable to load Razorpay. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const onStatusChange = (status) => setPaymentStatus(status);

      if (payMethod === 'cod') {
        initiatePayment(payNowOnline, form.name, form.email, form.phone, cart, navigate, decrementStock, form, user, 'cod', onStatusChange);
      } else if (payMethod === 'partial_cod') {
        initiatePayment(payNowOnline, form.name, form.email, form.phone, cart, navigate, decrementStock, form, user, 'partial_cod', onStatusChange);
      } else {
        initiatePayment(total, form.name, form.email, form.phone, cart, navigate, decrementStock, form, user, 'online', onStatusChange);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #39ff14;
          --green-glow: rgba(57, 255, 20, 0.35);
          --green-soft: rgba(57, 255, 20, 0.08);
          --green-border: rgba(57, 255, 20, 0.25);
        }

        .field { background: #0f0f10; border: 1px solid #27272a; color: #fff; padding: 14px 18px; font-family: 'Barlow', sans-serif; font-size: 14px; width: 100%; outline: none; letter-spacing: 0.5px; transition: all 0.2s ease-in-out; border-radius: 2px; }
        .field:focus { border-color: #39ff14; box-shadow: 0 0 0 1px #39ff14, 0 0 12px rgba(57, 255, 20, 0.25); background: #121214; }
        .field.err { border-color: #ff4444; box-shadow: 0 0 8px rgba(255,68,68,0.2); }
        .field::placeholder { color: #52525b; font-family: 'Barlow Condensed', sans-serif; letter-spacing: 1px; }
        .label { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; letter-spacing: 2px; color: #a1a1aa; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; display: block; }
        
        .checkout-nav { background: rgba(10,10,10,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #1c1c1e; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .checkout-field-error { color: #ff5555; font-size: 12px; margin-top: 5px; letter-spacing: 0.5px; font-weight: 500; }
        .checkout-step-label { font-size: 12px; letter-spacing: 2px; font-weight: 800; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; }
        .checkout-section-label { font-size: 12px; letter-spacing: 3px; color: #39ff14; margin-bottom: 10px; font-weight: 800; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; }
        
        .checkout-pay-info { background: rgba(57,255,20,0.04); border: 1px solid rgba(57,255,20,0.2); padding: 14px 18px; margin-top: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; border-radius: 2px; }
        .checkout-status-box { padding: 16px 20px; margin-top: 14px; display: flex; align-items: center; gap: 14px; border-radius: 2px; }
        .checkout-status-processing { background: rgba(10,10,10,0.95); border: 1px solid #27272a; }
        .checkout-status-verifying { background: rgba(57,255,20,0.05); border: 1px solid rgba(57,255,20,0.3); }
        .checkout-status-failed { background: rgba(255,68,68,0.08); border: 1px solid rgba(255,68,68,0.3); padding: 20px; border-radius: 2px; }
        .checkout-recover-btn { background: #39ff14; color: #000; border: none; padding: 14px 20px; font-weight: 900; font-size: 14px; letter-spacing: 2px; font-family: 'Barlow Condensed', sans-serif; cursor: pointer; width: 100%; margin-bottom: 10px; transition: all 0.2s; }
        .checkout-recover-btn:hover { box-shadow: 0 0 20px rgba(57,255,20,0.5); }
        
        .checkout-summary-thumb { width: 52px; height: 52px; background: #0d0d0d; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; overflow: hidden; border: 1px solid #27272a; }
        .checkout-qty-badge { position: absolute; top: -6px; right: -6px; background: #39ff14; color: #000; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; font-family: 'Barlow Condensed', sans-serif; }
        .checkout-item-size { color: #a1a1aa; font-size: 12px; letter-spacing: 2px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
        .checkout-trust-badge { font-size: 11px; letter-spacing: 2px; color: #a1a1aa; border: 1px solid #27272a; padding: 6px 12px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; background: #0d0d0d; }
        .checkout-cod-note { font-size: 12px; color: #39ff14; margin-top: 10px; letter-spacing: 1px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; background: rgba(57,255,20,0.04); border: 1px solid rgba(57,255,20,0.15); padding: 8px 12px; }
        
        .pay-card { border: 1px solid #27272a; padding: 18px 22px; cursor: pointer; display: flex; align-items: center; gap: 16px; transition: all 0.25s ease-in-out; background: #0f0f10; margin-bottom: 12px; width: 100%; text-align: left; font: inherit; color: inherit; border-radius: 2px; }
        .pay-card.active { border-color: #39ff14; background: rgba(57, 255, 20, 0.05); box-shadow: 0 0 15px rgba(57, 255, 20, 0.15); }
        .pay-card:hover:not(.active) { border-color: #52525b; background: #141416; }
        
        .next-btn {
          background: #39ff14;
          color: #000000;
          border: 1px solid #39ff14;
          width: 100%;
          padding: 18px 20px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 16px;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          margin-top: 24px;
          box-shadow: 0 0 15px rgba(57, 255, 20, 0.25);
        }
        .next-btn:hover:not(:disabled) {
          background: #39ff14;
          color: #000000;
          border-color: #39ff14;
          box-shadow: 0 0 25px rgba(57, 255, 20, 0.6);
          letter-spacing: 4px;
        }
        .next-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .step-dot-active { box-shadow: 0 0 18px rgba(57, 255, 20, 0.5); }
        .next-btn:disabled {
          background: #18181b;
          color: #52525b;
          border-color: #27272a;
          box-shadow: none;
          cursor: not-allowed;
        }
        .back-btn {
          background: transparent;
          color: #a1a1aa;
          border: 1px solid #27272a;
          width: 100%;
          padding: 13px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 500;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          margin-top: 10px;
        }
        .back-btn:hover {
          border-color: #555;
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
        }
        .back-btn:active {
          transform: scale(0.98);
        }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; letter-spacing: 0; transition: all 0.3s; }
        .step-line { flex: 1; height: 1px; transition: background 0.5s; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #00ff44; }

        /* Two-column form grid → single column on mobile (≤640px) */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        /* Three half-width fields (city/state/pincode) → inline pair on sm range */
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; gap: 12px; }
          /* Every field expands to full width on mobile */
          .form-grid > div { grid-column: 1 / -1 !important; }
        }
        /* On tablet (641–860px) keep 2-col grid, city+state side by side naturally */

        /* Outer layout: side-by-side on desktop, stacked on mobile */
        .checkout-layout {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 24px;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .checkout-layout {
            grid-template-columns: 1fr;
            padding: 24px 16px;
          }
        }

        /* Order summary: sticky on desktop → static below form steps on mobile */
        .order-summary-panel {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          padding: 24px;
          position: sticky;
          top: 80px;
          animation: fadeUp 0.6s ease 0.1s both;
        }
        @media (max-width: 860px) {
          .order-summary-panel {
            position: static;
            /* Form steps appear first; summary stacks naturally below */
            order: 2;
          }
        }

        /* Left panel (form steps) stays first in DOM → always renders above summary */
        .checkout-left {
          animation: fadeUp 0.5s ease;
          order: 1;
        }

        /* Step indicator: shrink labels on very small screens */
        @media (max-width: 380px) {
          .step-label { font-size: 8px !important; letter-spacing: 1px !important; }
          .step-dot { width: 26px; height: 26px; font-size: 10px; }
        }

        /* Nav: tighten on mobile */
        @media (max-width: 480px) {
          .checkout-nav-title { font-size: 16px !important; }
          .checkout-nav-secure { display: none; }
        }

        /* Confirm page delivery/payment cards */
        @media (max-width: 480px) {
          .confirm-address { font-size: 13px !important; }
        }

        /* Touch-friendly tap targets */
        @media (max-width: 860px) {
          .next-btn { padding: 18px 16px; font-size: 15px; letter-spacing: 1.5px; }
          .back-btn { padding: 15px 16px; }
          .pay-card { padding: 14px 16px; }
          .field { padding: 14px 16px; font-size: 16px; /* prevents iOS auto-zoom */ }
        }

        /* ─── EXTRA SMALL SCREENS (≤ 400px) ────────────────────────── */
        @media (max-width: 400px) {
          .checkout-layout { padding: 16px 10px; gap: 16px; }
          .order-summary-panel { padding: 16px 14px; }
          .next-btn { font-size: 13px; letter-spacing: 1px; padding: 16px 12px; }
          .back-btn { font-size: 12px; letter-spacing: 1px; padding: 13px 12px; }
          .pay-card { padding: 12px; gap: 10px; }
          .field { padding: 13px 12px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="checkout-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrandLogo style={{ height: "36px" }} />
        </div>
        <span className="checkout-nav-secure" style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>SECURE CHECKOUT 🔒</span>
      </nav>

      <main id="main-content" className="checkout-layout" style={{ gridTemplateColumns: step === 0 ? "1fr" : undefined }}>

        {/* LEFT PANEL */}
        <div className="checkout-left" style={step === 0 ? { maxWidth: "600px", margin: "0 auto", width: "100%" } : {}}>

          {/* STEP INDICATOR */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div className={`step-dot${i <= step ? " step-dot-active" : ""}`} style={{ background: i <= step ? "#00ff44" : "#111", color: i <= step ? "#000" : "#333", border: i <= step ? "1px solid #00ff44" : "1px solid #222" }}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="step-label checkout-step-label" style={{ color: i <= step ? "#00ff44" : "#333" }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className="step-line" style={{ background: i < step ? "#00ff44" : "#222", margin: "0 8px", marginBottom: 20 }} />}
              </div>
            ))}
          </div>

          {/* STEP 0 — DELIVERY */}
          {step === 0 && (
            <div style={{ animation: "fadeUp 0.4s ease", display: "flex", flexDirection: "column", gap: "24px", padding: "24px 0" }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 0, fontFamily: "'Barlow', sans-serif", fontStyle: "normal", letterSpacing: "0.04em", textTransform: "uppercase" }}><span style={{ color: "#00ff44" }}>/ </span>DELIVERY DETAILS</h2>
              <div className="form-grid">
                {(user ? [
                  { key: "phone", label: "PHONE NUMBER", placeholder: "9876543210", full: false },
                  { key: "address", label: "STREET ADDRESS", placeholder: "Flat 4B, Park Street", full: true },
                  { key: "city", label: "CITY", placeholder: "Kolkata", full: false },
                  { key: "state", label: "STATE", placeholder: "West Bengal", full: false },
                  { key: "pincode", label: "PINCODE", placeholder: "700001", full: false },
                ] : [
                  { key: "name", label: "FULL NAME", placeholder: "FULL NAME", full: false },
                  { key: "phone", label: "PHONE NUMBER", placeholder: "9876543210", full: false },
                  { key: "email", label: "EMAIL ADDRESS", placeholder: "you@email.com", full: true },
                  { key: "address", label: "STREET ADDRESS", placeholder: "ADDRESS", full: true },
                  { key: "city", label: "CITY", placeholder: "CITY", full: false },
                  { key: "state", label: "STATE", placeholder: "STATE", full: false },
                  { key: "pincode", label: "PINCODE", placeholder: "123456", full: false },
                ]).map(f => (
                  <div key={f.key} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                    <label htmlFor={`field-${f.key}`} className="label">{f.label}</label>
                    <input
                      id={`field-${f.key}`}
                      aria-label={f.label}
                      className={`field ${errors[f.key] ? "err" : ""}`}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(p => ({ ...p, [f.key]: val }));
                        setErrors(p => ({ ...p, [f.key]: "" }));
                        if (f.key === 'email') {
                          setWarnings(p => ({ ...p, email: suggestEmailTypo(val) }));
                        }
                      }}
                      // Correct input modes for mobile keyboards
                      inputMode={f.key === "phone" || f.key === "pincode" ? "numeric" : f.key === "email" ? "email" : "text"}
                      autoComplete={
                        f.key === "name" ? "name" :
                          f.key === "phone" ? "tel" :
                            f.key === "email" ? "email" :
                              f.key === "address" ? "street-address" :
                                f.key === "city" ? "address-level2" :
                                  f.key === "state" ? "address-level1" :
                                    f.key === "pincode" ? "postal-code" : "off"
                      }
                    />
                    {errors[f.key] ? (
                      <div className="checkout-field-error">{errors[f.key]}</div>
                    ) : f.key === "email" && warnings.email ? (
                      <div className="checkout-field-error" style={{ color: "#fbbf24" }}>{warnings.email}</div>
                    ) : f.key === "pincode" ? (
                      checkingShipping ? (
                        <div style={{ color: "#a1a1aa", fontSize: 12, marginTop: 4, letterSpacing: 1 }}>
                          ⚡ Checking Delhivery serviceability...
                        </div>
                      ) : delhiveryInfo ? (
                        delhiveryInfo.serviceable ? (
                          <div style={{ color: "#00ff44", fontSize: 12, marginTop: 4, letterSpacing: 0.5, fontFamily: "'Barlow', sans-serif" }}>
                            ✓ Delhivery Serviceable {delhiveryInfo.city ? `(${delhiveryInfo.city})` : ''} · Shipping: {delhiveryInfo.freeShippingApplied ? 'FREE 🎉' : `₹${delhiveryInfo.totalShipping}`}
                          </div>
                        ) : (
                          <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4, letterSpacing: 0.5 }}>
                            ⚠️ {delhiveryInfo.remarks || "Pincode not serviceable by Delhivery"}
                          </div>
                        )
                      ) : null
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Password field for guest users only */}
              {!user && (
                <>
                  <div style={{ marginTop: 14 }}>
                    <label htmlFor="field-password" className="label">PASSWORD (OPTIONAL)</label>
                    <input id="field-password" className="field" type="password" placeholder="Create a password (min. 6 chars)"
                      aria-label="Create an account password (optional, minimum 6 characters)"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                      autoComplete="new-password" />
                    {errors.password && <div className="checkout-field-error">{errors.password}</div>}
                  </div>
                  <p style={{ color: "#a1a1aa", fontSize: 12, fontFamily: "'Barlow', sans-serif", letterSpacing: 1, marginTop: 10, lineHeight: 1.6, borderLeft: "2px solid rgba(0, 255, 68, 0.25)", paddingLeft: 10 }}>
                    💡 Your email & password will be saved for future logins — no need to re-enter next time.
                  </p>
                </>
              )}

              <button type="button" className="next-btn" onClick={handleNext}>CONTINUE TO PAYMENT →</button>
            </div>
          )}

          {/* STEP 1 — PAYMENT */}
          {step === 1 && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, fontFamily: "'Barlow', sans-serif", fontStyle: "normal", letterSpacing: "0.04em", textTransform: "uppercase" }}><span style={{ color: "#00ff44" }}>/ </span>PAYMENT METHOD</h2>



              {[
                {
                  id: "razorpay",
                  icon: "💳",
                  label: "PAY ONLINE",
                  sub: "UPI, Credit/Debit Card, Net Banking & more — choose inside Razorpay",
                },
                ...(!hasClearanceItem ? [
                  {
                    id: "cod",
                    icon: "💵",
                    label: "CASH ON DELIVERY",
                    sub: shipping === 0
                      ? `Free Shipping 🎉 · Pay ₹${subtotal.toLocaleString()} in cash on delivery`
                      : `Pay delivery charge (₹${shipping.toLocaleString()}) online now · Pay full jersey price (₹${subtotal.toLocaleString()}) on delivery`,
                  },
                  {
                    id: "partial_cod",
                    icon: "🤝",
                    label: "PARTIAL COD",
                    sub: shipping === 0
                      ? `Free Shipping 🎉 · Pay half (₹${Math.ceil(subtotal / 2).toLocaleString()}) now · Remaining ₹${(subtotal - Math.ceil(subtotal / 2)).toLocaleString()} on delivery`
                      : `Pay ₹${(shipping + Math.ceil(subtotal / 2)).toLocaleString()} now (₹${shipping} delivery + ₹${Math.ceil(subtotal / 2).toLocaleString()} half jersey) · Pay ₹${(subtotal - Math.ceil(subtotal / 2)).toLocaleString()} on delivery`,
                  },
                ] : []),
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  className={`pay-card ${payMethod === p.id ? "active" : ""}`}
                  onClick={() => setPayMethod(p.id)}
                >
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payMethod === p.id ? "#00ff44" : "#555"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {payMethod === p.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00ff44" }} />}
                  </div>
                  <span style={{ fontSize: 24 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase" }}>{p.label}</div>
                    <div style={{ color: "#a1a1aa", fontSize: 12, fontFamily: "'Barlow', sans-serif", fontWeight: 400, marginTop: 3, lineHeight: 1.5 }}>{p.sub}</div>
                  </div>
                  {payMethod === p.id && <div style={{ marginLeft: "auto", color: "#00ff44", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SELECTED</div>}
                </button>
              ))}

              {payMethod === "razorpay" && (
                <div className="checkout-pay-info">
                  <span style={{ fontSize: 18 }}>ℹ️</span>
                  <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, lineHeight: 1.5 }}>
                    Pay full amount now (₹{subtotal.toLocaleString()} jersey + {shipping === 0 ? "free shipping" : `₹${shipping} shipping`} = ₹{total.toLocaleString()}). UPI, Card, or Net Banking on the next screen.
                  </span>
                </div>
              )}
              {payMethod === "cod" && (
                <div className="checkout-pay-info">
                  <span style={{ fontSize: 18 }}>ℹ️</span>
                  <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, lineHeight: 1.5 }}>
                    Pay delivery charge (₹{shipping.toLocaleString()}) online now via Razorpay. Pay full jersey price (₹{subtotal.toLocaleString()}) in cash when your order arrives.
                  </span>
                </div>
              )}
              {payMethod === "partial_cod" && (
                <div className="checkout-pay-info">
                  <span style={{ fontSize: 18 }}>🤝</span>
                  <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, lineHeight: 1.5 }}>
                    Pay {shipping === 0 ? `half jersey price (₹${halfJerseyPrice.toLocaleString()}) now` : `₹${partialCodUpfront.toLocaleString()} now (₹${shipping} delivery + ₹${halfJerseyPrice.toLocaleString()} half jersey price)`}. Pay remaining ₹{partialCodDoorstep.toLocaleString()} in cash when your order arrives.
                  </span>
                </div>
              )}

              <button type="button" className="next-btn" onClick={handleNext}>REVIEW ORDER →</button>
              <button type="button" className="back-btn" onClick={() => setStep(0)}>← BACK</button>
            </div>
          )}

          {/* STEP 2 — CONFIRM */}
          {step === 2 && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, fontFamily: "'Barlow', sans-serif", fontStyle: "normal", letterSpacing: "0.04em", textTransform: "uppercase" }}><span style={{ color: "#00ff44" }}>/ </span>CONFIRM ORDER</h2>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20, marginBottom: 16 }}>
                <div className="checkout-section-label">DELIVERING TO</div>
                <div style={{ fontWeight: 600, fontSize: 16, fontFamily: "'Barlow', sans-serif" }}>{form.name}</div>
                <div className="confirm-address" style={{ color: "#a1a1aa", fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 400, marginTop: 4, lineHeight: 1.6 }}>
                  {form.address}, {form.city}, {form.state} — {form.pincode}<br />{form.phone} · {form.email}
                </div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20, marginBottom: 16 }}>
                <div className="checkout-section-label">PAYMENT VIA</div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#00ff44" }}>
                  {{ razorpay: "💳 ONLINE PAYMENT (Razorpay)", cod: "💵 CASH ON DELIVERY", partial_cod: "🤝 PARTIAL COD" }[payMethod]}
                </div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20 }}>
                <div className="checkout-section-label">YOUR ITEMS</div>
                {cart.map((item) => (
                  <div key={cartLineKey(item)} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #1a1a1a" }}>
                    {getFirstImage(item.image_url)
                      ? <img src={getFirstImage(item.image_url)} alt={item.name} style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0 }} />
                      : <span style={{ fontSize: 32 }}>👕</span>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Barlow', sans-serif" }}>{item.name}</div>
                      <div className="checkout-item-size">SIZE {item.size} · QTY {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 600, flexShrink: 0, fontFamily: "'Barlow', sans-serif" }}>₹{item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              <button type="button" className="next-btn" onClick={handlePlace} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    PROCESSING...
                  </span>
                ) : payMethod === 'cod'
                  ? `PAY ₹${payNowOnline.toLocaleString()} DELIVERY NOW →`
                  : payMethod === 'partial_cod'
                  ? `PAY ₹${payNowOnline.toLocaleString()} NOW →`
                  : `PAY NOW — ₹${total.toLocaleString()} →`}
              </button>

              {/* ── Payment Status Overlay ── */}
              {paymentStatus === 'processing' && (
                <div className="checkout-status-box checkout-status-processing">
                  <span style={{ width: 18, height: 18, border: '2px solid #00ff44', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  <span style={{ color: '#a1a1aa', fontSize: 13, letterSpacing: 1 }}>Processing Payment...</span>
                </div>
              )}

              {paymentStatus === 'verifying' && (
                <div className="checkout-status-box checkout-status-verifying">
                  <span style={{ width: 18, height: 18, border: '2px solid #00ff44', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  <span style={{ color: '#00ff44', fontSize: 13, letterSpacing: 1 }}>Verifying Payment... Please wait.</span>
                </div>
              )}

              {(paymentStatus === 'failed' || paymentStatus === 'dismissed' || paymentStatus === 'error') && (
                <div className="checkout-status-failed">
                  <div style={{ color: '#ff6666', fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                    {paymentStatus === 'dismissed' ? '⚠️ Payment window closed' : '❌ Payment Failed'}
                  </div>
                  <div style={{ color: '#a1a1aa', fontSize: 12, letterSpacing: 0.5, lineHeight: 1.6, marginBottom: 14 }}>
                    {paymentStatus === 'dismissed'
                      ? 'Did you complete payment inside your UPI app? Click below to check.'
                      : 'Something went wrong. If money was debited from your account, click below to verify.'}
                  </div>
                  <button type="button" className="checkout-recover-btn"
                    onClick={async () => {
                      const orderId = localStorage.getItem('pendingRazorpayOrderId');
                      if (!orderId) { alert('No pending order found. Please contact support.'); return; }
                      setPaymentStatus('recovering');
                      const result = await checkAndRecoverPayment(orderId);
                      if (result.status === 'captured') {
                        setPaymentStatus('success');
                        alert('✅ Payment confirmed! Redirecting to your order...');
                        // Re-finalize from localStorage form data
                        const formData = JSON.parse(localStorage.getItem('pendingOrderForm') || '{}');
                        navigate('/success');
                      } else {
                        setPaymentStatus('failed');
                        alert(`Payment status: ${result.status || 'not captured'}. Please try again or contact support with Order ID: ${orderId}`);
                      }
                    }}
                  >
                    🔍 CHECK PAYMENT STATUS
                  </button>
                  <div className="checkout-order-id">
                    Order ID: <span style={{ color: '#888' }}>{localStorage.getItem('pendingRazorpayOrderId') || '—'}</span>
                  </div>
                </div>
              )}

              {paymentStatus === 'recovering' && (
                <div className="checkout-status-box checkout-status-verifying" style={{ marginTop: 4 }}>
                  <span style={{ width: 18, height: 18, border: '2px solid #00ff44', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  <span style={{ color: '#00ff44', fontSize: 13, letterSpacing: 1 }}>Checking payment with Razorpay...</span>
                </div>
              )}

              <button type="button" className="back-btn" onClick={() => setStep(1)}>← BACK</button>
            </div>
          )}
        </div>

        {/* RIGHT — ORDER SUMMARY */}
        {step > 0 && (
          <div className="order-summary-panel">
            <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 4, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #1a1a1a", fontFamily: "'Barlow', sans-serif", fontStyle: "normal", textTransform: "uppercase", color: "#fff" }}>ORDER SUMMARY</h3>
            {cart.map((item) => (
              <div key={cartLineKey(item)} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <div className="checkout-summary-thumb">
                  {getFirstImage(item.image_url)
                    ? <img src={getFirstImage(item.image_url)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 24 }}>👕</span>
                  }
                  <div className="checkout-qty-badge">{item.qty}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Barlow', sans-serif" }}>{item.name}</div>
                  <div className="checkout-item-size">SIZE {item.size}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, flexShrink: 0, fontFamily: "'Barlow', sans-serif" }}>₹{item.price * item.qty}</div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: 8 }}>
              {[
                ["SUBTOTAL", `₹${subtotal.toLocaleString()}`],
                ["SHIPPING", shipping === 0 ? "FREE 🎉" : `₹${shipping.toLocaleString()}`],
                ...(payMethod === "cod" ? [["PAY AT DOORSTEP", `₹${subtotal.toLocaleString()}`]] : []),
                ...(payMethod === "partial_cod" ? [["PAY AT DOORSTEP", `₹${partialCodDoorstep.toLocaleString()}`]] : []),
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, letterSpacing: 1 }}>
                  <span style={{ color: "#888" }}>{l}</span>
                  <span style={{ color: v === "FREE 🎉" ? "#39ff14" : (l === "SHIPPING" || l === "PAY AT DOORSTEP") ? "#39ff14" : "#a1a1aa", fontWeight: (l === "SHIPPING" || l === "PAY AT DOORSTEP") ? 700 : 400 }}>{v}</span>
                </div>
              ))}
              {delhiveryInfo?.estimatedDays && (
                <div style={{ fontSize: 11, color: "#39ff14", letterSpacing: 1, marginBottom: 10, textAlign: "right" }}>
                  🚚 Est. Delivery: {delhiveryInfo.estimatedDays}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #1a1a1a", fontWeight: 800, fontSize: 20, fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span>{payMethod === "cod" || payMethod === "partial_cod" ? "ORDER TOTAL" : "PAY NOW"}</span>
                <span style={{ color: "#39ff14" }}>₹{total.toLocaleString()}</span>
              </div>
              {(payMethod === "cod" || payMethod === "partial_cod") && (
                <div className="checkout-cod-note">
                  PAY NOW: ₹{payNowOnline.toLocaleString()}
                </div>
              )}
            </div>
            {freeShippingGap > 0 && (
              <div style={{ background: "rgba(57, 255, 20, 0.05)", border: "1px solid rgba(57, 255, 20, 0.15)", padding: "10px 14px", marginTop: 16, fontSize: 12, letterSpacing: 1, color: "#39ff14" }}>
                💡 Add ₹{freeShippingGap.toLocaleString()} more for FREE shipping!
              </div>
            )}
            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["🔒 SECURE", "↩️ 30-DAY RETURN", "✓ AUTHENTIC"].map(t => (
                <span key={t} className="checkout-trust-badge">{t}</span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}