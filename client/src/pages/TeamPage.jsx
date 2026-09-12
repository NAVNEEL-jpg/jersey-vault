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
import { fetchProductReviews, addProductReview, uploadReviewImage } from "../utils/reviews";
import ProductSEO from "../components/ProductSEO";
import { generateProductSlug } from "../utils/product-slugs";

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
  const [modalQty, setModalQty] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [jerseyReviews, setJerseyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showWriteReviewForm, setShowWriteReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewPhotos, setNewReviewPhotos] = useState([]);
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const [submittingCustomerReview, setSubmittingCustomerReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState("");
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [previewReviewPhoto, setPreviewReviewPhoto] = useState(null);
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
            .select("id,name,price,stock,size_stock,image_url,status,type,team_id,category,sub_category,description,featured")
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
    if (selectedJersey || cartOpen || previewReviewPhoto || showSizeChart) {
      document.body.style.overflow = "hidden";
    } else if (!mobileMenuOpen) {
      document.body.style.overflow = "";
    }
  }, [selectedJersey, cartOpen, previewReviewPhoto, showSizeChart, mobileMenuOpen]);

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

  const getSizeStock = useCallback((jersey, size) => {
    if (!jersey) return 0;
    let sStock = jersey.size_stock;
    if (typeof sStock === "string") {
      try { sStock = JSON.parse(sStock); } catch (_) { sStock = null; }
    }
    if (sStock && typeof sStock === "object") {
      const val = Number(sStock[size]);
      if (!isNaN(val) && val >= 0) return val;
    }
    if (jersey.stock && Number(jersey.stock) > 0) {
      return Math.max(1, Math.floor(Number(jersey.stock) / 6));
    }
    return 0;
  }, []);

  const openJerseyModal = useCallback((jersey) => {
    setSelectedJersey(jersey);
    let defaultSize = "M";
    if (jersey) {
      let sStock = jersey.size_stock;
      if (typeof sStock === "string") {
        try { sStock = JSON.parse(sStock); } catch (_) { sStock = null; }
      }
      if (sStock && typeof sStock === "object") {
        if (!sStock["M"] || Number(sStock["M"]) <= 0) {
          const available = SIZES.find(s => Number(sStock[s]) > 0);
          if (available) defaultSize = available;
        }
      }
    }
    setSelectedSize(defaultSize);
    setModalQty(1);
    if (jersey?.name) {
      try {
        const pSlug = generateProductSlug(jersey.name);
        window.history.replaceState({}, "", `/product/${pSlug}`);
      } catch (_) {}
    }
  }, []);

  const closeJerseyModal = useCallback(() => {
    setSelectedJersey(null);
    setShowWriteReviewForm(false);
    try {
      window.history.replaceState({}, "", `/teams/${slug}`);
    } catch (_) {}
  }, [slug]);

  useEffect(() => {
    if (selectedJersey) {
      setLoadingReviews(true);
      setShowWriteReviewForm(false);
      setNewReviewerName("");
      setNewReviewRating(5);
      setNewReviewComment("");
      setNewReviewPhotos([]);
      setReviewSubmitSuccess("");
      setReviewSubmitError("");
      fetchProductReviews(selectedJersey.id)
        .then(reviews => {
          const published = (reviews || []).filter(r => r.is_published !== false);
          setJerseyReviews(published);
        })
        .catch(err => {
          console.error("Failed to fetch product reviews:", err);
          setJerseyReviews([]);
        })
        .finally(() => setLoadingReviews(false));
    } else {
      setJerseyReviews([]);
    }
  }, [selectedJersey]);

  const handleUploadCustomerPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingReviewPhoto(true);
    setReviewSubmitError("");
    try {
      for (const file of files) {
        const url = await uploadReviewImage(file);
        if (url) {
          setNewReviewPhotos(prev => [...prev, url]);
        }
      }
    } catch (err) {
      console.error("Failed to upload photo:", err);
      setReviewSubmitError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingReviewPhoto(false);
      e.target.value = "";
    }
  };

  const handlePostCustomerReview = async (e) => {
    e.preventDefault();
    if (!selectedJersey) return;
    if (!newReviewComment.trim()) {
      setReviewSubmitError("Please enter your review comments.");
      return;
    }
    setSubmittingCustomerReview(true);
    setReviewSubmitError("");
    setReviewSubmitSuccess("");
    try {
      const updatedReviews = await addProductReview(selectedJersey.id, {
        reviewer_name: newReviewerName.trim() || "Customer",
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        photos: newReviewPhotos,
        is_published: true
      });
      const published = (updatedReviews || []).filter(r => r.is_published !== false);
      setJerseyReviews(published);
      setReviewSubmitSuccess("✓ Thank you! Your review has been posted successfully.");
      setNewReviewComment("");
      setNewReviewPhotos([]);
      setNewReviewerName("");
      setNewReviewRating(5);
      setTimeout(() => {
        setShowWriteReviewForm(false);
        setReviewSubmitSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Error posting review:", err);
      setReviewSubmitError("Failed to post review: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingCustomerReview(false);
    }
  };

  const handleShareWhatsApp = useCallback((jersey, e) => {
    e?.stopPropagation();
    const pSlug = generateProductSlug(jersey.name);
    const url = `https://www.thejerseyvault.in/product/${pSlug}`;
    const text = `Check out the ${jersey.name} on The Jersey Vault: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, []);

  const handleCopyShareLink = useCallback((jersey, e) => {
    e?.stopPropagation();
    const pSlug = generateProductSlug(jersey.name);
    const url = `https://www.thejerseyvault.in/product/${pSlug}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => showToast("Product link copied to clipboard!")).catch(() => {});
    } else {
      showToast("Product link copied to clipboard!");
    }
  }, [showToast]);

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return jerseys;
    if (activeFilter === "PLAYER VERSION") return jerseys.filter(j => (j.type || "").toUpperCase().includes("PLAYER"));
    if (activeFilter === "FAN VERSION") return jerseys.filter(j => !(j.type || "").toUpperCase().includes("PLAYER"));
    if (activeFilter === "RETRO") return jerseys.filter(j => (j.category || j.sub_category || "").toUpperCase().includes("RETRO"));
    return jerseys;
  }, [jerseys, activeFilter]);

  const addToCart = useCallback((jersey, size, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === jersey.id && i.size === size);
      if (ex) return prev.map(i => i.id === jersey.id && i.size === size ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...jersey, size, qty }];
    });
    showToast(`${jersey.name} (${size}) x${qty} added!`);
    closeJerseyModal();
  }, [showToast, closeJerseyModal]);

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
          .tp-modal-bg{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;}
          .tp-modal-dim{position:absolute;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(8px);cursor:pointer;border:none;width:100%;height:100%;}
          .tp-modal{background:#0a0a0a;border:1px solid #1e1e1e;width:100%;max-width:540px;max-height:calc(100vh - 32px);overflow-y:auto;-webkit-overflow-scrolling:touch;border-radius:2px;position:relative;z-index:1;animation:fadeUp 0.3s cubic-bezier(0.23,1,0.32,1);box-shadow:0 0 80px rgba(57,255,20,0.06),0 40px 80px rgba(0,0,0,0.9);}
          .tp-modal-img-wrap{position:relative;width:100%;height:360px;background:#0d0d0d;overflow:hidden;}
          .tp-modal-back-btn{position:absolute;top:12px;left:12px;z-index:100;background:rgba(0,0,0,0.85);border:1px solid #39ff14;color:#39ff14;padding:4px 10px;border-radius:3px;font-size:11px;font-weight:900;font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;box-shadow:0 0 8px rgba(57,255,20,0.3);backdrop-filter:blur(4px);transition:transform 0.15s, background 0.15s;}
          .tp-modal-back-btn:hover{background:#39ff14;color:#000;}
          .tp-modal-close{position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.85);border:1.5px solid #39ff14;color:#39ff14;font-size:18px;cursor:pointer;width:36px;height:36px;display:flex;align-items:center;justify-content:center;z-index:100;font-weight:900;border-radius:4px;box-shadow:0 0 10px rgba(57,255,20,0.4);transition:transform 0.15s, border-color 0.2s;}
          .tp-modal-close:hover{border-color:#39ff14;color:#fff;transform:scale(1.05);}
          .tp-modal-body{padding:20px;}
          .tp-modal-name{font-size:22px;font-weight:900;letter-spacing:1px;line-height:1.2;}
          .tp-modal-price{font-size:32px;font-weight:900;color:#39ff14;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;margin-top:4px;}
          .tp-size-label{font-size:12px;letter-spacing:3px;color:#555;font-weight:700;margin-top:16px;margin-bottom:8px;}
          .tp-size-grid{display:flex;flex-wrap:wrap;gap:6px;}
          .tp-size-btn{all:unset;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:15px;letter-spacing:1px;border:1.5px solid #2a2a2a;cursor:pointer;transition:all 0.2s;border-radius:2px;}
          .tp-size-btn.active{background:#39ff14;color:#000;border-color:#39ff14;transform:translateY(-2px);box-shadow:0 0 0 2px rgba(57,255,20,0.25);}
          .tp-size-btn:hover:not(.active):not(:disabled){border-color:#39ff14;color:#39ff14;}
          .tp-size-btn:disabled{background:#0d0d0d!important;border-color:#1a1a1a!important;color:#333!important;cursor:not-allowed;text-decoration:line-through;transform:none!important;box-shadow:none!important;}
          .tp-size-chart-btn{all:unset;box-sizing:border-box;margin-left:auto;background:transparent;border:1px dashed #39ff14!important;color:#ffffff!important;padding:4px 10px;font-size:12px;font-weight:700;letter-spacing:2px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;font-style:italic;transition:all 0.2s ease-in-out;display:inline-flex;align-items:center;gap:6px;}
          .tp-size-chart-btn:hover{background:#39ff14!important;color:#000000!important;border-style:solid!important;}
          .tp-size-chart-btn:hover svg{stroke:#000000!important;}
          .tp-stock-warning{font-size:12px;color:#e67e22;letter-spacing:3px;font-weight:700;margin-top:8px;}
          .tp-modal-qty-control{display:inline-flex;align-items:center;background:#0a0a0a;border:1px solid #333;border-radius:2px;padding:0 4px;height:42px;}
          .tp-modal-qty-control button:not(:disabled){transition:color 0.15s,transform 0.15s;color:#ffffff;}
          .tp-modal-qty-control button:not(:disabled):hover{color:#39ff14!important;transform:scale(1.15);}
          .tp-type-badge{display:inline-block;font-size:12px;letter-spacing:3px;color:#000;font-weight:900;background:#39ff14;padding:3px 10px;border-radius:2px;}
          .tp-share-btn{background:none;border:none;color:#ffffff;padding:2px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:transform 0.15s;}
          .tp-share-btn:hover{transform:scale(1.2);}
          @keyframes scanline{0%{top:-100%;}100%{top:200%;}}
          .tp-modal-add{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#39ff14;color:#000;padding:15px;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:4px;cursor:pointer;margin-top:20px;transition:background 0.2s,box-shadow 0.2s;border-radius:2px;}
          .tp-modal-add:hover{background:#2dff00;box-shadow:0 0 20px rgba(57,255,20,0.5);}
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
          .icon-cart-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;padding:0;background:transparent;border:none;color:#fff;cursor:pointer;transition:color 0.2s,transform 0.15s;}
          .icon-cart-btn:hover{color:#39ff14;}
          .icon-cart-btn:active{transform:scale(0.92);}
          .cart-icon-badge{position:absolute;top:0px;right:1px;min-width:18px;height:18px;padding:0 4px;background:#39ff14;color:#000;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:900;line-height:1;border-radius:999px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(57,255,20,0.7);border:1.5px solid #070707;pointer-events:none;z-index:2;}
          @media(max-width:440px){
            .icon-cart-btn{width:36px;height:36px;}
            .cart-icon-badge{top:-1px;right:0px;min-width:16px;height:16px;font-size:10px;padding:0 3px;}
          }
          @media(max-width:360px){
            .icon-cart-btn{width:32px;height:32px;}
            .cart-icon-badge{top:-2px;right:-1px;min-width:15px;height:15px;font-size:9px;}
          }
          @media(max-width:768px){
            .tp-hamburger{display:flex!important;}
            .tp-desktop-links{display:none!important;}
            .wc26-video-wrap{height:34px;width:clamp(60px,16vw,85px);margin:0 4px 0 auto;border:1px solid rgba(255,255,255,0.12);border-radius:4px;}
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
            .wc26-video-wrap{height:30px!important;width:clamp(48px,13vw,65px)!important;}
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
            .wc26-video-wrap{height:28px!important;width:44px!important;}
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
            <button type="button" aria-label="View cart" onClick={()=>setCartOpen(true)} className="icon-cart-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartItemCount > 0 && <span className="cart-icon-badge">{cartItemCount}</span>}
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
                    onClick={()=>jersey.stock>0&&openJerseyModal(jersey)}>
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
                      onClick={e=>{e.stopPropagation();jersey.stock>0&&openJerseyModal(jersey);}}>
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

      {/* SIZE PICKER & DETAILS MODAL */}
      {selectedJersey && (
        <div className="tp-modal-bg">
          <button type="button" className="tp-modal-dim" onClick={closeJerseyModal} aria-label="Close" />
          <div className="tp-modal" style={{ position: "relative" }}>
            {/* Top Left Compact Back Button */}
            <button
              type="button"
              className="tp-modal-back-btn"
              onClick={closeJerseyModal}
            >
              <span style={{ fontSize: "12px", lineHeight: 1 }}>←</span>
              <span>BACK</span>
            </button>

            {/* Top Right Close Button */}
            <button type="button" className="tp-modal-close" onClick={closeJerseyModal}>✕</button>

            {/* Product Image Carousel */}
            <div className="tp-modal-img-wrap" style={{ position: "relative" }}>
              <ProductCarousel imageUrl={selectedJersey.image_url} alt={selectedJersey.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.3), transparent)", animation: "scanline 2.5s linear infinite" }} />
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to top, #0a0a0a, transparent)", pointerEvents: "none" }} />
            </div>

            {/* Product Info Header */}
            <div style={{ padding: "16px 24px 6px" }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 1, fontStyle: "italic", lineHeight: 1.2 }}>{selectedJersey.name}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 8, width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="tp-type-badge">{(() => {
                    if (selectedJersey.type && (selectedJersey.type.toUpperCase().includes("FAN") || selectedJersey.type.toUpperCase().includes("PLAYER"))) {
                      return selectedJersey.type.toUpperCase();
                    }
                    const str = `${selectedJersey.name || ""} ${selectedJersey.category || ""} ${selectedJersey.sub_category || ""} ${selectedJersey.description || ""}`.toUpperCase();
                    return str.includes("PLAYER") ? "PLAYER VERSION" : "FAN VERSION";
                  })()}</span>
                  <span className="tp-modal-price" style={{ margin: 0 }}>₹{selectedJersey.price?.toLocaleString("en-IN")}</span>
                </div>

                {/* WhatsApp & Copy Link Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto" }}>
                  <button
                    type="button"
                    className="tp-share-btn"
                    onClick={(e) => handleShareWhatsApp(selectedJersey, e)}
                    title="Share on WhatsApp"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M12.012 2c-5.508 0-9.989 4.478-9.989 9.984 0 1.762.459 3.483 1.332 5.004L2 22l5.161-1.344a9.96 9.96 0 004.851 1.256h.004c5.507 0 9.988-4.478 9.988-9.984 0-2.668-1.039-5.176-2.925-7.062A9.925 9.925 0 0012.012 2zm5.721 14.286c-.24.673-1.398 1.282-1.92 1.348-.48.06-1.096.084-3.54-.924-2.772-1.144-4.56-3.96-4.696-4.14-.136-.18-1.12-1.488-1.12-2.844 0-1.356.708-2.016.96-2.292.24-.264.528-.336.708-.336.18 0 .36.004.516.012.168.008.396-.064.62.472.24.576.816 1.992.888 2.136.072.144.12.312.024.504-.096.192-.144.312-.288.48-.144.168-.304.376-.432.504-.144.144-.294.3-.126.588.168.288.75 1.238 1.61 2.004 1.106.985 2.038 1.29 2.326 1.434.288.144.48.216.552.336.072.12.072.696-.168 1.368z"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="tp-share-btn"
                    onClick={(e) => handleCopyShareLink(selectedJersey, e)}
                    title="Copy Product Link"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                </div>
              </div>

              {selectedJersey.stock > 0 && selectedJersey.stock <= 5 && (
                <div className="tp-stock-warning">⚠ ONLY {selectedJersey.stock} LEFT IN STOCK</div>
              )}
            </div>

            {/* Size, Quantity, Specs & Reviews Body */}
            <div style={{ padding: "10px 24px 32px" }}>
              <div className="tp-size-label" style={{ margin: "0 0 8px", fontSize: "13px", letterSpacing: "2.5px" }}>
                SELECT SIZE
              </div>

              {/* SIZE GRID & SIZE CHART BUTTON */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "nowrap", gap: "10px" }}>
                <div className="tp-size-grid" style={{ margin: 0 }}>
                  {(() => {
                    const availableSizes = SIZES.filter(s => getSizeStock(selectedJersey, s) > 0);
                    const listToRender = availableSizes.length > 0 ? availableSizes : SIZES;
                    return listToRender.map(s => {
                      const inStock = getSizeStock(selectedJersey, s) > 0;
                      return (
                        <button
                          type="button"
                          key={s}
                          disabled={!inStock}
                          className={`tp-size-btn${selectedSize === s ? " active" : ""}`}
                          onClick={() => {
                            if (inStock) {
                              setSelectedSize(s);
                              setModalQty(1);
                            }
                          }}
                        >
                          {s}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Size Chart Button */}
                <button
                  type="button"
                  onClick={() => setShowSizeChart(true)}
                  title="View Size Chart"
                  className="tp-size-chart-btn"
                >
                  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 18 16 L 18 72 L 78 72" />
                    <line x1="18" y1="28" x2="25" y2="28" />
                    <line x1="18" y1="40" x2="25" y2="40" />
                    <line x1="18" y1="52" x2="25" y2="52" />
                    <line x1="18" y1="64" x2="25" y2="64" />
                    <line x1="30" y1="72" x2="30" y2="65" />
                    <line x1="42" y1="72" x2="42" y2="65" />
                    <line x1="54" y1="72" x2="54" y2="65" />
                    <line x1="66" y1="72" x2="66" y2="65" />
                    <path d="M 12 24 L 18 14 L 24 24" />
                    <path d="M 70 66 L 80 72 L 70 78" />
                    <path d="M 36 24 H 60 V 58 H 52 L 48 38 L 44 58 H 36 Z" strokeWidth="4" />
                    <path d="M 36 30 H 60" strokeWidth="3" />
                  </svg>
                  <span style={{ fontSize: "9px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>
                    SIZE CHART
                  </span>
                </button>
              </div>

              {/* SELECT QUANTITY */}
              <div style={{ marginTop: 20 }}>
                <div className="tp-size-label" style={{ marginBottom: 8 }}>SELECT QUANTITY</div>
                <div className="tp-modal-qty-control">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={modalQty <= 1}
                    onClick={(e) => {
                      setModalQty(prev => Math.max(1, prev - 1));
                      e.currentTarget.blur();
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: modalQty <= 1 ? "#444" : "#ffffff",
                      width: "36px",
                      height: "36px",
                      fontSize: "20px",
                      fontWeight: 900,
                      cursor: modalQty <= 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      outline: "none"
                    }}
                  >
                    −
                  </button>

                  <span style={{
                    padding: "0 14px",
                    color: "#ffffff",
                    fontSize: "18px",
                    fontWeight: 900,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: "1px",
                    minWidth: "32px",
                    textAlign: "center",
                    userSelect: "none"
                  }}>
                    {modalQty}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={modalQty >= (getSizeStock(selectedJersey, selectedSize) || (selectedJersey?.stock ?? 99))}
                    onClick={(e) => {
                      const maxStock = getSizeStock(selectedJersey, selectedSize) || (selectedJersey?.stock ?? 99);
                      if (modalQty < maxStock) {
                        setModalQty(prev => prev + 1);
                      } else {
                        showToast(`Only ${maxStock} items available in stock for size ${selectedSize}`);
                      }
                      e.currentTarget.blur();
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: modalQty >= (getSizeStock(selectedJersey, selectedSize) || (selectedJersey?.stock ?? 99)) ? "#444" : "#ffffff",
                      width: "36px",
                      height: "36px",
                      fontSize: "20px",
                      fontWeight: 900,
                      cursor: modalQty >= (getSizeStock(selectedJersey, selectedSize) || (selectedJersey?.stock ?? 99)) ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      outline: "none"
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ADD TO CART BUTTON */}
              <button
                type="button"
                className="tp-modal-add"
                onClick={() => addToCart(selectedJersey, selectedSize, modalQty)}
              >
                <span>ADD TO CART</span>
                <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 14, letterSpacing: 2 }}>—</span>
                <span>₹{((selectedJersey.price || 0) * modalQty).toLocaleString("en-IN")}</span>
              </button>

              {/* PRODUCT SPECIFICATIONS & DETAILS */}
              <div style={{ marginTop: 24, borderTop: "1px solid #1a1a1a", paddingTop: 20 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#fff",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <span style={{ color: "#39ff14" }}>📋</span> PRODUCT SPECIFICATIONS &amp; DETAILS
                </div>

                <div style={{
                  background: "#0c0c0c",
                  border: "1px solid #1f1f1f",
                  borderRadius: "4px",
                  padding: "16px 18px"
                }}>
                  <ul style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontFamily: "'Barlow', sans-serif"
                  }}>
                    {(() => {
                      const name = (selectedJersey?.name || "").toUpperCase();
                      const cat = (selectedJersey?.category || "").toUpperCase();
                      const subCat = (selectedJersey?.sub_category || "").toUpperCase();
                      const type = (selectedJersey?.type || "").toUpperCase();
                      const desc = (selectedJersey?.description || "").toUpperCase();
                      const isPlayer = cat.includes("PLAYER") || subCat.includes("PLAYER") || type.includes("PLAYER") || name.includes("PLAYER") || desc.includes("PLAYER");

                      if (isPlayer) {
                        return [
                          "Made in Thailand",
                          "Superior Dry Fit Quality",
                          "Authentic Rubberised 3D Logo"
                        ];
                      } else {
                        return [
                          "Made in Thailand",
                          "Dry Fit Quality",
                          "Embroidered Premium Logo",
                          "Shorts Included"
                        ];
                      }
                    })().map((feature, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                        <span style={{ color: "#39ff14", fontSize: 18, fontWeight: 900, lineHeight: 1 }}>•</span>
                        <strong style={{ color: "#ffffff", fontWeight: 700 }}>{feature}</strong>
                      </li>
                    ))}
                  </ul>

                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px dashed #222",
                    color: "#aaaaaa",
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: "'Barlow', sans-serif"
                  }}>
                    {selectedJersey?.description && selectedJersey.description.trim() !== ""
                      ? selectedJersey.description
                      : (() => {
                          const name = (selectedJersey?.name || "").toUpperCase();
                          const cat = (selectedJersey?.category || "").toUpperCase();
                          const subCat = (selectedJersey?.sub_category || "").toUpperCase();
                          const type = (selectedJersey?.type || "").toUpperCase();
                          const isPlayer = cat.includes("PLAYER") || subCat.includes("PLAYER") || type.includes("PLAYER") || name.includes("PLAYER");
                          return isPlayer
                            ? "Authentic Match / Player Edition jersey engineered with Thailand superior ultra-lightweight Dry-Fit performance fabric, heat-transferred authentic rubberised 3D club crests, and precision athletic slim-fit tailoring as worn on pitch by professional players."
                            : "Premium Fan Edition football jersey imported from Thailand. Features breathable Dry-Fit fabric technology for maximum comfort, high-density embroidered club logos, and comes complete with matching shorts included.";
                        })()
                    }
                  </div>
                </div>
              </div>

              {/* ── CUSTOMER REVIEWS SECTION ── */}
              <div style={{ marginTop: 28, borderTop: "1px solid #1a1a1a", paddingTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "#fff" }}>
                      CUSTOMER REVIEWS ({jerseyReviews.length})
                    </div>
                    {jerseyReviews.length > 0 && (
                      <div style={{ fontSize: 12, color: "#39ff14", letterSpacing: 1, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>⭐⭐⭐⭐⭐</span>
                        <span style={{ fontWeight: 700 }}>(5.0 / 5.0 Rating)</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWriteReviewForm(o => !o)}
                    style={{
                      background: showWriteReviewForm ? "rgba(255, 68, 68, 0.15)" : "rgba(57, 255, 20, 0.12)",
                      border: showWriteReviewForm ? "1px solid rgba(255, 68, 68, 0.4)" : "1px solid #39ff14",
                      color: showWriteReviewForm ? "#ff4444" : "#39ff14",
                      padding: "6px 14px",
                      borderRadius: "4px",
                      fontWeight: 800,
                      fontSize: "12px",
                      letterSpacing: "1px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    {showWriteReviewForm ? "✕ CLOSE FORM" : "✍️ WRITE A REVIEW"}
                  </button>
                </div>

                {/* WRITE A REVIEW FORM */}
                {showWriteReviewForm && (
                  <form
                    onSubmit={handlePostCustomerReview}
                    style={{
                      background: "#080808",
                      border: "1px solid #39ff14",
                      borderRadius: "6px",
                      padding: "16px",
                      marginBottom: "20px",
                      boxShadow: "0 0 20px rgba(57, 255, 20, 0.15)"
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: "14px", letterSpacing: "1.5px", color: "#39ff14", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>✍️</span> WRITE &amp; POST A REVIEW
                    </div>

                    {/* Star Rating Picker */}
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "6px" }}>
                        YOUR RATING:
                      </label>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            style={{
                              background: "none",
                              border: "none",
                              color: star <= newReviewRating ? "#ffb700" : "#444",
                              fontSize: "22px",
                              cursor: "pointer",
                              padding: "0 2px",
                              transition: "transform 0.15s, color 0.15s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                          >
                            ★
                          </button>
                        ))}
                        <span style={{ fontSize: "12px", color: "#39ff14", fontWeight: 800, marginLeft: "8px", letterSpacing: "0.5px" }}>
                          ({newReviewRating} / 5 Stars)
                        </span>
                      </div>
                    </div>

                    {/* Reviewer Name */}
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "4px" }}>
                        YOUR NAME / NICKNAME:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul S. (or leave empty for 'Customer')"
                        value={newReviewerName}
                        onChange={(e) => setNewReviewerName(e.target.value)}
                        style={{
                          width: "100%",
                          background: "#111",
                          border: "1px solid #2a2a2a",
                          borderRadius: "4px",
                          padding: "8px 12px",
                          color: "#fff",
                          fontSize: "13px",
                          fontFamily: "'Barlow', sans-serif",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = "#39ff14"}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}
                      />
                    </div>

                    {/* Review Comment */}
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "4px" }}>
                        YOUR REVIEW / FEEDBACK:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Share details about jersey quality, fabric, printing, sizing fit..."
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          background: "#111",
                          border: "1px solid #2a2a2a",
                          borderRadius: "4px",
                          padding: "8px 12px",
                          color: "#fff",
                          fontSize: "13px",
                          fontFamily: "'Barlow', sans-serif",
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box"
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = "#39ff14"}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}
                      />
                    </div>

                    {/* Photo Upload */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "6px" }}>
                        ADD PHOTOS (OPTIONAL):
                      </label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <label
                          style={{
                            background: "#161616",
                            border: "1px dashed #39ff14",
                            color: "#39ff14",
                            padding: "8px 14px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 800,
                            letterSpacing: "1px",
                            cursor: uploadingReviewPhoto ? "wait" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <span>📷</span> {uploadingReviewPhoto ? "UPLOADING PHOTO..." : "UPLOAD PHOTO"}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={uploadingReviewPhoto}
                            onChange={handleUploadCustomerPhoto}
                            style={{ display: "none" }}
                          />
                        </label>

                        {uploadingReviewPhoto && (
                          <span style={{ fontSize: "11px", color: "#aaa", fontStyle: "italic" }}>
                            Processing image...
                          </span>
                        )}
                      </div>

                      {/* Photo Previews */}
                      {newReviewPhotos.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                          {newReviewPhotos.map((url, pIdx) => (
                            <div key={pIdx} style={{ position: "relative" }}>
                              <img
                                src={url}
                                alt="Attached preview"
                                style={{
                                  width: 56,
                                  height: 56,
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                  border: "1px solid #39ff14"
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setNewReviewPhotos(prev => prev.filter((_, i) => i !== pIdx))}
                                style={{
                                  position: "absolute",
                                  top: -5,
                                  right: -5,
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  background: "#ff4444",
                                  color: "#fff",
                                  border: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  fontWeight: 900,
                                  cursor: "pointer"
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Messages */}
                    {reviewSubmitError && (
                      <div style={{ color: "#ff4444", fontSize: "12px", marginBottom: "12px", fontWeight: 700 }}>
                        ⚠️ {reviewSubmitError}
                      </div>
                    )}
                    {reviewSubmitSuccess && (
                      <div style={{ color: "#39ff14", fontSize: "12px", marginBottom: "12px", fontWeight: 800 }}>
                        {reviewSubmitSuccess}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingCustomerReview || uploadingReviewPhoto}
                      style={{
                        width: "100%",
                        background: "#39ff14",
                        color: "#000",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: "4px",
                        fontWeight: 900,
                        fontSize: "13px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        cursor: (submittingCustomerReview || uploadingReviewPhoto) ? "wait" : "pointer",
                        opacity: (submittingCustomerReview || uploadingReviewPhoto) ? 0.7 : 1,
                        transition: "transform 0.15s, background 0.2s"
                      }}
                    >
                      {submittingCustomerReview ? "POSTING REVIEW..." : "POST REVIEW →"}
                    </button>
                  </form>
                )}

                {loadingReviews ? (
                  <div style={{ color: "#777", fontSize: 12, padding: "16px 0", letterSpacing: 1 }}>
                    Loading customer reviews...
                  </div>
                ) : jerseyReviews.length === 0 ? (
                  <div style={{ background: "#080808", border: "1px dashed #222", padding: "20px", textAlign: "center", borderRadius: "4px" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>💬</div>
                    <div style={{ color: "#aaa", fontSize: 13, letterSpacing: 1, fontWeight: 600 }}>Be the first to review this premium jersey</div>
                    <div style={{ color: "#555", fontSize: 11, letterSpacing: 0.5, marginTop: 4 }}>Verified customer reviews will appear here.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "340px", overflowY: "auto", paddingRight: 4 }}>
                    {jerseyReviews.map((rev) => (
                      <div key={rev.id} style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", padding: "14px 14px 12px 14px", borderRadius: "4px", position: "relative", boxSizing: "border-box" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px 12px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.5px", color: "#d4d4d4" }}>
                              {rev.reviewer_name}
                            </span>
                            <span style={{
                              background: "rgba(57, 255, 20, 0.12)",
                              border: "1px solid rgba(57, 255, 20, 0.25)",
                              color: "#39ff14",
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: "4px",
                              letterSpacing: "0.5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              whiteSpace: "nowrap"
                            }}>
                              ✓ VERIFIED BUYER
                            </span>
                          </div>
                          <span style={{ color: "#ffb700", fontSize: "11px", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                            {"★".repeat(rev.rating || 5)}{"☆".repeat(5 - (rev.rating || 5))}
                          </span>
                        </div>

                        <p style={{ color: "#b0b0b0", fontSize: "13px", lineHeight: 1.4, fontFamily: "'Barlow', sans-serif", margin: "6px 0 10px 0", wordBreak: "break-word" }}>
                          {rev.comment}
                        </p>

                        {Array.isArray(rev.photos) && rev.photos.length > 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                            {rev.photos.map((photo, pIdx) => (
                              <img
                                key={pIdx}
                                src={photo}
                                alt={`Review attachment ${pIdx + 1}`}
                                onClick={() => setPreviewReviewPhoto(photo)}
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: "cover",
                                  border: "1px solid #2a2a2a",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  transition: "transform 0.2s, border-color 0.2s"
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.borderColor = "#39ff14"; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
                              />
                            ))}
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, marginBottom: 4 }}>
                          <span style={{ color: "#555", fontSize: "11px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "1px" }}>
                            {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : '7/26/2026'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── YOU MAY ALSO LIKE SECTION ── */}
              {(() => {
                const relatable = jerseys.filter(j => j.id !== selectedJersey.id);
                if (relatable.length === 0) return null;
                return (
                  <div style={{ marginTop: 32, borderTop: "1px solid #1a1a1a", paddingTop: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                      <div>
                        <div style={{ color: "#39ff14", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
                          RECOMMENDED FOR YOU
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "#fff" }}>
                          YOU MAY ALSO LIKE
                        </div>
                      </div>
                      <Link
                        to={`/product/${generateProductSlug(selectedJersey.name)}`}
                        style={{
                          color: "#39ff14",
                          textDecoration: "none",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 1,
                          fontFamily: "'Barlow Condensed', sans-serif"
                        }}
                      >
                        OPEN FULL PAGE ↗
                      </Link>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 12
                    }}>
                      {relatable.map((rel) => {
                        const relImg = getFirstImage(rel.image_url);
                        const relIsPlayer = (rel.type || "").toUpperCase().includes("PLAYER");
                        return (
                          <div
                            key={rel.id}
                            onClick={() => {
                              openJerseyModal(rel);
                              const modalEl = document.querySelector('.tp-modal');
                              if (modalEl) modalEl.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{
                              background: "#080808",
                              border: "1px solid #1c1c1c",
                              borderRadius: 4,
                              overflow: "hidden",
                              cursor: "pointer",
                              transition: "border-color 0.2s, transform 0.2s",
                              display: "flex",
                              flexDirection: "column"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#39ff14"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1c1c1c"; e.currentTarget.style.transform = "none"; }}
                          >
                            <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#111" }}>
                              <img src={relImg} alt={rel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.85)", border: relIsPlayer ? "1px solid #ff4444" : "1px solid #39ff14", color: relIsPlayer ? "#ff4444" : "#39ff14", fontSize: 8, fontWeight: 900, padding: "1px 4px", borderRadius: 2 }}>
                                {rel.type || (relIsPlayer ? "PLAYER" : "FAN")}
                              </div>
                            </div>
                            <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                              <div>
                                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>
                                  {rel.name}
                                </div>
                                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "#39ff14", letterSpacing: 1 }}>
                                  ₹{rel.price?.toLocaleString("en-IN")}
                                </div>
                              </div>
                              <button
                                type="button"
                                style={{
                                  marginTop: 6,
                                  width: "100%",
                                  background: "transparent",
                                  border: "1px solid #39ff14",
                                  color: "#39ff14",
                                  padding: "4px 0",
                                  fontSize: 10,
                                  fontWeight: 900,
                                  fontFamily: "'Barlow Condensed', sans-serif",
                                  letterSpacing: 1,
                                  borderRadius: 2,
                                  cursor: "pointer"
                                }}
                              >
                                SELECT SIZE
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <ProductSEO jersey={selectedJersey} reviews={jerseyReviews} />
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR REVIEW PHOTOS */}
      {previewReviewPhoto && (
        <div className="tp-modal-bg" style={{ zIndex: 2100 }}>
          <button type="button" className="tp-modal-dim" onClick={() => setPreviewReviewPhoto(null)} aria-label="Close photo preview" />
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", margin: "auto", background: "#000", border: "1px solid #39ff14", padding: 8, zIndex: 2101 }}>
            <button
              type="button"
              style={{ position: "absolute", top: 12, right: 12, background: "#39ff14", color: "#000", border: "none", width: 32, height: 32, fontWeight: 900, cursor: "pointer", zIndex: 10 }}
              onClick={() => setPreviewReviewPhoto(null)}
            >
              ✕
            </button>
            <img src={previewReviewPhoto} alt="Customer review attachment" style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", objectFit: "contain", margin: "0 auto" }} />
          </div>
        </div>
      )}

      {/* SIZE CHART MODAL POPUP */}
      {showSizeChart && (
        <div className="tp-modal-bg" style={{ zIndex: 2100 }}>
          <button type="button" className="tp-modal-dim" aria-label="Close size chart" onClick={() => setShowSizeChart(false)} />
          <div className="tp-modal" style={{ maxWidth: "520px", border: "1px solid #39ff14", position: "relative", zIndex: 2101 }}>
            <button type="button" className="tp-modal-close" style={{ right: "12px", left: "auto", zIndex: 10 }} onClick={() => setShowSizeChart(false)}>
              ✕
            </button>
            <div style={{ position: "relative", background: "#0a0a0a" }}>
              <div style={{
                background: "#39ff14",
                color: "#000",
                padding: "14px 20px",
                textAlign: "center",
                fontWeight: "900",
                fontSize: "24px",
                fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
                letterSpacing: "3px",
                textTransform: "uppercase"
              }}>
                SIZE CHART
              </div>

              <div style={{ padding: "24px 20px 16px" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#fff",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "14px",
                  textAlign: "center",
                  border: "1px solid #222"
                }}>
                  <thead>
                    <tr style={{ background: "#111", borderBottom: "2px solid #39ff14" }}>
                      <th style={{ padding: "12px 8px", fontWeight: "900", letterSpacing: "1px", border: "1px solid #222" }}>SIZE</th>
                      <th style={{ padding: "12px 8px", fontWeight: "900", letterSpacing: "1px", border: "1px solid #222", color: "#ccc" }}>
                        CHEST <span style={{ color: "#39ff14", fontSize: "11px", display: "block" }}>(FAN VERSION) (in.")</span>
                      </th>
                      <th style={{ padding: "12px 8px", fontWeight: "900", letterSpacing: "1px", border: "1px solid #222", color: "#ccc" }}>
                        CHEST <span style={{ color: "#39ff14", fontSize: "11px", display: "block" }}>(PLAYER VERSION) (in.")</span>
                      </th>
                      <th style={{ padding: "12px 8px", fontWeight: "900", letterSpacing: "1px", border: "1px solid #222", color: "#ccc" }}>
                        LENGTH <span style={{ color: "#aaa", fontSize: "11px", display: "block" }}>(SAME FOR ALL) (in.")</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { size: "S", fan: "38", player: "36", len: "27" },
                      { size: "M", fan: "40", player: "38", len: "28" },
                      { size: "L", fan: "42", player: "40", len: "29" },
                      { size: "XL", fan: "44", player: "42", len: "30" },
                      { size: "XXL", fan: "46", player: "44", len: "31" }
                    ].map((row, idx) => (
                      <tr key={row.size} style={{
                        background: idx % 2 === 0 ? "#070707" : "#0c0c0c",
                        borderBottom: "1px solid #222",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(57,255,20,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#070707" : "#0c0c0c"}
                      >
                        <td style={{ padding: "12px 8px", fontWeight: "900", color: "#39ff14", fontSize: "16px", border: "1px solid #222" }}>{row.size}</td>
                        <td style={{ padding: "12px 8px", fontWeight: "700", border: "1px solid #222" }}>{row.fan}</td>
                        <td style={{ padding: "12px 8px", fontWeight: "700", border: "1px solid #222" }}>{row.player}</td>
                        <td style={{ padding: "12px 8px", fontWeight: "700", border: "1px solid #222" }}>{row.len}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: "16px", padding: "12px", background: "#111", border: "1px solid #1e1e1e", borderRadius: "2px", fontSize: "12px", color: "#aaa", lineHeight: 1.5, fontFamily: "'Barlow', sans-serif" }}>
                  <strong style={{ color: "#39ff14" }}>Tip:</strong> Fan version jerseys provide a regular, comfortable fit. Player version jerseys have an athletic slim-fit cut; consider sizing up if between sizes.
                </div>
              </div>
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
