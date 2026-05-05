import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from '../supabase';
import logo from "../assets/jerseyvault-logo.jpeg";
import heroBg from "../assets/hero-bg.jpeg";

const LOGO_SRC = logo;

function CartoonFlameText({ text }) {
  const id = "flameclip-" + text.replace(/\s/g, "");
  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 0.9 }}>
      <span style={{
        fontSize: "clamp(52px,10vw,100px)",
        fontWeight: 900,
        fontStyle: "italic",
        letterSpacing: "-2px",
        color: "#ffffff",
        display: "block",
        fontFamily: "'Barlow Condensed', sans-serif",
        userSelect: "none",
      }}>
        {text}
      </span>
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={id}>
            <text x="0" y="90%" fontSize="clamp(52px,10vw,100px)" fontWeight="900" fontStyle="italic" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="-2">{text}</text>
          </clipPath>
          <linearGradient id="flameGrad1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFE000" /><stop offset="22%" stopColor="#FF8C00" />
            <stop offset="48%" stopColor="#E8000A" /><stop offset="78%" stopColor="#B20000" />
            <stop offset="100%" stopColor="#3a0000" />
          </linearGradient>
          <linearGradient id="flameGrad2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFF176" /><stop offset="18%" stopColor="#FFB300" />
            <stop offset="45%" stopColor="#FF3D00" /><stop offset="75%" stopColor="#C62828" />
            <stop offset="100%" stopColor="#4a0000" />
          </linearGradient>
          <filter id="flameWobble" x="-20%" y="-40%" width="140%" height="180%">
            <feTurbulence type="turbulence" baseFrequency="0.025 0.06" numOctaves="3" seed="2" result="noise">
              <animate attributeName="baseFrequency" values="0.025 0.06; 0.03 0.08; 0.022 0.055; 0.025 0.06" dur="0.9s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g clipPath={`url(#${id})`} filter="url(#flameWobble)">
          <rect x="-5%" y="-80%" width="110%" height="200%" fill="url(#flameGrad1)">
            <animateTransform attributeName="transform" type="translate" values="0,0; 2,-6; -3,-10; 1,-5; 0,0" dur="0.55s" repeatCount="indefinite" />
          </rect>
          <rect x="-5%" y="-60%" width="110%" height="180%" fill="url(#flameGrad2)" opacity="0.65">
            <animateTransform attributeName="transform" type="translate" values="0,0; -2,-8; 3,-4; -1,-9; 0,0" dur="0.42s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.65; 0.85; 0.5; 0.75; 0.65" dur="0.7s" repeatCount="indefinite" />
          </rect>
          <rect x="-5%" y="55%" width="110%" height="55%" fill="#FFE000" opacity="0.7">
            <animate attributeName="opacity" values="0.7; 1; 0.6; 0.9; 0.7" dur="0.35s" repeatCount="indefinite" />
          </rect>
        </g>
      </svg>
    </div>
  );
}

export default function JerseyStore() {
  const navigate = useNavigate();
  const [jerseys, setJerseys] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState(() => {
  const saved = localStorage.getItem("cart");
  return saved ? JSON.parse(saved) : [];
});
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedJersey, setSelectedJersey] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [toast, setToast] = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .then(({ data, error }) => {
        if (!error && data) setJerseys(data);
        setLoadingProducts(false);
      });
  }, []);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setUser(data.session.user);
    });
  }, []);
  useEffect(() => {
  localStorage.setItem("cart", JSON.stringify(cart));
}, [cart]);

  // Filter uses j.type which matches the Supabase "type" column values:
  // "PLAYER VERSION", "FAN VERSION", "RETRO"
  const filtered = jerseys.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "FAN VERSION" && j.type === "FAN VERSION") ||
      (activeFilter === "PLAYER VERSION" && j.type === "PLAYER VERSION") ||
      (activeFilter === "RETRO" && j.type === "RETRO");
    return matchesSearch && matchesFilter;
  });

  const addToCart = (jersey, size) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === jersey.id && i.size === size);
      if (existing) return prev.map(i => i.id === jersey.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...jersey, size, qty: 1 }];
    });
    showToast(`${jersey.name} added to cart!`);
    setSelectedJersey(null);
  };

  const removeFromCart = (id, size) => setCart(prev => prev.filter(i => !(i.id === id && i.size === size)));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  // Filter button config — keys match Supabase type values exactly
  const filterButtons = [
    { key: "ALL",            label: "ALL" },
    { key: "FAN VERSION",    label: "FAN VERSION" },
    { key: "PLAYER VERSION", label: "PLAYER VERSION" },
    { key: "RETRO",          label: "RETRO" },
  ];

  const sectionTitle =
    activeFilter === "ALL" ? "SHOP ALL" : activeFilter;

  return (
    <>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #39ff14; border-radius: 2px; }
          @keyframes slideDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
          @keyframes toastIn { from{opacity:0;transform:translateX(100px);} to{opacity:1;transform:translateX(0);} }
          @keyframes marquee { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
          @keyframes glow { 0%,100%{box-shadow:0 0 10px #39ff1440;} 50%{box-shadow:0 0 30px #39ff1480;} }
          @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
          @keyframes breathe { 0%,100%{transform:scale(1);} 50%{transform:scale(1.025);} }
          .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; }
          .nav-link:hover { color:#39ff14; }
          .card { background:#111; border:1px solid #1a1a1a; overflow:hidden; cursor:pointer; transition:transform 0.3s, border-color 0.3s; position:relative; display:flex; flex-direction:column; }
          .card:hover { transform:translateY(-6px); border-color:#39ff14; }
          .card-img { width:100%; height:220px; object-fit:cover; display:block; transition:transform 0.4s; }
          .card:hover .card-img { transform:scale(1.04); }
          .card-img-wrap { overflow:hidden; position:relative; height:220px; background:#0d0d0d; }
          .card-overlay { position:absolute; inset:0; background:linear-gradient(to top, #000 0%, transparent 60%); opacity:0.5; pointer-events:none; }
          .add-btn { background:#39ff14; color:#000; border:none; width:100%; padding:12px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:15px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; text-transform:uppercase; }
          .add-btn:hover { background:#fff; }
          .size-btn { background:transparent; border:1px solid #333; color:#888; width:44px; height:44px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; }
          .size-btn.selected { background:#39ff14; border-color:#39ff14; color:#000; }
          .size-btn:hover:not(.selected) { border-color:#39ff14; color:#39ff14; }
          .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
          .modal { background:#111; border:1px solid #2a2a2a; width:90%; max-width:480px; overflow:hidden; animation:fadeUp 0.3s ease; max-height:90vh; overflow-y:auto; }
          .modal-img { width:100%; height:260px; object-fit:cover; display:block; }
          .modal-img-placeholder { width:100%; height:260px; background:#0d0d0d; display:flex; align-items:center; justify-content:center; font-size:80px; }
          .cart-panel { position:fixed; right:0; top:0; bottom:0; width:360px; background:#0f0f0f; border-left:1px solid #222; z-index:200; display:flex; flex-direction:column; animation:slideDown 0.3s ease; }
          .cart-item { display:flex; gap:12px; padding:16px; border-bottom:1px solid #1a1a1a; align-items:center; }
          .cart-item-img { width:50px; height:50px; object-fit:cover; background:#0d0d0d; flex-shrink:0; }
          .checkout-btn { background:linear-gradient(90deg,#39ff14,#00ff88); color:#000; border:none; width:calc(100% - 32px); margin:16px; padding:16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:16px; letter-spacing:3px; cursor:pointer; animation:glow 2s infinite; }
          .checkout-btn:hover { background:#fff; }
          .search-input { background:#111; border:1px solid #222; color:#fff; padding:10px 16px; font-family:'Barlow Condensed',sans-serif; font-size:15px; width:220px; outline:none; letter-spacing:1px; }
          .search-input:focus { border-color:#39ff14; }
          .search-input::placeholder { color:#ccc; }
          .skeleton { background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
          .logo-img { width:44px; height:44px; object-fit:contain; mix-blend-mode:screen; filter:brightness(1.1) contrast(1.05); display:block; }
          .logo-wrap { display:flex; align-items:center; gap:8px; }
          .out-of-stock-badge { position:absolute; top:12px; left:12px; background:#ff4444; color:#fff; font-size:10px; font-weight:900; letter-spacing:2px; padding:3px 8px; z-index:2; }
          .type-badge-card { position:absolute; top:12px; right:12px; font-size:9px; font-weight:900; letter-spacing:2px; padding:3px 8px; z-index:2; background:#00000088; border:1px solid #39ff1466; color:#39ff14; }
          .filter-btn { background:transparent; color:#888; border:1px solid #333; padding:8px 18px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:13px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; text-transform:uppercase; }
          .filter-btn:hover { border-color:#39ff14; color:#39ff14; }
          .filter-btn.active { background:#39ff14; border-color:#39ff14; color:#000; }
          @media(max-width:600px){ .cart-panel{width:100%;} .search-input{width:140px;} }
        `}</style>

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, background: "#39ff14", color: "#000", padding: "14px 20px", fontWeight: 900, letterSpacing: 2, fontSize: 13, zIndex: 999, animation: "toastIn 0.3s ease" }}>
            ✓ {toast}
          </div>
        )}

        {/* NAVBAR */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, animation: "slideDown 0.5s ease" }}>
          <div className="logo-wrap">
            <img src={LOGO_SRC} alt="JerseyVault logo" className="logo-img" />
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#fff" }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            <Link to="/" className="nav-link">HOME</Link>
            <span className="nav-link" onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}>SHOP</span>
            <Link to="/tracking" className="nav-link">TRACK</Link>
            <Link to="/checkout" className="nav-link">CART</Link>
            <Link to="/myorders" className="nav-link">MY ORDERS</Link>
            {user ? (
              <span className="nav-link" onClick={async () => { await supabase.auth.signOut(); setUser(null); setCart([]); localStorage.removeItem("cart"); }}>LOGOUT</span>
            ) : (
              <Link to="/auth" className="nav-link">LOGIN</Link>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input className="search-input" placeholder="SEARCH..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button onClick={() => setCartOpen(true)} style={{ background: "transparent", border: "1px solid #39ff14", color: "#39ff14", padding: "8px 16px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#39ff14"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#39ff14"; }}>
              🛒 CART {cartCount > 0 && <span style={{ background: "#39ff14", color: "#000", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{cartCount}</span>}
            </button>
          </div>
        </nav>

        {/* TICKER */}
        <div style={{ background: "#39ff14", color: "#000", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
          <div style={{ display: "inline-flex", animation: "marquee 18s linear infinite" }}>
            {[...Array(2)].map((_, i) => (
              <span key={i} style={{ display: "inline-flex" }}>
                {["FREE SHIPPING ABOVE ₹1999", "AUTHENTIC LICENSED JERSEYS", "EASY 30-DAY RETURNS", "COD AVAILABLE", "SIZES XS TO XXL"].map(t => (
                  <span key={t} style={{ fontWeight: 900, letterSpacing: 3, fontSize: 12, padding: "0 40px" }}>★ {t}</span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* HERO */}
        <section style={{
          position: "relative",
          padding: "80px 24px 60px",
          textAlign: "center",
          overflow: "hidden",
          opacity: heroVisible ? 1 : 0,
          transition: "opacity 0.8s ease",
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(10,10,10,1) 0%, rgba(10,10,10,0.3) 30%, rgba(0,0,0,0.2) 60%, rgba(10,10,10,0.95) 100%)",
            pointerEvents: "none"
          }} />

          <p style={{ color: "#39ff14", letterSpacing: 6, fontSize: 12, fontWeight: 700, marginBottom: 16, animation: "fadeUp 0.6s ease 0.2s both", position: "relative", zIndex: 1 }}>THE ULTIMATE COLLECTION</p>

          <h1 style={{
            lineHeight: 0.9,
            animation: "fadeUp 0.6s ease 0.3s both, breathe 5s ease-in-out 1s infinite",
            position: "relative",
            display: "inline-block",
            zIndex: 1,
          }}>
            <span style={{ display: "block", position: "relative", marginBottom: 4 }}>
              <CartoonFlameText text="WEAR YOUR" />
            </span>
            <span style={{ display: "block", color: "#39ff14", fontSize: "clamp(52px,10vw,100px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, letterSpacing: -2 }}>
              LEGEND
            </span>
          </h1>

          <p style={{ color: "#ccc", marginTop: 20, fontSize: 16, letterSpacing: 2, fontFamily: "'Barlow',sans-serif", fontWeight: 400, animation: "fadeUp 0.6s ease 0.4s both", position: "relative", zIndex: 1 }}>Official jerseys from football, cricket &amp; basketball</p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", animation: "fadeUp 0.6s ease 0.5s both", position: "relative", zIndex: 1 }}>
            <button onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: "#39ff14", color: "#000", border: "none", padding: "14px 36px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 3, cursor: "pointer", animation: "pulse 2s infinite" }}>
              SHOP NOW
            </button>
            <button style={{ background: "transparent", color: "#fff", border: "1px solid #333", padding: "14px 36px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 3, cursor: "pointer" }}>
              VIEW TEAMS
            </button>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #39ff14, transparent)" }} />
        </section>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" }}>
          {[["500+", "JERSEYS"], ["50K+", "CUSTOMERS"], ["100%", "AUTHENTIC"]].map(([num, label]) => (
            <div key={label} style={{ textAlign: "center", padding: "20px 0", borderRight: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#39ff14" }}>{num}</div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#ccc", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* SHOP */}
        <section id="shop" style={{ padding: "60px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontStyle: "italic", letterSpacing: 1 }}>
              <span style={{ color: "#39ff14" }}>/ </span>{sectionTitle}
            </h2>

            {/* FILTER BUTTONS — keys match Supabase type values exactly */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filterButtons.map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-btn${activeFilter === key ? " active" : ""}`}
                  onClick={() => setActiveFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingProducts ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                  <div className="skeleton" style={{ height: 220 }} />
                  <div style={{ padding: 16 }}>
                    <div className="skeleton" style={{ height: 18, marginBottom: 10, width: "60%" }} />
                    <div className="skeleton" style={{ height: 14, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
              <div style={{ fontSize: 60 }}>🔍</div>
              <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO RESULTS FOUND</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 2 }}>
              {filtered.map((jersey, i) => (
                <div key={jersey.id} className="card" onClick={() => { setSelectedJersey(jersey); setSelectedSize("M"); }}
                  style={{ animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}>
                  {jersey.stock === 0 && <div className="out-of-stock-badge">OUT OF STOCK</div>}
                  {jersey.type && <div className="type-badge-card">{jersey.type}</div>}
                  <div className="card-img-wrap">
                    {jersey.image_url ? (
                      <img src={jersey.image_url} alt={jersey.name} className="card-img" />
                    ) : (
                      <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0d", fontSize: 60 }}>👕</div>
                    )}
                    <div className="card-overlay" />
                  </div>
                  <div style={{ padding: "16px 16px 0", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>{jersey.name}</div>
                        {jersey.stock > 0 && jersey.stock <= 5 && (
                          <div style={{ fontSize: 11, color: "#ff9900", letterSpacing: 2, marginTop: 4, fontWeight: 700 }}>
                            ONLY {jersey.stock} LEFT
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>₹{jersey.price}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px 16px" }}>
                    <button className="add-btn"
                      disabled={jersey.stock === 0}
                      style={jersey.stock === 0 ? { background: "#222", color: "#444", cursor: "not-allowed", letterSpacing: 3 } : {}}
                      onClick={e => { e.stopPropagation(); if (jersey.stock > 0) { setSelectedJersey(jersey); setSelectedSize("M"); } }}>
                      {jersey.stock === 0 ? "OUT OF STOCK" : "SELECT SIZE →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FEATURES */}
        <section style={{ background: "#0d0d0d", padding: "60px 24px", borderTop: "1px solid #1a1a1a" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", textAlign: "center", marginBottom: 40 }}>WHY <span style={{ color: "#39ff14" }}>JERSEYVAULT</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
            {[
              ["🏅", "LICENSED AUTHENTIC", "Every jersey is officially licensed and verified"],
              ["🚚", "FAST DELIVERY", "Ships within 24–48 hours across India"],
              ["↩️", "30-DAY RETURNS", "No questions asked easy returns"],
              ["🔒", "SECURE PAYMENTS", "Razorpay — UPI, Cards, Netbanking"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: "#111", border: "1px solid #1a1a1a", padding: 24, textAlign: "center", transition: "border-color 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#39ff14"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 900, letterSpacing: 2, fontSize: 14, marginBottom: 8 }}>{title}</div>
                <div style={{ color: "#555", fontSize: 13, fontFamily: "'Barlow',sans-serif", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "#050505", borderTop: "1px solid #1a1a1a", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: 4, marginBottom: 8 }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></div>
          <p style={{ color: "#333", fontSize: 12, letterSpacing: 2 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
            {[["PRIVACY", "/privacy"], ["TERMS", "/terms"], ["CONTACT", "/contact"], ["FAQ", "/faq"]].map(([l, h]) => (
              <Link key={l} to={h} style={{ color: "#888", fontSize: 12, letterSpacing: 2, cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = "#39ff14"} onMouseLeave={e => e.target.style.color = "#888"}>{l}</Link>
            ))}
          </div>
        </footer>

        {/* SIZE PICKER MODAL */}
        {selectedJersey && (
          <div className="modal-bg" onClick={() => setSelectedJersey(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setSelectedJersey(null)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>✕</button>
                {selectedJersey.image_url ? (
                  <img src={selectedJersey.image_url} alt={selectedJersey.name} className="modal-img" />
                ) : (
                  <div className="modal-img-placeholder">👕</div>
                )}
              </div>
              <div style={{ padding: "20px 24px 8px" }}>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 1 }}>{selectedJersey.name}</div>
                {selectedJersey.type && (
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#39ff14", fontWeight: 900, marginTop: 4 }}>{selectedJersey.type}</div>
                )}
                <div style={{ fontSize: 22, fontWeight: 900, color: "#39ff14", marginTop: 4 }}>₹{selectedJersey.price}</div>
                {selectedJersey.stock > 0 && selectedJersey.stock <= 5 && (
                  <div style={{ fontSize: 11, color: "#ff9900", letterSpacing: 2, marginTop: 6, fontWeight: 700 }}>⚠ ONLY {selectedJersey.stock} LEFT IN STOCK</div>
                )}
              </div>
              <div style={{ padding: "8px 24px 24px" }}>
                <div style={{ fontSize: 12, letterSpacing: 3, color: "#555", marginBottom: 12, fontWeight: 700 }}>SELECT SIZE</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {sizes.map(s => {
  const sizeStock = selectedJersey.size_stock?.[s] ?? 0;
  const outOfStock = sizeStock === 0;
  return (
    <button
      key={s}
      className={`size-btn ${selectedSize === s ? "selected" : ""} ${outOfStock ? "oos" : ""}`}
      onClick={() => !outOfStock && setSelectedSize(s)}
      disabled={outOfStock}
      style={outOfStock ? { opacity: 0.3, cursor: "not-allowed", textDecoration: "line-through" } : {}}
    >
      {s}
    </button>
  );
})}
                </div>
                <button className="add-btn" style={{ marginTop: 24, fontSize: 16 }} onClick={() => addToCart(selectedJersey, selectedSize)}>
                  ADD TO CART — ₹{selectedJersey.price}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CART PANEL */}
        {cartOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 150 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => setCartOpen(false)} />
            <div className="cart-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px", borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>YOUR CART</span>
                <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#333" }}>
                    <div style={{ fontSize: 50 }}>🛒</div>
                    <p style={{ marginTop: 12, letterSpacing: 2, fontSize: 13 }}>CART IS EMPTY</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={`${item.id}-${item.size}`} className="cart-item">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="cart-item-img" />
                      ) : (
                        <div style={{ width: 50, height: 50, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👕</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>{item.name}</div>
                        <div style={{ color: "#555", fontSize: 11, letterSpacing: 2, marginTop: 2 }}>SIZE {item.size} · QTY {item.qty}</div>
                        <div style={{ color: "#39ff14", fontWeight: 700, marginTop: 4 }}>₹{item.price * item.qty}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.id, item.size)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 18, transition: "color 0.2s" }}
                        onMouseEnter={e => e.target.style.color = "#ff4444"} onMouseLeave={e => e.target.style.color = "#444"}>✕</button>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px 12px", fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>
                    <span style={{ color: "#555" }}>TOTAL</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                  <button className="checkout-btn" onClick={() => { localStorage.setItem("cart", JSON.stringify(cart)); navigate("/checkout"); }}>
                    PROCEED TO CHECKOUT →
                  </button>
                  <p style={{ textAlign: "center", color: "#333", fontSize: 11, letterSpacing: 2, paddingBottom: 16 }}>FREE SHIPPING ON ORDERS ABOVE ₹1999</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}