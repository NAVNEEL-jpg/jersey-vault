import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "../supabase";
import { express } from "../express";
import BrandLogo from "../components/BrandLogo";
import laliga26Video from "../assets/Laliga26.mp4.mp4";
import { getProductImages, getFirstImage } from "../utils/imageHelpers";
import { fetchProductReviews, addProductReview, uploadReviewImage } from "../utils/reviews";
import ProductSEO from "../components/ProductSEO";
import { generateProductSlug } from "../utils/product-slugs";
import ReactGA from "react-ga4";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// Image Carousel for Product Cards & Gallery
const ProductGallery = memo(function ProductGallery({ imageUrl, alt, onImageClick }) {
  const images = useMemo(() => getProductImages(imageUrl), [imageUrl]);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images.length) {
    return (
      <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0d", fontSize: 64 }}>
        👕
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Main Preview */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#0f0f0f", borderRadius: 4, overflow: "hidden", border: "1px solid #1a1a1a" }}>
        <img
          src={images[activeIdx] || images[0]}
          alt={alt}
          onClick={() => onImageClick && onImageClick(images[activeIdx] || images[0])}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in", transition: "transform 0.3s ease" }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        />

        {/* Scanline Animation */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.3), transparent)", animation: "scanline 3s linear infinite" }} />
        </div>

        {/* Previous / Next Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev - 1 + images.length) % images.length); }}
              aria-label="Previous image"
              style={{
                position: "absolute",
                top: "50%",
                left: 10,
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#39ff14"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(0,0,0,0.75)"}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev + 1) % images.length); }}
              aria-label="Next image"
              style={{
                position: "absolute",
                top: "50%",
                right: 10,
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#39ff14"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(0,0,0,0.75)"}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              style={{
                width: 68,
                height: 68,
                flexShrink: 0,
                padding: 0,
                background: "#111",
                border: idx === activeIdx ? "2px solid #39ff14" : "1px solid #222",
                borderRadius: 4,
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <img src={img} alt={`${alt} thumbnail ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Core Product States
  const [product, setProduct] = useState(null);
  const [team, setTeam] = useState(null);
  const [relatableJerseys, setRelatableJerseys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // User & Auth States
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selection & Purchase States
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Reviews States
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

  // Cart & Toast
  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + (item.qty || 1), 0), [cart]);

  // Sync Cart to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("cart", JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // Auth Listener
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
      if (u) {
        const nav = u.email?.toLowerCase() === "navneeldutta@gmail.com";
        setUser({ ...u });
        setIsAdmin(nav);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Body Scroll Locking for modals
  useEffect(() => {
    if (cartOpen || previewReviewPhoto || showSizeChart) {
      document.body.style.overflow = "hidden";
    } else if (!mobileMenuOpen) {
      document.body.style.overflow = "";
    }
  }, [cartOpen, previewReviewPhoto, showSizeChart, mobileMenuOpen]);

  // Helper to compute size stock
  const getSizeStock = useCallback((j, size) => {
    if (!j) return 0;
    let sStock = j.size_stock;
    if (typeof sStock === "string") {
      try { sStock = JSON.parse(sStock); } catch (_) { sStock = null; }
    }
    if (sStock && typeof sStock === "object") {
      const upper = size.toUpperCase();
      if (sStock[upper] !== undefined) return Number(sStock[upper]) || 0;
      if (sStock[size] !== undefined) return Number(sStock[size]) || 0;
    }
    return j.stock !== undefined ? Number(j.stock) : 0;
  }, []);

  // Fetch Main Product & Relatable Jerseys
  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    (async () => {
      try {
        // 1. Fetch all products to find slug or id match
        const { data: allProducts, error: pErr } = await express.from("products")
          .select("id,name,price,stock,size_stock,image_url,status,type,team_id,category,sub_category,description,featured")
          .eq("status", "active");

        if (pErr || !allProducts || allProducts.length === 0) {
          if (active) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const matched = allProducts.find(
          (p) => generateProductSlug(p.name) === slug || String(p.id) === slug
        );

        if (!matched) {
          if (active) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (active) {
          setProduct(matched);

          // Auto-select first in-stock size
          let bestSize = "M";
          for (const s of SIZES) {
            if (getSizeStock(matched, s) > 0) {
              bestSize = s;
              break;
            }
          }
          setSelectedSize(bestSize);
          setQuantity(1);

          // Track Google Analytics View Item
          ReactGA.event("view_item", {
            currency: "INR",
            value: matched.price,
            items: [{
              item_id: matched.id,
              item_name: matched.name,
              price: matched.price,
              item_category: matched.type
            }]
          });

          // 2. Fetch Team Details & Relatable Jerseys
          if (matched.team_id) {
            try {
              const { data: tData } = await express.from("teams")
                .select("id,name,logo_url")
                .eq("id", matched.team_id)
                .single();
              if (tData && active) setTeam(tData);
            } catch (_) {}

            // Filter relatable jerseys of the same team
            const sameTeamJerseys = allProducts.filter(
              (p) => p.id !== matched.id && p.team_id === matched.team_id
            );
            if (active) setRelatableJerseys(sameTeamJerseys);
          } else {
            // Fallback: match by similar name keywords (e.g. "Madrid", "Barcelona", "Arsenal")
            const words = matched.name.split(" ").filter(w => w.length > 3);
            const similar = allProducts.filter(p => {
              if (p.id === matched.id) return false;
              return words.some(w => p.name.toLowerCase().includes(w.toLowerCase()));
            });
            if (active) setRelatableJerseys(similar.slice(0, 6));
          }
        }
      } catch (err) {
        console.error("ProductPage load error:", err);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug, getSizeStock]);

  // Fetch Reviews when product loads
  useEffect(() => {
    if (!product?.id) {
      setJerseyReviews([]);
      return;
    }
    setLoadingReviews(true);
    fetchProductReviews(product.id)
      .then((revs) => {
        const published = (revs || []).filter((r) => r.is_published !== false);
        setJerseyReviews(published);
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
        setJerseyReviews([]);
      })
      .finally(() => setLoadingReviews(false));
  }, [product?.id]);

  // Handle Review Image Upload
  const handleReviewPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReviewPhoto(true);
    setReviewSubmitError("");
    try {
      const url = await uploadReviewImage(file);
      if (url) {
        setNewReviewPhotos((prev) => [...prev, url]);
      } else {
        setReviewSubmitError("Could not process image upload.");
      }
    } catch (_) {
      setReviewSubmitError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingReviewPhoto(false);
    }
  };

  // Handle Submit Customer Review
  const handlePostCustomerReview = async (e) => {
    e.preventDefault();
    if (!product) return;
    if (!newReviewComment.trim()) {
      setReviewSubmitError("Please enter your review feedback.");
      return;
    }
    setSubmittingCustomerReview(true);
    setReviewSubmitError("");
    setReviewSubmitSuccess("");
    try {
      const updated = await addProductReview(product.id, {
        reviewer_name: newReviewerName.trim() || "Customer",
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        photos: newReviewPhotos,
      });
      const published = (updated || []).filter((r) => r.is_published !== false);
      setJerseyReviews(published);
      setReviewSubmitSuccess("✓ Thank you! Your review has been posted successfully.");
      setNewReviewComment("");
      setNewReviewPhotos([]);
      setShowWriteReviewForm(false);
    } catch (_) {
      setReviewSubmitError("Failed to submit review. Please try again.");
    } finally {
      setSubmittingCustomerReview(false);
    }
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    const stockAvailable = getSizeStock(product, selectedSize);
    if (stockAvailable === 0) {
      showToast("Selected size is currently out of stock.");
      return;
    }

    setCart((prev) => {
      const key = `${product.id}-${selectedSize}`;
      const existing = prev.find((item) => `${item.id}-${item.size}` === key);
      if (existing) {
        const newQty = Math.min(existing.qty + quantity, stockAvailable);
        return prev.map((item) =>
          `${item.id}-${item.size}` === key ? { ...item, qty: newQty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          size: selectedSize,
          qty: quantity,
          image_url: getFirstImage(product.image_url),
          type: product.type || "FAN VERSION",
        },
      ];
    });

    ReactGA.event("add_to_cart", {
      currency: "INR",
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: quantity,
        item_category: selectedSize,
      }],
    });

    showToast(`✓ Added ${quantity}x ${product.name} (${selectedSize}) to cart!`);
    setCartOpen(true);
  };

  // Share Actions
  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("✓ Product link copied to clipboard!");
      });
    } else {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast("✓ Product link copied to clipboard!");
    }
  };

  const handleWhatsAppShare = () => {
    if (!product) return;
    const text = `🔥 Check out the ${product.name} on The Jersey Vault for ₹${product.price}!\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const selectedSizeStock = product ? getSizeStock(product, selectedSize) : 0;
  const isOutOfStock = product ? product.stock === 0 : false;
  const isPlayerVersion = product?.name?.toUpperCase().includes("PLAYER") || product?.type?.toUpperCase().includes("PLAYER");

  return (
    <div style={{ background: "#070707", color: "#fff", minHeight: "100vh", fontFamily: "'Barlow', sans-serif" }}>
      <Helmet>
        <title>{product ? `${product.name} | The Jersey Vault` : "Jersey Product | The Jersey Vault"}</title>
        <meta name="description" content={product?.description || "Shop official football and cricket jerseys in India. Authentic Thailand Dry-Fit quality, COD available with fast nationwide shipping."} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* STYLES & ANIMATIONS */}
      <style>{`
        @keyframes scanline { 0% { top:-10%; } 100% { top:110%; } }
        @keyframes marquee { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .pdp-nav { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:64px; background:#070707; border-bottom:1px solid #141414; position:sticky; top:0; z-index:900; }
        .pdp-nav-link { color:#ccc; text-decoration:none; font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:14px; letter-spacing:2px; transition:color 0.2s; text-transform:uppercase; }
        .pdp-nav-link:hover { color:#39ff14; }
        .pdp-container { max-width:1200px; margin:0 auto; padding:24px 20px 80px; animation:fadeIn 0.4s ease; }
        .pdp-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; margin-top:20px; }
        .pdp-relatable-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; margin-top:20px; }
        .pdp-card { background:#0a0a0a; border:1px solid #181818; border-radius:4px; overflow:hidden; transition:transform 0.25s, border-color 0.25s, box-shadow 0.25s; cursor:pointer; display:flex; flex-direction:column; }
        .pdp-card:hover { transform:translateY(-4px); border-color:#39ff14; box-shadow:0 8px 24px rgba(57,255,20,0.15); }
        .icon-cart-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; padding:0; background:transparent; border:none; color:#fff; cursor:pointer; }
        .icon-cart-btn:hover { color:#39ff14; }
        .cart-icon-badge { position:absolute; top:0px; right:1px; min-width:18px; height:18px; padding:0 4px; background:#39ff14; color:#000; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:900; line-height:1; border-radius:999px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(57,255,20,0.7); border:1.5px solid #070707; pointer-events:none; }
        .pdp-cta-btn { background:#39ff14; color:#000; border:none; padding:16px 24px; font-family:'Bebas Neue','Barlow Condensed',sans-serif; font-size:22px; font-weight:900; letter-spacing:2px; cursor:pointer; width:100%; border-radius:4px; transition:transform 0.15s, background 0.2s, box-shadow 0.2s; box-shadow:0 0 16px rgba(57,255,20,0.35); text-transform:uppercase; }
        .pdp-cta-btn:hover:not(:disabled) { background:#32e012; transform:translateY(-1px); box-shadow:0 0 24px rgba(57,255,20,0.6); }
        .pdp-cta-btn:active:not(:disabled) { transform:scale(0.99); }
        .pdp-cta-btn:disabled { background:#222; color:#555; cursor:not-allowed; box-shadow:none; }
        .pdp-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:2000; display:flex; align-items:center; justify-content:center; padding:16px; }
        .pdp-modal-dim { position:absolute; inset:0; background:transparent; border:none; cursor:pointer; }
        .pdp-modal { background:#0a0a0a; border:1px solid #222; border-radius:4px; max-height:92vh; overflow-y:auto; width:100%; position:relative; z-index:2001; }
        .pdp-modal-close { position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.08); border:none; color:#fff; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; }
        .pdp-modal-close:hover { background:#39ff14; color:#000; }
        .cart-overlay { position:fixed; inset:0; z-index:2500; display:flex; justify-content:flex-end; }
        .cart-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); border:none; cursor:pointer; }
        .cart-panel { position:relative; width:100%; max-width:420px; height:100%; background:#0a0a0a; border-left:1px solid #222; display:flex; flex-direction:column; z-index:2501; animation:slideLeft 0.3s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideLeft { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @media(max-width:768px) {
          .pdp-desktop-links { display:none !important; }
          .pdp-hamburger { display:flex !important; }
        }
        @media(max-width:868px) {
          .pdp-grid { grid-template-columns:1fr; gap:28px; }
          .pdp-relatable-grid { grid-template-columns:repeat(2, 1fr); gap:12px; }
        }
        @media(max-width:480px) {
          .pdp-container { padding:16px 14px 60px; }
          .pdp-relatable-grid { grid-template-columns:repeat(2, 1fr); gap:10px; }
        }
      `}</style>

      {/* TOP ANNOUNCEMENT TICKER */}
      <div style={{ background: "#39ff14", color: "#000", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", animation: "marquee 20s linear infinite" }}>
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ display: "inline-flex" }}>
              {["★ FREE SHIPPING ABOVE ₹1099", "★ AUTHENTIC LICENSED JERSEYS", "★ EASY 30-DAY RETURNS", "★ COD AVAILABLE", "★ SIZES XS TO XXL"].map(t => (
                <span key={t} style={{ fontWeight: 900, letterSpacing: 2, fontSize: 13, padding: "0 28px" }}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="pdp-nav">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "none" }}
          className="pdp-hamburger"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none"><line x1="2" y1="2" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="2" x2="2" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>

        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <BrandLogo />
        </Link>

        <div className="pdp-desktop-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link to="/" className="pdp-nav-link">HOME</Link>
          <Link to="/#shop" className="pdp-nav-link">SHOP</Link>
          <Link to="/teams" className="pdp-nav-link" style={{ color: "#39ff14" }}>TEAMS</Link>
          <Link to="/tracking" className="pdp-nav-link">TRACK</Link>
          {user ? (
            <button
              type="button"
              className="pdp-nav-link"
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              LOGOUT
            </button>
          ) : (
            <Link to="/auth" className="pdp-nav-link">LOGIN</Link>
          )}
          {isAdmin && (
            <button
              type="button"
              className="pdp-nav-link"
              style={{ color: "#39ff14", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => navigate("/admin")}
            >
              ⚙ ADMIN
            </button>
          )}

          {/* 26/27 Kits Mini Video */}
          <div
            onClick={() => navigate("/?cat=" + encodeURIComponent("26/27 KITS"))}
            style={{ cursor: "pointer", height: 32, width: 52, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="26/27 Kits"
          >
            <video
              ref={el => { if (el) { el.muted = true; el.play?.().catch(() => {}); } }}
              src={laliga26Video}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Cart Icon Button */}
          <button
            type="button"
            aria-label="View cart"
            onClick={() => setCartOpen(true)}
            className="icon-cart-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="cart-icon-badge">{cartCount}</span>}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div style={{
          display: mobileMenuOpen ? "flex" : "none",
          flexDirection: "column",
          gap: 16,
          position: "fixed",
          top: 56,
          left: 0,
          right: 0,
          bottom: 0,
          background: "#080808",
          padding: "24px 20px",
          borderTop: "1px solid #1a1a1a",
          zIndex: 9999
        }}>
          <Link to="/" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>HOME</Link>
          <Link to="/#shop" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>SHOP ALL JERSEYS</Link>
          <Link to="/teams" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ color: "#39ff14", fontSize: 18 }}>TEAMS & CLUBS</Link>
          <Link to="/tracking" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>TRACK ORDER</Link>
          {user ? (
            <button
              type="button"
              className="pdp-nav-link"
              onClick={async () => { await supabase.auth.signOut(); setUser(null); setMobileMenuOpen(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontSize: 18 }}
            >
              LOGOUT
            </button>
          ) : (
            <Link to="/auth" className="pdp-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 18 }}>LOGIN / SIGN UP</Link>
          )}
          {isAdmin && (
            <button
              type="button"
              className="pdp-nav-link"
              style={{ color: "#39ff14", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontSize: 18 }}
              onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
            >
              ⚙ ADMIN DASHBOARD
            </button>
          )}
        </div>
      </nav>

      {/* TOAST ALERT */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#39ff14",
          color: "#000",
          padding: "10px 22px",
          borderRadius: "4px",
          fontWeight: 900,
          fontSize: "14px",
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "1px",
          boxShadow: "0 4px 20px rgba(57,255,20,0.4)",
          zIndex: 9999
        }}>
          {toast}
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="pdp-container">
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{ display: "inline-block", width: 44, height: 44, border: "3px solid #222", borderTopColor: "#39ff14", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }`}</style>
            <p style={{ marginTop: 16, color: "#888", letterSpacing: 2, fontSize: 13 }}>LOADING PRODUCT DETAILS...</p>
          </div>
        ) : notFound || !product ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ fontSize: 56 }}>🔍</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginTop: 12 }}>JERSEY NOT FOUND</h1>
            <p style={{ color: "#888", fontSize: 14, maxWidth: 440, margin: "10px auto 24px" }}>
              The jersey you are looking for does not exist or has been retired.
            </p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                background: "#39ff14",
                color: "#000",
                textDecoration: "none",
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
                padding: "12px 28px",
                borderRadius: 4
              }}
            >
              RETURN TO HOME
            </Link>
          </div>
        ) : (
          <>
            {/* BREADCRUMBS */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#777", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, flexWrap: "wrap" }}>
              <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>HOME</Link>
              <span>/</span>
              <Link to="/teams" style={{ color: "#aaa", textDecoration: "none" }}>TEAMS</Link>
              {team && (
                <>
                  <span>/</span>
                  <span style={{ color: "#39ff14" }}>{team.name}</span>
                </>
              )}
              <span>/</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{product.name}</span>
            </div>

            {/* PRODUCT HERO GRID */}
            <div className="pdp-grid">
              {/* LEFT: IMAGE GALLERY */}
              <div>
                <ProductGallery
                  imageUrl={product.image_url}
                  alt={product.name}
                  onImageClick={(photo) => setPreviewReviewPhoto(photo)}
                />
              </div>

              {/* RIGHT: BUYING ACTIONS & SPECS */}
              <div>
                {/* Version Badge & Stock */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{
                    background: isPlayerVersion ? "rgba(255, 68, 68, 0.15)" : "rgba(57, 255, 20, 0.12)",
                    border: isPlayerVersion ? "1px solid rgba(255, 68, 68, 0.4)" : "1px solid #39ff14",
                    color: isPlayerVersion ? "#ff4444" : "#39ff14",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 2,
                    padding: "4px 10px",
                    borderRadius: 3,
                    fontFamily: "'Barlow Condensed', sans-serif"
                  }}>
                    {product.type || (isPlayerVersion ? "PLAYER VERSION" : "FAN VERSION")}
                  </span>

                  {isOutOfStock ? (
                    <span style={{ background: "rgba(255, 0, 0, 0.2)", border: "1px solid #ff4444", color: "#ff4444", fontSize: 11, fontWeight: 900, padding: "4px 8px", borderRadius: 3, letterSpacing: 1 }}>
                      OUT OF STOCK
                    </span>
                  ) : (
                    <span style={{ background: "rgba(57, 255, 20, 0.15)", border: "1px solid #39ff14", color: "#39ff14", fontSize: 11, fontWeight: 900, padding: "4px 8px", borderRadius: 3, letterSpacing: 1 }}>
                      ✓ IN STOCK
                    </span>
                  )}

                  {product.featured && (
                    <span style={{ background: "rgba(255, 183, 0, 0.15)", border: "1px solid #ffb700", color: "#ffb700", fontSize: 11, fontWeight: 900, padding: "4px 8px", borderRadius: 3, letterSpacing: 1 }}>
                      ★ FEATURED
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, letterSpacing: 2, lineHeight: 1.1, margin: "0 0 12px 0", color: "#fff" }}>
                  {product.name}
                </h1>

                {/* Rating Snippet */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ color: "#ffb700", fontSize: 14 }}>
                    {"★".repeat(5)}
                  </div>
                  <a
                    href="#reviews-section"
                    style={{ color: "#888", fontSize: 12, letterSpacing: 1, textDecoration: "underline", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    ({jerseyReviews.length} Verified Customer Reviews)
                  </a>
                </div>

                {/* Price Display */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, fontWeight: 900, color: "#39ff14", letterSpacing: 2 }}>
                    ₹{product.price?.toLocaleString("en-IN")}
                  </span>
                  <span style={{ textDecoration: "line-through", color: "#555", fontSize: 20, fontFamily: "'Bebas Neue', sans-serif" }}>
                    ₹{Math.round(product.price * 1.45)?.toLocaleString("en-IN")}
                  </span>
                  <span style={{ background: "rgba(57, 255, 20, 0.15)", color: "#39ff14", border: "1px solid #39ff14", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>
                    SAVE 30%
                  </span>
                </div>

                {/* SIZE SELECTOR */}
                <div style={{ margin: "24px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#ddd" }}>
                      SELECT SIZE: <span style={{ color: "#39ff14" }}>{selectedSize}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      style={{
                        background: "transparent",
                        border: "1px dashed #444",
                        color: "#39ff14",
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 3,
                        cursor: "pointer",
                        letterSpacing: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = "#39ff14"}
                      onMouseOut={e => e.currentTarget.style.borderColor = "#444"}
                    >
                      📏 SIZE CHART
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                    {SIZES.map((s) => {
                      const stock = getSizeStock(product, s);
                      const isSelected = selectedSize === s;
                      const isOutOfStockSize = stock === 0;

                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isOutOfStockSize}
                          onClick={() => {
                            setSelectedSize(s);
                            setQuantity(1);
                          }}
                          style={{
                            position: "relative",
                            padding: "12px 4px",
                            textAlign: "center",
                            background: isSelected ? "#39ff14" : isOutOfStockSize ? "#0c0c0c" : "#111",
                            color: isSelected ? "#000" : isOutOfStockSize ? "#444" : "#fff",
                            border: isSelected ? "1px solid #39ff14" : isOutOfStockSize ? "1px solid #1a1a1a" : "1px solid #2a2a2a",
                            borderRadius: 4,
                            cursor: isOutOfStockSize ? "not-allowed" : "pointer",
                            fontWeight: 900,
                            fontSize: 15,
                            fontFamily: "'Barlow Condensed', sans-serif",
                            letterSpacing: 1,
                            transition: "all 0.15s"
                          }}
                        >
                          {s}
                          {isOutOfStockSize && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                              <div style={{ width: "80%", height: "1px", background: "#444", transform: "rotate(-30deg)" }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stock Warning */}
                  {selectedSizeStock > 0 && selectedSizeStock <= 5 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#ffb700", fontWeight: 700, letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      ⚡ Only {selectedSizeStock} left in stock for size {selectedSize}!
                    </div>
                  )}
                </div>

                {/* QUANTITY & ADD TO CART */}
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  {/* Quantity selector */}
                  <div style={{ display: "flex", alignItems: "center", background: "#111", border: "1px solid #282828", borderRadius: 4, overflow: "hidden" }}>
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{ width: 44, height: 52, background: "none", border: "none", color: quantity <= 1 ? "#444" : "#fff", fontSize: 20, cursor: quantity <= 1 ? "not-allowed" : "pointer", fontWeight: 900 }}
                    >
                      −
                    </button>
                    <span style={{ width: 40, textAlign: "center", fontWeight: 900, fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= selectedSizeStock || isOutOfStock}
                      onClick={() => setQuantity(q => Math.min(selectedSizeStock, q + 1))}
                      style={{ width: 44, height: 52, background: "none", border: "none", color: quantity >= selectedSizeStock ? "#444" : "#fff", fontSize: 20, cursor: quantity >= selectedSizeStock ? "not-allowed" : "pointer", fontWeight: 900 }}
                    >
                      +
                    </button>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    disabled={isOutOfStock || selectedSizeStock === 0}
                    onClick={handleAddToCart}
                    className="pdp-cta-btn"
                  >
                    {isOutOfStock || selectedSizeStock === 0 ? "OUT OF STOCK" : `ADD TO CART — ₹${(product.price * quantity).toLocaleString("en-IN")}`}
                  </button>
                </div>

                {/* Share Actions */}
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    style={{
                      flex: 1,
                      background: "#0c0c0c",
                      border: "1px solid #222",
                      color: "#25D366",
                      padding: "10px",
                      borderRadius: 4,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "#25D366"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "#222"}
                  >
                    <span>💬</span> SHARE ON WHATSAPP
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      flex: 1,
                      background: "#0c0c0c",
                      border: "1px solid #222",
                      color: "#aaa",
                      padding: "10px",
                      borderRadius: 4,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "#39ff14"; e.currentTarget.style.color = "#39ff14"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#aaa"; }}
                  >
                    <span>🔗</span> COPY PRODUCT LINK
                  </button>
                </div>

                {/* TRUST BADGES */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "#0a0a0a", border: "1px solid #161616", padding: 14, borderRadius: 4, marginBottom: 24 }}>
                  {[
                    { icon: "🚚", title: "Fast Delivery", desc: "4-7 business days across India" },
                    { icon: "💵", title: "Cash on Delivery", desc: "Pay at your doorstep" },
                    { icon: "🔄", title: "7-Day Exchange", desc: "Hassle-free size swaps" },
                    { icon: "🛡️", title: "Master Quality", desc: "Authentic Thailand Dry-Fit" },
                  ].map((badge, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 20 }}>{badge.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>{badge.title}</div>
                        <div style={{ fontSize: 10, color: "#777" }}>{badge.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PRODUCT SPECIFICATIONS */}
                <div style={{ background: "#090909", border: "1px solid #1c1c1c", borderRadius: 4, padding: 16 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#39ff14", marginBottom: 10 }}>
                    📋 PRODUCT SPECIFICATIONS & DETAILS
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#ccc", fontSize: 13, lineHeight: 1.8 }}>
                    <li><strong>Origin:</strong> Made in Thailand</li>
                    <li><strong>Fabric:</strong> Breathable, sweat-wicking Dry-Fit technology</li>
                    <li><strong>Crest / Logo:</strong> {isPlayerVersion ? "Heat-transferred 3D authentic rubber badge" : "High-density precision embroidered crest"}</li>
                    <li><strong>Includes:</strong> Matching Thailand shorts included in kit</li>
                  </ul>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #222", color: "#888", fontSize: 12, lineHeight: 1.6 }}>
                    {product.description || (isPlayerVersion
                      ? "Authentic Match / Player Edition jersey engineered with Thailand superior ultra-lightweight Dry-Fit performance fabric, heat-transferred authentic rubberised 3D club crests, and precision athletic slim-fit tailoring as worn on pitch by professional players."
                      : "Premium Fan Edition football jersey imported from Thailand. Features breathable Dry-Fit fabric technology for maximum comfort, high-density embroidered club logos, and comes complete with matching shorts included.")}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CUSTOMER REVIEWS SECTION ── */}
            <div id="reviews-section" style={{ marginTop: 60, borderTop: "1px solid #181818", paddingTop: 40 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: 28, letterSpacing: 2, margin: 0, color: "#fff" }}>
                    CUSTOMER REVIEWS ({jerseyReviews.length})
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, color: "#39ff14", fontSize: 13, fontWeight: 700 }}>
                    <span>⭐⭐⭐⭐⭐</span>
                    <span>(5.0 / 5.0 Rating • 100% Verified Customers)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWriteReviewForm(o => !o)}
                  style={{
                    background: showWriteReviewForm ? "rgba(255, 68, 68, 0.15)" : "rgba(57, 255, 20, 0.12)",
                    border: showWriteReviewForm ? "1px solid rgba(255, 68, 68, 0.4)" : "1px solid #39ff14",
                    color: showWriteReviewForm ? "#ff4444" : "#39ff14",
                    padding: "8px 18px",
                    borderRadius: "4px",
                    fontWeight: 800,
                    fontSize: "13px",
                    letterSpacing: "1px",
                    cursor: "pointer",
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
                  style={{ background: "#0c0c0c", border: "1px solid #39ff14", borderRadius: 6, padding: 20, marginBottom: 28, boxShadow: "0 0 24px rgba(57,255,20,0.15)" }}
                >
                  <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1, color: "#fff", marginBottom: 14 }}>
                    ✍️ WRITE & POST A REVIEW
                  </div>

                  {/* Rating Stars */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, color: "#aaa", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>
                      YOUR RATING:
                    </label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: 24,
                            cursor: "pointer",
                            color: star <= newReviewRating ? "#ffb700" : "#444",
                            padding: 0,
                            transition: "transform 0.1s"
                          }}
                        >
                          ★
                        </button>
                      ))}
                      <span style={{ marginLeft: 8, fontSize: 13, color: "#aaa", fontWeight: 700 }}>
                        ({newReviewRating} / 5 Stars)
                      </span>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, color: "#aaa", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>
                      YOUR NAME / NICKNAME:
                    </label>
                    <input
                      type="text"
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      placeholder="e.g. Rahul S. (or leave empty for 'Customer')"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#161616",
                        border: "1px solid #333",
                        color: "#fff",
                        borderRadius: 4,
                        fontSize: 14,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Comments textarea */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, color: "#aaa", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>
                      YOUR REVIEW / FEEDBACK:
                    </label>
                    <textarea
                      rows={3}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Share details about jersey quality, fabric, printing, sizing fit..."
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#161616",
                        border: "1px solid #333",
                        color: "#fff",
                        borderRadius: 4,
                        fontSize: 14,
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  {/* Photos Upload */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 12, color: "#aaa", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>
                      ADD PHOTOS (OPTIONAL):
                    </label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <label style={{
                        background: "#1a1a1a",
                        border: "1px dashed #39ff14",
                        color: "#39ff14",
                        padding: "8px 14px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <span>📷</span> {uploadingReviewPhoto ? "UPLOADING..." : "UPLOAD PHOTO"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingReviewPhoto}
                          onChange={handleReviewPhotoUpload}
                          style={{ display: "none" }}
                        />
                      </label>

                      {newReviewPhotos.map((url, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <img src={url} alt="Review upload" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 4, border: "1px solid #39ff14" }} />
                          <button
                            type="button"
                            onClick={() => setNewReviewPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ position: "absolute", top: -6, right: -6, background: "#ff4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {reviewSubmitError && <div style={{ color: "#ff4444", fontSize: 12, marginBottom: 10 }}>{reviewSubmitError}</div>}
                  {reviewSubmitSuccess && <div style={{ color: "#39ff14", fontSize: 12, marginBottom: 10 }}>{reviewSubmitSuccess}</div>}

                  <button
                    type="submit"
                    disabled={submittingCustomerReview}
                    style={{
                      background: "#39ff14",
                      color: "#000",
                      border: "none",
                      padding: "10px 24px",
                      fontWeight: 900,
                      fontSize: 14,
                      letterSpacing: 1.5,
                      borderRadius: 4,
                      cursor: submittingCustomerReview ? "not-allowed" : "pointer"
                    }}
                  >
                    {submittingCustomerReview ? "SUBMITTING..." : "POST REVIEW →"}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              {loadingReviews ? (
                <div style={{ color: "#666", padding: "20px 0", textAlign: "center" }}>Loading customer reviews...</div>
              ) : jerseyReviews.length === 0 ? (
                <div style={{ background: "#0a0a0a", border: "1px dashed #222", padding: "32px 20px", textAlign: "center", borderRadius: 4 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>💬</div>
                  <div style={{ color: "#ccc", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>Be the first to review this premium jersey</div>
                  <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>Verified customer reviews will appear here.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                  {jerseyReviews.map((rev) => (
                    <div key={rev.id} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "16px", borderRadius: 4, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{rev.reviewer_name}</span>
                            <span style={{ background: "rgba(57, 255, 20, 0.12)", border: "1px solid rgba(57, 255, 20, 0.25)", color: "#39ff14", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 3 }}>
                              ✓ VERIFIED
                            </span>
                          </div>
                          <span style={{ color: "#ffb700", fontSize: 12 }}>
                            {"★".repeat(rev.rating || 5)}{"☆".repeat(5 - (rev.rating || 5))}
                          </span>
                        </div>

                        <p style={{ color: "#b8b8b8", fontSize: 13, lineHeight: 1.5, margin: "6px 0 12px 0" }}>
                          {rev.comment}
                        </p>

                        {Array.isArray(rev.photos) && rev.photos.length > 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                            {rev.photos.map((photo, pIdx) => (
                              <img
                                key={pIdx}
                                src={photo}
                                alt={`Customer attachment ${pIdx + 1}`}
                                onClick={() => setPreviewReviewPhoto(photo)}
                                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 4, border: "1px solid #282828", cursor: "pointer" }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", marginTop: 10 }}>
                        <span style={{ color: "#555", fontSize: 11 }}>
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recently verified"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── "YOU MAY ALSO LIKE" (RELATABLE JERSEYS OF THAT TEAM) ── */}
            <div style={{ marginTop: 64, borderTop: "2px solid #1a1a1a", paddingTop: 40 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: "#39ff14", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>
                    RECOMMENDED OFFICIAL KITS
                  </div>
                  <h2 style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: "clamp(26px, 4vw, 36px)", letterSpacing: 2, margin: "2px 0 0 0", color: "#fff" }}>
                    YOU MAY ALSO LIKE
                  </h2>
                  <p style={{ color: "#777", fontSize: 13, margin: "4px 0 0 0" }}>
                    More official kits & editions from {team?.name || "this collection"}
                  </p>
                </div>

                {team && (
                  <Link
                    to={`/teams/${slug}`}
                    style={{ color: "#39ff14", textDecoration: "none", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    VIEW ALL {team.name} JERSEYS →
                  </Link>
                )}
              </div>

              {relatableJerseys.length === 0 ? (
                <div style={{ background: "#0a0a0a", border: "1px solid #161616", padding: "30px", textAlign: "center", borderRadius: 4, color: "#666" }}>
                  More jerseys coming soon for this squad!
                </div>
              ) : (
                <div className="pdp-relatable-grid">
                  {relatableJerseys.map((rel) => {
                    const relSlug = generateProductSlug(rel.name);
                    const relImg = getFirstImage(rel.image_url);
                    const relIsPlayer = rel.name.toUpperCase().includes("PLAYER") || rel.type?.toUpperCase().includes("PLAYER");

                    return (
                      <div
                        key={rel.id}
                        className="pdp-card"
                        onClick={() => navigate(`/product/${relSlug}`)}
                      >
                        {/* Image Wrap */}
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#0f0f0f", overflow: "hidden" }}>
                          <img
                            src={relImg}
                            alt={rel.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.8)", border: relIsPlayer ? "1px solid #ff4444" : "1px solid #39ff14", color: relIsPlayer ? "#ff4444" : "#39ff14", fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 2, letterSpacing: 1 }}>
                            {rel.type || (relIsPlayer ? "PLAYER" : "FAN")}
                          </div>
                          {rel.stock === 0 && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff4444", fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>
                              OUT OF STOCK
                            </div>
                          )}
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: "12px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
                              {rel.name}
                            </div>
                            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "#39ff14", letterSpacing: 1 }}>
                              ₹{rel.price?.toLocaleString("en-IN")}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${relSlug}`);
                            }}
                            style={{
                              marginTop: 10,
                              background: "transparent",
                              border: "1px solid #39ff14",
                              color: "#39ff14",
                              padding: "6px",
                              borderRadius: 3,
                              fontWeight: 900,
                              fontSize: 11,
                              fontFamily: "'Barlow Condensed', sans-serif",
                              letterSpacing: 1,
                              cursor: "pointer",
                              transition: "background 0.2s, color 0.2s"
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = "#39ff14"; e.currentTarget.style.color = "#000"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#39ff14"; }}
                          >
                            VIEW JERSEY →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEO STRUCTURED DATA */}
            <ProductSEO jersey={product} reviews={jerseyReviews} />
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#040404", borderTop: "1px solid #141414", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: 5, marginBottom: 8, fontFamily: "'Bebas Neue',sans-serif" }}>
          JERSEY<span style={{ color: "#39ff14" }}>VAULT</span>
        </div>
        <p style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
          {[["HOME", "/"], ["SHOP", "/#shop"], ["TEAMS", "/teams"], ["TRACK", "/tracking"], ["PRIVACY", "/privacy"], ["TERMS", "/terms"], ["CONTACT", "/contact"], ["FAQ", "/faq"]].map(([l, h]) => (
            <Link
              key={l}
              to={h}
              style={{ color: "#555", fontSize: 12, letterSpacing: 2, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#39ff14"}
              onMouseLeave={e => e.target.style.color = "#555"}
            >
              {l}
            </Link>
          ))}
        </div>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="cart-overlay">
          <button type="button" className="cart-backdrop" onClick={() => setCartOpen(false)} aria-label="Close cart" />
          <div className="cart-panel">
            {/* Header */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2 }}>
                SHOPPING CART ({cartCount})
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                style={{ background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer", padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#666" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: 1 }}>YOUR CART IS EMPTY</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${idx}`} style={{ display: "flex", gap: 12, background: "#0e0e0e", border: "1px solid #181818", padding: 10, borderRadius: 4 }}>
                      <img src={item.image_url} alt={item.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 3 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "#39ff14", marginTop: 4, letterSpacing: 1 }}>SIZE: {item.size} • ₹{item.price}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <span style={{ fontSize: 11, color: "#888" }}>QTY: {item.qty}</span>
                          <button
                            type="button"
                            onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: "none", border: "none", color: "#ff4444", fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ padding: "18px 20px", borderTop: "1px solid #1a1a1a", background: "#0c0c0c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: 1, color: "#aaa" }}>SUBTOTAL:</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#39ff14", letterSpacing: 1 }}>
                    ₹{cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setCartOpen(false); navigate("/checkout"); }}
                  style={{
                    width: "100%",
                    background: "#39ff14",
                    color: "#000",
                    border: "none",
                    padding: "14px",
                    fontWeight: 900,
                    fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
                    fontSize: 20,
                    letterSpacing: 2,
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  PROCEED TO CHECKOUT →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIZE CHART MODAL POPUP */}
      {showSizeChart && (
        <div className="pdp-modal-bg">
          <button type="button" className="pdp-modal-dim" aria-label="Close size chart" onClick={() => setShowSizeChart(false)} />
          <div className="pdp-modal" style={{ maxWidth: "520px", border: "1px solid #39ff14" }}>
            <button type="button" className="pdp-modal-close" onClick={() => setShowSizeChart(false)}>✕</button>
            <div style={{ background: "#39ff14", color: "#000", padding: "14px 20px", textAlign: "center", fontWeight: "900", fontSize: "24px", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "3px" }}>
              SIZE CHART
            </div>
            <div style={{ padding: "24px 20px 16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", textAlign: "center", border: "1px solid #222" }}>
                <thead>
                  <tr style={{ background: "#111", borderBottom: "2px solid #39ff14" }}>
                    <th style={{ padding: "12px 8px", border: "1px solid #222" }}>SIZE</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #222", color: "#ccc" }}>
                      CHEST <span style={{ color: "#39ff14", fontSize: 11, display: "block" }}>(FAN VERSION) (in.")</span>
                    </th>
                    <th style={{ padding: "12px 8px", border: "1px solid #222", color: "#ccc" }}>
                      CHEST <span style={{ color: "#39ff14", fontSize: 11, display: "block" }}>(PLAYER VERSION) (in.")</span>
                    </th>
                    <th style={{ padding: "12px 8px", border: "1px solid #222", color: "#ccc" }}>
                      LENGTH <span style={{ color: "#aaa", fontSize: 11, display: "block" }}>(in.")</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: "S", fan: "38", player: "36", len: "27" },
                    { size: "M", fan: "40", player: "38", len: "28" },
                    { size: "L", fan: "42", player: "40", len: "29" },
                    { size: "XL", fan: "44", player: "42", len: "30" },
                    { size: "XXL", fan: "46", player: "44", len: "31" },
                  ].map((row, idx) => (
                    <tr key={row.size} style={{ background: idx % 2 === 0 ? "#070707" : "#0c0c0c" }}>
                      <td style={{ padding: "12px 8px", fontWeight: "900", color: "#39ff14", fontSize: "16px", border: "1px solid #222" }}>{row.size}</td>
                      <td style={{ padding: "12px 8px", fontWeight: "700", border: "1px solid #222" }}>{row.fan}</td>
                      <td style={{ padding: "12px 8px", fontWeight: "700", border: "1px solid #222" }}>{row.player}</td>
                      <td style={{ padding: "12px 8px", fontWeight: "700", border: "1px solid #222" }}>{row.len}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 16, padding: 12, background: "#111", border: "1px solid #1e1e1e", borderRadius: 2, fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>
                <strong style={{ color: "#39ff14" }}>Fit Tip:</strong> Fan version jerseys offer a regular, comfortable fit. Player version jerseys have a tighter athletic fit; if you prefer extra room, choose one size up.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR REVIEW PHOTOS */}
      {previewReviewPhoto && (
        <div className="pdp-modal-bg" style={{ zIndex: 2200 }}>
          <button type="button" className="pdp-modal-dim" onClick={() => setPreviewReviewPhoto(null)} aria-label="Close photo preview" />
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", margin: "auto", background: "#000", border: "1px solid #39ff14", padding: 8, zIndex: 2201 }}>
            <button
              type="button"
              style={{ position: "absolute", top: 12, right: 12, background: "#39ff14", color: "#000", border: "none", width: 32, height: 32, fontWeight: 900, cursor: "pointer", zIndex: 10 }}
              onClick={() => setPreviewReviewPhoto(null)}
            >
              ✕
            </button>
            <img src={previewReviewPhoto} alt="Customer review preview" style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", objectFit: "contain", margin: "0 auto" }} />
          </div>
        </div>
      )}
    </div>
  );
}
