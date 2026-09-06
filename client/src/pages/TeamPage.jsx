import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { COLLECTION_MAPPING } from "../utils/collection-mapping";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from "../supabase";
import { express } from "../express";
import BrandLogo from "../components/BrandLogo";
import laliga26Video from "../assets/Laliga26.mp4.mp4";
import heroBg from "../assets/hero-bg.jpeg";
import { getProductImages, getFirstImage } from "../utils/imageHelpers";
import barcaTeamBanner from "../assets/team-banners/barcelona-banner.jpg";
import realMadridTeamBanner from "../assets/team-banners/real-madrid-banner.jpg";
import manUtdTeamBanner from "../assets/team-banners/manchester-united-banner.jpg";
import arsenalTeamBanner from "../assets/team-banners/arsenal-banner.jpg";

const BANNER_MAP = {
  "barcelona": barcaTeamBanner,
  "real-madrid": realMadridTeamBanner,
  "manchester-united": manUtdTeamBanner,
  "arsenal": arsenalTeamBanner,
};

const ACCENT_MAP = {
  "barcelona": "#a50044",
  "real-madrid": "#00529f",
  "manchester-united": "#da291c",
  "arsenal": "#ef0107",
  "liverpool": "#c8102e",
  "chelsea": "#034694",
  "manchester-city": "#6cabdd",
  "tottenham": "#132257",
  "ac-milan": "#fb090b",
  "inter-milan": "#0068a8",
  "juventus": "#e0e0e0",
  "psg": "#004170",
  "bayern-munich": "#dc052d",
  "borussia-dortmund": "#fde100",
  "ajax": "#d2122e",
  "napoli": "#087bc4",
  "atletico-madrid": "#cb3524",
  "argentina": "#74acdf",
  "brazil": "#009c3b",
  "france": "#002395",
  "germany": "#dddddd",
  "spain": "#c60b1e",
  "england": "#012169",
  "portugal": "#006600",
  "netherlands": "#ff6600",
  "japan": "#bc002d",
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const ProductCarousel = memo(function ProductCarousel({ imageUrl, alt, style }) {
  const images = getProductImages(imageUrl);
  const [idx, setIdx] = useState(0);
  if (!images.length) {
    return (
      <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#0d0d0d",fontSize:48 }}>
        👕
      </div>
    );
  }
  if (images.length === 1) {
    return <img src={images[0]} alt={alt} draggable="false" style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",display:"block",...style }} />;
  }
  return (
    <div style={{ position:"relative",width:"100%",height:"100%" }}>
      <div style={{ width:"100%",height:"100%",overflow:"hidden" }}>
        <div style={{ display:"flex",width:`${images.length*100}%`,height:"100%",transform:`translateX(-${(idx/images.length)*100}%)`,transition:"transform 0.38s cubic-bezier(0.23,1,0.32,1)" }}>
          {images.map((src,i) => (
            <img key={i} src={src} alt={alt} draggable="false"
              style={{ width:`${100/images.length}%`,height:"100%",objectFit:"cover",objectPosition:"center",display:"block" }} />
          ))}
        </div>
      </div>
      <div style={{ position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:5 }}>
        {images.map((_,i) => (
          <button key={i} type="button" onClick={e=>{e.stopPropagation();setIdx(i);}}
            style={{ all:"unset",width:i===idx?16:6,height:6,borderRadius:3,background:i===idx?"#39ff14":"rgba(255,255,255,0.35)",transition:"all 0.25s ease",cursor:"pointer" }} />
        ))}
      </div>
    </div>
  );
});

export default function TeamPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const collectionData = useMemo(() => COLLECTION_MAPPING[slug] || null, [slug]);
  const bannerImg = BANNER_MAP[slug] || heroBg;
  const accentColor = ACCENT_MAP[slug] || "#39ff14";

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [jerseys, setJerseys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedJersey, setSelectedJersey] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [cart, setCart] = useState(() => {
    try { const s = sessionStorage.getItem("cart"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user;
      if (u) {
        const nav = u.email?.toLowerCase() === "navneeldutta@gmail.com";
        setUser({ ...u, role: nav ? "admin" : "customer" });
        setIsAdmin(nav);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (u) { const nav = u.email?.toLowerCase() === "navneeldutta@gmail.com"; setUser({ ...u }); setIsAdmin(nav); }
      else { setUser(null); setIsAdmin(false); }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!collectionData || collectionData.type !== "team") { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data: tData } = await express.from("teams").select("id,name").ilike("name", collectionData.matchName).single();
        if (tData) {
          const { data } = await express.from("products")
            .select("id,name,price,stock,image_url,status,type,team_id,category,sub_category")
            .eq("status", "active").eq("team_id", tData.id);
          if (data) setJerseys(data);
        }
      } catch (e) { console.error("TeamPage:", e); }
      setLoading(false);
    })();
  }, [slug, collectionData]);

  useEffect(() => {
    try { sessionStorage.setItem("cart", JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const y = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      return () => {
        const saved = Math.abs(parseInt(document.body.style.top || "0", 10));
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        if (saved) window.scrollTo(0, saved);
      };
    }
  }, [mobileMenuOpen]);

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return jerseys;
    if (activeFilter === "PLAYER VERSION") return jerseys.filter(j => (j.type || "").toUpperCase().includes("PLAYER"));
    if (activeFilter === "FAN VERSION") return jerseys.filter(j => !(j.type || "").toUpperCase().includes("PLAYER"));
    if (activeFilter === "RETRO") return jerseys.filter(j => (j.category || j.sub_category || "").toUpperCase().includes("RETRO"));
    return jerseys;
  }, [jerseys, activeFilter]);

  const addToCart = useCallback((jersey, size) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === jersey.id && i.size === size);
      if (ex) return prev.map(i => i.id === jersey.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...jersey, size, qty: 1 }];
    });
    showToast(`${jersey.name} (${size}) added!`);
    setSelectedJersey(null);
  }, [showToast]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  if (!collectionData || collectionData.type !== "team") {
    return (
      <div style={{ background:"#070707",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif" }}>
        <div style={{ fontSize:48 }}>404</div>
        <div style={{ fontSize:22,fontWeight:900,letterSpacing:4 }}>TEAM NOT FOUND</div>
        <button type="button" onClick={() => navigate("/teams")} style={{ all:"unset",marginTop:12,background:"#39ff14",color:"#000",padding:"12px 32px",fontWeight:900,fontSize:16,letterSpacing:4,cursor:"pointer",borderRadius:2 }}>
          ALL TEAMS
        </button>
      </div>
    );
  }

  const pageTitle = collectionData.h1 || `${collectionData.matchName} JERSEYS`;

  return (
    <>
      <Helmet>
        <title>{collectionData.title} | The Jersey Vault</title>
        <meta name="description" content={collectionData.desc} />
        <link rel="canonical" href={`https://www.thejerseyvault.in/teams/${slug}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context":"https://schema.org","@type":"BreadcrumbList",
          "itemListElement":[
            {"@type":"ListItem","position":1,"name":"Home","item":"https://www.thejerseyvault.in/"},
            {"@type":"ListItem","position":2,"name":"Teams","item":"https://www.thejerseyvault.in/teams"},
            {"@type":"ListItem","position":3,"name":collectionData.title,"item":`https://www.thejerseyvault.in/teams/${slug}`}
          ]
        })}} />
      </Helmet>

      <div id="tp-root" style={{ fontFamily:"'Barlow Condensed',sans-serif",background:"#0a0a0a",minHeight:"100vh",color:"#fff",overflowX:"hidden" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&family=Bebas+Neue&display=swap');
          html,body,#root,#tp-root{max-width:100vw;overflow-x:hidden;}
          *{box-sizing:border-box;margin:0;padding:0;}
          ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#111;}::-webkit-scrollbar-thumb{background:#39ff14;border-radius:2px;}
          @keyframes slideDown{from{opacity:0;transform:translateY(-28px);}to{opacity:1;transform:translateY(0);}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}
          @keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
          @keyframes marquee{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
          @keyframes mobileMenuSlide{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
          @keyframes toastIn{from{opacity:0;transform:translateX(60px) scale(0.9);}to{opacity:1;transform:translateX(0) scale(1);}}
          .tp-nav{position:sticky;top:0;z-index:99999;background:rgba(7,7,7,0.97);backdrop-filter:blur(12px);border-bottom:1px solid #151515;padding:0 20px 0 4px;display:flex;align-items:center;justify-content:space-between;gap:16px;height:64px;animation:slideDown 0.4s ease;}
          .tp-nav-link{color:#bbb;text-decoration:none;font-weight:600;letter-spacing:2px;font-size:13px;transition:color 0.2s;cursor:pointer;display:flex;align-items:center;gap:6px;}
          button.tp-nav-link{background:none;border:none;padding:0;font-family:inherit;}
          .tp-nav-link:hover{color:#39ff14;}
          .tp-desktop-links{display:flex;gap:28px;align-items:center;flex-shrink:0;}
          .tp-nav-right{display:flex;align-items:center;gap:12px;flex-shrink:0;margin-left:auto;}
          .tp-hamburger{display:none;align-items:center;justify-content:center;width:32px;height:32px;background:none!important;border:none!important;cursor:pointer;padding:0!important;flex-shrink:0;z-index:130;}
          .tp-mobile-menu{display:none;position:fixed;top:64px;left:0;right:0;bottom:0;height:calc(100vh - 64px);background:#070707;border-top:1px solid #1a1a1a;padding:20px 24px 40px;flex-direction:column;gap:20px;animation:mobileMenuSlide 0.2s ease;z-index:999999;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
          .tp-mobile-menu.open{display:flex!important;}
          .tp-mobile-menu .tp-nav-link{font-size:18px;letter-spacing:3px;padding:6px 0;border-bottom:1px solid #111;}
          .wc26-video-wrap{display:flex;align-items:center;height:50px;width:170px;overflow:hidden;flex-shrink:0;border-left:1px solid #1a1a1a;border-right:1px solid #1a1a1a;position:relative;margin:0 8px;}
          .wc26-video-wrap video{width:100%;height:100%;object-fit:cover;pointer-events:none;}
          .tp-hero{position:relative;width:100%;height:clamp(280px,45vw,560px);overflow:hidden;}
          .tp-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%;display:block;}
          .tp-hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,7,7,0.2) 0%,rgba(7,7,7,0.1) 35%,rgba(7,7,7,0.9) 100%);}
          .tp-hero-content{position:absolute;bottom:0;left:0;right:0;padding:clamp(16px,4vw,48px);display:flex;flex-direction:column;gap:8px;}
          .tp-hero-badge{align-self:flex-start;font-size:11px;letter-spacing:3px;font-weight:900;padding:4px 12px;border-radius:4px;border:1.5px solid ${accentColor};background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);color:${accentColor};box-shadow:0 0 12px ${accentColor}44;}
          .tp-hero-title{font-size:clamp(28px,5vw,64px);font-weight:900;font-style:italic;letter-spacing:1px;color:#fff;font-family:'Bebas Neue',sans-serif;line-height:0.92;text-shadow:0 2px 20px rgba(0,0,0,0.9);}
          .tp-hero-count{font-size:13px;letter-spacing:4px;color:rgba(255,255,255,0.5);font-weight:700;}
          .tp-back-btn{all:unset;display:inline-flex;align-items:center;gap:7px;padding:6px 14px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(57,255,20,0.45);border-radius:4px;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;font-style:italic;letter-spacing:2.5px;cursor:pointer;transition:all 0.2s ease;}
          .tp-back-btn:hover{background:#39ff14;color:#000;border-color:#39ff14;box-shadow:0 0 18px rgba(57,255,20,0.6);}
          .tp-filter-bar{display:flex;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;gap:6px;padding-bottom:4px;scrollbar-width:none;}
          .tp-filter-bar::-webkit-scrollbar{display:none;}
          .tp-filter-btn{border:1px solid #2a2a2a!important;background:transparent!important;color:#fff!important;font-size:14px!important;letter-spacing:3px!important;padding:6px 14px;height:36px;font-family:'Barlow Condensed',sans-serif!important;font-weight:900!important;font-style:italic!important;cursor:pointer;transition:all 0.2s;white-space:nowrap;flex-shrink:0;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);}
          .tp-filter-btn:first-child{clip-path:polygon(0% 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);}
          .tp-filter-btn:last-child{clip-path:polygon(8px 0%,100% 0%,100% 100%,0% 100%);}
          .tp-filter-btn:hover{border:1px solid #888!important;color:#39ff14!important;}
          .tp-filter-btn.active{background:#39ff14!important;color:#000!important;border:none!important;}
          .tp-card{background:repeating-linear-gradient(45deg,#0f0f0f,#0f0f0f 4px,#111 4px,#111 8px);border:1px solid #1e1e1e;overflow:hidden;cursor:pointer;transition:transform 0.3s cubic-bezier(0.23,1,0.32,1),border-color 0.3s,box-shadow 0.3s;position:relative;display:flex;flex-direction:column;height:420px;}
          .tp-card:hover{transform:translateY(-6px);border-color:#39ff14;box-shadow:0 0 0 1px #39ff14,0 0 30px rgba(57,255,20,0.2),0 20px 60px rgba(0,0,0,0.6);}
          .tp-card-img-wrap{overflow:hidden;position:relative;height:270px;width:100%;background:#0d0d0d;flex-shrink:0;}
          .tp-card-type{position:absolute;top:10px;right:10px;font-size:11px;font-weight:900;letter-spacing:2px;padding:3px 8px;z-index:2;background:rgba(0,0,0,0.75);border:1px solid rgba(57,255,20,0.3);color:#39ff14;border-radius:2px;backdrop-filter:blur(4px);}
          .tp-card-body{padding:14px 14px 0;flex:1;}
          .tp-card-title{font-size:15px;font-weight:900;letter-spacing:1px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.25;min-height:38px;}
          .tp-card-price{font-size:22px;font-weight:900;color:#39ff14;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;margin-top:4px;}
          .tp-add-btn{all:unset;box-sizing:border-box;display:block;width:100%;text-align:center;background:#39ff14;color:#000;padding:11px 8px;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:14px;letter-spacing:4px;cursor:pointer;margin-top:auto;transition:background 0.2s,color 0.2s;}
          .tp-add-btn:hover{background:transparent;color:#39ff14;box-shadow:inset 0 0 0 2px #39ff14;}
          .tp-oos-badge{position:absolute;top:10px;left:10px;background:#c0392b;color:#fff;font-size:11px;font-weight:900;letter-spacing:2px;padding:3px 8px;z-index:2;border-radius:2px;}
          .tp-skeleton{background:linear-gradient(90deg,#0f0f0f 25%,#161616 50%,#0f0f0f 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
          .tp-modal-bg{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;}
          .tp-modal-dim{position:absolute;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(8px);cursor:pointer;border:none;width:100%;height:100%;}
          .tp-modal{background:#0a0a0a;border:1px solid #1e1e1e;width:100%;max-width:480px;max-height:calc(100vh - 32px);overflow-y:auto;-webkit-overflow-scrolling:touch;border-radius:2px;position:relative;z-index:1;animation:fadeUp 0.3s cubic-bezier(0.23,1,0.32,1);box-shadow:0 0 80px rgba(57,255,20,0.06),0 40px 80px rgba(0,0,0,0.9);}
          .tp-modal-img-wrap{position:relative;width:100%;height:360px;background:#0d0d0d;overflow:hidden;}
          .tp-modal-close{position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);border:1.5px solid #39ff14;color:#39ff14;font-size:18px;cursor:pointer;width:36px;height:36px;display:flex;align-items:center;justify-content:center;z-index:100;font-weight:900;border-radius:4px;box-shadow:0 0 10px rgba(57,255,20,0.4);}
          .tp-modal-body{padding:20px;}
          .tp-modal-name{font-size:22px;font-weight:900;letter-spacing:1px;line-height:1.2;}
          .tp-modal-price{font-size:32px;font-weight:900;color:#39ff14;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;margin-top:4px;}
          .tp-size-label{font-size:12px;letter-spacing:3px;color:#555;font-weight:700;margin-top:16px;margin-bottom:8px;}
          .tp-size-grid{display:flex;flex-wrap:wrap;gap:6px;}
          .tp-size-btn{all:unset;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:15px;letter-spacing:1px;border:1.5px solid #2a2a2a;cursor:pointer;transition:all 0.2s;border-radius:2px;}
          .tp-size-btn.active{background:#39ff14;color:#000;border-color:#39ff14;transform:translateY(-2px);}
          .tp-size-btn:hover:not(.active){border-color:#39ff14;color:#39ff14;}
          .tp-modal-add{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:100%;background:#39ff14;color:#000;padding:14px;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:5px;cursor:pointer;margin-top:16px;transition:background 0.2s;}
          .tp-modal-add:hover{background:#2dff00;}
          .tp-cart-overlay{position:fixed;inset:0;z-index:1999;}
          .tp-cart-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.7);border:none;width:100%;height:100%;cursor:pointer;}
          .tp-cart-panel{position:fixed;right:0;top:0;bottom:0;width:min(380px,92vw);background:#070707;border-left:1px solid #1a1a1a;z-index:2000;display:flex;flex-direction:column;animation:slideDown 0.25s cubic-bezier(0.23,1,0.32,1);box-shadow:-24px 0 60px rgba(0,0,0,0.7);overflow:hidden;}
          .tp-cart-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #111;}
          .tp-cart-close{all:unset;box-sizing:border-box;border:1px solid #1a1a1a;color:#444;font-size:14px;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:900;transition:border-color 0.2s,color 0.2s;border-radius:2px;}
          .tp-cart-close:hover{border-color:#39ff14;color:#39ff14;}
          .tp-cart-items{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;}
          .tp-cart-item{display:flex;gap:12px;padding:14px 18px;border-bottom:1px solid #111;align-items:center;}
          .tp-cart-item-img{width:52px;height:52px;object-fit:cover;flex-shrink:0;border:1px solid #1a1a1a;}
          .tp-cart-item-name{font-weight:900;font-size:15px;letter-spacing:1px;color:#eee;}
          .tp-cart-item-meta{font-size:11px;letter-spacing:2px;color:#444;margin-top:2px;}
          .tp-cart-item-price{font-family:'Bebas Neue',sans-serif;font-size:18px;color:#39ff14;margin-top:4px;}
          .tp-cart-remove{all:unset;box-sizing:border-box;border:1px solid #333;color:#777;cursor:pointer;font-size:14px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:900;border-radius:2px;margin-left:auto;flex-shrink:0;transition:border-color 0.15s,color 0.15s;}
          .tp-cart-remove:hover{border-color:#c0392b;color:#ff4d4d;}
          .tp-cart-footer{border-top:1px solid #141414;background:#050505;padding:16px 20px;}
          .tp-cart-total{font-family:'Bebas Neue',sans-serif;font-size:32px;color:#39ff14;letter-spacing:2px;}
          .tp-cart-checkout{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#39ff14;color:#000;padding:14px;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:5px;cursor:pointer;margin-top:12px;border-radius:2px;transition:background 0.2s;}
          .tp-cart-checkout:hover{background:#2dff00;}
          .tp-toast{position:fixed;bottom:96px;right:24px;background:#0d0d0d;color:#fff;padding:14px 18px;font-weight:700;letter-spacing:1px;font-size:13px;z-index:99999;animation:toastIn 0.35s cubic-bezier(0.23,1,0.32,1);max-width:calc(100vw - 48px);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(57,255,20,0.35);}
          @media(max-width:768px){
            .tp-hamburger{display:flex!important;}
            .tp-desktop-links{display:none!important;}
            .wc26-video-wrap{height:36px;width:clamp(75px,20vw,110px);margin:0 4px 0 auto;border:1px solid rgba(255,255,255,0.12);border-radius:4px;}
            .tp-hero{height:clamp(240px,58vw,380px);}
            .tp-card{height:390px;}
            .tp-card-img-wrap{height:240px!important;}
            .tp-modal{max-width:100%;border-radius:0;}
            .tp-modal-img-wrap{height:280px!important;}
            .tp-cart-panel{width:min(360px,94vw);}
          }
          @media(max-width:480px){
            .tp-nav{padding:0 8px 0 4px!important;}
            .tp-hero{height:clamp(200px,64vw,320px);}
            .tp-card{height:370px;}
            .tp-card-img-wrap{height:220px!important;}
            .tp-modal-img-wrap{height:250px!important;}
            .tp-cart-panel{width:100vw;}
            .wc26-video-wrap{height:30px!important;width:68px!important;}
          }
          @media(max-width:375px){
            .tp-nav{height:56px!important;}
            .tp-mobile-menu{top:56px!important;height:calc(100vh - 56px)!important;}
            .tp-hero{height:clamp(180px,66vw,280px);}
            .tp-hero-title{font-size:clamp(22px,9vw,48px);}
            .tp-card{height:350px;}
            .tp-card-img-wrap{height:200px!important;}
            .tp-add-btn{font-size:12px!important;letter-spacing:2px!important;}
            .tp-filter-btn{font-size:11px!important;padding:4px 9px!important;height:30px!important;}
          }
          @media(min-width:769px) and (max-width:1024px){
            .tp-hero{height:clamp(320px,42vw,480px);}
          }
          @media(min-width:1280px){
            .tp-hero{height:clamp(460px,44vw,640px);}
          }
          @media(max-width:812px) and (orientation:landscape){
            .tp-hero{height:clamp(180px,50vh,320px)!important;}
          }
          @media(hover:none) and (pointer:coarse){
            .tp-card:hover{transform:none;}
          }
        `}</style>

        {/* TICKER */}
        <div style={{ background:"#39ff14",color:"#000",padding:"10px 0",overflow:"hidden",whiteSpace:"nowrap" }}>
          <div style={{ display:"inline-flex",animation:"marquee 18s linear infinite" }}>
            {[...Array(2)].map((_,i)=>(
              <span key={i} style={{ display:"inline-flex" }}>
                {["FREE SHIPPING ABOVE ₹1099","AUTHENTIC LICENSED JERSEYS","EASY 30-DAY RETURNS","COD AVAILABLE","SIZES XS TO XXL"].map(t=>(
                  <span key={t} style={{ fontWeight:900,letterSpacing:3,fontSize:15,padding:"0 36px" }}>★ {t}</span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* NAVBAR */}
        <nav className="tp-nav">
          <button type="button" className="tp-hamburger" onClick={()=>setMobileMenuOpen(o=>!o)} aria-label="Toggle menu" style={{ marginLeft:0 }}>
            {mobileMenuOpen
              ? <svg width="26" height="26" viewBox="0 0 22 22" fill="none"><line x1="2" y1="2" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="2" x2="2" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
          <Link to="/" style={{ textDecoration:"none",flexShrink:0 }}><BrandLogo /></Link>
          <div className="tp-desktop-links">
            <Link to="/" className="tp-nav-link">HOME</Link>
            <Link to="/#shop" className="tp-nav-link">SHOP</Link>
            <Link to="/teams" className="tp-nav-link" style={{ color:"#39ff14" }}>TEAMS</Link>
            <Link to="/tracking" className="tp-nav-link">TRACK</Link>
            {user ? <button type="button" className="tp-nav-link" onClick={async()=>{await supabase.auth.signOut();setUser(null);}}>LOGOUT</button>
              : <Link to="/auth" className="tp-nav-link">LOGIN</Link>}
            {isAdmin && <button type="button" className="tp-nav-link" style={{ color:"#39ff14" }} onClick={()=>navigate("/admin")}>⚙ ADMIN</button>}
          </div>
          <div className="wc26-video-wrap" onClick={()=>navigate("/?cat="+encodeURIComponent("26/27 KITS"))} style={{ cursor:"pointer" }} title="26/27 Kits">
            <video ref={el=>{if(el){el.muted=true;el.play?.().catch(()=>{});}}} src={laliga26Video} autoPlay loop muted playsInline preload="auto" />
          </div>
          <div className="tp-nav-right">
            <button type="button" aria-label="View cart" onClick={()=>setCartOpen(true)}
              style={{ background:"transparent",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,transition:"color 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.color="#39ff14"} onMouseLeave={e=>e.currentTarget.style.color="#fff"}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartItemCount > 0 && <span style={{ color:"#39ff14",fontSize:17,fontWeight:900 }}>{cartItemCount}</span>}
            </button>
          </div>
          <div className={`tp-mobile-menu${mobileMenuOpen ? " open" : ""}`}>
            <Link to="/" className="tp-nav-link" onClick={()=>setMobileMenuOpen(false)}>HOME</Link>
            <Link to="/#shop" className="tp-nav-link" onClick={()=>setMobileMenuOpen(false)}>SHOP</Link>
            <Link to="/teams" className="tp-nav-link" style={{ color:"#39ff14" }} onClick={()=>setMobileMenuOpen(false)}>← ALL TEAMS</Link>
            <Link to="/tracking" className="tp-nav-link" onClick={()=>setMobileMenuOpen(false)}>TRACK ORDER</Link>
            <Link to="/myorders" className="tp-nav-link" onClick={()=>setMobileMenuOpen(false)}>MY ORDERS</Link>
            {user ? <button type="button" className="tp-nav-link" onClick={async()=>{await supabase.auth.signOut();setUser(null);setMobileMenuOpen(false);}}>LOGOUT</button>
              : <Link to="/auth" className="tp-nav-link" onClick={()=>setMobileMenuOpen(false)}>LOGIN</Link>}
            {isAdmin && <button type="button" className="tp-nav-link" style={{ color:"#39ff14" }} onClick={()=>{navigate("/admin");setMobileMenuOpen(false);}}>⚙ ADMIN</button>}
          </div>
        </nav>

        {/* HERO BANNER */}
        <div className="tp-hero">
          <img src={bannerImg} alt={pageTitle} className="tp-hero-img" />
          <div className="tp-hero-overlay" />
          <div className="tp-hero-content">
            <span className="tp-hero-badge">OFFICIAL COLLECTION</span>
            <h1 className="tp-hero-title">{pageTitle}</h1>
            {!loading && <div className="tp-hero-count">{jerseys.length} JERSEY{jerseys.length !== 1 ? "S" : ""} AVAILABLE</div>}
          </div>
        </div>

        {/* SHOP SECTION */}
        <section style={{ padding:"clamp(28px,5vw,64px) clamp(10px,4vw,32px)" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
              <h2 style={{ fontSize:"clamp(22px,3.5vw,38px)",fontWeight:900,fontStyle:"italic",letterSpacing:1,margin:0 }}>
                <span style={{ color:"#39ff14" }}>/ </span>{pageTitle}
              </h2>
              <button type="button" className="tp-back-btn" onClick={()=>navigate("/teams")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                ALL TEAMS
              </button>
            </div>
            <div className="tp-filter-bar">
              {["ALL","PLAYER VERSION","FAN VERSION","RETRO"].map(f=>(
                <button key={f} type="button" className={`tp-filter-btn${activeFilter===f?" active":""}`} onClick={()=>setActiveFilter(f)}>{f}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6 }}>
              {[...Array(6)].map((_,i)=>(
                <div key={i} style={{ background:"#0f0f0f",border:"1px solid #151515" }}>
                  <div className="tp-skeleton" style={{ height:240 }} />
                  <div style={{ padding:14 }}>
                    <div className="tp-skeleton" style={{ height:16,marginBottom:8,width:"60%" }} />
                    <div className="tp-skeleton" style={{ height:14,width:"35%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center",padding:"80px 0",color:"#333" }}>
              <div style={{ fontSize:52 }}>🔍</div>
              <p style={{ marginTop:16,letterSpacing:4,fontSize:13 }}>NO JERSEYS FOUND</p>
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6 }}>
              {filtered.map((jersey,i) => {
                const typeLabel = (jersey.type||"").toUpperCase().includes("PLAYER") ? "PLAYER VERSION" : "FAN VERSION";
                return (
                  <div key={jersey.id} className="tp-card"
                    style={{ animation:`fadeUp 0.45s ease ${i*0.06}s both`,cursor:jersey.stock>0?"pointer":"default" }}
                    onClick={()=>jersey.stock>0&&setSelectedJersey(jersey)}>
                    {jersey.stock===0 && <div className="tp-oos-badge">OUT OF STOCK</div>}
                    <div className="tp-card-type">{typeLabel}</div>
                    <div className="tp-card-img-wrap">
                      <ProductCarousel imageUrl={jersey.image_url} alt={jersey.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                    </div>
                    <div className="tp-card-body">
                      <div className="tp-card-title">{jersey.name}</div>
                      <div className="tp-card-price">₹{jersey.price?.toLocaleString("en-IN")}</div>
                    </div>
                    <button type="button" className="tp-add-btn" disabled={jersey.stock===0}
                      onClick={e=>{e.stopPropagation();jersey.stock>0&&setSelectedJersey(jersey);}}>
                      {jersey.stock===0?"OUT OF STOCK":"SELECT SIZE"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer style={{ background:"#040404",borderTop:"1px solid #111",padding:"40px 24px",textAlign:"center" }}>
          <div style={{ fontWeight:900,fontSize:26,letterSpacing:5,marginBottom:8,fontFamily:"'Bebas Neue',sans-serif" }}>
            JERSEY<span style={{ color:"#39ff14" }}>VAULT</span>
          </div>
          <p style={{ color:"#555",fontSize:12,letterSpacing:3 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
          <div style={{ display:"flex",justifyContent:"center",gap:24,marginTop:16,flexWrap:"wrap" }}>
            {[["PRIVACY","/privacy"],["TERMS","/terms"],["CONTACT","/contact"],["FAQ","/faq"]].map(([l,h])=>(
              <Link key={l} to={h} style={{ color:"#333",fontSize:12,letterSpacing:3,textDecoration:"none",transition:"color 0.2s" }}
                onMouseEnter={e=>e.target.style.color="#39ff14"} onMouseLeave={e=>e.target.style.color="#333"}>{l}</Link>
            ))}
          </div>
        </footer>
      </div>

      {/* MODAL */}
      {selectedJersey && (
        <div className="tp-modal-bg">
          <button type="button" className="tp-modal-dim" onClick={()=>setSelectedJersey(null)} aria-label="Close" />
          <div className="tp-modal">
            <button type="button" className="tp-modal-close" onClick={()=>setSelectedJersey(null)}>✕</button>
            <div className="tp-modal-img-wrap">
              <ProductCarousel imageUrl={selectedJersey.image_url} alt={selectedJersey.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            </div>
            <div className="tp-modal-body">
              <div className="tp-modal-name">{selectedJersey.name}</div>
              <div className="tp-modal-price">₹{selectedJersey.price?.toLocaleString("en-IN")}</div>
              <div className="tp-size-label">SELECT SIZE</div>
              <div className="tp-size-grid">
                {SIZES.map(sz => (
                  <button key={sz} type="button" className={`tp-size-btn${selectedSize===sz?" active":""}`} onClick={()=>setSelectedSize(sz)}>{sz}</button>
                ))}
              </div>
              <button type="button" className="tp-modal-add" onClick={()=>addToCart(selectedJersey,selectedSize)}>
                ADD TO CART
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART */}
      {cartOpen && (
        <div className="tp-cart-overlay">
          <button type="button" className="tp-cart-backdrop" onClick={()=>setCartOpen(false)} aria-label="Close cart" />
          <div className="tp-cart-panel">
            <div className="tp-cart-header">
              <div style={{ fontWeight:900,fontSize:18,letterSpacing:3 }}>
                CART <span style={{ background:"#39ff14",color:"#000",fontSize:12,padding:"2px 8px",borderRadius:2,marginLeft:8 }}>{cartItemCount}</span>
              </div>
              <button type="button" className="tp-cart-close" onClick={()=>setCartOpen(false)}>✕</button>
            </div>
            <div className="tp-cart-items">
              {cart.length === 0 ? (
                <div style={{ textAlign:"center",padding:"60px 20px",color:"#333" }}>
                  <div style={{ fontSize:40,marginBottom:12 }}>🛒</div>
                  <p style={{ letterSpacing:3,fontSize:13 }}>YOUR CART IS EMPTY</p>
                </div>
              ) : cart.map((item,idx) => (
                <div key={`${item.id}-${item.size}-${idx}`} className="tp-cart-item">
                  {getFirstImage(item.image_url) && <img src={getFirstImage(item.image_url)} alt={item.name} className="tp-cart-item-img" />}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div className="tp-cart-item-name" style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</div>
                    <div className="tp-cart-item-meta">SIZE: {item.size} · QTY: {item.qty}</div>
                    <div className="tp-cart-item-price">₹{(item.price*item.qty).toLocaleString("en-IN")}</div>
                  </div>
                  <button type="button" className="tp-cart-remove" onClick={()=>setCart(prev=>prev.filter((_,i)=>i!==idx))}>✕</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="tp-cart-footer">
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:12,letterSpacing:4,color:"#444",fontWeight:700 }}>TOTAL</span>
                  <span className="tp-cart-total">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <button type="button" className="tp-cart-checkout" onClick={()=>{sessionStorage.setItem("cart",JSON.stringify(cart));navigate("/checkout");}}>
                  CHECKOUT →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="tp-toast">{toast}</div>}
    </>
  );
}
