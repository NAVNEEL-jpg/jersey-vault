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
  );
});

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const filterButtons = [
  { key: "ALL",            label: "ALL" },
  { key: "FAN VERSION",    label: "FAN VERSION" },
  { key: "PLAYER VERSION", label: "PLAYER VERSION" },
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
        <span className="nav-link" style={{ color: "#39ff14" }} onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>⚙ ADMIN</span>
      )}
    </>
  ), [user, isAdmin, handleLogout, scrollToShop, navigate]);

  return (
    <>
      <div id="jv-root" style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
        <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&family=Bebas+Neue&display=swap');

  :root {
    --green: #39ff14;
    --green-dim: rgba(57,255,20,0.12);
    --green-glow: rgba(57,255,20,0.35);
    --green-soft: rgba(57,255,20,0.06);
    --dark: #0a0a0a;
    --card-bg: #0f0f0f;
    --border: #1e1e1e;
    --border-hover: #2e2e2e;
    --text-muted: #888;
    --text-dim: #888;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
#jv-root button:not(.hamburger):not(.add-btn):not(.filter-btn):not(.size-btn) { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; text-transform: uppercase; }
  #jv-root .add-btn, #jv-root .checkout-btn { display: block; width: 100%; text-align: center; }
  #jv-root .filter-btn, #jv-root .size-btn { display: inline-flex; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #39ff14; border-radius: 2px; }

  @keyframes slideDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
  @keyframes toastIn { from{opacity:0;transform:translateX(100px) scale(0.9);} to{opacity:1;transform:translateX(0) scale(1);} }
  @keyframes marquee { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
  @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
  @keyframes breathe { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
  @keyframes mobileMenuSlide { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
  @keyframes scanline { 0%{transform:translateY(-100%);} 100%{transform:translateY(400%);} }
  @keyframes cartItemSlide { from{opacity:0; transform:translateX(20px);} to{opacity:1; transform:translateX(0);} }

  /* ── SHINE sweep used on buttons ── */
  @keyframes btnShine {
    0%   { left: -120%; }
    60%  { left: 130%; }
    100% { left: 130%; }
  }
  /* ── size-btn selected pulse ── */
  @keyframes sizePop {
    0%   { transform: scale(1) translateY(-2px); }
    40%  { transform: scale(1.12) translateY(-4px); }
    70%  { transform: scale(0.97) translateY(-2px); }
    100% { transform: scale(1) translateY(-2px); }
  }
  /* ── filter pill slide-in ── */
  @keyframes filterPillIn {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  /* ── checkout arrow nudge ── */
  @keyframes arrowNudge {
    0%,100% { transform: translateX(0); }
    50%     { transform: translateX(5px); }
  }
  /* ── subtle glow pulse on active filter ── */
  @keyframes glowPulse {
    0%,100% { box-shadow: 0 0 14px var(--green-glow); }
    50%     { box-shadow: 0 0 28px var(--green-glow), 0 0 8px var(--green); }
  }
  /* ── cart price count-up feel ── */
  @keyframes priceReveal {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; }
  .nav-link:hover { color:#39ff14; }

 .card { background: var(--card-bg); border:1px solid var(--border); overflow:hidden; cursor:pointer; transition:transform 0.3s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s; position:relative; display:flex; flex-direction:column; }
  .card:hover { transform:translateY(-6px); border-color:#39ff14; box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(57,255,20,0.15); }
  .card-img { width:100%; height:220px; object-fit:cover; display:block; transition:transform 0.5s cubic-bezier(0.23,1,0.32,1); }
  .card:hover .card-img { transform:scale(1.06); }
  .card-img-wrap { overflow:hidden; position:relative; height:220px; background:#0d0d0d; }
  .card-overlay { position:absolute; inset:0; background:linear-gradient(to top, #000 0%, transparent 60%); opacity:0.5; pointer-events:none; }

 /* ══════════════════════════════════════
   ADD-TO-CART / SELECT SIZE BUTTON
   — Sleek split-light design with
     diagonal shine sweep on hover
══════════════════════════════════════ */
#jv-root .add-btn {
  background: var(--green);
  color: #000;
  border: none !important;
  width: 100%;
  padding: 11px 16px;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900 !important;
  font-size: 16px !important;
  letter-spacing: 5px !important;
  cursor: pointer;
  text-transform: uppercase;
  transition: background 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 0;
  position: relative;
  overflow: hidden;
  margin-top: 12px;
}
#jv-root .add-btn::before { display: none; }
#jv-root .add-btn::after  { display: none; }

#jv-root .add-btn:hover {
  background: #000;
  color: var(--green);
  letter-spacing: 6px;
  box-shadow: inset 0 0 0 2px var(--green);
}
#jv-root .add-btn:active { transform: scale(0.98); }
#jv-root .add-btn:disabled,
#jv-root .add-btn[disabled] {
  background: #1a1a1a !important;
  color: #333 !important;
  cursor: not-allowed;
  box-shadow: none !important;
}
#jv-root .add-btn:disabled::before { display: none; }

/* ══════════════════════════════════════
   FILTER BAR & PILLS
   — Segmented-control feel with
     animated active indicator
══════════════════════════════════════ */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
  scrollbar-width: none;
  align-items: center;
  background: transparent;
  border: none;
}
.filter-bar::-webkit-scrollbar { display: none; }

#jv-root .filter-btn {
  border: none !important;
  background: transparent !important;
  color: #fff !important;
  font-size: 18px !important;
  letter-spacing: 4px !important;
  padding: 8px 18px;
  height: 40px;
  font-family: 'Barlow Condensed', sans-serif !important;
  font-weight: 900 !important;
  font-style: italic !important;
}

#jv-root .filter-btn:hover {
  background: transparent !important;
  border: none !important;
  color: var(--green) !important;
}

#jv-root .filter-btn.active {
  background: var(--green) !important;
  color: #000 !important;
  border: none !important;
  box-shadow: none !important;
  font-size: 18px !important;
  letter-spacing: 4px !important;
  font-weight: 900 !important;
  font-family: 'Barlow Condensed', sans-serif !important;
  font-style: italic !important;
  padding: 6px 18px;
  border-radius: 0 !important;
  transform: skewX(-10deg);
  clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

#jv-root .filter-btn.active:first-child {
  clip-path: polygon(0% 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
  transform: skewX(0deg);
}

#jv-root .filter-btn.active:last-child {
  clip-path: polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%);
  transform: skewX(0deg);
}

#jv-root .filter-btn.active::before { display: none; }

/* ══════════════════════════════════════
   SIZE BUTTONS — Professional
══════════════════════════════════════ */
#jv-root .size-grid {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 8px 0 16px;
}

#jv-root .size-btn {
  position: relative;
  background: #111;
  border: 1px solid #2a2a2a !important;
  color: #aaa !important;
  width: 52px;
  height: 52px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
}

/* Top accent line */
#jv-root .size-btn::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: #1a1a1a;
  transition: background 0.2s;
}
#jv-root .size-btn::after { display: none; }

/* HOVER */
#jv-root .size-btn:hover:not(.selected):not(:disabled) {
  border-color: rgba(57,255,20,0.5) !important;
  color: var(--green);
  background: rgba(57,255,20,0.05);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
}
#jv-root .size-btn:hover:not(.selected):not(:disabled)::before {
  background: var(--green);
}

/* SELECTED */
#jv-root .size-btn.selected,
#jv-root .size-btn.selected:hover,
#jv-root .size-btn.selected:focus {
  background: var(--green) !important;
  border-color: var(--green) !important;
  color: #000 !important;
  font-weight: 900;
  font-size: 17px;
  transform: translateY(-2px);
  box-shadow:
    0 0 0 3px rgba(57,255,20,0.15),
    0 8px 20px rgba(57,255,20,0.25);
  animation: sizePop 0.3s cubic-bezier(0.23,1,0.32,1) both;
}
#jv-root .size-btn.selected::before {
  background: rgba(0,0,0,0.2);
}

/* DISABLED / OUT OF STOCK */
#jv-root .size-btn:disabled {
  background: #0d0d0d !important;
  border-color: #1a1a1a !important;
  color: #2a2a2a !important;
  cursor: not-allowed;
  text-decoration: line-through;
  transform: none !important;
  box-shadow: none !important;
}
#jv-root .size-btn:disabled::before { display: none; }

@keyframes sizePop {
  0%   { transform: scale(0.9) translateY(-2px); }
  60%  { transform: scale(1.08) translateY(-2px); }
  100% { transform: scale(1) translateY(-2px); }
}

/* SIZE LABEL */
#jv-root .size-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 5px;
  color: var(--text-muted);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
#jv-root .size-label::before,
#jv-root .size-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, #222);
}
#jv-root .size-label::after {
  background: linear-gradient(to left, transparent, #222);
}
  /* ══════════════════════════════════════
     CHECKOUT BUTTON
     — High-contrast CTA with animated
       arrow and layered gradient fill
  ══════════════════════════════════════ */
 <button className="checkout-btn" onClick={handleCheckout}>
  <span>PROCEED TO CHECKOUT</span>
.checkout-btn {
  position: relative;
  overflow: hidden;
  background: var(--green);
  color: #000;
  border: none !important;
  width: calc(100% - 32px);
  margin: 16px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px 0;
  font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
  font-weight: 900;
  font-size: 24px;
  letter-spacing: 8px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
  border-radius: 0;
  left: 0;
  right: 0;
}

.checkout-btn::before { display: none; }
.checkout-btn::after { display: none; }

.checkout-btn:hover {
  background: #000;
  color: var(--green);
  letter-spacing: 10px;
  box-shadow: 
    inset 0 0 0 2px var(--green),
    0 0 40px rgba(57,255,20,0.15);
  transform: translateY(-1px);
}

.checkout-btn:active {
  background: #000;
  color: var(--green);
  transform: scale(0.98);
}

.checkout-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0,0,0,0.2);
  font-style: normal;
  font-size: 18px;
  font-weight: 900;
  transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
  flex-shrink: 0;
}

.checkout-btn:hover .checkout-arrow {
  background: rgba(57,255,20,0.15);
  color: var(--green);
  transform: translateX(6px);
}

.checkout-btn:active .checkout-arrow {
  background: rgba(57,255,20,0.15);
  color: var(--green);
  transform: translateX(3px);
}
  /* ══════════════════════════════════════
     MODAL
  ══════════════════════════════════════ */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(8px); padding:16px; }
  .modal { background:#0a0a0a; border:1px solid #1e1e1e; width:100%; max-width:480px; overflow:hidden; animation:fadeUp 0.3s cubic-bezier(0.23,1,0.32,1); max-height:calc(100vh - 32px); overflow-y:auto; box-shadow:0 0 80px rgba(57,255,20,0.06), 0 40px 80px rgba(0,0,0,0.9); border-radius:2px; }
  .modal-img { width:100%; height:240px; object-fit:cover; display:block; }
  .modal-img-placeholder { width:100%; height:240px; background:#0d0d0d; display:flex; align-items:center; justify-content:center; font-size:80px; }

  /* ══════════════════════════════════════
     CART PANEL
  ══════════════════════════════════════ */
  .cart-panel { position:fixed; right:0; top:0; bottom:0; width:380px; background:#070707; border-left:1px solid #181818; z-index:200; display:flex; flex-direction:column; animation:slideDown 0.28s cubic-bezier(0.23,1,0.32,1); box-shadow:-30px 0 80px rgba(0,0,0,0.8); }

  .cart-item { display:flex; gap:14px; padding:16px 20px; border-bottom:1px solid #111; align-items:center; animation:cartItemSlide 0.25s ease both; transition:background 0.2s; }
  .cart-item:hover { background:#0c0c0c; }
  .cart-item-img { width:56px; height:56px; object-fit:cover; background:#0d0d0d; flex-shrink:0; border:1px solid #1a1a1a; border-radius:2px; }
  .cart-item-name { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:17px; letter-spacing:1px; color:#eee; line-height:1.1; }
  .cart-item-meta { font-family:'Barlow Condensed',sans-serif; font-size:11px; letter-spacing:3px; color:#333; margin-top:3px; font-weight:700; }
  .cart-item-price { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; color:#39ff14; margin-top:6px; letter-spacing:1px; animation: priceReveal 0.3s ease; }
  .cart-tag { display:inline-flex; align-items:center; gap:6px; margin-top:5px; }
  .cart-tag-size { background:var(--green); color:#000; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; letter-spacing:2px; padding:3px 8px; border-radius:2px; }
  .cart-tag-qty { color:#333; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; }

  .cart-total-row { display:flex; justify-content:space-between; align-items:center; padding:16px 20px 8px; background:#050505; border-top:1px solid #141414; }
  .cart-total-label { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; letter-spacing:6px; color:#333; text-transform:uppercase; }
  .cart-total-amount { font-family:'Bebas Neue','Barlow Condensed',sans-serif; font-weight:400; font-size:36px; color:var(--green); letter-spacing:2px; line-height:1; animation: priceReveal 0.25s ease; }

  .search-input { background:#0d0d0d; border:1px solid #2a2a2a; border-radius:4px; color:#fff; padding:10px 20px; font-family:'Barlow Condensed',sans-serif; font-size:15px; outline:none; letter-spacing:1px; width:100%; transition:border-color 0.2s, box-shadow 0.2s; }
  .search-input:focus { border-color:var(--green); box-shadow:0 0 0 2px rgba(57,255,20,0.1), 0 4px 16px rgba(0,0,0,0.4); }
  .search-input::placeholder { color:#333; letter-spacing:2px; }
  .skeleton { background:linear-gradient(90deg, #0f0f0f 25%, #161616 50%, #0f0f0f 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  .logo-img { width:52px; height:54px; object-fit:contain; mix-blend-mode:screen; filter:brightness(1.3) contrast(1.13) drop-shadow(0 0 4px rgba(57,255,20,0.15)); display:block; background:transparent; }
  .logo-wrap { display:flex; align-items:center; gap:8px; }
  .out-of-stock-badge { position:absolute; top:12px; left:12px; background:#c0392b; color:#fff; font-size:9px; font-weight:900; letter-spacing:3px; padding:4px 10px; z-index:2; border-radius:2px; }
  .type-badge-card { position:absolute; top:12px; right:12px; font-size:9px; font-weight:900; letter-spacing:3px; padding:4px 10px; z-index:2; background:rgba(0,0,0,0.75); border:1px solid rgba(57,255,20,0.3); color:var(--green); border-radius:2px; backdrop-filter:blur(4px); }
  .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid #151515; border-bottom:1px solid #151515; background:#070707; }
  .stat-cell { text-align:center; padding:20px 0; border-right:1px solid #151515; }
  .stat-cell:last-child { border-right:none; }
  .hero-section { position:relative; padding:80px 24px 60px; text-align:center; overflow:hidden; background-size:cover; background-position:center top; background-repeat:no-repeat; }

  /* ── NAVBAR ── */
  .desktop-nav-links { display:flex; gap:28px; align-items:center; flex-shrink:0; }
  .desktop-search { display:flex; align-items:center; flex:1; max-width:520px; justify-content:center; }
  .hamburger { display:none; flex-direction:column; justify-content:space-between; width:28px; height:22px; background:none !important; border:none !important; cursor:pointer; padding:0 !important; }
  .hamburger span { display:block !important; width:100%; height:2px; background:white !important; border-radius:2px; transition: transform 0.3s ease, opacity 0.3s ease; }
  .hamburger.open span:nth-child(1) { transform:rotate(45deg) translate(5px,5px); }
  .hamburger.open span:nth-child(2) { opacity:0; }
  .hamburger.open span:nth-child(3) { transform:rotate(-45deg) translate(5px,-5px); }
  .mobile-menu { display:none; position:absolute; top:64px; left:0; right:0; background:rgba(7,7,7,0.99); border-bottom:1px solid #1a1a1a; padding:16px 24px; flex-direction:column; gap:20px; animation:mobileMenuSlide 0.2s ease; z-index:49; backdrop-filter:blur(12px); }
  .mobile-menu.open { display:flex; }
  .mobile-menu .nav-link { font-size:18px; letter-spacing:3px; padding:4px 0; border-bottom:1px solid #111; }

  @media(max-width:768px) {
    .hamburger { display:flex; }
    .desktop-nav-links { display:none; }
    .desktop-search { display:none; }
    .cart-panel { width:100%; border-left:none; }
    .search-input { max-width:100%; font-size:13px; padding:8px 16px; }
    .hero-section { padding:60px 16px 40px; background-position:center center; background-size:cover; }
    .modal-img { height:180px; }
    .modal-img-placeholder { height:180px; }
    .shop-header { flex-direction:column; align-items:flex-start !important; gap:12px !important; }
    .nav-right { gap:8px !important; }
    .filter-bar { border-radius:4px; }
  }
  @media(max-width:480px) {
    .stat-cell { padding:14px 0; }
    .size-btn { width:48px; height:48px; }
  }
`}</style>

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--green)", color: "#000", padding: "13px 20px 13px 16px", fontWeight: 900, letterSpacing: 2, fontSize: 12, zIndex: 999, animation: "toastIn 0.35s cubic-bezier(0.23,1,0.32,1)", maxWidth: "calc(100vw - 48px)", display: "flex", alignItems: "center", gap: 10, borderRadius: 2, boxShadow: "0 8px 32px rgba(57,255,20,0.3)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, background: "rgba(0,0,0,0.2)", borderRadius: "50%", fontSize: 11, flexShrink: 0 }}>✓</span>
            {toast}
          </div>
        )}

        {/* NAVBAR */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(7,7,7,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #151515", padding: "0 20px 0 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, height: 64, animation: "slideDown 0.5s ease" }}>
          <div className="logo-wrap" style={{ flexShrink: 0, marginLeft: 0, paddingLeft: 0 }}>
            <img src={LOGO_SRC} alt="JerseyVault logo" className="logo-img" />
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#fff" }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
          </div>
          <div className="desktop-search">
            <input className="search-input" placeholder="SEARCH JERSEYS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="desktop-nav-links">{navLinks}</div>
          <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <button
              onClick={() => setCartOpen(true)}
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 1, padding: 0, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#39ff14"}
              onMouseLeave={e => e.currentTarget.style.color = "#fff"}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && (
                <span style={{ color: "#39ff14", fontSize: 19, fontWeight: 900, lineHeight: 1 }}>{cartCount}</span>
              )}
            </button>
            <button className={`hamburger${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(o => !o)} aria-label="Toggle menu">
              <span /><span /><span />
            </button>
          </div>
          <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
            <input className="search-input" placeholder="SEARCH JERSEYS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ marginBottom: 8 }} />
            {navLinks}
          </div>
        </nav>

        <Ticker />

        {/* HERO */}
        <section className="hero-section" style={{ opacity: heroVisible ? 1 : 0, transition: heroVisible ? "none" : "opacity 0.8s ease", backgroundImage: `url(${heroBg})` }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(7,7,7,0.92) 0%, rgba(7,7,7,0.4) 30%, rgba(0,0,0,0.3) 60%, rgba(7,7,7,0.99) 100%)", pointerEvents: "none" }} />
          <p style={{ color: "#39ff14", letterSpacing: 6, fontSize: 11, fontWeight: 700, marginBottom: 16, position: "relative", zIndex: 1, opacity: 0.8 }}>THE ULTIMATE COLLECTION</p>
          <h1 style={{ lineHeight: 0.9, animation: "breathe 3s ease-in-out 1s infinite", position: "relative", display: "inline-block", zIndex: 1 }}>
            <span style={{ display: "block", position: "relative", marginBottom: 4 }}><CartoonFlameText text="WEAR YOUR" /></span>
            <span style={{ display: "block", color: "#39ff14", fontSize: "clamp(48px,10vw,120px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, letterSpacing: -2 }}>LEGEND</span>
          </h1>
          <p style={{ color: "#aaa", marginTop: 20, fontSize: 14, letterSpacing: 3, fontFamily: "'Barlow',sans-serif", fontWeight: 400, position: "relative", zIndex: 1 }}>Official jerseys from football, cricket &amp; basketball</p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
            <button onClick={scrollToShop} style={{ all: "unset", boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#39ff14", color: "#000", border: "none", padding: "14px 40px", fontFamily: "'Bebas Neue','Barlow Condensed',sans-serif", fontWeight: 400, fontSize: 16, letterSpacing: 5, cursor: "pointer", animation: "pulse 2s infinite", borderRadius: 2 }}>
              SHOP NOW
            </button>
            <button onClick={() => navigate("/teams")} style={{ all: "unset", boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#fff", border: "1px solid #2a2a2a", padding: "14px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 4, cursor: "pointer", borderRadius: 2, transition: "border-color 0.2s" }}>
              VIEW TEAMS
            </button>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #39ff14, transparent)" }} />
        </section>

        {/* STATS */}
        <div className="stats-grid">
          {[["500+", "JERSEYS"], ["50K+", "CUSTOMERS"], ["100%", "AUTHENTIC"]].map(([num, label]) => (
            <div key={label} className="stat-cell">
              <div style={{ fontSize: 30, fontWeight: 900, color: "#39ff14", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>{num}</div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#666", marginTop: 4, fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* SHOP */}
        <section id="shop" style={{ padding: "60px 16px" }}>
          <div className="shop-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontStyle: "italic", letterSpacing: 1 }}>
              <span style={{ color: "#39ff14" }}>/ </span>{sectionTitle}
            </h2>
            {/* ── UPGRADED FILTER BAR ── */}
            <div className="filter-bar">
              {filterButtons.map(({ key, label }) => (
  <button key={key} className={`filter-btn${activeFilter === key ? " active" : ""}`} onClick={() => setActiveFilter(key)}>
    <span style={{ display: "inline-block", transform: activeFilter === key ? "skewX(8deg)" : "none" }}>
      {label}
    </span>
  </button>
))}
            </div>
          </div>

          {loadingProducts ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 6 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: "#0f0f0f", border: "1px solid #151515" }}>
                  <div className="skeleton" style={{ height: 220 }} />
                  <div style={{ padding: 16 }}>
                    <div className="skeleton" style={{ height: 18, marginBottom: 10, width: "60%" }} />
                    <div className="skeleton" style={{ height: 14, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#222" }}>
              <div style={{ fontSize: 56 }}>🔍</div>
              <p style={{ marginTop: 16, letterSpacing: 4, fontSize: 13 }}>NO RESULTS FOUND</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 6}}>
              {filtered.map((jersey, i) => (
                <div key={jersey.id} className="card" onClick={() => { setSelectedJersey(jersey); setSelectedSize("M"); }} style={{ animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}>
                  {jersey.stock === 0 && <div className="out-of-stock-badge">OUT OF STOCK</div>}
                  {jersey.type && <div className="type-badge-card">{jersey.type}</div>}
                  <div className="card-img-wrap">
                    {jersey.image_url ? (
                      <img src={jersey.image_url} alt={jersey.name} className="card-img" />
                    ) : (
                      <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0d", fontSize: 56 }}>👕</div>
                    )}
                    <div className="card-overlay" />
                  </div>
                  <div style={{ padding: "16px 16px 0", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: 1 }}>{jersey.name}</div>
                        {jersey.stock > 0 && jersey.stock <= 5 && (
                          <div style={{ fontSize: 10, color: "#e67e22", letterSpacing: 3, marginTop: 4, fontWeight: 700 }}>ONLY {jersey.stock} LEFT</div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>₹{jersey.price}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "auto" }}>
  <button
    className="add-btn"
    disabled={jersey.stock === 0}
    onClick={e => {
      e.stopPropagation();
      if (jersey.stock > 0) { setSelectedJersey(jersey); setSelectedSize("M"); }
    }}
  >
    {jersey.stock === 0 ? "OUT OF STOCK" : (
      <><span>SELECT SIZE</span><span style={{ fontSize: 14, opacity: 1 }}>→</span></>
    )}
  </button>
</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FEATURES */}
        <section style={{ background: "#070707", padding: "60px 16px", borderTop: "1px solid #111" }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, fontStyle: "italic", textAlign: "center", marginBottom: 40, letterSpacing: 2 }}>WHY <span style={{ color: "#39ff14" }}>JERSEYVAULT</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 1 }}>
            {[
              ["🏅", "LICENSED AUTHENTIC", "Every jersey is officially licensed and verified"],
              ["🚚", "FAST DELIVERY", "Ships within 24–48 hours across India"],
              ["↩️", "30-DAY RETURNS", "No questions asked easy returns"],
              ["🔒", "SECURE PAYMENTS", "Razorpay — UPI, Cards, Netbanking"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: "#0a0a0a", border: "1px solid #111", padding: "28px 24px", textAlign: "center", transition: "border-color 0.3s, background 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#39ff14"; e.currentTarget.style.background = "#0c0c0c"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.background = "#0a0a0a"; }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 900, letterSpacing: 3, fontSize: 13, marginBottom: 8, color: "#ddd" }}>{title}</div>
                <div style={{ color: "#666", fontSize: 13, fontFamily: "'Barlow',sans-serif", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "#040404", borderTop: "1px solid #111", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: 5, marginBottom: 8, fontFamily: "'Bebas Neue',sans-serif" }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></div>
          <p style={{ color: "#222", fontSize: 11, letterSpacing: 3 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
            {[["PRIVACY", "/privacy"], ["TERMS", "/terms"], ["CONTACT", "/contact"], ["FAQ", "/faq"]].map(([l, h]) => (
              <Link key={l} to={h} style={{ color: "#333", fontSize: 11, letterSpacing: 3, cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = "#39ff14"} onMouseLeave={e => e.target.style.color = "#333"}>{l}</Link>
            ))}
          </div>
        </footer>

        {/* ── SIZE PICKER MODAL ── */}
        {selectedJersey && (
          <div className="modal-bg" onClick={() => setSelectedJersey(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setSelectedJersey(null)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.8)", border: "1px solid #2a2a2a", color: "#888", fontSize: 14, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, borderRadius: 2, transition: "border-color 0.2s, color 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#39ff14"; e.currentTarget.style.color="#39ff14"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.color="#888"; }}>✕</button>
                {selectedJersey.image_url ? (
                  <img src={selectedJersey.image_url} alt={selectedJersey.name} className="modal-img" />
                ) : (
                  <div className="modal-img-placeholder">👕</div>
                )}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.3), transparent)", animation: "scanline 2.5s linear infinite" }} />
                </div>
                {/* Gradient overlay on image */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #0a0a0a, transparent)", pointerEvents: "none" }} />
              </div>

              <div style={{ padding: "16px 24px 6px" }}>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, fontStyle: "italic" }}>{selectedJersey.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                  {selectedJersey.type && (
                    <span style={{ display: "inline-block", fontSize: 9, letterSpacing: 4, color: "#000", fontWeight: 900, background: "#39ff14", padding: "3px 10px", borderRadius: 2 }}>{selectedJersey.type}</span>
                  )}
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#39ff14", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2 }}>₹{selectedJersey.price}</span>
                </div>
                {selectedJersey.stock > 0 && selectedJersey.stock <= 5 && (
                  <div style={{ fontSize: 10, color: "#e67e22", letterSpacing: 3, marginTop: 8, fontWeight: 700 }}>⚠ ONLY {selectedJersey.stock} LEFT IN STOCK</div>
                )}
              </div>

              <div style={{ padding: "10px 24px 32px" }}>
                {/* ── UPGRADED SIZE LABEL ── */}
                <div className="size-label">SELECT SIZE</div>

                {/* ── UPGRADED SIZE GRID ── */}
                <div className="size-grid">
                  {sizes.map(s => {
                    const sizeStock = getSizeStock(selectedJersey, s);
                    const outOfStock = sizeStock === 0;
                    return (
                    <button
  key={s}
  className={`size-btn${selectedSize === s ? " selected" : ""}`}
  onClick={() => !outOfStock && setSelectedSize(s)}
  disabled={outOfStock}
>
  {s}
</button>
                    );
                  })}
                </div>

                {/* ── UPGRADED ADD TO CART BUTTON ── */}
                <button
                  className="add-btn filled-variant"
                  style={{ marginTop: 24, fontSize: 16, padding: "16px" }}
                  onClick={() => addToCart(selectedJersey, selectedSize)}
                >
                  <span>ADD TO CART</span>
                  <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 14, letterSpacing: 2 }}>—</span>
                  <span>₹{selectedJersey.price}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CART PANEL ── */}
        {cartOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 150 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)" }} onClick={() => setCartOpen(false)} />
            <div className="cart-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px", borderBottom: "1px solid #111" }}>
                <div>
                  <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 4, fontStyle: "italic", color: "#888" }}>YOUR</span>
                  {" "}
                  <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 4, color: "#39ff14", fontStyle: "italic" }}>CART</span>
                  {cartCount > 0 && (
                    <span style={{ display: "inline-block", marginLeft: 10, background: "var(--green)", color: "#000", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 10, letterSpacing: 2, padding: "2px 8px", verticalAlign: "middle", borderRadius: 2 }}>{cartCount} ITEM{cartCount !== 1 ? "S" : ""}</span>
                  )}
                </div>
                <button onClick={() => setCartOpen(false)}
                  style={{ background: "none", border: "1px solid #1a1a1a", color: "#444", fontSize: 14, cursor: "pointer", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, transition: "border-color 0.2s, color 0.2s", borderRadius: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#39ff14"; e.currentTarget.style.color="#39ff14"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#1a1a1a"; e.currentTarget.style.color="#444"; }}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#1e1e1e" }}>
                    <div style={{ fontSize: 48 }}>🛒</div>
                    <p style={{ marginTop: 12, letterSpacing: 4, fontSize: 12, fontWeight: 900, fontStyle: "italic", color: "#2a2a2a" }}>CART IS EMPTY</p>
                    <p style={{ marginTop: 8, letterSpacing: 3, fontSize: 10, color: "#1a1a1a" }}>ADD SOME FIRE JERSEYS</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}`} className="cart-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="cart-item-img" />
                      ) : (
                        <div style={{ width: 56, height: 56, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, border: "1px solid #1a1a1a", borderRadius: 2 }}>👕</div>
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
                        style={{ background: "none", border: "1px solid #151515", color: "#2a2a2a", cursor: "pointer", fontSize: 12, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, flexShrink: 0, transition: "all 0.15s", borderRadius: 2 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="#c0392b"; e.currentTarget.style.color="#c0392b"; e.currentTarget.style.background="rgba(192,57,43,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="#151515"; e.currentTarget.style.color="#2a2a2a"; e.currentTarget.style.background="none"; }}>✕</button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid #0f0f0f", paddingTop: 16, background: "#050505" }}>
                  <div className="cart-total-row">
                    <div>
                      <span className="cart-total-label">ORDER TOTAL</span>
                      <div style={{ fontSize: 9, letterSpacing: 3, color: "#1e1e1e", marginTop: 2, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                        {total >= 1999 ? "✓ FREE SHIPPING APPLIED" : `ADD ₹${(1999 - total).toLocaleString()} FOR FREE SHIP`}
                      </div>
                    </div>
                    <span className="cart-total-amount">₹{total.toLocaleString()}</span>
                  </div>

                  {/* ── UPGRADED CHECKOUT BUTTON ── */}
                  <button className="checkout-btn" onClick={handleCheckout}>
  <span>PROCEED TO CHECKOUT</span>
  <span className="checkout-arrow">→</span>
</button>
                  <p style={{ textAlign: "center", color: "#1a1a1a", fontSize: 9, letterSpacing: 3, paddingBottom: 16, fontWeight: 700 }}>✦ SECURED BY RAZORPAY ✦</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}