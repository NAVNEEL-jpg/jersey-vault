import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from "../supabase";
import logo from "../assets/jerseyvault-logo.jpeg";
import heroBg from "../assets/hero-bg.jpeg";
const LOGO_SRC = logo;
const FLAME_ID = "jv-flame-teams";

/* ─────────────────────────────────────────
   REUSABLE: CartoonFlameText  (same as Home)
───────────────────────────────────────── */
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
            <text x="0" y="90%" fontSize="clamp(40px,8vw,100px)" fontWeight="900" fontStyle="italic"
              fontFamily="'Barlow Condensed', sans-serif" letterSpacing="-2">{text}</text>
          </clipPath>
          <linearGradient id={`${FLAME_ID}-g1`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#FFE000" />
            <stop offset="22%"  stopColor="#FF8C00" />
            <stop offset="48%"  stopColor="#E8000A" />
            <stop offset="78%"  stopColor="#B20000" />
            <stop offset="100%" stopColor="#3a0000" />
          </linearGradient>
          <linearGradient id={`${FLAME_ID}-g2`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#FFF176" />
            <stop offset="18%"  stopColor="#FFB300" />
            <stop offset="45%"  stopColor="#FF3D00" />
            <stop offset="75%"  stopColor="#C62828" />
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

/* ─────────────────────────────────────────
   TICKER  (same as Home)
───────────────────────────────────────── */
const Ticker = memo(function Ticker() {
  return (
    <div style={{ background: "#39ff14", color: "#000", padding: "11px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-flex", animation: "marquee 18s linear infinite" }}>
        {[...Array(2)].map((_, i) => (
          <span key={i} style={{ display: "inline-flex" }}>
            {["FREE SHIPPING ABOVE ₹1999", "AUTHENTIC LICENSED JERSEYS", "EASY 30-DAY RETURNS", "COD AVAILABLE", "SIZES XS TO XXL"].map(t => (
              <span key={t} style={{ fontWeight: 900, letterSpacing: 3, fontSize: 16, padding: "0 40px" }}>★ {t}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   SPORT CATEGORY TABS
───────────────────────────────────────── */
const sportTabs = [
  { key: "ALL",        label: "ALL" },
  { key: "FOOTBALL",   label: "FOOTBALL" },
  { key: "CRICKET",    label: "CRICKET" },
  { key: "BASKETBALL", label: "BASKETBALL" },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Teams() {
  const navigate = useNavigate();
  const [user,           setUser]           = useState(null);
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount,      setCartCount]      = useState(0);
  const [activeTab,      setActiveTab]      = useState("ALL");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [teams,          setTeams]          = useState([]);
  const [loading,        setLoading]        = useState(true);

  /* ── Auth ── */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session) {
        const u = data.session.user;
        const { data: profile } = await supabase
          .from("profiles").select("role").eq("id", u.id).maybeSingle();
        setUser(u);
        if (profile?.role === "admin") setIsAdmin(true);
      }
    });
  }, []);

  /* ── Cart count from sessionStorage ── */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCartCount(parsed.reduce((s, i) => s + i.qty, 0));
      }
    } catch {}
  }, []);

  /* ── Fetch teams from Supabase ── */
  useEffect(() => {
    supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setTeams(data);
        setLoading(false);
      });
  }, []);

  /* ── Resize: close hamburger ── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setIsAdmin(false); setMobileMenuOpen(false);
  }, []);

  /* ── Filtered teams ── */
  const filtered = useMemo(() => teams.filter(t => {
    const matchesSport  = activeTab === "ALL" || (t.sport || "").toUpperCase() === activeTab;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  }), [teams, activeTab, searchQuery]);

  /* ── Nav links (mirrors Home.jsx) ── */
  const navLinks = useMemo(() => (
    <>
      <Link to="/"        className="t-nav-link" onClick={() => setMobileMenuOpen(false)}>HOME</Link>
      <Link to="/#shop"   className="t-nav-link" onClick={() => setMobileMenuOpen(false)}>SHOP</Link>
      <Link to="/teams"   className="t-nav-link active-nav" onClick={() => setMobileMenuOpen(false)}>TEAMS</Link>
      <Link to="/tracking" className="t-nav-link" onClick={() => setMobileMenuOpen(false)}>TRACK</Link>
      <span className="t-nav-link" onClick={() => { navigate("/"); setTimeout(() => {}, 100); setMobileMenuOpen(false); }}>CART</span>
      <Link to="/myorders" className="t-nav-link" onClick={() => setMobileMenuOpen(false)}>MY ORDERS</Link>
      {user ? (
        <span className="t-nav-link" onClick={handleLogout}>LOGOUT</span>
      ) : (
        <Link to="/auth" className="t-nav-link" onClick={() => setMobileMenuOpen(false)}>LOGIN</Link>
      )}
      {isAdmin && (
        <span className="t-nav-link" style={{ color: "#39ff14" }}
          onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>⚙ ADMIN</span>
      )}
    </>
  ), [user, isAdmin, handleLogout, navigate]);

  /* ── Sport icon map ── */
  const sportIcon = { FOOTBALL: "⚽", CRICKET: "🏏", BASKETBALL: "🏀" };

  return (
    <>
      <div id="jv-teams-root" style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>

        {/* ════════════════════ STYLES ════════════════════ */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&family=Bebas+Neue&display=swap');

          :root {
            --green: #39ff14;
            --green-dim: rgba(57,255,20,0.12);
            --green-glow: rgba(57,255,20,0.35);
            --dark: #0a0a0a;
            --card-bg: #0f0f0f;
            --border: #1e1e1e;
            --text-muted: #888;
          }

          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #111; }
          ::-webkit-scrollbar-thumb { background: #39ff14; border-radius: 2px; }

          @keyframes marquee    { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
          @keyframes slideDown  { from{opacity:0;transform:translateY(-30px);} to{opacity:1;transform:translateY(0);} }
          @keyframes fadeUp     { from{opacity:0;transform:translateY(40px);}  to{opacity:1;transform:translateY(0);} }
          @keyframes breathe    { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
          @keyframes shimmer    { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
          @keyframes pulse      { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
          @keyframes mobileMenuSlide { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
          @keyframes teamCardIn { from{opacity:0;transform:translateY(24px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
          @keyframes logoSpin   { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
          @keyframes glowPulse  { 0%,100%{box-shadow:0 0 14px var(--green-glow);} 50%{box-shadow:0 0 28px var(--green-glow), 0 0 8px var(--green);} }

          /* ── NAV LINKS ── */
          .t-nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; }
          .t-nav-link:hover { color:#39ff14; }
          .t-nav-link.active-nav { color:#39ff14; }

          /* ── LOGO ── */
          .t-logo-img { width:52px; height:54px; object-fit:contain; mix-blend-mode:screen; filter:brightness(1.3) contrast(1.13) drop-shadow(0 0 4px rgba(57,255,20,0.15)); display:block; background:transparent; }
          .t-logo-wrap { display:flex; align-items:center; gap:8px; }

          /* ── HAMBURGER ── */
          .t-hamburger { display:none; flex-direction:column; justify-content:space-between; align-items:stretch; width:28px; height:22px; background:none !important; border:none !important; cursor:pointer; padding:0 !important; }
          .t-hamburger span { display:block !important; width:100%; height:2px; background:white !important; border-radius:2px; }
          .t-mobile-menu { display:none; position:absolute; top:64px; left:0; right:0; background:rgba(7,7,7,0.99); border-bottom:1px solid #1a1a1a; padding:16px 24px; flex-direction:column; gap:20px; animation:mobileMenuSlide 0.2s ease; z-index:49; backdrop-filter:blur(12px); }
          .t-mobile-menu.open { display:flex; }
          .t-mobile-menu .t-nav-link { font-size:18px; letter-spacing:3px; padding:4px 0; border-bottom:1px solid #111; }
          .t-search-input { background:#1a1a1a; border:1px solid #444; border-radius:999px; color:#fff; padding:10px 20px; font-family:'Barlow Condensed',sans-serif; font-size:15px; outline:none; letter-spacing:1px; width:100%; transition:border-color 0.2s, box-shadow 0.2s; }
          .t-search-input:focus { border-color:var(--green); box-shadow:0 0 0 2px rgba(57,255,20,0.1); }
          .t-search-input::placeholder { color:#888; letter-spacing:2px; }

          /* ── SPORT FILTER TABS ── */
          .t-filter-bar { display:flex; flex-wrap:wrap; gap:0; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:4px; scrollbar-width:none; }
          .t-filter-bar::-webkit-scrollbar { display:none; }
          .t-filter-btn {
            border:1px solid #2a2a2a !important; background:transparent !important; color:#fff !important;
            font-size:18px !important; letter-spacing:4px !important; padding:8px 18px; height:40px;
            font-family:'Barlow Condensed',sans-serif !important; font-weight:900 !important; font-style:italic !important;
            clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
            cursor:pointer; text-transform:uppercase; transition:all 0.2s;
          }
          .t-filter-btn:first-child { clip-path:polygon(0% 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); }
          .t-filter-btn:last-child  { clip-path:polygon(10px 0%,100% 0%,100% 100%,0% 100%); }
          .t-filter-btn:hover { border:1px solid #888 !important; color:var(--green) !important; }
          .t-filter-btn.active {
            background:var(--green) !important; color:#000 !important; border:none !important;
            font-style:italic !important; padding:6px 18px; border-radius:0 !important;
            transform:skewX(-10deg);
            clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
            display:inline-flex; align-items:center; justify-content:center;
          }
          .t-filter-btn.active:first-child { clip-path:polygon(0% 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); transform:skewX(0deg); }
          .t-filter-btn.active:last-child  { clip-path:polygon(10px 0%,100% 0%,100% 100%,0% 100%); transform:skewX(0deg); }

          /* ── TEAM CARDS ── */
          .t-team-card {
            background: repeating-linear-gradient(45deg,#0f0f0f,#0f0f0f 4px,#111 4px,#111 8px);
            border:1px solid var(--border); overflow:hidden; cursor:pointer;
            transition:transform 0.3s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s;
            position:relative; display:flex; flex-direction:column; align-items:center;
            padding:32px 20px 18px; gap:10px; text-decoration:none;
          }
          .t-team-card::after {
            content:''; position:absolute; top:-50%; left:-75%; width:50%; height:200%;
            background:linear-gradient(to right,transparent 0%,rgba(57,255,20,0.08) 50%,transparent 100%);
            transform:skewX(-20deg); transition:left 0.5s cubic-bezier(0.23,1,0.32,1); pointer-events:none; z-index:3;
          }
          .t-team-card:hover::after { left:125%; }
          .t-team-card:hover {
            transform:translateY(-6px); border-color:#39ff14;
            box-shadow:0 0 0 1px #39ff14, 0 0 30px rgba(57,255,20,0.2), 0 20px 60px rgba(0,0,0,0.6);
          }
          .t-team-logo-wrap {
            width:96px; height:96px; display:flex; align-items:center; justify-content:center;
            flex-shrink:0; transition:box-shadow 0.3s;
          }
    
          .t-team-logo { width:120px; height:120px; object-fit:contain; image-rendering:crisp-edges; filter:contrast(1.15) brightness(1.05); }
          .t-team-logo-placeholder { font-size:44px; }
          .t-team-name {
            font-family:'Bebas Neue',sans-serif; font-weight:400; font-style:normal;
            font-size:14px; letter-spacing:3px; text-align:center; color:#aaa; line-height:1.1; text-transform:uppercase;
          }
          .t-sport-badge {
            font-size:9px; font-weight:900; letter-spacing:3px; padding:4px 10px;
            background:rgba(0,0,0,0.75); border:1px solid rgba(57,255,20,0.3);
            color:var(--green); border-radius:2px; backdrop-filter:blur(4px);
          }
          .t-jersey-count {
            font-family:'Bebas Neue',sans-serif; font-size:13px; letter-spacing:3px;
            color:#333; margin-top:2px;
          }
          .t-team-card:hover .t-jersey-count { color:#666; }

          /* ── SKELETON ── */
          .t-skeleton { background:linear-gradient(90deg,#0f0f0f 25%,#161616 50%,#0f0f0f 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }

          /* ── SECTION DIVIDER ── */
          .t-section-divider { height:1px; background:linear-gradient(90deg,transparent,#39ff14,transparent); opacity:0.3; border:none; }

          /* ── HERO ── */
          .t-hero { position:relative; padding:80px 24px 60px; text-align:center; overflow:hidden; background-size:cover; background-position:center top; background-repeat:no-repeat; }

          /* ── SHOP BTN ── */
          .t-shop-btn {
            background:var(--green); color:#000; border:none; padding:14px 40px;
            font-family:'Bebas Neue','Barlow Condensed',sans-serif; font-weight:400; font-size:16px;
            letter-spacing:5px; cursor:pointer; animation:pulse 2s infinite; border-radius:2px;
            text-decoration:none; display:inline-flex; align-items:center; justify-content:center;
          }

          /* ── DESKTOP NAV ── */
          .t-desktop-nav-links { display:flex; gap:28px; align-items:center; flex-shrink:0; }
          .t-desktop-search { display:flex; align-items:center; flex:1; max-width:520px; justify-content:center; }

          @media(max-width:768px) {
            .t-hamburger { display:flex; }
            .t-desktop-nav-links { display:none; }
            .t-desktop-search { display:none; }
            .t-hero { padding:60px 16px 40px; }
            .t-filter-btn { font-size:14px !important; padding:6px 12px; }
            .t-team-card { padding:24px 16px 20px; }
            .t-team-logo-wrap { width:80px; height:80px; }
            .t-team-logo { width:60px; height:60px; }
          }
          @media(max-width:480px) {
            .t-team-name { font-size:15px; }
            .t-team-logo-wrap { width:72px; height:72px; }
          }
        `}</style>

        {/* ════════════════════ NAVBAR ════════════════════ */}
        <nav style={{ position:"sticky", top:0, zIndex:50, background:"rgba(7,7,7,0.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid #151515", padding:"0 20px 0 4px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, height:64, animation:"slideDown 0.5s ease" }}>
          <Link to="/" className="t-logo-wrap" style={{ textDecoration:"none", flexShrink:0 }}>
            <img src={LOGO_SRC} alt="JerseyVault logo" className="t-logo-img" />
            <span style={{ fontWeight:900, fontSize:20, letterSpacing:3, color:"#fff" }}>
              JERSEY<span style={{ color:"#39ff14" }}>VAULT</span>
            </span>
          </Link>

          <div className="t-desktop-search">
            <input className="t-search-input" placeholder="SEARCH TEAMS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          <div className="t-desktop-nav-links">{navLinks}</div>

          {/* Right: cart + hamburger */}
          <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0, marginLeft:"auto" }}>
            <button
              onClick={() => navigate("/")}
              style={{ background:"transparent", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:1, padding:0, transition:"color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color="#39ff14"}
              onMouseLeave={e => e.currentTarget.style.color="#fff"}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && <span style={{ color:"#39ff14", fontSize:19, fontWeight:900, lineHeight:1 }}>{cartCount}</span>}
            </button>

            <button
              className={`t-hamburger${mobileMenuOpen ? " open" : ""}`}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <line x1="2" y1="2" x2="20" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="20" y1="2" x2="2" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <><span /><span /><span /></>
              )}
            </button>
          </div>

          <div className={`t-mobile-menu${mobileMenuOpen ? " open" : ""}`}>
            <input className="t-search-input" placeholder="SEARCH TEAMS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ marginBottom:8 }} />
            {navLinks}
          </div>
        </nav>

        <Ticker />
        <hr className="t-section-divider" />

        {/* ════════════════════ HERO ════════════════════ */}
        <section className="t-hero" style={{ backgroundImage: `url(${heroBg})` }}>
          {/* Diagonal grid lines overlay */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(45deg,rgba(57,255,20,0.02) 0px,rgba(57,255,20,0.02) 1px,transparent 1px,transparent 40px)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(7,7,7,0.6) 0%,rgba(7,7,7,0.1) 40%,rgba(7,7,7,0.8) 100%)", pointerEvents:"none" }} />

          <p style={{ color:"#39ff14", letterSpacing:6, fontSize:11, fontWeight:700, marginBottom:16, position:"relative", zIndex:1, opacity:0.8 }}>
            BROWSE BY CLUB &amp; COUNTRY
          </p>

          {/* ── "WEAR YOUR" in flame + "TEAMS" in green — exact copy of Home hero ── */}
          <h1 style={{ lineHeight:0.9, animation:"breathe 3s ease-in-out 1s infinite", position:"relative", display:"inline-block", zIndex:1 }}>
            <span style={{ display:"block", position:"relative", marginBottom:4 }}>
              <CartoonFlameText text="PICK YOUR" />
            </span>
            <span style={{ display:"block", color:"#39ff14", fontSize:"clamp(48px,10vw,120px)", fontWeight:900, fontStyle:"italic", lineHeight:0.9, letterSpacing:-2 }}>
              TEAM
            </span>
          </h1>

          <p style={{ color:"#aaa", marginTop:20, fontSize:14, letterSpacing:3, fontFamily:"'Barlow',sans-serif", fontWeight:400, position:"relative", zIndex:1 }}>
            Football · Cricket · Basketball — find your club &amp; shop its jerseys
          </p>

          <div style={{ marginTop:32, display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", position:"relative", zIndex:1 }}>
            <Link to="/#shop" className="t-shop-btn">SHOP JERSEYS</Link>
            <button
              onClick={() => document.getElementById("teams-grid")?.scrollIntoView({ behavior:"smooth" })}
              style={{ all:"unset", boxSizing:"border-box", display:"inline-flex", alignItems:"center", justifyContent:"center", background:"transparent", color:"#fff", border:"1px solid #2a2a2a", padding:"14px 40px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, letterSpacing:4, cursor:"pointer", borderRadius:2, transition:"border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#39ff14"}
              onMouseLeave={e => e.currentTarget.style.borderColor="#2a2a2a"}
            >
              BROWSE TEAMS
            </button>
          </div>

          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,#39ff14,transparent)" }} />
        </section>

        <hr className="t-section-divider" />

        {/* ════════════════════ TEAMS GRID ════════════════════ */}
        <section id="teams-grid" style={{ padding:"60px 16px" }}>

          {/* Header + filter bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32, flexWrap:"wrap", gap:16 }}>
            <h2 style={{ fontSize:36, fontWeight:900, fontStyle:"italic", letterSpacing:1 }}>
              <span style={{ color:"#39ff14" }}>/ </span>
              {activeTab === "ALL" ? "ALL TEAMS" : activeTab}
            </h2>
            <div className="t-filter-bar">
              {sportTabs.map(({ key, label }) => (
                <button
                  key={key}
                  className={`t-filter-btn${activeTab === key ? " active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  <span style={{ display:"inline-block", transform: activeTab === key ? "skewX(8deg)" : "none" }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            /* Skeleton */
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:6 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ background:"#0f0f0f", border:"1px solid #151515", padding:"32px 20px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
                  <div className="t-skeleton" style={{ width:96, height:96, borderRadius:"50%" }} />
                  <div className="t-skeleton" style={{ height:18, width:"70%", borderRadius:2 }} />
                  <div className="t-skeleton" style={{ height:12, width:"40%", borderRadius:2 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:"#222" }}>
              <div style={{ fontSize:56 }}>🔍</div>
              <p style={{ marginTop:16, letterSpacing:4, fontSize:13 }}>NO TEAMS FOUND</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:6 }}>
              {filtered.map((team, i) => (
                <div
                  key={team.id}
                  className="t-team-card"
                  style={{ animation:`teamCardIn 0.5s ease ${i * 0.06}s both` }}
                onClick={() => navigate(`/?team=${team.id}`)}
                >
                  {/* Sport badge */}
                  {team.sport && (
                    <div className="t-sport-badge" style={{ position:"absolute", top:12, right:12 }}>
                      {sportIcon[team.sport?.toUpperCase()] || "🏅"} {team.sport.toUpperCase()}
                    </div>
                  )}

                  {/* Logo */}
                  <div className="t-team-logo-wrap">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="t-team-logo" />
                    ) : (
                      <span className="t-team-logo-placeholder">
                        {sportIcon[team.sport?.toUpperCase()] || "🛡️"}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="t-team-name">{team.name}</div>

                  {/* Jersey count */}
                  {team.jersey_count != null && (
                    <div className="t-jersey-count">{team.jersey_count} JERSEY{team.jersey_count !== 1 ? "S" : ""}</div>
                  )}

                  {/* CTA */}
                  <div style={{ marginTop:4, fontSize:10, letterSpacing:4, color:"#39ff14", fontWeight:900, opacity:0, transition:"opacity 0.25s" }}
                    className="t-card-cta">VIEW JERSEYS →</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <hr className="t-section-divider" />

        {/* ════════════════════ FOOTER ════════════════════ */}
        <footer style={{ background:"#040404", borderTop:"1px solid #111", padding:"40px 24px", textAlign:"center" }}>
          <div style={{ fontWeight:900, fontSize:26, letterSpacing:5, marginBottom:8, fontFamily:"'Bebas Neue',sans-serif" }}>
            JERSEY<span style={{ color:"#39ff14" }}>VAULT</span>
          </div>
          <p style={{ color:"#222", fontSize:11, letterSpacing:3 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
          <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:16, flexWrap:"wrap" }}>
            {[["PRIVACY","/privacy"],["TERMS","/terms"],["CONTACT","/contact"],["FAQ","/faq"]].map(([l, h]) => (
              <Link key={l} to={h} style={{ color:"#333", fontSize:11, letterSpacing:3, cursor:"pointer", transition:"color 0.2s", textDecoration:"none" }}
                onMouseEnter={e => e.target.style.color="#39ff14"}
                onMouseLeave={e => e.target.style.color="#333"}>{l}</Link>
            ))}
          </div>
        </footer>

      </div>

      {/* Hover CTA reveal via global style injection */}
      <style>{`
        .t-team-card:hover .t-card-cta { opacity:1 !important; }
      `}</style>
    </>
  );
}