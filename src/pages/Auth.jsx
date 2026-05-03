import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import logo from "../assets/jerseyvault-logo.jpeg";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const update = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/', { replace: true });
    });
  }, []);

  const validate = () => {
    const e = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Name is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (mode === "signup" && !/^\d{10}$/.test(form.phone)) e.phone = "Enter valid 10-digit number";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (mode === "signup" && form.password !== form.confirm) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) { setErrors({ email: error.message }); setLoading(false); return; }
      setLoading(false);
      navigate('/', { replace: true });
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, phone: form.phone } }
      });
      if (error) { setErrors({ email: error.message }); setLoading(false); return; }
      setLoading(false);
      setSuccess(true);
    }
  };

  const handleForgot = async () => {
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) { setErrors({ forgot: "Enter a valid email" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
    if (error) { setErrors({ forgot: error.message }); setLoading(false); return; }
    setLoading(false);
    setForgotSent(true);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) setErrors({ email: error.message });
  };

  const switchMode = (m) => { setMode(m); setErrors({}); setSuccess(false); setForm({ name: "", email: "", phone: "", password: "", confirm: "" }); };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3;
  const strengthLabels = ["", "WEAK", "FAIR", "STRONG", "VERY STRONG"];
  const strengthColors = ["", "#ff4444", "#ff9900", "#39ff14", "#00ffaa"];

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0;} 70%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
        @keyframes glow { 0%,100%{box-shadow:0 0 10px #39ff1440;} 50%{box-shadow:0 0 30px #39ff1480;} }
        @keyframes bgPulse { 0%,100%{opacity:0.06;} 50%{opacity:0.12;} }
        .field-wrap { position:relative; margin-bottom:4px; }
        .field { background:#111; border:1px solid #222; color:#fff; padding:14px 16px; font-family:'Barlow Condensed',sans-serif; font-size:15px; width:100%; outline:none; letter-spacing:1px; transition:border-color 0.2s; }
        .field:focus { border-color:#39ff14; }
        .field.err { border-color:#ff4444; }
        .field::placeholder { color:#333; }
        .label { font-size:11px; letter-spacing:3px; color:#555; margin-bottom:7px; font-weight:700; display:block; }
        .submit-btn { background:#39ff14; color:#000; border:none; width:100%; padding:16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:16px; letter-spacing:4px; cursor:pointer; transition:all 0.2s; animation:glow 2s infinite; }
        .submit-btn:hover { background:#fff; }
        .google-btn { background:#111; color:#fff; border:1px solid #222; width:100%; padding:14px; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:10px; }
        .google-btn:hover { border-color:#555; background:#1a1a1a; }
        .tab { flex:1; padding:16px; background:transparent; border:none; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:18px; letter-spacing:4px; cursor:pointer; transition:all 0.2s; border-bottom:2px solid transparent; color:#666; opacity:1; }
        .tab.active { color:#39ff14; border-bottom-color:#39ff14; }
        .tab:not(.active):hover { color:#aaa; }
        .eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; color:#444; cursor:pointer; font-size:18px; transition:color 0.2s; }
        .eye-btn:hover { color:#39ff14; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#39ff14; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={logo} alt="JerseyVault" style={{ width: 36, height: 36, objectFit: "contain", mixBlendMode: "screen" }} />
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
        </div>
        <span style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>YOUR ACCOUNT</span>
      </nav>

      {/* BG DECORATION */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "#39ff14", filter: "blur(120px)", animation: "bgPulse 4s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "#00aaff", filter: "blur(120px)", animation: "bgPulse 5s ease infinite 1s" }} />
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {success ? (
            <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#39ff1420", border: "2px solid #39ff14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, animation: "popIn 0.5s ease", margin: "0 auto 24px" }}>✓</div>
              <h2 style={{ fontSize: 36, fontWeight: 900, fontStyle: "italic" }}>ACCOUNT CREATED!</h2>
              <p style={{ color: "#555", marginTop: 8, letterSpacing: 2, fontSize: 13, fontFamily: "'Barlow', sans-serif" }}>
                Welcome to JerseyVault, {form.name}!
              </p>
              <button onClick={() => navigate('/', { replace: true })}
                style={{ marginTop: 28, background: "#39ff14", color: "#000", border: "none", padding: "14px 36px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 3, cursor: "pointer" }}>
                GO TO STORE →
              </button>
            </div>

          ) : mode === "forgot" ? (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13, letterSpacing: 2, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>← BACK TO LOGIN</button>
              <h2 style={{ fontSize: 34, fontWeight: 900, fontStyle: "italic", marginBottom: 6 }}>FORGOT <span style={{ color: "#39ff14" }}>PASSWORD?</span></h2>
              <p style={{ color: "#555", fontSize: 13, fontFamily: "'Barlow', sans-serif", marginBottom: 28, lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</p>
              {forgotSent ? (
                <div style={{ background: "#39ff1410", border: "1px solid #39ff1440", padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
                  <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 2, color: "#39ff14" }}>RESET LINK SENT!</div>
                  <div style={{ color: "#555", fontSize: 13, marginTop: 6, fontFamily: "'Barlow', sans-serif" }}>Check your inbox at {forgotEmail}</div>
                </div>
              ) : (
                <>
                  <label className="label">EMAIL ADDRESS</label>
                  <div className="field-wrap">
                    <input className={`field ${errors.forgot ? "err" : ""}`} placeholder="you@email.com" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setErrors({}); }} />
                  </div>
                  {errors.forgot && <div style={{ color: "#ff4444", fontSize: 11, marginBottom: 12, letterSpacing: 1 }}>{errors.forgot}</div>}
                  <button className="submit-btn" style={{ marginTop: 16 }} onClick={handleForgot}>
                    {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 16, height: 16, border: "2px solid #000", borderTop: "2px solid transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />SENDING...</span> : "SEND RESET LINK →"}
                  </button>
                </>
              )}
            </div>

          ) : (
            <div style={{ animation: "fadeUp 0.4s ease" }}>

              {/* LOGO */}
              <div style={{ marginBottom: 28, textAlign: "center" }}>
                <img
                  src={logo}
                  alt="JerseyVault"
                  style={{ width: 72, height: 72, objectFit: "contain", mixBlendMode: "screen", filter: "brightness(1.1) contrast(1.05)", margin: "0 auto 16px", display: "block" }}
                />
                <h1 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic" }}>
                  {mode === "login" ? <>WELCOME <span style={{ color: "#39ff14" }}>BACK</span></> : <>CREATE <span style={{ color: "#39ff14" }}>ACCOUNT</span></>}
                </h1>
                <p style={{ color: "#555", fontSize: 13, marginTop: 6, fontFamily: "'Barlow', sans-serif", letterSpacing: 1 }}>
                  {mode === "login" ? "Log in to access your orders & wishlist" : "Join JerseyVault — it's free"}
                </p>
              </div>

              {/* TABS */}
              <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: 28 }}>
                <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>LOGIN</button>
                <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>SIGN UP</button>
              </div>

              {/* GOOGLE */}
              <button className="google-btn" style={{ marginBottom: 20 }} onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                CONTINUE WITH GOOGLE
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
                <span style={{ color: "#333", fontSize: 11, letterSpacing: 2 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mode === "signup" && (
                  <div>
                    <label className="label">FULL NAME</label>
                    <div className="field-wrap">
                      <input className={`field ${errors.name ? "err" : ""}`} placeholder="Neel Kumar" value={form.name} onChange={e => update("name", e.target.value)} />
                    </div>
                    {errors.name && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{errors.name}</div>}
                  </div>
                )}

                <div>
                  <label className="label">EMAIL ADDRESS</label>
                  <div className="field-wrap">
                    <input className={`field ${errors.email ? "err" : ""}`} placeholder="you@email.com" value={form.email} onChange={e => update("email", e.target.value)} />
                  </div>
                  {errors.email && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{errors.email}</div>}
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="label">PHONE NUMBER</label>
                    <div className="field-wrap">
                      <input className={`field ${errors.phone ? "err" : ""}`} placeholder="9876543210" value={form.phone} onChange={e => update("phone", e.target.value)} maxLength={10} />
                    </div>
                    {errors.phone && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{errors.phone}</div>}
                  </div>
                )}

                <div>
                  <label className="label">PASSWORD</label>
                  <div className="field-wrap">
                    <input className={`field ${errors.password ? "err" : ""}`} type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={form.password} onChange={e => update("password", e.target.value)} style={{ paddingRight: 44 }} />
                    <button className="eye-btn" onClick={() => setShowPass(p => !p)}>{showPass ? "🙈" : "👁️"}</button>
                  </div>
                  {errors.password && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{errors.password}</div>}
                  {mode === "signup" && form.password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, background: i <= strength ? strengthColors[strength] : "#222", transition: "background 0.3s" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, letterSpacing: 2, color: strengthColors[strength], fontWeight: 700 }}>{strengthLabels[strength]}</span>
                    </div>
                  )}
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="label">CONFIRM PASSWORD</label>
                    <div className="field-wrap">
                      <input className={`field ${errors.confirm ? "err" : ""}`} type={showConfirm ? "text" : "password"} placeholder="Re-enter password" value={form.confirm} onChange={e => update("confirm", e.target.value)} style={{ paddingRight: 44 }} />
                      <button className="eye-btn" onClick={() => setShowConfirm(p => !p)}>{showConfirm ? "🙈" : "👁️"}</button>
                    </div>
                    {errors.confirm && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>{errors.confirm}</div>}
                    {form.confirm && form.password === form.confirm && <div style={{ color: "#39ff14", fontSize: 11, marginTop: 4, letterSpacing: 1 }}>✓ Passwords match</div>}
                  </div>
                )}
              </div>

              {mode === "login" && (
                <div style={{ textAlign: "right", marginTop: 10 }}>
                  <span onClick={() => switchMode("forgot")} style={{ color: "#555", fontSize: 12, letterSpacing: 2, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = "#39ff14"} onMouseLeave={e => e.target.style.color = "#555"}>
                    FORGOT PASSWORD?
                  </span>
                </div>
              )}

              <button className="submit-btn" style={{ marginTop: 22 }} onClick={handleSubmit}>
                {loading
                  ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 16, height: 16, border: "2px solid #000", borderTop: "2px solid transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />{mode === "login" ? "LOGGING IN..." : "CREATING ACCOUNT..."}</span>
                  : mode === "login" ? "LOGIN →" : "CREATE ACCOUNT →"}
              </button>

              {mode === "signup" && (
                <p style={{ color: "#333", fontSize: 11, textAlign: "center", marginTop: 14, fontFamily: "'Barlow', sans-serif", letterSpacing: 1, lineHeight: 1.6 }}>
                  By signing up you agree to our <span style={{ color: "#555", cursor: "pointer" }}>Terms of Service</span> and <span style={{ color: "#555", cursor: "pointer" }}>Privacy Policy</span>
                </p>
              )}

              <p style={{ textAlign: "center", marginTop: 20, color: "#444", fontSize: 13, letterSpacing: 1 }}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  style={{ color: "#39ff14", cursor: "pointer", fontWeight: 700, letterSpacing: 2 }}>
                  {mode === "login" ? "SIGN UP" : "LOGIN"}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}