import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from '../supabase';
import logo from "../assets/jerseyvault-logo.jpeg";
import heroBg from "../assets/hero-bg.jpeg";

const LOGO_SRC = logo;

// FIX 4: Stable ID — computed once outside render, no Math.random() on each render
function useStableId(prefix) {
  const ref = useRef(null);
  if (!ref.current) {
    ref.current = `${prefix}-${Math.random().toString(36).slice(2)}`;
  }
  return ref.current;
}

function CartoonFlameText({ text }) {
  const id = useStableId("flameclip-" + text.replace(/\s/g, ""));
  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 0.9 }}>
      <span style={{
        fontSize: "clamp(40px,8vw,100px)",
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
            <text x="0" y="90%" fontSize="clamp(40px,8vw,100px)" fontWeight="900" fontStyle="italic" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="-2">{text}</text>
          </clipPath>
          <linearGradient id={`${id}-g1`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFE000" /><stop offset="22%" stopColor="#FF8C00" />
            <stop offset="48%" stopColor="#E8000A" /><stop offset="78%" stopColor="#B20000" />
            <stop offset="100%" stopColor="#3a0000" />
          </linearGradient>
          <linearGradient id={`${id}-g2`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFF176" /><stop offset="18%" stopColor="#FFB300" />
            <stop offset="45%" stopColor="#FF3D00" /><stop offset="75%" stopColor="#C62828" />
            <stop offset="100%" stopColor="#4a0000" />
          </linearGradient>
          <filter id={`${id}-wobble`} x="-20%" y="-40%" width="140%" height="180%">
            <feTurbulence type="turbulence" baseFrequency="0.025 0.06" numOctaves="3" seed="2" result="noise">
              <animate attributeName="baseFrequency" values="0.025 0.06; 0.03 0.08; 0.022 0.055; 0.025 0.06" dur="0.9s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g clipPath={`url(#${id})`} filter={`url(#${id}-wobble)`}>
          <rect x="-5%" y="-80%" width="110%" height="200%" fill={`url(#${id}-g1)`}>
            <animateTransform attributeName="transform" type="translate" values="0,0; 2,-6; -3,-10; 1,-5; 0,0" dur="0.55s" repeatCount="indefinite" />
          </rect>
          <rect x="-5%" y="-60%" width="110%" height="180%" fill={`url(#${id}-g2)`} opacity="0.65">
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

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const filterButtons = [
  { key: "ALL",            label: "ALL" },
  { key: "FAN VERSION",    label: "FAN" },
  { key: "PLAYER VERSION", label: "PLAYER" },
  { key: "RETRO",          label: "RETRO" },
];

export default function JerseyStore() {
  const navigate = useNavigate();
  const [jerseys, setJerseys] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedJersey, setSelectedJersey] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [toast, setToast] = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isAdmin, setIsAdmin] = useState(false);
  // FIX 1 & 2: Hamburger menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .then(async ({ data, error }) => {
        if (!error && data) {
          setJerseys(data);
          
          // Validate existing cart items against fresh data
          if (cart.length > 0) {
            const validIds = new Set(data.map(p => p.id));
            const filteredCart = cart.filter(item => validIds.has(item.id));
            
            if (filteredCart.length !== cart.length) {
              setCart(filteredCart);
              localStorage.setItem("cart", JSON.stringify(filteredCart));
              showToast("Some unavailable items were removed from your cart.");
            }
          }
        }
        setLoadingProducts(false);
      });
  }, []);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session) {
        setUser(data.session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();
        if (profile?.role === "admin") setIsAdmin(true);
      }
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // FIX 9: useMemo for filtered list
  const filtered = useMemo(() => jerseys.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "ALL" ||
      j.type === activeFilter;
    return matchesSearch && matchesFilter;
  }), [jerseys, searchQuery, activeFilter]);

  // FIX 9: useCallback for stable handlers
  const addToCart = useCallback((jersey, size) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === jersey.id && i.size === size);
      if (existing) return prev.map(i => i.id === jersey.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...jersey, size, qty: 1 }];
    });
    showToast(`${jersey.name} added to cart!`);
    setSelectedJersey(null);
  }, []);

  const removeFromCart = useCallback((id, size) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.size === size)));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const sectionTitle = activeFilter === "ALL" ? "SHOP ALL" : activeFilter;

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    try { localStorage.removeItem("cart"); } catch {}
    setMobileMenuOpen(false);
  }, []);

  const scrollToShop = useCallback(() => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, []);

  // FIX 11: Gate checkout if no user
  const handleCheckout = useCallback(() => {
  localStorage.setItem("cart", JSON.stringify(cart));
  navigate("/checkout");
}, [cart, navigate]);

  const navLinks = (
    <>
      <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>HOME</Link>
      <span className="nav-link" onClick={scrollToShop}>SHOP</span>
      <Link to="/tracking" className="nav-link" onClick={() => setMobileMenuOpen(false)}>TRACK</Link>
      <Link to="/checkout" className="nav-link" onClick={() => setMobileMenuOpen(false)}>CART</Link>
      <Link to="/myorders" className="nav-link" onClick={() => setMobileMenuOpen(false)}>MY ORDERS</Link>
      {user ? (
        <span className="nav-link" onClick={handleLogout}>LOGOUT</span>
      ) : (
        <Link to="/auth" className="nav-link" onClick={() => setMobileMenuOpen(false)}>LOGIN</Link>
      )}
      {isAdmin && (
        <span className="nav-link" style={{ color: "#39ff14" }} onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>⚙ ADMIN</span>
      )}
    </>
  );

  // FIX 5: Safe size_stock accessor
  const getSizeStock = (jersey, size) => {
    if (!jersey?.size_stock || typeof jersey.size_stock !== "object") return 0;
    return jersey.size_stock[size] ?? 0;
  };

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
          @keyframes breathe { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
          @keyframes mobileMenuSlide { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }

          .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; }
          .nav-link:hover { color:#39ff14; }

          /* CARD */
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
          .size-btn:hover:not(.selected):not(:disabled) { border-color:#39ff14; color:#39ff14; }

          /* FIX 8: Modal with proper padding bottom for small screens */
          .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:16px; }
          .modal { background:#111; border:1px solid #2a2a2a; width:100%; max-width:480px; overflow:hidden; animation:fadeUp 0.3s ease; max-height:calc(100vh - 32px); overflow-y:auto; border-radius:2px; }
          .modal-img { width:100%; height:220px; object-fit:cover; display:block; }
          .modal-img-placeholder { width:100%; height:220px; background:#0d0d0d; display:flex; align-items:center; justify-content:center; font-size:80px; }

          /* CART PANEL */
          .cart-panel { position:fixed; right:0; top:0; bottom:0; width:360px; background:#0f0f0f; border-left:1px solid #222; z-index:200; display:flex; flex-direction:column; animation:slideDown 0.3s ease; }
          .cart-item { display:flex; gap:12px; padding:16px; border-bottom:1px solid #1a1a1a; align-items:center; }
          .cart-item-img { width:50px; height:50px; object-fit:cover; background:#0d0d0d; flex-shrink:0; }
          .checkout-btn { background:linear-gradient(90deg,#39ff14,#00ff88); color:#000; border:none; width:calc(100% - 32px); margin:16px; padding:16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:16px; letter-spacing:3px; cursor:pointer; animation:glow 2s infinite; }
          .checkout-btn:hover { background:#fff; }

         .search-input { background:#161616; border:1px solid #444; border-radius:999px; color:#fff; padding:10px 20px; font-family:'Barlow Condensed',sans-serif; font-size:15px; outline:none; letter-spacing:1px; width:100%; max-width:480px; flex:1; transition:border-color 0.2s, box-shadow 0.2s; }
         .search-input:focus { border-color:#39ff14; box-shadow: 0 0 0 2px rgba(57,255,20,0.15); }
         .search-input::placeholder { color:#888; letter-spacing:2px; }

          .skeleton { background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
          .logo-img { width52px; height:54px; object-fit:contain; mix-blend-mode:screen; filter:brightness(1.3) contrast(1.13) drop-shadow(0 0 4px rgba(57,255,20,0.15)); display:block; background:transparent; }
          .logo-wrap { display:flex; align-items:center; gap:8px; }
          .out-of-stock-badge { position:absolute; top:12px; left:12px; background:#ff4444; color:#fff; font-size:10px; font-weight:900; letter-spacing:2px; padding:3px 8px; z-index:2; }
          .type-badge-card { position:absolute; top:12px; right:12px; font-size:9px; font-weight:900; letter-spacing:2px; padding:3px 8px; z-index:2; background:#00000088; border:1px solid #39ff1466; color:#39ff14; }

          /* FIX 6: Filter buttons scroll on small screens */
          .filter-bar { display:flex; gap:8px; flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:4px; scrollbar-width:none; }
          .filter-bar::-webkit-scrollbar { display:none; }
          .filter-btn { background:transparent; color:#888; border:1px solid #333; padding:8px 14px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:2px; cursor:pointer; transition:all 0.2s; text-transform:uppercase; white-space:nowrap; flex-shrink:0; }
          .filter-btn:hover { border-color:#39ff14; color:#39ff14; }
          .filter-btn.active { background:#39ff14; border-color:#39ff14; color:#000; }

          /* Hamburger */
          .hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:4px; }
          .hamburger span { display:block; width:22px; height:2px; background:#fff; transition:all 0.3s; }
          .hamburger.open span:nth-child(1) { transform:rotate(45deg) translate(5px,5px); }
          .hamburger.open span:nth-child(2) { opacity:0; }
          .hamburger.open span:nth-child(3) { transform:rotate(-45deg) translate(5px,-5px); }

          /* Desktop nav links */
          .desktop-nav { display:flex; gap:28px; align-items:center; }

          /* Mobile menu dropdown */
          .mobile-menu { display:none; position:absolute; top:60px; left:0; right:0; background:rgba(10,10,10,0.98); border-bottom:1px solid #222; padding:16px 24px; flex-direction:column; gap:20px; animation:mobileMenuSlide 0.2s ease; z-index:49; }
          .mobile-menu.open { display:flex; }
          .mobile-menu .nav-link { font-size:18px; letter-spacing:3px; padding:4px 0; border-bottom:1px solid #1a1a1a; }

          /* Stats fix */
          .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid #1a1a1a; border-bottom:1px solid #1a1a1a; background:#0d0d0d; }
          /* FIX 3: Remove borderRight from last stat cell */
          .stat-cell { text-align:center; padding:20px 0; border-right:1px solid #1a1a1a; }
          .stat-cell:last-child { border-right:none; }

          /* FIX 10: Hero mobile */
          .hero-section { position:relative; padding:80px 24px 60px; text-align:center; overflow:hidden; background-size:cover; background-position:center top; background-repeat:no-repeat; }

          /* FIX 7: Mobile cart panel */
          /* Replace the existing mobile search-input rule */
@media(max-width:768px) {
  .hamburger { display:flex; }
  .desktop-nav { display:none; }
  .cart-panel { width:100%; border-left:none; }
  .search-input { max-width:100%; font-size:13px; padding:8px 16px; }
  .hero-section { padding:60px 16px 40px; background-position:center center; background-size:cover; }
  .modal-img { height:180px; }
  .modal-img-placeholder { height:180px; }
  .shop-header { flex-direction:column; align-items:flex-start !important; gap:12px !important; }
  .nav-right { gap:8px !important; }
}
@media(max-width:480px) {
  .stat-cell { padding:14px 0; }
}
        `}</style>

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, background: "#39ff14", color: "#000", padding: "14px 20px", fontWeight: 900, letterSpacing: 2, fontSize: 13, zIndex: 999, animation: "toastIn 0.3s ease", maxWidth: "calc(100vw - 48px)" }}>
            ✓ {toast}
          </div>
        )}

        {/* NAVBAR */}
       <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid #1a1a1a", padding: "0 0 0 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, height: 64, animation: "slideDown 0.5s ease" }}>
  {/* LEFT: Logo */}
<div className="logo-wrap" style={{ flexShrink: 0, marginLeft: 0, paddingLeft: 0 }}>
    <img src={LOGO_SRC} alt="JerseyVault logo" className="logo-img" />
    <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#fff" }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
  </div>

  {/* CENTER: Search — desktop only */}
  <div className="desktop-nav" style={{ flex: 1, justifyContent: "center", maxWidth: 520 }}>
    <input
      className="search-input"
      placeholder="SEARCH..."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
    />
  </div>

  {/* Desktop nav links */}
  <div className="desktop-nav" style={{ flexShrink: 0 }}>
    {navLinks}
  </div>

  {/* RIGHT: Cart + hamburger */}
  <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, paddingRight: 20 }}>
    <button
      onClick={() => setCartOpen(true)}
      style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 1, padding: 0, transition: "color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.color = "#39ff14"}
      onMouseLeave={e => e.currentTarget.style.color = "#fff"}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      {cartCount > 0 && (
        <span style={{ color: "#39ff14", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{cartCount}</span>
      )}
    </button>
    <button
      className={`hamburger${mobileMenuOpen ? " open" : ""}`}
      onClick={() => setMobileMenuOpen(o => !o)}
      aria-label="Toggle menu"
    >
      <span /><span /><span />
    </button>
  </div>

  {/* Mobile dropdown */}
  <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
    <input
      className="search-input"
      placeholder="SEARCH..."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      style={{ marginBottom: 8 }}
    />
    {navLinks}
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

        {/* FIX 10: Hero — mobile-friendly */}
        <section
          className="hero-section"
          style={{
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 0.8s ease",
            backgroundImage: `url(${heroBg})`,
          }}
        >
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.4) 30%, rgba(0,0,0,0.3) 60%, rgba(10,10,10,0.98) 100%)",
            pointerEvents: "none"
          }} />

          <p style={{ color: "#39ff14", letterSpacing: 6, fontSize: 12, fontWeight: 700, marginBottom: 16, animation: "fadeUp 0.6s ease 0.2s both", position: "relative", zIndex: 1 }}>THE ULTIMATE COLLECTION</p>

          <h1 style={{
            lineHeight: 0.9,
            animation: "fadeUp 0.6s ease 0.3s both, breathe 3s ease-in-out 1s infinite",
            position: "relative",
            display: "inline-block",
            zIndex: 1,
          }}>
            <span style={{ display: "block", position: "relative", marginBottom: 4 }}>
              <CartoonFlameText text="WEAR YOUR" />
            </span>
            <span style={{ display: "block", color: "#39ff14", fontSize: "clamp(48px,10vw,120px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, letterSpacing: -2 }}>
              LEGEND
            </span>
          </h1>

          <p style={{ color: "#ccc", marginTop: 20, fontSize: 16, letterSpacing: 2, fontFamily: "'Barlow',sans-serif", fontWeight: 400, animation: "fadeUp 0.6s ease 0.4s both", position: "relative", zIndex: 1 }}>Official jerseys from football, cricket &amp; basketball</p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.6s ease 0.5s both", position: "relative", zIndex: 1 }}>
            <button onClick={scrollToShop}
              style={{ background: "#39ff14", color: "#000", border: "none", padding: "14px 36px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 3, cursor: "pointer", animation: "pulse 2s infinite" }}>
              SHOP NOW
            </button>
            <button style={{ background: "transparent", color: "#fff", border: "1px solid #333", padding: "14px 36px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 3, cursor: "pointer" }}>
              VIEW TEAMS
            </button>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #39ff14, transparent)" }} />
        </section>

        {/* FIX 3: Stats — last cell has no borderRight */}
        <div className="stats-grid">
          {[["500+", "JERSEYS"], ["50K+", "CUSTOMERS"], ["100%", "AUTHENTIC"]].map(([num, label]) => (
            <div key={label} className="stat-cell">
              <div style={{ fontSize: 28, fontWeight: 900, color: "#39ff14" }}>{num}</div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#ccc", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* SHOP */}
        <section id="shop" style={{ padding: "60px 16px" }}>
          <div className="shop-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontStyle: "italic", letterSpacing: 1 }}>
              <span style={{ color: "#39ff14" }}>/ </span>{sectionTitle}
            </h2>

            {/* FIX 6: Horizontally scrollable filter bar */}
            <div className="filter-bar">
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
        <section style={{ background: "#0d0d0d", padding: "60px 16px", borderTop: "1px solid #1a1a1a" }}>
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
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
            {[["PRIVACY", "/privacy"], ["TERMS", "/terms"], ["CONTACT", "/contact"], ["FAQ", "/faq"]].map(([l, h]) => (
              <Link key={l} to={h} style={{ color: "#888", fontSize: 12, letterSpacing: 2, cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = "#39ff14"} onMouseLeave={e => e.target.style.color = "#888"}>{l}</Link>
            ))}
          </div>
        </footer>

        {/* FIX 8: SIZE PICKER MODAL — proper padding & scroll */}
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
              <div style={{ padding: "8px 24px 32px" }}>
                <div style={{ fontSize: 12, letterSpacing: 3, color: "#555", marginBottom: 12, fontWeight: 700 }}>SELECT SIZE</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {/* FIX 5: Safe size_stock via helper */}
                  {sizes.map(s => {
                    const sizeStock = getSizeStock(selectedJersey, s);
                    const outOfStock = sizeStock === 0;
                    return (
                      <button
                        key={s}
                        className={`size-btn${selectedSize === s ? " selected" : ""}`}
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
                  {/* FIX 11: Gated checkout */}
                  <button className="checkout-btn" onClick={handleCheckout}>
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