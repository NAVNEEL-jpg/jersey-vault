import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initiatePayment } from "../razorpay";
import { supabase } from '../supabase';

const steps = ["DELIVERY", "PAYMENT", "CONFIRM"];

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("cart");
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

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 1999 ? 0 : 99;
  const total = subtotal + shipping;

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
    if (payMethod === "cod") {
      // For COD, pay ₹99 upfront via Razorpay
      initiatePayment(99, form.name, form.email, form.phone, cart, navigate, decrementStock, form, user, true);
    } else {
      initiatePayment(total, form.name, form.email, form.phone, cart, navigate, decrementStock, form, user, false);
    }
  };

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes glow { 0%,100%{box-shadow:0 0 10px #39ff1440;} 50%{box-shadow:0 0 30px #39ff1480;} }
        .field { background: #111; border: 1px solid #222; color: #fff; padding: 13px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; width: 100%; outline: none; letter-spacing: 1px; transition: border-color 0.2s; }
        .field:focus { border-color: #39ff14; }
        .field.err { border-color: #ff4444; }
        .field::placeholder { color: #333; }
        .label { font-size: 11px; letter-spacing: 3px; color: #555; margin-bottom: 6px; font-weight: 700; }
        .pay-card { border: 1px solid #222; padding: 16px 20px; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.2s; background: #111; margin-bottom: 10px; }
        .pay-card.active { border-color: #39ff14; background: #39ff1408; }
        .pay-card:hover:not(.active) { border-color: #333; }
        .next-btn { background: #39ff14; color: #000; border: none; width: 100%; padding: 16px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 4px; cursor: pointer; transition: all 0.2s; margin-top: 20px; animation: glow 2s infinite; }
        .next-btn:hover { background: #fff; }
        .next-btn:disabled { background: #222; color: #444; cursor: not-allowed; animation: none; }
        .back-btn { background: transparent; color: #555; border: 1px solid #222; width: 100%; padding: 13px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; margin-top: 10px; }
        .back-btn:hover { border-color: #444; color: #fff; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; letter-spacing: 0; transition: all 0.3s; }
        .step-line { flex: 1; height: 1px; transition: background 0.5s; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #39ff14; }

        /* ─── MOBILE RESPONSIVE ─────────────────────────────────── */
        /* Two-column form grid → single column on small screens    */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
          /* Every field takes full width on mobile */
          .form-grid > div { grid-column: 1 / -1 !important; }
        }

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

        /* Order summary: sticky on desktop, static on mobile */
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
            /* Show summary above the form on mobile */
            order: -1;
          }
        }

        /* Left panel: appears below summary on mobile (natural order) */
        .checkout-left {
          animation: fadeUp 0.5s ease;
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
          .next-btn { padding: 18px 16px; font-size: 15px; }
          .back-btn { padding: 15px 16px; }
          .pay-card { padding: 14px 16px; }
          .field { padding: 14px 16px; font-size: 16px; /* prevents iOS zoom */ }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#39ff14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000" }}>J</div>
          <span className="checkout-nav-title" style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
        </div>
        <span className="checkout-nav-secure" style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>SECURE CHECKOUT 🔒</span>
      </nav>

      <div className="checkout-layout">

        {/* LEFT PANEL */}
        <div className="checkout-left">

          {/* STEP INDICATOR */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div className="step-dot" style={{ background: i <= step ? "#39ff14" : "#111", color: i <= step ? "#000" : "#333", border: i <= step ? "none" : "1px solid #222" }}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="step-label" style={{ fontSize: 10, letterSpacing: 2, color: i <= step ? "#39ff14" : "#333", fontWeight: 700 }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className="step-line" style={{ background: i < step ? "#39ff14" : "#222", margin: "0 8px", marginBottom: 20 }} />}
              </div>
            ))}
          </div>

          {/* STEP 0 — DELIVERY */}
          {step === 0 && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", marginBottom: 24 }}><span style={{ color: "#39ff14" }}>/ </span>DELIVERY DETAILS</h2>
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
                    <div className="label">{f.label}</div>
                    <input
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
                    <div className="label">PASSWORD (OPTIONAL)</div>
                    <input className="field" type="password" placeholder="Create a password (min. 6 chars)"
                      value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                  </div>
                  <p style={{ color: "#555", fontSize: 12, fontFamily: "'Barlow', sans-serif", letterSpacing: 1, marginTop: 10, lineHeight: 1.6, borderLeft: "2px solid #39ff1440", paddingLeft: 10 }}>
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
              <h2 style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", marginBottom: 24 }}><span style={{ color: "#39ff14" }}>/ </span>PAYMENT METHOD</h2>

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
                  sub: "Pay when you receive your order",
                },
              ].map(p => (
                <div key={p.id} className={`pay-card ${payMethod === p.id ? "active" : ""}`} onClick={() => setPayMethod(p.id)}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payMethod === p.id ? "#39ff14" : "#333"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {payMethod === p.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#39ff14" }} />}
                  </div>
                  <span style={{ fontSize: 24 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>{p.label}</div>
                    <div style={{ color: "#555", fontSize: 12, fontFamily: "'Barlow', sans-serif", marginTop: 2 }}>{p.sub}</div>
                  </div>
                  {payMethod === p.id && <div style={{ marginLeft: "auto", color: "#39ff14", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>SELECTED</div>}
                </div>
              ))}

              {payMethod === "razorpay" && (
                <div style={{ background: "#39ff1408", border: "1px solid #39ff1430", padding: "12px 16px", marginTop: 4, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>ℹ️</span>
                  <span style={{ fontSize: 12, color: "#39ff14", fontFamily: "'Barlow', sans-serif", letterSpacing: 0.5, lineHeight: 1.5 }}>
                    You'll choose UPI, Card, or Net Banking on the next screen inside the secure Razorpay window.
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
              <h2 style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", marginBottom: 24 }}><span style={{ color: "#39ff14" }}>/ </span>CONFIRM ORDER</h2>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 12, fontWeight: 700 }}>DELIVERING TO</div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{form.name}</div>
                <div className="confirm-address" style={{ color: "#888", fontFamily: "'Barlow', sans-serif", fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
                  {form.address}, {form.city}, {form.state} — {form.pincode}<br />{form.phone} · {form.email}
                </div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 12, fontWeight: 700 }}>PAYMENT VIA</div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#39ff14" }}>
                  {{ razorpay: "💳 ONLINE PAYMENT (Razorpay)", cod: "💵 CASH ON DELIVERY" }[payMethod]}
                </div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 12, fontWeight: 700 }}>YOUR ITEMS</div>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #1a1a1a" }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0 }} />
                      : <span style={{ fontSize: 32 }}>👕</span>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ color: "#555", fontSize: 12, letterSpacing: 2 }}>SIZE {item.size} · QTY {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 900, flexShrink: 0 }}>₹{item.price * item.qty}</div>
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
                  ? `PAY ₹99 ADVANCE (COD) →`
                  : `PAY NOW — ₹${total.toLocaleString()} →`}
              </button>
              <button className="back-btn" onClick={() => setStep(1)}>← BACK</button>
            </div>
          )}
        </div>

        {/* RIGHT — ORDER SUMMARY */}
        <div className="order-summary-panel">
          <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: 3, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #1a1a1a" }}>ORDER SUMMARY</h3>
          {cart.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 24 }}>👕</span>
                }
                <div style={{ position: "absolute", top: -6, right: -6, background: "#39ff14", color: "#000", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{item.qty}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ color: "#555", fontSize: 11, letterSpacing: 1 }}>SIZE {item.size}</div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 14, flexShrink: 0 }}>₹{item.price * item.qty}</div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, marginTop: 8 }}>
            {[["SUBTOTAL", `₹${subtotal.toLocaleString()}`], ["SHIPPING", shipping === 0 ? "FREE 🎉" : `₹${shipping}`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#555", letterSpacing: 1 }}>
                <span>{l}</span><span style={{ color: shipping === 0 && l === "SHIPPING" ? "#39ff14" : "#888" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #1a1a1a", fontWeight: 900, fontSize: 20 }}>
              <span>TOTAL</span><span style={{ color: "#39ff14" }}>₹{total.toLocaleString()}</span>
            </div>
          </div>
          {shipping > 0 && (
            <div style={{ background: "#39ff1410", border: "1px solid #39ff1430", padding: "10px 14px", marginTop: 16, fontSize: 12, letterSpacing: 1, color: "#39ff14" }}>
              💡 Add ₹{(1999 - subtotal).toLocaleString()} more for FREE shipping!
            </div>
          )}
          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["🔒 SECURE", "↩️ 30-DAY RETURN", "✓ AUTHENTIC"].map(t => (
              <span key={t} style={{ fontSize: 10, letterSpacing: 1, color: "#444", border: "1px solid #1a1a1a", padding: "4px 8px" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}