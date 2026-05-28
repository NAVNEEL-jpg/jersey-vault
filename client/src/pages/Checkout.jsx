import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initiatePayment, placeCodOrderFree } from "../razorpay";
import { supabase } from '../supabase';
import { calcOrderTotals, FREE_SHIPPING_MIN } from "../utils/shipping";

const steps = ["DELIVERY", "PAYMENT", "CONFIRM"];

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const data = sessionStorage.getItem("cart");
    if (data) setCart(JSON.parse(data));
  }, []);

  useEffect(() => {
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
  const [payMethod, setPayMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});

  const { subtotal, shipping, total, freeShippingGap } = calcOrderTotals(cart);

  // COD Safety Deposit & Shipping calculations
  const payNowOnline = cart.length === 0 ? 0 : (payMethod === "cod" ? 1 : total);
  const payAtDoorstep = cart.length === 0 ? 0 : (payMethod === "cod" ? (subtotal >= 1999 ? subtotal - 1 : subtotal) : 0);
  const payNow = payNowOnline;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter valid 10-digit number";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter valid email";
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
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password,
          options: { data: { full_name: form.name, phone: form.phone } }
        });

        if (!signUpError && signUpData?.user) {
          await supabase.from("profiles").upsert({
            id: signUpData.user.id,
            full_name: form.name,
            email: form.email,
            phone: form.phone,
          });
        }
      }
    }
    setStep(s => s + 1);
  };

  const decrementStock = async () => {
    for (const item of cart) {
      const { data: product } = await supabase
        .from("products")
        .select("size_stock")
        .eq("id", item.id)
        .single();

      if (product?.size_stock) {
        const newSizeStock = { ...product.size_stock };
        newSizeStock[item.size] = Math.max(0, (newSizeStock[item.size] || 0) - item.qty);
        await supabase.from("products").update({ size_stock: newSizeStock }).eq("id", item.id);
      }
    }
  };

  const handlePlace = async () => {
    setLoading(true);
    try {
      if (payMethod === "cod") {
        initiatePayment(payNowOnline, form.name, form.email, form.phone, cart, navigate, decrementStock, form, user, true);
      } else {
        const razorpayReady = await loadRazorpayScript();
        if (!razorpayReady) {
          alert("Unable to load Razorpay checkout. Please refresh and try again.");
          return;
        }
        initiatePayment(total, form.name, form.email, form.phone, cart, navigate, decrementStock, form, user, false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        .field { background: #121212; border: 1px solid #3f3f46; color: #fff; padding: 13px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; width: 100%; outline: none; letter-spacing: 1px; transition: all 0.2s ease-in-out; }
        .field:focus { border-color: #00ff44; box-shadow: 0 0 0 1px #00ff44, 0 0 10px rgba(0, 255, 68, 0.15); }
        .field.err { border-color: #ff4444; }
        .field::placeholder { color: #52525b; }
        .label { font-family: 'Barlow', sans-serif; font-size: 11px; letter-spacing: 3px; color: #a1a1aa; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; }
        .pay-card { border: 1px solid #222; padding: 16px 20px; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.2s; background: #111; margin-bottom: 10px; }
        .pay-card.active { border-color: #00ff44; background: rgba(0, 255, 68, 0.03); }
        .pay-card:hover:not(.active) { border-color: #333; }
        .next-btn {
          background: #1a1a1a;
          color: #ffffff;
          border: 1px solid #27272a;
          width: 100%;
          padding: 16px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 500;
          font-size: 14px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          margin-top: 20px;
        }
        .next-btn:hover:not(:disabled) {
          background: #00ff44;
          color: #000000;
          border-color: #00ff44;
          box-shadow: 0 0 15px rgba(0, 255, 68, 0.4);
        }
        .next-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .step-dot-active { box-shadow: 0 0 15px rgba(0, 255, 68, 0.3); }
        .next-btn:disabled {
          background: #111;
          color: #444;
          border-color: #222;
          cursor: not-allowed;
        }
        .back-btn {
          background: transparent;
          color: #888;
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
      <nav style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#00ff44", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000" }}>J</div>
          <span className="checkout-nav-title" style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>JERSEY<span style={{ color: "#00E65B", fontWeight: 900 }}>VAULT</span></span>
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
                  <span className="step-label" style={{ fontSize: 10, letterSpacing: 2, color: i <= step ? "#00ff44" : "#333", fontWeight: 700 }}>{s}</span>
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
                  { key: "name", label: "FULL NAME", placeholder: "Navneel Dutta", full: false },
                  { key: "phone", label: "PHONE NUMBER", placeholder: "9876543210", full: false },
                  { key: "email", label: "EMAIL ADDRESS", placeholder: "you@email.com", full: true },
                  { key: "address", label: "STREET ADDRESS", placeholder: "Flat 4B, Park Street", full: true },
                  { key: "city", label: "CITY", placeholder: "Kolkata", full: false },
                  { key: "state", label: "STATE", placeholder: "West Bengal", full: false },
                  { key: "pincode", label: "PINCODE", placeholder: "700001", full: false },
                ]).map(f => (
                  <div key={f.key} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                    <label htmlFor={`field-${f.key}`} className="label">{f.label}</label>
                    <input
                      id={`field-${f.key}`}
                      className={`field ${errors[f.key] ? "err" : ""}`}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: "" })); }}
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
                    {errors[f.key] && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{errors[f.key]}</div>}
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
                      value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                  </div>
                  <p style={{ color: "#a1a1aa", fontSize: 12, fontFamily: "'Barlow', sans-serif", letterSpacing: 1, marginTop: 10, lineHeight: 1.6, borderLeft: "2px solid rgba(0, 255, 68, 0.25)", paddingLeft: 10 }}>
                    💡 Your email & password will be saved for future logins — no need to re-enter next time.
                  </p>
                </>
              )}

              <button className="next-btn" onClick={handleNext}>CONTINUE TO PAYMENT →</button>
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
                {
                  id: "cod",
                  icon: "💵",
                  label: "CASH ON DELIVERY",
                  sub: subtotal >= 1999
                    ? `Pay ₹99 safety deposit now · ₹${(subtotal - 99).toLocaleString()} on delivery (free shipping)`
                    : `Pay ₹99 shipping now · ₹${subtotal.toLocaleString()} on delivery`,
                },
              ].map(p => (
                <div key={p.id} className={`pay-card ${payMethod === p.id ? "active" : ""}`} onClick={() => setPayMethod(p.id)}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payMethod === p.id ? "#00ff44" : "#555"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {payMethod === p.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00ff44" }} />}
                  </div>
                  <span style={{ fontSize: 24 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase" }}>{p.label}</div>
                    <div style={{ color: "#a1a1aa", fontSize: 12, fontFamily: "'Barlow', sans-serif", fontWeight: 400, marginTop: 3, lineHeight: 1.5 }}>{p.sub}</div>
                  </div>
                  {payMethod === p.id && <div style={{ marginLeft: "auto", color: "#00ff44", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SELECTED</div>}
                </div>
              ))}

              {payMethod === "razorpay" && (
                <div style={{ background: "rgba(0, 255, 68, 0.03)", border: "1px solid rgba(0, 255, 68, 0.15)", padding: "12px 16px", marginTop: 4, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>ℹ️</span>
                  <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, lineHeight: 1.5 }}>
                    Pay full amount now (₹{subtotal.toLocaleString()} + {shipping === 0 ? "free shipping" : `₹${shipping} shipping`} = ₹{total.toLocaleString()}). UPI, Card, or Net Banking on the next screen.
                  </span>
                </div>
              )}
              {payMethod === "cod" && (
                <div style={{ background: "rgba(0, 255, 68, 0.03)", border: "1px solid rgba(0, 255, 68, 0.15)", padding: "12px 16px", marginTop: 4, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>ℹ️</span>
                  <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, lineHeight: 1.5 }}>
                    {subtotal >= 1999
                      ? `Pay ₹99 safety deposit now via Razorpay. Pay ₹${(subtotal - 99).toLocaleString()} in cash when your order arrives (free shipping).`
                      : `Pay ₹99 shipping now via Razorpay. Pay ₹${subtotal.toLocaleString()} in cash when your order arrives.`}
                  </span>
                </div>
              )}

              <button className="next-btn" onClick={handleNext}>REVIEW ORDER →</button>
              <button className="back-btn" onClick={() => setStep(0)}>← BACK</button>
            </div>
          )}

          {/* STEP 2 — CONFIRM */}
          {step === 2 && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, fontFamily: "'Barlow', sans-serif", fontStyle: "normal", letterSpacing: "0.04em", textTransform: "uppercase" }}><span style={{ color: "#00ff44" }}>/ </span>CONFIRM ORDER</h2>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#a1a1aa", marginBottom: 12, fontWeight: 600, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase" }}>DELIVERING TO</div>
                <div style={{ fontWeight: 600, fontSize: 16, fontFamily: "'Barlow', sans-serif" }}>{form.name}</div>
                <div className="confirm-address" style={{ color: "#a1a1aa", fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 400, marginTop: 4, lineHeight: 1.6 }}>
                  {form.address}, {form.city}, {form.state} — {form.pincode}<br />{form.phone} · {form.email}
                </div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#a1a1aa", marginBottom: 12, fontWeight: 600, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase" }}>PAYMENT VIA</div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#00ff44" }}>
                  {{ razorpay: "💳 ONLINE PAYMENT (Razorpay)", cod: "💵 CASH ON DELIVERY" }[payMethod]}
                </div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#a1a1aa", marginBottom: 12, fontWeight: 600, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase" }}>YOUR ITEMS</div>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #1a1a1a" }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0 }} />
                      : <span style={{ fontSize: 32 }}>👕</span>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Barlow', sans-serif" }}>{item.name}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 11, letterSpacing: 2, fontFamily: "'Barlow', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>SIZE {item.size} · QTY {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 600, flexShrink: 0, fontFamily: "'Barlow', sans-serif" }}>₹{item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              <button className="next-btn" onClick={handlePlace} disabled={loading}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 18, border: "2px solid #000", borderTop: "2px solid transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    PROCESSING...
                  </span>
                ) : payMethod === "cod"
                  ? (subtotal >= 1999
                    ? `PAY DEPOSIT ₹99 → (₹${(subtotal - 99).toLocaleString()} on delivery)`
                    : `PAY SHIPPING ₹99 → (₹${subtotal.toLocaleString()} on delivery)`)
                  : `PAY NOW — ₹${total.toLocaleString()} →`}
              </button>
              <button className="back-btn" onClick={() => setStep(1)}>← BACK</button>
            </div>
          )}
        </div>

        {/* RIGHT — ORDER SUMMARY */}
        {step > 0 && (
          <div className="order-summary-panel">
            <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 4, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #1a1a1a", fontFamily: "'Barlow', sans-serif", fontStyle: "normal", textTransform: "uppercase", color: "#fff" }}>ORDER SUMMARY</h3>
            {cart.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 24 }}>👕</span>
                  }
                  <div style={{ position: "absolute", top: -6, right: -6, background: "#00ff44", color: "#000", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{item.qty}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Barlow', sans-serif" }}>{item.name}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 10, letterSpacing: 2, fontFamily: "'Barlow', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>SIZE {item.size}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, flexShrink: 0, fontFamily: "'Barlow', sans-serif" }}>₹{item.price * item.qty}</div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: 8 }}>
              {[["SUBTOTAL", `₹${subtotal.toLocaleString()}`], ["SHIPPING", shipping === 0 ? "FREE 🎉" : `₹${shipping}`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#888", letterSpacing: 1 }}>
                  <span>{l}</span><span style={{ color: shipping === 0 && l === "SHIPPING" ? "#00ff44" : "#a1a1aa" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: payNowOnline > 0 ? "#00ff44" : "#888", letterSpacing: 1 }}>
                <span>PAY NOW (ONLINE)</span><span>₹{payNowOnline.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: payAtDoorstep > 0 ? "#00ff44" : "#888", letterSpacing: 1 }}>
                <span>PAY AT DOORSTEP</span><span>₹{payAtDoorstep.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #1a1a1a", fontWeight: 800, fontSize: 20, fontFamily: "'Barlow', sans-serif" }}>
                <span>{payMethod === "cod" ? "ORDER TOTAL" : "PAY NOW"}</span>
                <span style={{ color: "#00ff44" }}>₹{(payMethod === "cod" ? total : payNow).toLocaleString()}</span>
              </div>
              {payMethod === "cod" && (
                <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 8, letterSpacing: 1, fontFamily: "'Barlow', sans-serif" }}>
                  Razorpay charge today: ₹{payNowOnline} only
                </div>
              )}
            </div>
            {freeShippingGap > 0 && (
              <div style={{ background: "rgba(0, 255, 68, 0.05)", border: "1px solid rgba(0, 255, 68, 0.15)", padding: "10px 14px", marginTop: 16, fontSize: 12, letterSpacing: 1, color: "#00ff44" }}>
                💡 Add ₹{freeShippingGap.toLocaleString()} more for FREE shipping (orders ₹{FREE_SHIPPING_MIN.toLocaleString()}+)!
              </div>
            )}
            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["🔒 SECURE", "↩️ 30-DAY RETURN", "✓ AUTHENTIC"].map(t => (
                <span key={t} style={{ fontSize: 10, letterSpacing: 1, color: "#888", border: "1px solid #1a1a1a", padding: "4px 8px" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}