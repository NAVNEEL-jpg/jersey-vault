import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from '../supabase';
import logo from "../assets/jerseyvault-logo.jpeg";
import heroBg from "../assets/hero-bg.jpeg";

const LOGO_SRC = logo;

const FLAME_ID = "jv-flame";

const CartoonFlameText = memo(function CartoonFlameText({ text }) {
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
          <clipPath id={FLAME_ID}>
            <text x="0" y="90%" fontSize="clamp(40px,8vw,100px)" fontWeight="900" fontStyle="italic" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="-2">{text}</text>
          </clipPath>
          <linearGradient id={`${FLAME_ID}-g1`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFE000" /><stop offset="22%" stopColor="#FF8C00" />
            <stop offset="48%" stopColor="#E8000A" /><stop offset="78%" stopColor="#B20000" />
            <stop offset="100%" stopColor="#3a0000" />
          </linearGradient>
          <linearGradient id={`${FLAME_ID}-g2`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFF176" /><stop offset="18%" stopColor="#FFB300" />
            <stop offset="45%" stopColor="#FF3D00" /><stop offset="75%" stopColor="#C62828" />
            <stop offset="100%" stopColor="#4a0000" />
          </linearGradient>
          <filter id={`${FLAME_ID}-wobble`} x="-20%" y="-40%" width="140%" height="180%">
            <feTurbulence type="turbulence" baseFrequency="0.025 0.06" numOctaves="3" seed="2" result="noise">
              <animate attributeName="baseFrequency" values="0.025 0.06; 0.03 0.08; 0.022 0.055; 0.025 0.06" dur="0.9s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g clipPath={`url(#${FLAME_ID})`} filter={`url(#${FLAME_ID}-wobble)`}>
          <rect x="-5%" y="-80%" width="110%" height="200%" fill={`url(#${FLAME_ID}-g1)`}>
            <animateTransform attributeName="transform" type="translate" values="0,0; 2,-6; -3,-10; 1,-5; 0,0" dur="0.55s" repeatCount="indefinite" />
          </rect>
          <rect x="-5%" y="-60%" width="110%" height="180%" fill={`url(#${FLAME_ID}-g2)`} opacity="0.65">
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
});

const Ticker = memo(function Ticker() {
  return (
    <div className="jv-ticker" style={{ background: "#00ff44", color: "#000", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap", WebkitMaskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)", maskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)" }}>
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
  );
});

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
      const saved = sessionStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedJersey, setSelectedJersey] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [toast, setToast] = useState(null);

  const [heroVisible, setHeroVisible] = useState(() => {
    try { return sessionStorage.getItem("jv_visited") === "1"; }
    catch { return false; }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .then(async ({ data, error }) => {
        if (!error && data) {
          setJerseys(data);
          if (cart.length > 0) {
            const validIds = new Set(data.map(p => p.id));
            const filteredCart = cart.filter(item => validIds.has(item.id));
            if (filteredCart.length !== cart.length) {
              setCart(filteredCart);
              sessionStorage.setItem("cart", JSON.stringify(filteredCart));
              showToast("Some unavailable items were removed from your cart.");
            }
          }
        }
        setLoadingProducts(false);
      });
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem("jv_visited", "1"); } catch {}
  }, []);

  useEffect(() => {
    if (!heroVisible) {
      const t = setTimeout(() => setHeroVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session) {
        const sessionUser = data.session.user;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionUser.id)
          .single();
        setUser(sessionUser);
        if (profile?.role === "admin") setIsAdmin(true);
      }
    });
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filtered = useMemo(() => jerseys.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "ALL" || j.type === activeFilter;
    return matchesSearch && matchesFilter;
  }), [jerseys, searchQuery, activeFilter]);

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
    setIsAdmin(false);
    setCart([]);
    try { sessionStorage.removeItem("cart"); } catch {}
    setMobileMenuOpen(false);
  }, []);

  const scrollToShop = useCallback(() => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, []);

  const handleCheckout = useCallback(() => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
    navigate("/checkout");
  }, [cart, navigate]);

  const getSizeStock = (jersey, size) => {
    if (!jersey?.size_stock || typeof jersey.size_stock !== "object") return 0;
    return jersey.size_stock[size] ?? 0;
  };

  const navLinks = useMemo(() => (
    <>
      <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>HOME</Link>
      <span className="nav-link" onClick={scrollToShop}>SHOP</span>
      <Link to="/teams" className="nav-link" onClick={() => setMobileMenuOpen(false)}>TEAMS</Link>
      <Link to="/tracking" className="nav-link" onClick={() => setMobileMenuOpen(false)}>TRACK</Link>
      <span className="nav-link" onClick={() => { setCartOpen(true); setMobileMenuOpen(false); }}>CART</span>
      <Link to="/myorders" className="nav-link" onClick={() => setMobileMenuOpen(false)}>MY ORDERS</Link>
      {user ? (
        <span className="nav-link" onClick={handleLogout}>LOGOUT</span>
      ) : (
        <Link to="/auth" className="nav-link" onClick={() => setMobileMenuOpen(false)}>LOGIN</Link>
      )}
      {isAdmin && (
        <span className="nav-link" style={{ color: "#00ff44" }} onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>⚙ ADMIN</span>
      )}
    </>
  ), [user, isAdmin, handleLogout, scrollToShop, navigate]);

  return (
    <>
      <div id="jv-root" style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
  <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&family=Bebas+Neue&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  #jv-root button:not(.hamburger) { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; text-transform: uppercase; }
  #jv-root .add-btn, #jv-root .checkout-btn { display: block; width: 100%; text-align: center; }
  #jv-root .filter-btn, #jv-root .size-btn { display: inline-flex; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #00ff44; border-radius: 2px; }

  @keyframes slideDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
  @keyframes toastIn { from{opacity:0;transform:translateX(100px);} to{opacity:1;transform:translateX(0);} }
  @keyframes marquee { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
  @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
  @keyframes breathe { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
  @keyframes mobileMenuSlide { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
  @keyframes scanline { 0%{transform:translateY(-100%);} 100%{transform:translateY(400%);} }
  @keyframes cartItemSlide { from{opacity:0; transform:translateX(20px);} to{opacity:1; transform:translateX(0);} }

  .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; position:relative; }
  .nav-link::after { content:''; position:absolute; left:0; bottom:-3px; width:0; height:2px; background:#00ff44; transition:width 0.25s cubic-bezier(0.25,1,0.5,1); border-radius:2px; }
  .nav-link:hover { color:#00ff44; }
  .nav-link:hover::after { width:100%; }

  .ticker-wrap { position:relative; overflow:hidden; }
  .ticker-wrap::before, .ticker-wrap::after { content:''; position:absolute; top:0; bottom:0; width:80px; z-index:2; pointer-events:none; }
  .ticker-wrap::before { left:0; background:linear-gradient(to right, #00ff44, transparent); }
  .ticker-wrap::after { right:0; background:linear-gradient(to left, #00ff44, transparent); }

  .card { background:#111; border:1px solid #1a1a1a; overflow:hidden; cursor:pointer; transition:transform 0.3s, border-color 0.3s; position:relative; display:flex; flex-direction:column; }
  .product-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:20px; }
  .card:hover { transform:translateY(-4px); border-color:#00ff44; }
  .card-img { width:100%; height:220px; object-fit:cover; display:block; transition:transform 0.4s; }
  .card:hover .card-img { transform:scale(1.04); }
  .card-img-wrap { overflow:hidden; position:relative; height:220px; background:#0d0d0d; }
  .card-overlay { position:absolute; inset:0; background:linear-gradient(to top, #000 0%, transparent 60%); opacity:0.5; pointer-events:none; }

  #jv-root .add-btn {
    position: relative;
    overflow: hidden;
    background: #1a1a1a !important;
    color: #fff !important;
    border: 1px solid #27272a !important;
    width: 100%;
    padding: 14px 16px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.3s ease-in-out;
    display: block;
    text-align: center;
  }
  #jv-root .add-btn::before { display: none; }
  #jv-root .add-btn::after { display: none; }
  #jv-root .add-btn:hover {
    background: #00ff44 !important;
    color: #000000 !important;
    border-color: #00ff44 !important;
    box-shadow: 0 0 15px rgba(0, 255, 68, 0.4) !important;
  }
  #jv-root .add-btn:active { transform: scale(0.98); }
  #jv-root .add-btn:disabled,
  #jv-root .add-btn[disabled] {
    background: #111 !important;
    color: #444 !important;
    border-color: #222 !important;
    cursor: not-allowed;
    box-shadow: none !important;
  }

  .filter-bar { display:flex; gap:14px; flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding:4px 2px 6px; scrollbar-width:none; align-items:stretch; }
  .filter-bar::-webkit-scrollbar { display:none; }

  #jv-root .filter-btn {
    background: #0d0d0d !important;
    color: #00ff44 !important;
    border: 1px solid transparent !important;
    box-sizing: border-box;
    height: 40px;
    padding: 0 20px;
    font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1;
    letter-spacing: 3px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    text-shadow: none;
    box-shadow: none !important;
  }
  #jv-root .filter-btn:not(.active) {
    text-shadow: none;
  }
  #jv-root .filter-btn:hover:not(.active) {
    background: #00ff44 !important;
    color: #000 !important;
    text-shadow: none !important;
    transform: translateY(-1px);
  }
  #jv-root .filter-btn.active {
    background: #00ff44 !important;
    color: #000 !important;
    text-shadow: none !important;
    box-shadow: none !important;
    transform: none;
  }

  .size-btn {
    background: rgba(26, 26, 26, 0.5) !important;
    border: 1px solid #27272a !important;
    color: #eee !important;
    width: 48px !important;
    height: 48px !important;
    padding: 8px !important;
    font-family: 'Barlow Condensed', sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.3s ease-in-out !important;
    letter-spacing: 1px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    position: relative !important;
    box-sizing: border-box !important;
    flex-shrink: 0 !important;
  }
  .size-btn:hover:not(.selected):not(:disabled) {
    background: #00ff44 !important;
    color: #000000 !important;
    border-color: #00ff44 !important;
    box-shadow: 0 0 15px rgba(0, 255, 68, 0.4) !important;
  }
  .size-btn.selected {
    background: #00ff44 !important;
    color: #000000 !important;
    border-color: #00ff44 !important;
    box-shadow: 0 0 15px rgba(0, 255, 68, 0.4) !important;
  }
  .size-label {
    font-family: 'Barlow', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 5px;
    color: #a1a1aa;
    text-transform: uppercase;
    display: block;
    margin-bottom: 12px;
    text-align: center;
  }

  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px); padding:16px; }
  .modal { background:#0e0e0e; border:1px solid #222; width:100%; max-width:480px; overflow:hidden; animation:fadeUp 0.3s ease; max-height:calc(100vh - 32px); overflow-y:auto; box-shadow:0 0 60px rgba(0,255,0,0.08), 0 40px 80px rgba(0,0,0,0.8); }
  .modal-img { width:100%; height:220px; object-fit:cover; display:block; }
  .modal-img-placeholder { width:100%; height:220px; background:#0d0d0d; display:flex; align-items:center; justify-content:center; font-size:80px; }

  .cart-panel { position:fixed; right:0; top:0; bottom:0; width:380px; background:#0a0a0a; border-left:1px solid #1e1e1e; z-index:200; display:flex; flex-direction:column; animation:slideDown 0.28s cubic-bezier(0.23,1,0.32,1); box-shadow:-20px 0 60px rgba(0,0,0,0.7); }

  .cart-item { display:flex; gap:14px; padding:16px 20px; border-bottom:1px solid #141414; align-items:center; animation:cartItemSlide 0.25s ease both; transition:background 0.15s; }
  .cart-item:hover { background:#0f0f0f; }
  .cart-item-img { width:54px; height:54px; object-fit:cover; background:#0d0d0d; flex-shrink:0; border:1px solid #1a1a1a; }
  .cart-item-name { font-family:'Barlow', sans-serif; font-weight:600; font-size:15px; letter-spacing:0.5px; color:#eee; line-height:1.2; }
  .cart-item-meta { font-family:'Barlow Condensed',sans-serif; font-size:11px; letter-spacing:3px; color:#444; margin-top:3px; font-weight:700; }
  .cart-item-price { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; color:#00ff44; margin-top:6px; letter-spacing:1px; }
  .cart-tag { display:inline-flex; align-items:center; gap:6px; margin-top:5px; }
  .cart-tag-size { background:#00ff44; color:#000; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; letter-spacing:2px; padding:3px 8px; }
  .cart-tag-qty { color:#444; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; }

  .cart-total-row { display:flex; justify-content:space-between; align-items:center; padding:16px 20px 8px; background:#0d0d0d; border-top:1px solid #1a1a1a; }
  .cart-total-label { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:13px; letter-spacing:6px; color:#555; text-transform:uppercase; }
  .cart-total-amount { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:32px; color:#00ff44; letter-spacing:2px; line-height:1; }

  .checkout-btn {
    position: relative;
    overflow: hidden;
    background: #1a1a1a;
    color: #fff;
    border: 1px solid #27272a !important;
    width: calc(100% - 32px);
    margin: 12px 16px;
    padding: 18px 0;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.3s ease-in-out;
    display: block;
    text-align: center;
    box-shadow: none;
  }
  .checkout-btn:hover {
    background: #00ff44 !important;
    color: #000000 !important;
    border-color: #00ff44 !important;
    box-shadow: 0 0 15px rgba(0, 255, 68, 0.4) !important;
  }
  .checkout-btn:active { transform:scale(0.98); }

  .search-input { background:#161616; border:1px solid #444; border-radius:999px; color:#fff; padding:10px 20px; font-family:'Barlow Condensed',sans-serif; font-size:15px; outline:none; letter-spacing:1px; width:100%; max-width:480px; flex:1; transition:border-color 0.2s, box-shadow 0.2s; }
  .search-input:focus { border-color:#00ff44; box-shadow:0 0 0 2px rgba(0,255,68,0.15); }
  .search-input::placeholder { color:#888; letter-spacing:2px; }
  .skeleton { background:linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  .logo-img { width:52px; height:54px; object-fit:contain; mix-blend-mode:screen; filter:brightness(1.3) contrast(1.13) drop-shadow(0 0 4px rgba(0,255,0,0.15)); display:block; background:transparent; }
  .logo-wrap { display:flex; align-items:center; gap:8px; }
  .out-of-stock-badge { position:absolute; top:12px; left:12px; background:#ff4444; color:#fff; font-size:10px; font-weight:900; letter-spacing:2px; padding:3px 8px; z-index:2; }
  .type-badge-card { position:absolute; top:12px; right:12px; font-size:9px; font-weight:900; letter-spacing:2px; padding:3px 8px; z-index:2; background:#000; border:1px solid rgba(0,255,68,0.4); color:#00ff44; }
  .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid #1a1a1a; border-bottom:1px solid #1a1a1a; background:#0d0d0d; }
  .stat-cell { text-align:center; padding:20px 0; border-right:1px solid #1a1a1a; }
  .stat-cell:last-child { border-right:none; }
  .hero-section { position:relative; padding:80px 24px 60px; text-align:center; overflow:hidden; background-size:cover; background-position:center top; background-repeat:no-repeat; }
  .hamburger { display:none; flex-direction:column; justify-content:space-between; width:28px; height:22px; background:none !important; border:none !important; cursor:pointer; padding:0 !important; }
  .hamburger span { display:block !important; width:100%; height:3px; background:white !important; border-radius:2px; }
  .hamburger.open span:nth-child(1) { transform:rotate(45deg) translate(5px,5px); }

  #jv-root .jv-btn-premium {
    background: #1a1a1a !important;
    color: #ffffff !important;
    border: 1px solid #27272a !important;
    padding: 14px 36px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 500 !important;
    font-size: 14px !important;
    letter-spacing: 2px !important;
    text-transform: uppercase !important;
    cursor: pointer;
    transition: all 0.3s ease-in-out !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  #jv-root .jv-btn-premium:hover {
    background: #00ff44 !important;
    color: #000000 !important;
    border-color: #00ff44 !important;
    box-shadow: 0 0 15px rgba(0, 255, 68, 0.4) !important;
  }
  #jv-root .jv-btn-premium:active {
    transform: scale(0.98);
  }

  #jv-root .jv-btn-premium-secondary {
    background: transparent !important;
    color: #888 !important;
    border: 1px solid #27272a !important;
    padding: 14px 36px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 500 !important;
    font-size: 14px !important;
    letter-spacing: 2px !important;
    text-transform: uppercase !important;
    cursor: pointer;
    transition: all 0.3s ease-in-out !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  #jv-root .jv-btn-premium-secondary:hover {
    border-color: #555 !important;
    color: #fff !important;
    background: rgba(255, 255, 255, 0.03) !important;
  }
  #jv-root .jv-btn-premium-secondary:active {
    transform: scale(0.98);
  }
  .hamburger.open span:nth-child(2) { opacity:0; }
  .hamburger.open span:nth-child(3) { transform:rotate(-45deg) translate(5px,-5px); }
  .desktop-nav { display:flex; gap:28px; align-items:center; }
  .mobile-menu { display:none; position:absolute; top:64px; left:0; right:0; background:rgba(10,10,10,0.98); border-bottom:1px solid #222; padding:16px 24px; flex-direction:column; gap:20px; animation:mobileMenuSlide 0.2s ease; z-index:49; }
  .mobile-menu.open { display:flex; }
  .mobile-menu .nav-link { font-size:18px; letter-spacing:3px; padding:4px 0; border-bottom:1px solid #1a1a1a; }

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
    /* Hero CTA buttons → full width for easy thumb-tap on mobile */
    #jv-root .jv-btn-premium,
    #jv-root .jv-btn-premium-secondary {
      width: 100% !important;
      padding: 16px 24px !important;
      justify-content: center !important;
    }
    /* Card image shorter on small screens */
    .card-img { height: 180px; }
    .card-img-wrap { height: 180px; }
    /* Modal image shorter on mobile */
    .modal-img { height: 160px; }
    .modal-img-placeholder { height: 160px; }
  }
  @media(max-width:480px) {
    .stat-cell { padding:12px 4px; }
    /* Stat numbers: reduce size so they fit 3-column row on 320px phones */
    .stat-cell > div:first-child { font-size:22px !important; }
    .stat-cell > div:last-child  { font-size:9px !important; letter-spacing:2px !important; }
    /* Product grid: 2-col at 340px+; drops to 1-col below via auto-fill minmax */
    .product-grid { grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
    /* Reduce card image to keep cards compact */
    .card-img { height:150px; }
    .card-img-wrap { height:150px; }
    /* Hero padding */
    .hero-section { padding:48px 12px 28px; }
    /* Filter bar tighter */
    .filter-bar { gap:8px; }
    /* Features grid single-column */
    .features-grid { grid-template-columns:1fr !important; }
  }
  @media(max-width:380px) {
    /* Compact section padding on very small phones */
    .hero-section { padding:40px 10px 24px; }
    /* Stat row: collapse labels on tiny screens */
    .stats-grid { grid-template-columns:repeat(3,1fr); }
    .stat-cell > div:first-child { font-size:20px !important; }
    /* Cart panel fits edge-to-edge */
    .cart-panel { width:100vw; }
    /* Search input tighter */
    .search-input { font-size:12px; padding:7px 12px; }
    /* Toast fits small screens */
    .toast-msg { font-size:11px !important; padding:10px 14px !important; }
  }
`}</style>

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, background: "#00ff44", color: "#000", padding: "14px 20px", fontWeight: 900, letterSpacing: 2, fontSize: 13, zIndex: 999, animation: "toastIn 0.3s ease", maxWidth: "calc(100vw - 48px)", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>
            ✓ {toast}
          </div>
        )}

        {/* NAVBAR */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 0 0 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, height: 64, animation: "slideDown 0.5s ease" }}>
          <div className="logo-wrap" style={{ flexShrink: 0, marginLeft: 0, paddingLeft: 0 }}>
            <img src={LOGO_SRC} alt="JerseyVault logo" className="logo-img" width="58" height="68" />
              <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#fff" }}>JERSEY<span style={{ color: "#00b344", fontWeight: 900 }}>VAULT</span></span>
          </div>
          <div className="desktop-nav" style={{ flex: 1, justifyContent: "center", maxWidth: 520 }}>
            <input
              className="search-input"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="desktop-nav" style={{ flexShrink: 0 }}>
            {navLinks}
          </div>

          <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, paddingRight: 20 }}>
            <button
              aria-label="View shopping cart"
              onClick={() => setCartOpen(true)}
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 1, padding: 0, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#00ff44"}
              onMouseLeave={e => e.currentTarget.style.color = "#fff"}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && (
                <span style={{ color: "#00ff44", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{cartCount}</span>
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

        <Ticker />

        <main id="main-content">
          {/* HERO */}
          <section
            className="hero-section"
            style={{
              opacity: heroVisible ? 1 : 0,
              transition: heroVisible ? "none" : "opacity 0.8s ease",
              backgroundImage: `url(${heroBg})`,
            }}
          >
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.4) 30%, rgba(0,0,0,0.3) 60%, rgba(10,10,10,0.98) 100%)",
              pointerEvents: "none"
            }} />

            <p style={{ color: "#00ff44", letterSpacing: 6, fontSize: 12, fontWeight: 900, marginBottom: 16, position: "relative", zIndex: 1 }}>THE ULTIMATE COLLECTION</p>

            <h1 style={{
              lineHeight: 0.9,
              animation: "breathe 3s ease-in-out 1s infinite",
              position: "relative",
              display: "inline-block",
              zIndex: 1,
            }}>
              <span style={{ display: "block", position: "relative", marginBottom: 4 }}>
                <CartoonFlameText text="WEAR YOUR" />
              </span>
              <span style={{ display: "block", color: "#00ff44", fontSize: "clamp(48px,10vw,120px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, letterSpacing: -2 }}>
                LEGEND
              </span>
            </h1>

            <p style={{ color: "#ccc", marginTop: 20, fontSize: 16, letterSpacing: 2, fontFamily: "'Barlow',sans-serif", fontWeight: 400, position: "relative", zIndex: 1 }}>Official jerseys from football, cricket &amp; basketball</p>
            <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <button 
                className="jv-btn-premium" 
                onClick={scrollToShop}
                style={{ animation: "pulse 2s infinite" }}
              >
                SHOP NOW
              </button>
              <button
                className="jv-btn-premium-secondary"
                onClick={() => navigate("/teams")}
              >
                VIEW TEAMS
              </button>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00ff44, transparent)" }} />
          </section>

          {/* STATS */}
          <div className="stats-grid">
            {[["500+", "JERSEYS"], ["50K+", "CUSTOMERS"], ["100%", "AUTHENTIC"]].map(([num, label]) => (
              <div key={label} className="stat-cell">
                <div style={{ fontSize: 28, fontWeight: 900, color: "#00b344" }}>{num}</div>
                <div style={{ fontSize: 10, letterSpacing: 4, color: "#FFFFFF", marginTop: 4, fontFamily: "'Barlow', sans-serif", fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* SHOP */}
          <section id="shop" style={{ padding: "60px 16px" }}>
            <div className="shop-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, fontStyle: "normal", letterSpacing: 2, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase" }}>
                <span style={{ color: "#00ff44", fontWeight: 900 }}>/ </span>{sectionTitle}
              </h2>
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
              <div className="product-grid">
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
              <div style={{ textAlign: "center", padding: "80px 0", color: "#a1a1aa" }}>
                <div style={{ fontSize: 60 }}>🔍</div>
                <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO RESULTS FOUND</p>
              </div>
            ) : (
              <div className="product-grid">
                {filtered.map((jersey, i) => (
                  <div key={jersey.id} className="card" onClick={() => { setSelectedJersey(jersey); setSelectedSize("M"); }}
                    style={{ animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}>
                    {jersey.stock === 0 && <div className="out-of-stock-badge">OUT OF STOCK</div>}
                    {jersey.type && <div className="type-badge-card">{jersey.type}</div>}
                    <div className="card-img-wrap">
                      {jersey.image_url ? (
                        <img src={jersey.image_url} alt={jersey.name} className="card-img" width="188" height="188" loading="lazy" decoding="async" />
                      ) : (
                        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0d", fontSize: 60 }}>👕</div>
                      )}
                      <div className="card-overlay" />
                    </div>
                    <div style={{ padding: "16px 16px 0", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 0.5, fontFamily: "'Barlow', sans-serif" }}>{jersey.name}</div>
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
                      <button
                        className="add-btn"
                        disabled={jersey.stock === 0}
                        onClick={e => {
                          e.stopPropagation();
                          if (jersey.stock > 0) {
                            setSelectedJersey(jersey);
                            setSelectedSize("M");
                          }
                        }}
                      >
                        {jersey.stock === 0 ? "OUT OF STOCK" : "SELECT SIZE"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* FEATURES */}
          <section style={{ background: "#0d0d0d", padding: "60px 16px", borderTop: "1px solid #1a1a1a" }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, fontStyle: "normal", textAlign: "center", marginBottom: 40, fontFamily: "'Barlow', sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>WHY <span style={{ color: "#00ff44", fontWeight: 900 }}>JERSEYVAULT</span></h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
              {[
                ["🏅", "LICENSED AUTHENTIC", "Every jersey is officially licensed and verified"],
                ["🚚", "FAST DELIVERY", "Ships within 24–48 hours across India"],
                ["↩️", "30-DAY RETURNS", "No questions asked easy returns"],
                ["🔒", "SECURE PAYMENTS", "Razorpay — UPI, Cards, Netbanking"],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ background: "#111", border: "1px solid #1a1a1a", padding: 24, textAlign: "center", transition: "border-color 0.3s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#00ff44"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
                  <div style={{ fontWeight: 700, letterSpacing: 2, fontSize: 13, marginBottom: 8, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase" }}>{title}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 13, fontFamily: "'Barlow', sans-serif", fontWeight: 400, lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer style={{ background: "#050505", borderTop: "1px solid #1a1a1a", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: 4, marginBottom: 8 }}>JERSEY<span style={{ color: "#00b344", fontWeight: 900 }}>VAULT</span></div>
          <p style={{ color: "#a1a1aa", fontSize: 12, letterSpacing: 2 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
            {[["PRIVACY", "/privacy"], ["TERMS", "/terms"], ["CONTACT", "/contact"], ["FAQ", "/faq"]].map(([l, h]) => (
              <Link key={l} to={h} style={{ color: "#a1a1aa", fontSize: 12, letterSpacing: 2, cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = "#00ff44"} onMouseLeave={e => e.target.style.color = "#a1a1aa"}>{l}</Link>
            ))}
          </div>
        </footer>

        {/* SIZE PICKER MODAL */}
        {selectedJersey && (
          <div className="modal-bg" onClick={() => setSelectedJersey(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setSelectedJersey(null)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", border: "1px solid #333", color: "#fff", fontSize: 16, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, letterSpacing: 1 }}>✕</button>
                {selectedJersey.image_url ? (
                  <img src={selectedJersey.image_url} alt={selectedJersey.name} className="modal-img" />
                ) : (
                  <div className="modal-img-placeholder">👕</div>
                )}
                {/* Green scan line effect over modal image */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #00ff4444, transparent)", animation: "scanline 2.5s linear infinite" }} />
                </div>
              </div>
              <div style={{ padding: "20px 24px 8px" }}>
                <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: 0.5, fontFamily: "'Barlow', sans-serif", fontStyle: "normal" }}>{selectedJersey.name}</div>
                {selectedJersey.type && (
                  <div style={{
                    display: "inline-block",
                    fontSize: 9,
                    letterSpacing: 4,
                    color: "#000",
                    fontWeight: 900,
                    marginTop: 6,
                    background: "#00ff44",
                    padding: "3px 10px",
                  }}>{selectedJersey.type}</div>
                )}
                <div style={{ fontSize: 24, fontWeight: 900, color: "#00ff44", marginTop: 8, fontStyle: "normal", letterSpacing: 1, fontFamily: "'Barlow', sans-serif" }}>₹{selectedJersey.price}</div>
                {selectedJersey.stock > 0 && selectedJersey.stock <= 5 && (
                  <div style={{ fontSize: 11, color: "#ff9900", letterSpacing: 2, marginTop: 6, fontWeight: 700 }}>⚠ ONLY {selectedJersey.stock} LEFT IN STOCK</div>
                )}
              </div>
              <div style={{ padding: "8px 24px 32px" }}>
                {/* Size label */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  <span className="size-label">SELECT SIZE</span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  {sizes.map(s => {
                    const sizeStock = getSizeStock(selectedJersey, s);
                    const outOfStock = sizeStock === 0;
                    return (
                      <button
                        key={s}
                        className={`size-btn${selectedSize === s ? " selected" : ""}`}
                        data-size={s}
                        onClick={() => !outOfStock && setSelectedSize(s)}
                        disabled={outOfStock}
                        style={outOfStock ? { opacity: 0.2, cursor: "not-allowed", textDecoration: "line-through", color: "#333", borderColor: "#1a1a1a !important" } : {}}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <button className="add-btn" style={{ marginTop: 24, fontSize: 17, padding: "15px" }} onClick={() => addToCart(selectedJersey, selectedSize)}>
                  ADD TO CART — ₹{selectedJersey.price}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CART PANEL */}
        {cartOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 150 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} onClick={() => setCartOpen(false)} />
            <div className="cart-panel">
              {/* Cart Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px", borderBottom: "1px solid #1a1a1a" }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: 3, fontFamily: "'Barlow', sans-serif", fontStyle: "normal", textTransform: "uppercase" }}>YOUR</span>
                  {" "}
                  <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#00ff44", fontFamily: "'Barlow', sans-serif", fontStyle: "normal", textTransform: "uppercase" }}>CART</span>
                  {cartCount > 0 && (
                    <span style={{
                      display: "inline-block",
                      marginLeft: 10,
                      background: "#00ff44",
                      color: "#000",
                      fontFamily: "'Barlow Condensed',sans-serif",
                      fontWeight: 900,
                      fontSize: 11,
                      letterSpacing: 2,
                      padding: "2px 8px",
                      verticalAlign: "middle",
                    }}>{cartCount} ITEM{cartCount !== 1 ? "S" : ""}</span>
                  )}
                </div>
                <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "1px solid #222", color: "#555", fontSize: 18, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, transition: "border-color 0.2s, color 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#00ff44"; e.currentTarget.style.color="#00ff44"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#222"; e.currentTarget.style.color="#555"; }}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#a1a1aa" }}>
                    <div style={{ fontSize: 50 }}>🛒</div>
                    <p style={{ marginTop: 12, letterSpacing: 4, fontSize: 13, fontWeight: 900, fontStyle: "italic" }}>CART IS EMPTY</p>
                    <p style={{ marginTop: 8, letterSpacing: 2, fontSize: 11, color: "#888" }}>ADD SOME FIRE JERSEYS</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}`} className="cart-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="cart-item-img" />
                      ) : (
                        <div style={{ width: 54, height: 54, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: "1px solid #1a1a1a" }}>👕</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-tag">
                          <span className="cart-tag-size">{item.size}</span>
                          <span className="cart-tag-qty">× {item.qty}</span>
                        </div>
                        <div className="cart-item-price">₹{(item.price * item.qty).toLocaleString()}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.id, item.size)}
                        style={{ background: "none", border: "1px solid #1a1a1a", color: "#888", cursor: "pointer", fontSize: 14, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, flexShrink: 0, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="#ff4444"; e.currentTarget.style.color="#ff4444"; e.currentTarget.style.background="#ff44440d"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="#1a1a1a"; e.currentTarget.style.color="#888"; e.currentTarget.style.background="none"; }}>✕</button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, background: "#080808" }}>
                  <div className="cart-total-row">
                    <span className="cart-total-label">TOTAL</span>
                    <span className="cart-total-amount">₹{total.toLocaleString()}</span>
                  </div>
                  <button className="checkout-btn" onClick={handleCheckout}>
                    PROCEED TO CHECKOUT →
                  </button>
                  <p style={{ textAlign: "center", color: "#a1a1aa", fontSize: 10, letterSpacing: 3, paddingBottom: 16, fontWeight: 700 }}>✦ FREE SHIPPING ABOVE ₹1999 ✦</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}