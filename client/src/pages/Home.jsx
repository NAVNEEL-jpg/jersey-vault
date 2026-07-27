import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import jordanlogo from "../assets/brands/jordan.png";
import nikelogo from "../assets/brands/nike.png";
import adidaslogo from "../assets/brands/adidas.png";
import pumalogo from "../assets/brands/puma.png";
import nblogo from "../assets/brands/newbalance.png";
import umbrologo from "../assets/brands/umbro.png";
import kappalogo from "../assets/brands/kappa.png";
import macronlogo from "../assets/brands/macron.png";
import hummellogo from "../assets/brands/hummel.png";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from '../supabase';
import ReactGA from "react-ga4";
import heroBg from "../assets/hero-bg.jpeg";
import BrandLogo from "../components/BrandLogo";
import AnnouncementPopup from "../components/AnnouncementPopup";
import wc26Bg from "../assets/WC26.jpeg";
import wc26Video from "../assets/WC26(1).mp4";
import { getProductImages, getFirstImage } from "../utils/imageHelpers";
import { fetchProductReviews, addProductReview, uploadReviewImage } from "../utils/reviews";

const ProductCarousel = memo(function ProductCarousel({ imageUrl, alt, style, className, onClick, arrowSize = "24px" }) {
  const images = getProductImages(imageUrl);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0d", fontSize: 56 }} className={className} onClick={onClick}>
        👕
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        className={className}
        draggable="false"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          transform: "scale(1.08)",
          transformOrigin: "center center",
          display: "block",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitUserDrag: "none",
          pointerEvents: "none",
          ...style
        }}
        onClick={onClick}
      />
    );
  }

  const handleDotClick = (e, index) => {
    e.stopPropagation();
    setActiveIndex(index);
    const container = e.currentTarget.parentElement.previousSibling;
    if (container) {
      const width = container.offsetWidth;
      container.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
    }
  };

  const handleArrowClick = (e, dir) => {
    e.stopPropagation();
    const container = e.currentTarget.parentElement.querySelector('.image-slider-container');
    if (container) {
      const width = container.offsetWidth;
      const totalScroll = container.scrollWidth;
      let newLeft = container.scrollLeft + dir * width;
      if (newLeft < 0) {
        newLeft = totalScroll - width;
      } else if (newLeft >= totalScroll) {
        newLeft = 0;
      }
      container.scrollTo({
        left: newLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e) => {
    const container = e.currentTarget;
    const width = container.offsetWidth;
    if (width > 0) {
      const newIndex = Math.round(container.scrollLeft / width);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    }
  };

  return (
    <div className="product-carousel-wrapper" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", userSelect: "none", ...style }}>
      <div 
        className="image-slider-container"
        onScroll={handleScroll}
        onClick={onClick}
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          touchAction: "pan-x",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          cursor: onClick ? "pointer" : "default"
        }}
      >
        {images.map((img, idx) => (
          <div 
            key={idx}
            className="image-slider-item"
            style={{
              flex: "0 0 100%",
              width: "100%",
              height: "100%",
              scrollSnapAlign: "start",
              userSelect: "none",
              WebkitUserSelect: "none"
            }}
          >
            <img 
              src={img} 
              alt={`${alt} - ${idx + 1}`} 
              className={className}
              draggable="false"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                transform: "scale(1.08)",
                transformOrigin: "center center",
                display: "block",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitUserDrag: "none",
                pointerEvents: "none"
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>

      {activeIndex > 0 && (
        <button
          type="button"
          className="carousel-arrow carousel-arrow-left"
          onClick={(e) => handleArrowClick(e, -1)}
          style={{
            position: "absolute",
            top: "50%",
            left: "8px",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "#39ff14",
            textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            fontSize: "var(--arrow-fs, 20px)",
            fontWeight: "bold",
            opacity: 0.5,
            transition: "opacity 0.2s ease, transform 0.2s, color 0.2s",
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1.2)";
            e.currentTarget.style.color = "#00ff33";
            e.currentTarget.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            e.currentTarget.style.color = "#39ff14";
            e.currentTarget.style.opacity = 0.5;
          }}
        >
          ◀
        </button>
      )}
      {activeIndex < images.length - 1 && (
        <button
          type="button"
          className="carousel-arrow carousel-arrow-right"
          onClick={(e) => handleArrowClick(e, 1)}
          style={{
            position: "absolute",
            top: "50%",
            right: "8px",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "#39ff14",
            textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            fontSize: "var(--arrow-fs, 20px)",
            fontWeight: "bold",
            opacity: 0.5,
            transition: "opacity 0.2s ease, transform 0.2s, color 0.2s",
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1.2)";
            e.currentTarget.style.color = "#00ff33";
            e.currentTarget.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            e.currentTarget.style.color = "#39ff14";
            e.currentTarget.style.opacity = 0.5;
          }}
        >
          ▶
        </button>
      )}

      <div 
        className="carousel-dots"
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "6px",
          zIndex: 2,
          padding: "4px 8px",
          background: "rgba(0,0,0,0.4)",
          borderRadius: "10px"
        }}
      >
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => handleDotClick(e, idx)}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: activeIndex === idx ? "#39ff14" : "rgba(255,255,255,0.4)",
              transition: "background 0.2s, transform 0.2s",
              transform: activeIndex === idx ? "scale(1.2)" : "scale(1)"
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
});


const CartoonFlameText = memo(function CartoonFlameText({ text, fontSize }) {
  const clipId = `jv-flame-${text.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const sizeStyle = fontSize ? { fontSize } : {};
  return (
    <div className="flame-text-wrap">
      <Helmet><link rel="canonical" href="https://www.thejerseyvault.in/" /></Helmet>
      <span className="flame-text-main" style={sizeStyle}>
        {text}
      </span>
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <text x="0" y="90%" fontSize={fontSize || "clamp(40px,8vw,100px)"} fontWeight="900" fontStyle="italic" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="-2">{text}</text>
          </clipPath>
          <linearGradient id={`${clipId}-g1`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFE000" /><stop offset="22%" stopColor="#FF8C00" />
            <stop offset="48%" stopColor="#E8000A" /><stop offset="78%" stopColor="#B20000" />
            <stop offset="100%" stopColor="#3a0000" />
          </linearGradient>
          <linearGradient id={`${clipId}-g2`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFF176" /><stop offset="18%" stopColor="#FFB300" />
            <stop offset="45%" stopColor="#FF3D00" /><stop offset="75%" stopColor="#C62828" />
            <stop offset="100%" stopColor="#4a0000" />
          </linearGradient>
          <filter id={`${clipId}-wobble`} x="-20%" y="-40%" width="140%" height="180%">
            <feTurbulence type="turbulence" baseFrequency="0.025 0.06" numOctaves="3" seed="2" result="noise">
              <animate attributeName="baseFrequency" values="0.025 0.06; 0.03 0.08; 0.022 0.055; 0.025 0.06" dur="0.9s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g clipPath={`url(#${clipId})`} filter={`url(#${clipId}-wobble)`}>
          <rect x="-5%" y="-80%" width="110%" height="200%" fill={`url(#${clipId}-g1)`}>
            <animateTransform attributeName="transform" type="translate" values="0,0; 2,-6; -3,-10; 1,-5; 0,0" dur="0.55s" repeatCount="indefinite" />
          </rect>
          <rect x="-5%" y="-60%" width="110%" height="180%" fill={`url(#${clipId}-g2)`} opacity="0.65">
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
    <div style={{ background: "#39ff14", color: "#000", padding: "11px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-flex", animation: "marquee 18s linear infinite" }}>
        {[...Array(2)].map((_, i) => (
          <span key={i} style={{ display: "inline-flex" }}>
            {["FREE SHIPPING ABOVE ₹1099", "AUTHENTIC LICENSED JERSEYS", "EASY 30-DAY RETURNS", "COD AVAILABLE", "SIZES XS TO XXL"].map(t => (
              <span key={t} style={{ fontWeight: 900, letterSpacing: 3, fontSize: 16, padding: "0 40px" }}>★ {t}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
});

const BrandLogos = memo(function BrandLogos() {
  const brands = [
    nikelogo, adidaslogo, pumalogo, nblogo,
    umbrologo, kappalogo, macronlogo, hummellogo, jordanlogo
  ];
  return (
    <div style={{ background: "#070707", borderTop: "1px solid #111", borderBottom: "1px solid #111", padding: "12px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-flex", alignItems: "center", animation: "marquee 26s linear infinite" }}>
        {[...Array(2)].map((_, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
            {brands.map((src, idx) => (
              <span key={idx} style={{ display: "inline-flex", alignItems: "center", padding: "0 40px", opacity: 0.8, transition: "opacity 0.3s", cursor: "default" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.8"}
              >
                <img
                  src={src}
                  alt=""
                  style={{ height: 44, width: "auto", objectFit: "contain", filter: "invert(1)" }}
                />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
});

// FIX: Extracted NavLinks as a proper component instead of memoized JSX
function NavLinks({ user, isAdmin, handleLogout, scrollToShop, navigate, setMobileMenuOpen, setCartOpen }) {
  return (
    <>
      <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>HOME</Link>
      <button type="button" className="nav-link" onClick={scrollToShop}>SHOP</button>
      <Link to="/teams" className="nav-link" onClick={() => setMobileMenuOpen(false)}>TEAMS</Link>
      <Link to="/reviews" className="nav-link" onClick={() => setMobileMenuOpen(false)}>REVIEWS</Link>
      <Link to="/tracking" className="nav-link" onClick={() => setMobileMenuOpen(false)}>TRACK</Link>
      <button type="button" className="nav-link" onClick={() => { ReactGA.event("view_cart", { currency: "INR" }); setCartOpen(true); setMobileMenuOpen(false); }}>CART</button>
      <Link to="/myorders" className="nav-link" onClick={() => setMobileMenuOpen(false)}>MY ORDERS</Link>
      {user ? (
        <button type="button" className="nav-link" onClick={handleLogout}>LOGOUT</button>
      ) : (
        <Link to="/auth" className="nav-link" onClick={() => setMobileMenuOpen(false)}>LOGIN</Link>
      )}
      {isAdmin && (
        <button type="button" className="nav-link" style={{ color: "#39ff14" }} onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}><span>⚙</span><span>ADMIN</span></button>
      )}
    </>
  );
}

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const filterButtons = [
  { key: "ALL", label: "ALL" },
  { key: "FAN VERSION", label: "FAN VERSION" },
  { key: "PLAYER VERSION", label: "PLAYER VERSION" },
  { key: "26/27 KITS", label: "26/27 KITS" },
  { key: "CLEARANCE SALE", label: "CLEARANCE SALE 🔥" },
  { key: "RETRO", label: "RETRO" },
];

export default function JerseyStore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [modalQty, setModalQty] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [jerseyReviews, setJerseyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [previewReviewPhoto, setPreviewReviewPhoto] = useState(null);

  const [showWriteReviewForm, setShowWriteReviewForm] = useState(false);
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewPhotos, setNewReviewPhotos] = useState([]);
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const [submittingCustomerReview, setSubmittingCustomerReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState("");
  const [reviewSubmitError, setReviewSubmitError] = useState("");

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
      setReviewSubmitSuccess("✓ Thank you! Your review with photo(s) has been posted successfully.");
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
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(() => {
    try { return sessionStorage.getItem("jv_visited") === "1"; }
    catch { return false; }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTeamName, setActiveTeamName] = useState("");
  const [featuredCategoryName, setFeaturedCategoryName] = useState("FEATURED");

  const [teamsList, setTeamsList] = useState([]);
  const [sortBy, setSortBy] = useState("FEATURED");
  const [sortOpen, setSortOpen] = useState(false);
  const [menuCategoriesOpen, setMenuCategoriesOpen] = useState(false);
  const [menuTeamsOpen, setMenuTeamsOpen] = useState(false);
  const [menuSortOpen, setMenuSortOpen] = useState(false);
  const [showFilterScrollHint, setShowFilterScrollHint] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, sortBy, searchQuery, activeTeamName]);


  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "featured_category_name").single()
      .then(({ data }) => { if (data && data.value) setFeaturedCategoryName(data.value); })
      .catch(() => { setFeaturedCategoryName("FEATURED"); });

    supabase.from("teams").select("*").order("name", { ascending: true })
      .then(({ data, error }) => { if (!error && data) setTeamsList(data); });
  }, []);

  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener('open-cart', handleOpenCart);

    const params = new URLSearchParams(window.location.search);
    if (params.get('openCart') === 'true') {
      setCartOpen(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, []);

 useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delayFn = setTimeout(() => {
        ReactGA.event("search", { search_term: searchQuery.trim() });
      }, 1000);
      return () => {
        clearTimeout(delayFn);
      };
    }
  }, [searchQuery]);

  useEffect(() => {
    const teamId = searchParams.get("team");
    if (teamId && activeTeamName) {
      ReactGA.event("view_team", { team_id: teamId, team_name: activeTeamName });
    }
  }, [searchParams, activeTeamName]);

  // FIX: showToast wrapped in useCallback so it's stable across renders
  const showToast = useCallback((msg, options = {}) => {
    const text = typeof msg === "string" ? msg : (msg?.text || msg?.message || "");
    const isCart = options.isCart ?? (typeof msg === "object" && msg?.isCart !== undefined ? msg.isCart : true);
    setToast({ text, isCart });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e) => {
      if (!e.target.closest(".sort-dropdown-wrap")) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [sortOpen]);

  // Lock background page scrolling when product modal, cart, lightbox, size chart, or mobile menu is active
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedJersey || cartOpen || previewReviewPhoto || showSizeChart || mobileMenuOpen);
    if (isAnyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      return () => {
        const savedScrollY = Math.abs(parseInt(document.body.style.top || "0", 10));
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        if (savedScrollY) {
          window.scrollTo(0, savedScrollY);
        }
      };
    }
  }, [selectedJersey, cartOpen, previewReviewPhoto, showSizeChart, mobileMenuOpen]);

  const openQuickView = useCallback((jersey) => {
    setSelectedJersey(jersey);
    setSelectedSize("M");
    setModalQty(1);
    if (jersey && jersey.id) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("product", jersey.id);
        window.history.replaceState({}, "", url.toString());
      } catch (_) {}
    }
    ReactGA.event("view_item", {
      currency: "INR",
      value: jersey.price,
      items: [{
        item_id: jersey.id,
        item_name: jersey.name,
        price: jersey.price,
        item_category: jersey.type
      }]
    });
  }, []);

  const closeQuickView = useCallback(() => {
    setSelectedJersey(null);
    setShowSizeChart(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("product");
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.toString());
    } catch (_) {}
  }, []);

  const handleCopyShareLink = useCallback((jersey, e) => {
    if (e) e.stopPropagation();
    if (!jersey) return;
    const shareUrl = `${window.location.origin}/?product=${jersey.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("✓ Product share link copied to clipboard!", { isCart: false });
      }).catch(() => {
        fallbackCopyText(shareUrl);
      });
    } else {
      fallbackCopyText(shareUrl);
    }
    function fallbackCopyText(text) {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast("✓ Product share link copied to clipboard!", { isCart: false });
    }
  }, [showToast]);

  const handleShareWhatsApp = useCallback((jersey, e) => {
    if (e) e.stopPropagation();
    if (!jersey) return;
    const shareUrl = `${window.location.origin}/?product=${jersey.id}`;
    const text = `🔥 Check out the ${jersey.name} on Jersey Vault for ₹${jersey.price}!\n\nDirect Link: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, []);

  // Cart validation runs only when searchParams changes (i.e. when products load).
  useEffect(() => {
    let cancelled = false;
    let scrollTimer;

    const teamId = searchParams.get("team");
    if (teamId) {
      supabase.from("teams").select("name").eq("id", teamId).single()
        .then(({ data }) => { if (!cancelled && data) setActiveTeamName(data.name); });
    } else {
      setActiveTeamName("");
    }

    let query = supabase.from("products").select("*").eq("status", "active");
    if (teamId) query = query.eq("team_id", teamId);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data) {
        setJerseys(data);

        // Auto open product modal if product ID in URL
        const targetId = searchParams.get("product") || searchParams.get("id");
        if (targetId) {
          const found = data.find(p => String(p.id) === String(targetId));
          if (found) {
            setSelectedJersey(found);
            setSelectedSize("M");
            setModalQty(1);
          }
        }

        if (teamId) {
          scrollTimer = setTimeout(() => {
            document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
        const validIds = new Set(data.map(p => p.id));
        setCart(prevCart => {
          const filteredCart = prevCart.filter(item => validIds.has(item.id));
          if (filteredCart.length !== prevCart.length) {
            sessionStorage.setItem("cart", JSON.stringify(filteredCart));
            showToast("Some unavailable items were removed from your cart.");
            return filteredCart;
          }
          return prevCart;
        });
      }
      setLoadingProducts(false);
    });

    return () => {
      cancelled = true;
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [searchParams, showToast]);

  useEffect(() => {
    const catParam = searchParams.get("cat") || searchParams.get("filter");
    if (catParam) {
      setActiveFilter(catParam.toUpperCase());
      setTimeout(() => {
        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    const sortParam = searchParams.get("sort");
    if (sortParam) {
      setSortBy(sortParam.toUpperCase());
      setTimeout(() => {
        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    if (searchParams.get("featured") === "true") {
      setActiveFilter("FEATURED");
      setTimeout(() => {
        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    try { sessionStorage.setItem("jv_visited", "1"); } catch { }
  }, []);

  // This effect is intentionally run once on mount to trigger the hero fade-in.
  // heroVisible is read only to skip the timer if already visited (set in useState initializer).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!heroVisible) {
      const t = setTimeout(() => setHeroVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, []);

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
    } catch { }
  }, [cart]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filtered = useMemo(() => {
    let list = jerseys.filter(j => {
      const matchesSearch =
        (j.name || "").toLowerCase().includes(searchQuery.trim().toLowerCase());

      const matchesFilter =
        activeFilter === "ALL" || 
        (activeFilter === "FEATURED"
          ? j.featured === true 
          : activeFilter === "26/27 KITS"
            ? (j.is_26_27 === true || (j.type === "26/27 KITS" && j.is_26_27 !== false))
            : activeFilter === "CLEARANCE SALE"
              ? (j.is_clearance === true || (j.type === "CLEARANCE SALE" && j.is_clearance !== false))
              : j.type === activeFilter);

      return matchesSearch && matchesFilter;
    });

    if (sortBy === "PRICE_LOW_HIGH") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "PRICE_HIGH_LOW") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "NAME_ASC") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "NEWEST") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list;
  }, [jerseys, searchQuery, activeFilter, sortBy]);

  const ITEMS_PER_PAGE = isMobile ? 10 : 12;
  const totalPages = useMemo(() => Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1, [filtered.length, ITEMS_PER_PAGE]);
  const validCurrentPage = useMemo(() => Math.min(Math.max(currentPage, 1), totalPages), [currentPage, totalPages]);
  const paginatedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, validCurrentPage, ITEMS_PER_PAGE]);


  const addToCart = useCallback((jersey, size, quantity = 1) => {
    const qtyToAdd = Math.max(1, Number(quantity) || 1);
    ReactGA.event("add_to_cart", {
      currency: "INR",
      value: jersey.price * qtyToAdd,
      items: [{
        item_id: jersey.id,
        item_name: jersey.name,
        price: jersey.price,
        item_variant: size,
        item_category: jersey.type,
        quantity: qtyToAdd
      }]
    });
    setCart(prev => {
      const existing = prev.find(i => i.id === jersey.id && i.size === size);
      if (existing) return prev.map(i => i.id === jersey.id && i.size === size ? { ...i, qty: i.qty + qtyToAdd } : i);
      return [...prev, { ...jersey, size, qty: qtyToAdd }];
    });
    showToast(`${jersey.name} (${size} × ${qtyToAdd}) added to cart!`);
    setSelectedJersey(null);
  }, [showToast]);

  const removeFromCart = useCallback((id, size) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.size === size)));
  }, []);

  const updateCartQty = useCallback((id, size, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id && item.size === size) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          const maxStock = item.size_stock && typeof item.size_stock === "object" && item.size_stock[size] !== undefined
            ? item.size_stock[size]
            : (item.stock ?? 99);
          if (delta > 0 && maxStock !== undefined && newQty > maxStock) {
            showToast(`Only ${maxStock} in stock for size ${size}`);
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  }, [showToast]);



  // FIX: getSizeStock wrapped in useCallback for stability
  const getSizeStock = useCallback((jersey, size) => {
    if (!jersey?.size_stock || typeof jersey.size_stock !== "object") return 0;
    return jersey.size_stock[size] ?? 0;
  }, []);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const handleSelectSearchJersey = useCallback((jerseyName) => {
    if (jerseyName !== undefined) {
      setSearchQuery(jerseyName);
    }
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const shop = document.getElementById('shop');
      if (shop) {
        const y = shop.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150);
  }, []);

  const sectionTitle = useMemo(() => {
    if (activeTeamName) {
      return `${activeTeamName.toUpperCase()} JERSEYS`;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      // 1. Direct team name match in teamsList
      const teamByQuery = teamsList.find(t =>
        t.name && (
          t.name.toLowerCase() === q ||
          q.includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(q)
        )
      );
      if (teamByQuery) {
        return `${teamByQuery.name.toUpperCase()} JERSEYS`;
      }
      // 2. Team match via top filtered jersey's team_id
      if (filtered.length > 0) {
        const topJ = filtered[0];
        if (topJ.team_id) {
          const teamByJerseyId = teamsList.find(t => String(t.id) === String(topJ.team_id));
          if (teamByJerseyId) {
            return `${teamByJerseyId.name.toUpperCase()} JERSEYS`;
          }
        }
        // 3. Team match via jersey name
        const teamByJerseyName = teamsList.find(t =>
          t.name && (topJ.name || "").toLowerCase().includes(t.name.toLowerCase())
        );
        if (teamByJerseyName) {
          return `${teamByJerseyName.name.toUpperCase()} JERSEYS`;
        }
      }
      return `SEARCH: "${searchQuery.trim().toUpperCase()}"`;
    }
    if (activeFilter === "ALL") {
      return "SHOP ALL";
    }
    return activeFilter;
  }, [activeTeamName, searchQuery, teamsList, filtered, activeFilter]);


  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setCart([]);
    try { sessionStorage.removeItem("cart"); } catch { }
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

  return (
    <>
      <div id="jv-root" style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&family=Bebas+Neue&display=swap');
.section-divider { height:1px; background:linear-gradient(90deg, transparent, #39ff14, transparent); opacity:0.3; border:none; }
.mobile-search-btn {
  display: none;
}

@media(max-width:768px) {
  .mobile-search-btn {
    display: flex;
    align-items: center;
  }
}
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
#jv-root button:not(.hamburger):not(.add-btn):not(.filter-btn):not(.size-btn):not(.checkout-btn):not(.hero-btn-primary):not(.hero-btn-secondary):not(.nav-link) { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; text-transform: uppercase; }
  #jv-root .add-btn { display: block; width: 100%; text-align: center; }
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

  .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; display:flex; align-items:center; gap:6px; }
  button.nav-link { background:none; border:none; padding:0; font-family:inherit; }
  .nav-link:hover { color:#39ff14; }

  .card { background: repeating-linear-gradient( 45deg, #0f0f0f, #0f0f0f 4px, #111 4px, #111 8px ); border:1px solid var(--border); overflow:hidden; cursor:pointer; transition:transform 0.3s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s; position:relative; display:flex; flex-direction:column; height:420px; }
  .card:hover { transform:translateY(-6px); border-color:#39ff14; box-shadow: 0 0 0 1px #39ff14, 0 0 30px rgba(57,255,20,0.2), 0 20px 60px rgba(0,0,0,0.6); }
  .card-img { width:100% !important; height:100% !important; object-fit:cover !important; object-position:center center !important; transform:scale(1.08) !important; transform-origin:center center !important; display:block !important; transition:transform 0.5s cubic-bezier(0.23,1,0.32,1) !important; }
  .card-img-wrap { overflow:hidden; position:relative; height:280px; width:100%; background:#0d0d0d; }
  .card:hover .card-img { transform:scale(1.15) !important; }
  .card-overlay { position:absolute; inset:0; background:linear-gradient(to top, #000 0%, transparent 60%); opacity:0.5; pointer-events:none; }


 /* ══════════════════════════════════════
   ADD-TO-CART / SELECT SIZE BUTTON
══════════════════════════════════════ */
#jv-root .add-btn {
  background: var(--green);
  color: #000;
  box-shadow: none;
  border: none !important;
  width: 100%;
  padding: 11px 8px;
font-family: 'Barlow Condensed', sans-serif;
font-weight: 900 !important;
font-style: normal !important;
font-size: 15px !important;
letter-spacing: 4px !important;
  white-space: nowrap !important;
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
  background: transparent;
  color: var(--green);
  letter-spacing: 6px;
  box-shadow: inset 0 0 0 2px var(--green);
}
#jv-root .add-btn:active { transform: scale(0.98); }
#jv-root .add-btn:disabled,
#jv-root .add-btn[disabled] {
  background: #1a1a1a !important;
  color: #666 !important;
  cursor: not-allowed;
  box-shadow: none !important;
  letter-spacing: 3px !important;
  font-size: 13px !important;
}
#jv-root .add-btn:disabled::before { display: none; }

/* ══════════════════════════════════════
   FILTER BAR & PILLS
══════════════════════════════════════ */
.filter-bar {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 6px;
  scrollbar-width: none;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  width: 100%;
}
.filter-bar::-webkit-scrollbar { display: none; }

#jv-root .filter-btn {
  flex-shrink: 0;
  white-space: nowrap;
  border: 1px solid #2a2a2a !important;
  background: transparent !important;
  color: #fff !important;
  font-size: 18px !important;
  letter-spacing: 4px !important;
  padding: 8px 18px;
  height: 40px;
  font-family: 'Barlow Condensed', sans-serif !important;
  font-weight: 900 !important;
  font-style: italic !important;
  clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
}

#jv-root .filter-btn:first-child {
  clip-path: polygon(0% 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
}

#jv-root .filter-btn:last-child {
  clip-path: polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%);
}

#jv-root .filter-btn:hover {
  background: transparent !important;
  border: 1px solid #888 !important;
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
  #jv-root .filter-btn.wc26-btn,
#jv-root .filter-btn.wc26-btn.active {
  background-color: transparent !important;
  background-image: var(--wc26-bg) !important;
  background-size: cover !important;
  background-position: center !important;
  border: none !important;
  color: #fff !important;
  text-shadow: 0 1px 4px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.6) !important;
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
#jv-root .filter-btn.wc26-btn,
#jv-root .filter-btn.wc26-btn.active {
  background-color: transparent !important;
  background-image: var(--wc26-bg) !important;
  background-size: 400% !important;
  background-position: 50% 50% !important;
  border: none !important;
  color: transparent !important;
  text-shadow: none !important;
  height: 40px !important;
  width: 80px !important;
}

#jv-root .filter-btn.kits2627-btn {
  padding: 4px 8px !important;
  width: 140px !important;
  height: 40px !important;
  overflow: hidden !important;
}

.mobile-scroll-arrow-hint {
  display: none;
  align-items: center;
  gap: 4px;
  background: rgba(57,255,20,0.08);
  border: 1px solid rgba(57,255,20,0.3);
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
}
@keyframes bounceRight {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

@media (max-width: 768px) {
  .mobile-scroll-arrow-hint {
    display: inline-flex;
  }
  .filter-bar {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: scroll !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-x !important;
    padding-bottom: 6px !important;
    gap: 6px !important;
    width: 100% !important;
    scrollbar-width: none !important;
  }
  .filter-bar::-webkit-scrollbar {
    display: none !important;
  }
  #jv-root .filter-btn {
    flex-shrink: 0 !important;
    font-size: 14px !important;
    letter-spacing: 2px !important;
    padding: 6px 14px !important;
    height: 36px !important;
  }
  #jv-root .filter-btn.wc26-btn {
    width: 76px !important;
    height: 36px !important;
    flex-shrink: 0 !important;
  }
  #jv-root .filter-btn.kits2627-btn {
    width: 110px !important;
    height: 36px !important;
    padding: 3px 6px !important;
    flex-shrink: 0 !important;
  }
}

#jv-root .kits2627-graphic {
  display: block;
  width: 100%;
  height: 100%;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  transition: filter 0.2s ease;
}

/* 1. NORMAL UNSELECTED STATE: white graphic on dark outline box */
#jv-root .filter-btn.kits2627-btn:not(.active) .kits2627-graphic {
  filter: brightness(1);
}

/* 2. HOVER STATE: green logos with outline style just like other boxes */
#jv-root .filter-btn.kits2627-btn:not(.active):hover .kits2627-graphic {
  filter: brightness(0) saturate(100%) invert(75%) sepia(90%) saturate(1250%) hue-rotate(65deg) brightness(105%) contrast(105%);
}

/* 3. ACTIVE STATE: box itself is green (#39ff14) like other active boxes, logos & text inside are solid black (#000) */
#jv-root .filter-btn.kits2627-btn.active {
  background: var(--green) !important;
  border: none !important;
}

#jv-root .filter-btn.kits2627-btn.active .kits2627-graphic {
  filter: brightness(0);
}


/* ══════════════════════════════════════
   SIZE BUTTONS
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
  width: 40px;
  height: 40px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
}

#jv-root .size-btn::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: #1a1a1a;
  transition: background 0.2s;
}
#jv-root .size-btn::after { display: none; }

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

#jv-root .size-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
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
  ══════════════════════════════════════ */
.checkout-btn {
  position: relative;
  overflow: hidden;
  background: var(--green) !important;
  color: #000 !important;
  border: none !important;
  width: calc(100% - 32px);
  margin: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px 0;
  font-family: 'Bebas Neue', sans-serif !important;
  font-weight: 400 !important;
  font-size: 19px !important;
  letter-spacing: 8px !important;
  cursor: pointer;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
  border-radius: 2px;
}

.checkout-btn::before { display: none; }

.checkout-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255,255,255,0.3);
  pointer-events: none;
}

.checkout-btn:hover {
  background: #000 !important;
  color: var(--green) !important;
  letter-spacing: 8px !important;
  box-shadow: inset 0 0 0 1px var(--green),
              0 0 24px rgba(57,255,20,0.1);
  transform: none;
}

.checkout-btn:active {
  background: #000 !important;
  color: var(--green) !important;
  transform: scale(0.99);
}

.checkout-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-size: 20px;
  font-weight: 400;
  opacity: 0.8;
  transition: transform 0.3s ease, opacity 0.3s ease;
  flex-shrink: 0;
}

.checkout-btn:hover .checkout-arrow {
  transform: translateX(5px);
  opacity: 1;
}

.checkout-btn:active .checkout-arrow {
  transform: translateX(3px);
}

@media(max-width:768px) {
  .checkout-btn {
    width: calc(100% - 24px);
    margin: 10px 12px;
    font-size: 17px !important;
    letter-spacing: 6px !important;
    padding: 13px 0;
  }
  .nav-right { 
    gap: 14px !important; 
    align-items: center !important;
    margin-right: 4px !important;
  }
  .hamburger { 
    margin-left: 0;
    margin-right: 2px;
    align-self: center;
  }
  nav {
    padding: 0 8px 0 4px !important;
  }
.card-img { height:200px; }
.card-img-wrap { height:200px; }
.card { height:400px; }
.card-grid { grid-template-columns: repeat(2, 1fr) !important; }
}

@media(max-width:380px) {
  .checkout-btn {
    font-size: 14px !important;
    letter-spacing: 4px !important;
  }
  .checkout-arrow {
    font-size: 16px;
  }
    .card { height:390px; }
    .card-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
  /* ══════════════════════════════════════
     MODAL
  ══════════════════════════════════════ */
  .modal-bg { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:16px; overscroll-behavior:contain; touch-action:none; }
  .modal-bg-dismiss { position:absolute; inset:0; background:rgba(0,0,0,0.92); backdrop-filter:blur(8px); border:none; padding:0; cursor:pointer; width:100%; height:100%; touch-action:none; }
  .cart-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.8); border:none; padding:0; cursor:pointer; touch-action:none; }
  .modal { background:#0a0a0a; border:1px solid #1e1e1e; width:100%; max-width:480px; overflow:hidden; animation:fadeUp 0.3s cubic-bezier(0.23,1,0.32,1); max-height:calc(100vh - 32px); overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; box-shadow:0 0 80px rgba(57,255,20,0.06), 0 40px 80px rgba(0,0,0,0.9); border-radius:2px; position:relative; z-index:1; }
  .modal-img-wrap { position:relative; width:100%; height:360px; background:#0d0d0d; overflow:hidden; }
  .modal-img { width:100% !important; height:100% !important; object-fit:cover !important; object-position:center center !important; transform:scale(1.08) !important; transform-origin:center center !important; display:block !important; }
  .modal-img-placeholder { width:100%; height:360px; background:#0d0d0d; display:flex; align-items:center; justify-content:center; font-size:80px; }

  /* ══════════════════════════════════════
     CART PANEL
  ══════════════════════════════════════ */
  .cart-panel { position:fixed; right:0; top:0; bottom:0; width:380px; background:#070707; border-left:none; z-index:200; display:flex; flex-direction:column; animation:slideDown 0.28s cubic-bezier(0.23,1,0.32,1); box-shadow:-30px 0 80px rgba(0,0,0,0.8); overscroll-behavior:contain; -webkit-overflow-scrolling:touch; }

  .cart-item { display:flex; gap:14px; padding:16px 20px; border-bottom:1px solid #111; align-items:center; animation:cartItemSlide 0.25s ease both; transition:background 0.2s; }
  .cart-item:hover { background:#0c0c0c; }
  .cart-item-img { width:56px; height:56px; object-fit:cover; background:#0d0d0d; flex-shrink:0; border:1px solid #1a1a1a; border-radius:2px; }
  .cart-item-name { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:17px; letter-spacing:1px; color:#eee; line-height:1.1; }
  .cart-item-meta { font-family:'Barlow Condensed',sans-serif; font-size:12px; letter-spacing:3px; color:#333; margin-top:3px; font-weight:700; }
  .cart-item-price { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; color:#39ff14; margin-top:6px; letter-spacing:1px; animation: priceReveal 0.3s ease; }
  .cart-tag { display:inline-flex; align-items:center; gap:8px; margin-top:6px; }
  .cart-tag-size { background:var(--green); color:#000; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:14px; letter-spacing:1px; padding:0 10px; border-radius:3px; display:inline-flex; align-items:center; justify-content:center; height:32px; min-width:32px; }
  .cart-tag-qty { color:#333; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; }

  .cart-total-row { display:flex; justify-content:space-between; align-items:center; padding:16px 20px 8px; background:#050505; border-top:1px solid #141414; }
  .cart-total-label { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:6px; color:#333; text-transform:uppercase; }
  .cart-total-amount { font-family:'Bebas Neue','Barlow Condensed',sans-serif; font-weight:400; font-size:36px; color:var(--green); letter-spacing:2px; line-height:1; animation: priceReveal 0.25s ease; }

  .search-input { background:#1a1a1a; border:1px solid #444; border-radius:999px; color:#fff; padding:10px 20px; font-family:'Barlow Condensed',sans-serif; font-size:15px; outline:none; letter-spacing:1px; width:100%; transition:border-color 0.2s, box-shadow 0.2s; }
  .search-input:focus { border-color:var(--green); box-shadow:0 0 0 2px rgba(57,255,20,0.1), 0 4px 16px rgba(0,0,0,0.4); }
  .search-input::placeholder { color:#888; letter-spacing:2px; }
  .skeleton { background:linear-gradient(90deg, #0f0f0f 25%, #161616 50%, #0f0f0f 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  .logo-img { width:52px; height:54px; object-fit:contain; mix-blend-mode:screen; filter:brightness(1.3) contrast(1.13) drop-shadow(0 0 4px rgba(57,255,20,0.15)); display:block; background:transparent; }
  .logo-wrap { display:flex; align-items:center; gap:8px; }
  .out-of-stock-badge { position:absolute; top:12px; left:12px; background:#c0392b; color:#fff; font-size:12px; font-weight:900; letter-spacing:3px; padding:4px 10px; z-index:2; border-radius:2px; }
  .hamburger { display:none; align-items:center; justify-content:center; width:32px; height:32px; background:none !important; border:none !important; cursor:pointer; padding:0 !important; flex-shrink:0; z-index:130; }
  .hamburger.open { justify-content:center; align-items:center; }
  .hamburger span { display:block !important; width:100%; height:2px; background:white !important; border-radius:2px; }
  .mobile-menu { display:none; position:fixed; top:64px; left:0; right:0; bottom:0; height:calc(100vh - 64px); background:#070707; border-bottom:1px solid #1a1a1a; padding:20px 24px 40px; flex-direction:column; gap:20px; animation:mobileMenuSlide 0.2s ease; z-index:999999; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; overflow-y:auto; }
  .mobile-menu.open { display:flex !important; }
  .type-badge-card { position:absolute; top:12px; right:12px; font-size:12px; font-weight:900; letter-spacing:3px; padding:4px 10px; z-index:2; background:rgba(0,0,0,0.75); border:1px solid rgba(57,255,20,0.3); color:var(--green); border-radius:2px; backdrop-filter:blur(4px); }
  .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid #151515; border-bottom:1px solid #151515; background:#070707; }
  .stat-cell { text-align:center; padding:20px 0; border-right:1px solid #151515; }
  .stat-cell:last-child { border-right:none; }
  .hero-section { position:relative; padding:80px 24px 60px; text-align:center; overflow:hidden; background-size:cover; background-position:center top; background-repeat:no-repeat; }

  /* ── NAVBAR ── */
.desktop-nav-links { display:flex; gap:28px; align-items:center; flex-shrink:0; }
.desktop-search { display:flex; align-items:center; flex:1; max-width:520px; justify-content:center; }
.mobile-menu .nav-link { font-size:18px; letter-spacing:3px; padding:4px 0; border-bottom:1px solid #111; }

 @media(max-width:768px) {
  .hamburger { display:flex; }
  .desktop-nav-links { display:none; }
  .desktop-search { display:none; }
  .cart-panel { width:100%; border-left:none; }
  .hero-section { padding:60px 16px 40px; }
  .modal-img-wrap { height:300px !important; }
  .modal-img { height:100% !important; object-fit:cover !important; }
  .shop-header { flex-direction:column; align-items:flex-start !important; gap:12px !important; }

  .cart-total-row { padding:12px 16px 8px; }
  .cart-total-amount { font-size:26px; }
  .cart-total-label { font-size:12px; }
  .cart-item { padding:12px 16px; gap:10px; }
  .cart-item-name { font-size:15px; }
  .cart-item-price { font-size:17px; }
  .cart-item-img { width:48px; height:48px; }
  .card-img { height:100% !important; object-fit:cover !important; }
  .card-img-wrap { height:240px !important; }
  .card { height:400px; }
  .card-grid { grid-template-columns:repeat(2, 1fr) !important; }
  .stats-grid { grid-template-columns:repeat(3,1fr); }
  .stat-cell { padding:14px 0; }
  .filter-btn { font-size:14px !important; padding:6px 12px; }
  .size-btn { width:36px; height:36px; font-size:13px; }
  .modal { max-width:100%; margin:0; border-radius:0; }
  .size-grid { gap:6px; }
  .checkout-btn {
    width:calc(100% - 24px);
    margin:10px 12px;
    font-size:17px !important;
    letter-spacing:6px !important;
    padding:13px 0;
  }
}
 @media(max-width:480px) {
  .stat-cell { padding:12px 0; }
  .size-btn { width:34px; height:34px; font-size:12px; }
  .card-img { height:100% !important; object-fit:cover !important; }
  .card-img-wrap { height:210px !important; }
  .cart-item-img { width:44px; height:44px; }
  .cart-total-amount { font-size:24px; }
  .modal-img-wrap { height:260px !important; }
  .modal-img { height:100% !important; object-fit:cover !important; }
}
  @media(max-width:380px) {
  .checkout-btn {
    font-size:14px !important;
    letter-spacing:4px !important;
  }
  .checkout-arrow { font-size:16px; }
  .cart-item-name { font-size:13px; }
  .cart-item-price { font-size:15px; }
  .size-btn { width:32px; height:32px; font-size:11px; }
  .filter-btn { font-size:12px !important; padding:4px 8px; }
  .cart-total-amount { font-size:22px; }
  .stat-cell { padding:10px 0; }
}

  .flame-text-wrap { position:relative; display:inline-block; line-height:0.9; }
  .flame-text-main { font-size:clamp(40px,8vw,100px); font-weight:900; font-style:italic; letter-spacing:-2px; color:#fff; display:block; font-family:'Barlow Condensed',sans-serif; user-select:none; }
  .toast-banner { position:fixed; bottom:96px; right:24px; background:#0d0d0d; color:#fff; padding:14px 18px; font-weight:700; letter-spacing:1px; font-size:13px; z-index:9999; animation:toastIn 0.35s cubic-bezier(0.23,1,0.32,1); max-width:calc(100vw - 48px); display:flex; align-items:center; gap:12px; border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,0.5); border:1px solid rgba(57,255,20,0.35); min-width:230px; }
  .toast-icon { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; background:rgba(57,255,20,0.12); border-radius:8px; font-size:18px; flex-shrink:0; border:1px solid rgba(57,255,20,0.25); }
  .toast-body { display:flex; flex-direction:column; gap:2px; flex:1; }
  .toast-label { font-size:10px; font-weight:700; letter-spacing:2px; color:#39ff14; text-transform:uppercase; }
  .toast-msg { font-size:13px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }
  .site-nav { position:sticky; top:0; z-index:99999; background:rgba(7,7,7,0.97); backdrop-filter:blur(12px); border-bottom:1px solid #151515; padding:0 20px 0 4px; display:flex; align-items:center; justify-content:space-between; gap:16px; height:64px; animation:slideDown 0.5s ease; }
  /* Custom Sort Dropdown */
  .sort-dropdown-btn { display:inline-flex; align-items:center; gap:4px; background:linear-gradient(135deg,rgba(12,12,12,0.99),rgba(6,6,6,0.99)); border:1.5px solid #39ff14; box-shadow:0 0 8px rgba(57,255,20,0.3); padding:5px 12px; border-radius:6px; cursor:pointer; transition:all 0.2s ease; white-space:nowrap; }
  .sort-dropdown-btn:hover { box-shadow:0 0 18px rgba(57,255,20,0.6); transform:translateY(-1px); }
  .sort-dropdown-label { font-size:10px; font-weight:700; color:#efefef; letter-spacing:2px; font-family:'Barlow Condensed',sans-serif; flex-shrink:0; }
  .sort-dropdown-value { font-size:11px; font-weight:900; font-style:italic; color:#39ff14; letter-spacing:1.5px; font-family:'Barlow Condensed',sans-serif; margin-left:2px; }
  .sort-dropdown-chevron { transition:transform 0.2s ease; flex-shrink:0; }
  .sort-dropdown-chevron.open { transform:rotate(180deg); }
  .sort-dropdown-menu { position:absolute; top:calc(100% + 6px); right:0; min-width:180px; background:#0a0a0a; border:1.5px solid #39ff14; border-radius:6px; box-shadow:0 8px 32px rgba(57,255,20,0.25); overflow:hidden; z-index:200; list-style:none; margin:0; padding:4px 0; animation:fadeInDown 0.15s ease; }
  @keyframes fadeInDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .sort-dropdown-item { display:flex; align-items:center; gap:6px; padding:9px 14px; font-size:11px; font-weight:900; font-style:italic; letter-spacing:1.5px; font-family:'Barlow Condensed',sans-serif; color:#bbb; cursor:pointer; transition:all 0.15s ease; }
  .sort-dropdown-item:hover { background:rgba(57,255,20,0.08); color:#39ff14; }
  .sort-dropdown-item.active { color:#39ff14; background:rgba(57,255,20,0.05); }
  .sort-dropdown-tick { color:#39ff14; font-size:11px; font-style:normal; width:12px; flex-shrink:0; }

  /* Shop section layout */
  .shop-header-outer { display:flex; flex-direction:column; gap:14px; margin-bottom:28px; }
  .shop-section-title { font-size:36px; font-weight:900; font-style:italic; letter-spacing:1px; margin:0; }
  .shop-controls-row { display:flex; align-items:center; width:100%; gap:10px; }
  .shop-controls-row .filter-bar { flex:1; min-width:0; overflow-x:auto; padding-bottom:0; }
  .shop-sort-wrap { flex-shrink:0; align-self:center; }

  @media (min-width: 769px) {
    #jv-root .filter-btn { font-size: 19px !important; letter-spacing: 4.5px !important; padding: 10px 22px !important; height: 46px !important; }
    #jv-root .filter-btn.wc26-btn { width: 92px !important; height: 46px !important; }
    .shop-controls-row { align-items: center !important; }
    .shop-controls-row .filter-bar { padding-bottom: 0 !important; }
    .sort-dropdown-btn { height: 46px !important; padding: 0 16px !important; gap: 5px !important; }
    .sort-dropdown-label { font-size: 13px !important; letter-spacing: 2.5px !important; }
    .sort-dropdown-value { font-size: 14px !important; letter-spacing: 2px !important; margin-left: 3px !important; }
    .sort-dropdown-btn svg:first-child { width: 15px !important; height: 15px !important; }
    .sort-dropdown-chevron { width: 13px !important; height: 13px !important; }
  }
  @media (max-width: 768px) {
    .shop-controls-row { flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
    .shop-controls-row .filter-bar { width:100% !important; }
    .sort-dropdown-wrap, .shop-sort-wrap { align-self:flex-end !important; margin-left:auto !important; }
    .sort-dropdown-menu { right: 0; left: auto; }
  }
.wc26-video-wrap { display:flex; align-items:center; height:50px; width:170px; overflow:hidden; flex-shrink:0; border-left:1px solid #1a1a1a; border-right:1px solid #1a1a1a;position:relative; margin:0 8px; }
.wc26-video-wrap video { width:100%; height:100%; object-fit:cover; pointer-events:none; transform:scale(1.6); object-position:70% center; }
@media(max-width:768px) { .wc26-video-wrap { display:none; } }
  .logo-title { font-weight:900; font-size:20px; letter-spacing:3px; color:#fff; }
  .logo-title-accent { color:#39ff14; }
  .nav-right { display:flex; align-items:center; gap:12px; flex-shrink:0; margin-left:auto; }
  .icon-action-btn { background:transparent; border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; transition:color 0.2s; }
  .icon-action-btn:hover { color:#39ff14; }
  .icon-cart-btn { gap:0; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:15px; letter-spacing:1px; position:relative; }
   .cart-count-inline { color:#39ff14; background:transparent; font-size:16px; font-weight:900; line-height:1; padding:0; min-width:0; text-align:center; margin-left:4px; }
  .mobile-search-gap { margin-bottom:8px; }
  .hero-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(7,7,7,0.92) 0%, rgba(7,7,7,0.4) 30%, rgba(0,0,0,0.3) 60%, rgba(7,7,7,0.99) 100%); pointer-events:none; }
  .hero-eyebrow { color:#39ff14; letter-spacing:6px; font-size:12px; font-weight:700; margin-bottom:16px; position:relative; z-index:1; opacity:0.8; }
  .hero-subtitle { color:#aaa; margin-top:20px; font-size:14px; letter-spacing:3px; font-family:'Barlow',sans-serif; font-weight:400; position:relative; z-index:1; }
  .hero-cta-row { margin-top:32px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap; position:relative; z-index:1; }
  .hero-btn-primary { all:unset; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; background:#39ff14; color:#000; border:none; padding:14px 40px; font-family:'Bebas Neue','Barlow Condensed',sans-serif; font-weight:400; font-size:16px; letter-spacing:5px; cursor:pointer; animation:pulse 2s infinite; border-radius:2px; }
  .hero-btn-secondary { all:unset; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; background:transparent; color:#fff; border:1px solid #2a2a2a; padding:14px 40px; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; letter-spacing:4px; cursor:pointer; border-radius:2px; transition:border-color 0.2s; }
  .hero-divider { position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(90deg, transparent, #39ff14, transparent); }
  .stat-num { font-size:30px; font-weight:900; color:#39ff14; font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }
  .stat-label { font-size:12px; letter-spacing:4px; color:#777; margin-top:4px; font-weight:700; }
  .card-body { padding:16px 16px 0; flex:1; }
  .card-title { font-size:15px; font-weight:900; letter-spacing:1px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; line-height:1.2; min-height:54px; }
  .card-price { font-size:24px; font-weight:900; color:#39ff14; font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }
  .stock-warning { font-size:12px; color:#e67e22; letter-spacing:3px; font-weight:700; }
  .modal-close-btn { position:absolute; top:14px; right:14px; background:rgba(0,0,0,0.85); border:1.5px solid #39ff14; color:#39ff14; font-size:18px; cursor:pointer; width:36px; height:36px; display:flex; align-items:center; justify-content:center; z-index:100; font-family:'Barlow Condensed',sans-serif; font-weight:900; border-radius:4px; box-shadow:0 0 10px rgba(57,255,20,0.4); transition:transform 0.15s, border-color 0.2s; }
  .modal-close-btn:hover { border-color:#39ff14; color:#fff; transform:scale(1.05); }
  .modal-type-badge { display:inline-block; font-size:12px; letter-spacing:4px; color:#000; font-weight:900; background:#39ff14; padding:3px 10px; border-radius:2px; }
  .cart-overlay { position:fixed; inset:0; z-index:150; }
  .cart-header { display:flex; align-items:center; justify-content:space-between; padding:20px; border-bottom:1px solid #111; }
  .cart-count-badge { display:inline-block; margin-left:10px; background:var(--green); color:#000; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:2px; padding:2px 8px; vertical-align:middle; border-radius:2px; }
  .cart-close-btn { background:none; border:1px solid #1a1a1a; color:#444; font-size:14px; cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-weight:900; transition:border-color 0.2s, color 0.2s; border-radius:2px; }
  .cart-close-btn:hover { border-color:#39ff14; color:#39ff14; }
  .cart-remove-btn { background:none; border:1px solid #333; color:#aaa; cursor:pointer; font-size:16px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-weight:900; flex-shrink:0; transition:border-color 0.15s, color 0.15s, background 0.15s; border-radius:3px; }
  .cart-remove-btn:hover { border-color:#c0392b; color:#ff4d4d; background:rgba(192,57,43,0.15); }
  .cart-qty-control { display:inline-flex; align-items:center; gap:6px; background:#121214; border:1px solid #333; border-radius:4px; margin-left:8px; height:34px; padding:0 6px; }
  .cart-qty-btn { background:none; border:none; color:#ffffff; cursor:pointer; font-size:18px; font-weight:900; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; transition:color 0.15s ease, transform 0.15s ease, text-shadow 0.15s ease; line-height:1; outline:none; }
  .cart-qty-btn:not(:disabled):hover,
  .cart-qty-btn:not(:disabled):focus,
  .cart-qty-btn:not(:disabled):active { color:#39ff14 !important; background:none !important; box-shadow:none !important; transform:scale(1.25); text-shadow:0 0 10px rgba(57,255,20,0.8); }
  
  .modal-qty-control button:not(:disabled) { transition: color 0.15s ease, transform 0.15s ease, text-shadow 0.15s ease; color: #ffffff; }
  @media (hover: hover) {
    .modal-qty-control button:not(:disabled):hover {
      color: #39ff14 !important;
      text-shadow: 0 0 12px rgba(57, 255, 20, 0.85) !important;
      transform: scale(1.18);
    }
  }
  .modal-qty-control button:not(:disabled):active {
    color: #39ff14 !important;
    transform: scale(0.92);
  }
  .cart-shipping-note { font-size:12px; color:#888; margin-top:4px; font-family:'Barlow Condensed',sans-serif; font-weight:700; letter-spacing:2px; }
  .cart-secure-note { text-align:center; color:#1a1a1a; font-size:12px; letter-spacing:3px; padding-bottom:16px; font-weight:700; }
  .size-chart-btn {
    margin-left: auto !important;
    background: transparent;
    border: 1px dashed #39ff14 !important;
    color: #ffffff !important;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
    font-style: italic;
    transition: all 0.2s ease-in-out;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .size-chart-btn svg {
    stroke: #ffffff !important;
    transition: stroke 0.2s ease-in-out;
  }
  .size-chart-btn:hover {
    background: #39ff14 !important;
    color: #000000 !important;
    border-style: solid !important;
  }
  .size-chart-btn:hover svg {
    stroke: #000000 !important;
  }
  .modal-price {
    font-size: 28px;
    font-weight: 900;
    color: #39ff14;
    font-family: 'Bebas Neue', sans-serif;
    letter-spacing: 2px;
  }
  @media(max-width: 480px) {
    .size-chart-btn {
      padding: 3px 8px;
      font-size: 11px;
      letter-spacing: 1px;
      gap: 4px;
    }
    .modal-price {
      font-size: 22px;
    }
    .modal-type-badge {
      font-size: 10px;
      padding: 2px 6px;
      letter-spacing: 2px;
    }
  }

  .product-carousel-wrapper:hover .carousel-arrow {
    opacity: 1 !important;
  }
  .image-slider-container::-webkit-scrollbar {
    display: none !important;
  }

  /* Responsive Carousel Arrow Sizes */
  .card .carousel-arrow {
    --arrow-fs: 16px;
  }
  .modal .carousel-arrow {
    --arrow-fs: 28px;
  }
  @media(min-width: 769px) {
    .card .carousel-arrow {
      --arrow-fs: 13px;
    }
    .modal .carousel-arrow {
      --arrow-fs: 20px;
    }
  }


`}</style>

        {/* NAVBAR */}
        <nav className="site-nav">
          <button type="button" className={`hamburger${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(o => !o)} aria-label="Toggle menu" style={{ marginLeft: 0 }}>
            {mobileMenuOpen ? (
              <svg width="26" height="26" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="2" y1="2" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="2" x2="2" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <BrandLogo style={{ marginLeft: 0, paddingLeft: 0 }} />
          <div className="desktop-search">
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                className="search-input"
                placeholder="SEARCH JERSEYS..."
                aria-label="Search jerseys"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    handleSelectSearchJersey(searchQuery);
                  }
                }}
              />
              {showSuggestions && searchQuery.trim().length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  zIndex: 100,
                  marginTop: '-4px'
                }}>
                  {jerseys
                    .filter(j => j.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    .slice(0, 8)
                    .map(jersey => (
                      <div
                        key={jersey.id}
                        onClick={() => handleSelectSearchJersey(jersey.name)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #111',
                          transition: 'background 0.2s',
                          fontSize: '13px',
                          color: '#bbb',
                          userSelect: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#111'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {jersey.image_url && (
                          <img src={getFirstImage(jersey.image_url)} alt={jersey.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
                        )}
                        <span>{jersey.name}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          {/* FIX: NavLinks is now a proper component */}
          <div className="desktop-nav-links">
            <NavLinks
              user={user}
              isAdmin={isAdmin}
              handleLogout={handleLogout}
              scrollToShop={scrollToShop}
              navigate={navigate}
              setMobileMenuOpen={setMobileMenuOpen}
              setCartOpen={setCartOpen}
            />
          </div>
          <div className="wc26-video-wrap" onClick={() => { setActiveFilter("FEATURED"); setTimeout(() => { document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} style={{ cursor: 'pointer' }}>
  <video src={wc26Video} autoPlay loop muted playsInline />
</div>
          <div className="nav-right" style={{ gap: "18px", marginLeft: "auto" }}>
            {/* SEARCH ICON */}
            <div className="mobile-search-btn">
              <button type="button"
                aria-label="Open search"
                className="icon-action-btn"
                onClick={() => {
                  setMobileMenuOpen(true);

                  setTimeout(() => {
                    const el = document.querySelector(".h-search-input");
                    el?.focus();
                  }, 100);
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
            {/* CART BUTTON */}
            <button type="button"
              aria-label="Open cart"
              className="icon-action-btn icon-cart-btn"
              onClick={() => { ReactGA.event("view_cart", { currency: "INR" }); setCartOpen(true); }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="cart-count-inline">{cartCount}</span>
              )}
            </button>
          </div>
          <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                className="search-input h-search-input mobile-search-gap"
                placeholder="SEARCH JERSEYS..."
                aria-label="Search jerseys"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    handleSelectSearchJersey(searchQuery);
                  }
                }}
              />
              {showSuggestions && searchQuery.trim().length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  zIndex: 100,
                  marginTop: '-4px'
                }}>
                  {jerseys
                    .filter(j => j.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    .slice(0, 8)
                    .map(jersey => (
                      <div
                        key={jersey.id}
                        onClick={() => handleSelectSearchJersey(jersey.name)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #111',
                          transition: 'background 0.2s',
                          fontSize: '13px',
                          color: '#bbb',
                          userSelect: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#111'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {jersey.image_url && (
                          <img src={getFirstImage(jersey.image_url)} alt={jersey.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
                        )}
                        <span>{jersey.name}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {/* ── DROPDOWN ACCORDIONS FOR CATEGORIES, TEAMS & SORT BY ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", margin: "8px 0" }}>
              
              {/* 1. CATEGORIES ACCORDION */}
              <div style={{ borderBottom: "1px solid #1a1a1a" }}>
                <button
                  type="button"
                  onClick={() => setMenuCategoriesOpen(o => !o)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: 2,
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#39ff14" }}>⚡</span> CATEGORIES
                  </span>
                  <span style={{ color: "#39ff14", fontSize: 12 }}>{menuCategoriesOpen ? "▲" : "▼"}</span>
                </button>
                {menuCategoriesOpen && (
                  <div style={{ padding: "4px 0 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { key: "ALL", label: "ALL JERSEYS" },
                      { key: "FAN VERSION", label: "FAN VERSION" },
                      { key: "PLAYER VERSION", label: "PLAYER VERSION" },
                      { key: "26/27 KITS", label: "26/27 KITS ⚽" },
                      { key: "CLEARANCE SALE", label: "CLEARANCE SALE 🔥" },
                      { key: "FEATURED", label: `${featuredCategoryName.toUpperCase()} 🏆` },
                      { key: "RETRO", label: "RETRO JERSEYS 📜" },
                    ].map(cat => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setActiveFilter(cat.key);
                          setMobileMenuOpen(false);
                          setTimeout(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }), 100);
                        }}
                        style={{
                          textAlign: "left",
                          fontSize: 14,
                          fontWeight: 700,
                          letterSpacing: 2,
                          color: activeFilter === cat.key ? "#39ff14" : "#bbb",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "3px 0"
                        }}
                      >
                        {activeFilter === cat.key ? "▶ " : ""}{cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. TEAMS ACCORDION */}
              <div style={{ borderBottom: "1px solid #1a1a1a" }}>
                <button
                  type="button"
                  onClick={() => setMenuTeamsOpen(o => !o)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: 2,
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#39ff14" }}>🛡️</span> TEAMS {teamsList.length > 0 ? `(${teamsList.length})` : ""}
                  </span>
                  <span style={{ color: "#39ff14", fontSize: 12 }}>{menuTeamsOpen ? "▲" : "▼"}</span>
                </button>
                {menuTeamsOpen && (
                  <div style={{ padding: "4px 0 12px 14px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/teams");
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: 2,
                        color: "#39ff14",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        marginBottom: 4
                      }}
                    >
                      VIEW ALL TEAMS PAGE →
                    </button>
                    {teamsList.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          navigate(`/?team=${t.id}`);
                          setMobileMenuOpen(false);
                        }}
                        style={{
                          textAlign: "left",
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: 1,
                          color: "#bbb",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "2px 0"
                        }}
                      >
                        {t.logo_url ? (
                          <img src={t.logo_url} alt="" style={{ width: 18, height: 18, objectFit: "contain", borderRadius: "50%" }} />
                        ) : (
                          <span style={{ fontSize: 14 }}>🛡️</span>
                        )}
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. SORT BY ACCORDION */}
              <div style={{ borderBottom: "1px solid #1a1a1a" }}>
                <button
                  type="button"
                  onClick={() => setMenuSortOpen(o => !o)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: 2,
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#39ff14" }}>↕️</span> SORT BY
                  </span>
                  <span style={{ color: "#39ff14", fontSize: 12 }}>{menuSortOpen ? "▲" : "▼"}</span>
                </button>
                {menuSortOpen && (
                  <div style={{ padding: "4px 0 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { key: "FEATURED", label: "FEATURED (DEFAULT)" },
                      { key: "PRICE_LOW_HIGH", label: "PRICE: LOW TO HIGH" },
                      { key: "PRICE_HIGH_LOW", label: "PRICE: HIGH TO LOW" },
                      { key: "NAME_ASC", label: "NAME: A TO Z" },
                      { key: "NEWEST", label: "NEWEST ARRIVALS" },
                    ].map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          setSortBy(s.key);
                          setMobileMenuOpen(false);
                          setTimeout(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }), 100);
                        }}
                        style={{
                          textAlign: "left",
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 2,
                          color: sortBy === s.key ? "#39ff14" : "#bbb",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "3px 0"
                        }}
                      >
                        {sortBy === s.key ? "▶ " : ""}{s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* FIX: NavLinks component used in mobile menu too */}
            <NavLinks
              user={user}
              isAdmin={isAdmin}
              handleLogout={handleLogout}
              scrollToShop={scrollToShop}
              navigate={navigate}
              setMobileMenuOpen={setMobileMenuOpen}
              setCartOpen={setCartOpen}
            />
          </div>
        </nav>

        <Ticker />
        <BrandLogos />
        <div className="section-divider" />

        {/* HERO */}
        <section className="hero-section" style={{ opacity: heroVisible ? 1 : 0, transition: heroVisible ? "none" : "opacity 0.8s ease", backgroundImage: `url(${heroBg})` }}>
          <div className="hero-overlay" />
          <p className="hero-eyebrow">THE ULTIMATE COLLECTION</p>
          <h1 style={{ lineHeight: 0.9, animation: "breathe 3s ease-in-out 1s infinite", position: "relative", display: "inline-block", zIndex: 1 }}>
            <span style={{ display: "block", position: "relative", marginBottom: 4 }}><CartoonFlameText text="WEAR YOUR" /></span>
            <span style={{ display: "block", color: "#39ff14", fontSize: "clamp(48px,10vw,120px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, letterSpacing: -2 }}>LEGEND</span>
          </h1>
          <p className="hero-subtitle">Official jerseys from football, cricket &amp; basketball</p>
          <div className="hero-cta-row">
            <button type="button" className="hero-btn-primary" onClick={scrollToShop}>
              SHOP NOW
            </button>
            <button type="button" className="hero-btn-secondary" onClick={() => navigate("/teams")}>
              VIEW TEAMS
            </button>
          </div>
          <div className="hero-divider" />
        </section>

        {/* STATS */}
        <div className="stats-grid">
          {[["100+", "JERSEYS"], ["5K+", "CUSTOMERS"], ["100%", "AUTHENTIC"]].map(([num, label]) => (
            <div key={label} className="stat-cell">
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
        <div className="section-divider" />

        {/* SHOP */}
        <section id="shop" style={{ padding: "60px 16px" }}>
          <div className="shop-header-outer">
            {/* ROW 1: Title & Right Border Arrow Indicator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 className="shop-section-title" style={{ margin: 0 }}>
                <span style={{ color: "#39ff14" }}>/ </span>{sectionTitle}
              </h2>
              <div 
                className="mobile-scroll-arrow-hint"
                style={{ marginTop: 6 }}
                onClick={() => {
                  const el = document.querySelector(".filter-bar");
                  if (el) el.scrollBy({ left: 120, behavior: "smooth" });
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "bounceRight 1.2s ease-in-out infinite" }}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* ROW 2 (desktop only combined, mobile split): Filter bar + Sort */}
            <div className="shop-controls-row">
              {/* FILTER BAR — 100% native smooth horizontal scroll */}
              <div className="filter-bar">
                {filterButtons.slice(0, 3).concat(
                  filterButtons.slice(3, 4),
                  { key: "FEATURED", label: featuredCategoryName.toUpperCase() },
                  filterButtons.slice(4)
                ).map(({ key, label }) => (
                  <button
                    type="button"
                    key={key}
                    className={`filter-btn${activeFilter === key ? " active" : ""}${key === "FEATURED" ? " wc26-btn" : ""}`}
                    onClick={() => setActiveFilter(key)}
                    style={key === "FEATURED" ? {
                      "--wc26-bg": `url(${wc26Bg})`,
                      backgroundImage: `url(${wc26Bg})`,
                      backgroundSize: "400%",
                      backgroundPosition: "50% 50%",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "transparent",
                      textShadow: "none"
                    } : undefined}
                  >
                    <span style={{ display: "inline-block", opacity: key === "FEATURED" ? 0 : 1, transform: activeFilter === key ? "skewX(8deg)" : "none" }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              {/* SORT BY — custom themed dropdown */}
              <div className="sort-dropdown-wrap shop-sort-wrap" style={{ position: "relative", flexShrink: 0 }}>
                <button
                  className="sort-dropdown-btn"
                  onClick={() => setSortOpen(o => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  type="button"
                >
                  {/* Hamburger icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                  <span className="sort-dropdown-label">SORT BY</span>
                  <span className="sort-dropdown-value">{
                    sortBy === "FEATURED" ? "FEATURED" :
                    sortBy === "PRICE_LOW_HIGH" ? "PRICE: LOW → HIGH" :
                    sortBy === "PRICE_HIGH_LOW" ? "PRICE: HIGH → LOW" :
                    sortBy === "NAME_ASC" ? "NAME: A → Z" :
                    "NEWEST"
                  }</span>
                  <svg className={`sort-dropdown-chevron${sortOpen ? " open" : ""}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {sortOpen && (
                  <ul className="sort-dropdown-menu" role="listbox">
                    {[
                      { key: "FEATURED", label: "FEATURED" },
                      { key: "PRICE_LOW_HIGH", label: "PRICE: LOW → HIGH" },
                      { key: "PRICE_HIGH_LOW", label: "PRICE: HIGH → LOW" },
                      { key: "NAME_ASC", label: "NAME: A → Z" },
                      { key: "NEWEST", label: "NEWEST ARRIVALS" },
                    ].map(opt => (
                      <li
                        key={opt.key}
                        role="option"
                        aria-selected={sortBy === opt.key}
                        className={`sort-dropdown-item${sortBy === opt.key ? " active" : ""}`}
                        onClick={() => { setSortBy(opt.key); setSortOpen(false); }}
                      >
                        {sortBy === opt.key && <span className="sort-dropdown-tick">✓</span>}
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {loadingProducts ? (
            <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 6 }}>
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
            <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 6 }}>
              {paginatedProducts.map((jersey, i) => (
                <div
                  key={`${activeFilter}-${jersey.id}`}
                  className="card"
                  style={{ animation: `fadeUp 0.5s ease ${i * 0.07}s both`, cursor: jersey.stock > 0 ? "pointer" : "default" }}
                  onClick={() => {
                    if (jersey.stock > 0) {
                      ReactGA.event("view_item", {
                        currency: "INR", value: jersey.price,
                        items: [{ item_id: jersey.id, item_name: jersey.name, price: jersey.price, item_category: jersey.type }]
                      });
                      setSelectedJersey(jersey);
                      setSelectedSize("M");
                    }
                  }}
                >
                  {jersey.stock === 0 && <div className="out-of-stock-badge">OUT OF STOCK</div>}
                  <div className="type-badge-card">{(() => {
                    if (jersey.type && (jersey.type.toUpperCase().includes("FAN") || jersey.type.toUpperCase().includes("PLAYER"))) {
                      return jersey.type.toUpperCase();
                    }
                    const str = `${jersey.name || ""} ${jersey.category || ""} ${jersey.sub_category || ""} ${jersey.description || ""}`.toUpperCase();
                    return str.includes("PLAYER") ? "PLAYER VERSION" : "FAN VERSION";
                  })()}</div>
                  <div className="card-img-wrap">
                    <ProductCarousel imageUrl={jersey.image_url} alt={jersey.name} className="card-img" arrowSize="16px" />
                    <div className="card-overlay" />
                  </div>
                  <div className="card-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="card-title">{jersey.name}</div>
                      <div className="card-price">₹{jersey.price}</div>
                      {jersey.stock > 0 && jersey.stock <= 5 && (
                        <div className="stock-warning">ONLY {jersey.stock} LEFT</div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: "auto" }}>
                    {jersey.stock === 0 ? (
                      <button type="button" className="add-btn" disabled>
                        OUT OF STOCK
                      </button>
                    ) : (
                      <button type="button"
                        className="add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickView(jersey);
                        }}
                      >
                        SELECT SIZE
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORY PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              marginTop: 36,
              paddingTop: 20,
              borderTop: "1px solid #151515"
            }}>
              {/* Pagination Nav Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {/* PREV ARROW BUTTON */}
                <button
                  type="button"
                  disabled={validCurrentPage === 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    background: validCurrentPage === 1 ? "#0a0a0a" : "#141414",
                    border: `1px solid ${validCurrentPage === 1 ? "#222" : "#39ff14"}`,
                    color: validCurrentPage === 1 ? "#333" : "#39ff14",
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                    fontSize: 24,
                    fontWeight: 900,
                    lineHeight: 1,
                    cursor: validCurrentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  aria-label="Previous Page"
                >
                  «
                </button>

                {/* PAGE NUMBERS */}
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => {
                  const isActive = pageNum === validCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      style={{
                        background: isActive ? "#39ff14" : "#0d0d0d",
                        border: `1px solid ${isActive ? "#39ff14" : "#222"}`,
                        color: isActive ? "#000" : "#bbb",
                        minWidth: 40,
                        height: 40,
                        padding: "0 10px",
                        borderRadius: 4,
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: 16,
                        letterSpacing: 1,
                        cursor: "pointer",
                        boxShadow: isActive ? "0 0 16px rgba(57,255,20,0.4)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* NEXT ARROW BUTTON */}
                <button
                  type="button"
                  disabled={validCurrentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    background: validCurrentPage === totalPages ? "#0a0a0a" : "#141414",
                    border: `1px solid ${validCurrentPage === totalPages ? "#222" : "#39ff14"}`,
                    color: validCurrentPage === totalPages ? "#333" : "#39ff14",
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                    fontSize: 24,
                    fontWeight: 900,
                    lineHeight: 1,
                    cursor: validCurrentPage === totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  aria-label="Next Page"
                >
                  »
                </button>
              </div>

              {/* PAGE INFO SUBTITLE */}
              <div style={{ color: "#666", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                SHOWING {(validCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(validCurrentPage * ITEMS_PER_PAGE, filtered.length)} OF {filtered.length} JERSEYS (PAGE {validCurrentPage} OF {totalPages})
              </div>
            </div>
          )}
        </section>
        <div className="section-divider" />

        {/* FEATURES */}
        <section style={{ background: "#070707", padding: "60px 16px", borderTop: "1px solid #111" }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, fontStyle: "italic", textAlign: "center", marginBottom: 40, letterSpacing: 2 }}>WHY <span style={{ color: "#39ff14" }}>JERSEYVAULT</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 1 }}>
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
        <div className="section-divider" />

        {/* FOOTER */}
        <footer style={{ background: "#040404", borderTop: "1px solid #111", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: 5, marginBottom: 8, fontFamily: "'Bebas Neue',sans-serif" }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></div>
          <p style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
            {[["PRIVACY", "/privacy"], ["TERMS", "/terms"], ["CONTACT", "/contact"], ["FAQ", "/faq"]].map(([l, h]) => (
              <Link key={l} to={h} style={{ color: "#555", fontSize: 12, letterSpacing: 3, cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = "#39ff14"} onMouseLeave={e => e.target.style.color = "#555"}>{l}</Link>
            ))}
          </div>
        </footer>

        {/* SIZE PICKER MODAL */}
        {selectedJersey && (
          <div className="modal-bg">
            <button type="button" className="modal-bg-dismiss" aria-label="Close size picker" onClick={closeQuickView} />
            <div className="modal" style={{ position: "relative" }}>
              {/* Top Left Compact Back Button */}
              <button
                type="button"
                className="modal-back-btn"
                onClick={closeQuickView}
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  zIndex: 100,
                  background: "rgba(0, 0, 0, 0.85)",
                  border: "1px solid #39ff14",
                  color: "#39ff14",
                  padding: "4px 10px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  fontWeight: 900,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 0 8px rgba(57, 255, 20, 0.3)",
                  backdropFilter: "blur(4px)"
                }}
              >
                <span style={{ fontSize: "12px", lineHeight: 1 }}>←</span>
                <span>BACK</span>
              </button>
              <div className="modal-img-wrap" style={{ position: "relative" }}>
                <ProductCarousel
                  imageUrl={selectedJersey.image_url}
                  alt={selectedJersey.name}
                  className="modal-img"
                  arrowSize="28px"
                />
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.3), transparent)", animation: "scanline 2.5s linear infinite" }} />
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to top, #0a0a0a, transparent)", pointerEvents: "none" }} />
              </div>

              <div style={{ padding: "16px 24px 6px" }}>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, fontStyle: "italic" }}>{selectedJersey.name}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 8, width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="modal-type-badge">{(() => {
                      if (selectedJersey.type && (selectedJersey.type.toUpperCase().includes("FAN") || selectedJersey.type.toUpperCase().includes("PLAYER"))) {
                        return selectedJersey.type.toUpperCase();
                      }
                      const str = `${selectedJersey.name || ""} ${selectedJersey.category || ""} ${selectedJersey.sub_category || ""} ${selectedJersey.description || ""}`.toUpperCase();
                      return str.includes("PLAYER") ? "PLAYER VERSION" : "FAN VERSION";
                    })()}</span>
                    <span className="modal-price">₹{selectedJersey.price}</span>
                  </div>

                  {/* WhatsApp & Link White Logos (Size 26px with 16px gap) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto" }}>
                    <button
                      type="button"
                      onClick={(e) => handleShareWhatsApp(selectedJersey, e)}
                      title="Share on WhatsApp"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ffffff",
                        padding: "2px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.15s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M12.012 2c-5.508 0-9.989 4.478-9.989 9.984 0 1.762.459 3.483 1.332 5.004L2 22l5.161-1.344a9.96 9.96 0 004.851 1.256h.004c5.507 0 9.988-4.478 9.988-9.984 0-2.668-1.039-5.176-2.925-7.062A9.925 9.925 0 0012.012 2zm5.721 14.286c-.24.673-1.398 1.282-1.92 1.348-.48.06-1.096.084-3.54-.924-2.772-1.144-4.56-3.96-4.696-4.14-.136-.18-1.12-1.488-1.12-2.844 0-1.356.708-2.016.96-2.292.24-.264.528-.336.708-.336.18 0 .36.004.516.012.168.008.396-.064.62.472.24.576.816 1.992.888 2.136.072.144.12.312.024.504-.096.192-.144.312-.288.48-.144.168-.304.376-.432.504-.144.144-.294.3-.126.588.168.288.75 1.238 1.61 2.004 1.106.985 2.038 1.29 2.326 1.434.288.144.48.216.552.336.072.12.072.696-.168 1.368z"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyShareLink(selectedJersey, e)}
                      title="Copy Product Link"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ffffff",
                        padding: "2px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.15s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </button>
                  </div>
                </div>

                {selectedJersey.stock > 0 && selectedJersey.stock <= 5 && (
                  <div className="stock-warning" style={{ marginTop: 8 }}>⚠ ONLY {selectedJersey.stock} LEFT IN STOCK</div>
                )}
              </div>

              <div style={{ padding: "10px 24px 32px" }}>
                <div className="size-label" style={{ margin: "0 0 8px", fontSize: "13px", letterSpacing: "2.5px" }}>
                  SELECT SIZE
                </div>

                {/* SIZE GRID & WHITE SIZE CHART LOGO ON EXTREME RIGHT */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "nowrap", gap: "10px" }}>
                  <div className="size-grid" style={{ margin: 0 }}>
                    {sizes.filter(s => getSizeStock(selectedJersey, s) > 0).map(s => {
                      return (
                        <button type="button"
                          key={s}
                          className={`size-btn${selectedSize === s ? " selected" : ""}`}
                          onClick={() => {
                            setSelectedSize(s);
                            setModalQty(1);
                            ReactGA.event("size_selected", { size: s, item_id: selectedJersey.id, item_name: selectedJersey.name });
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>

                  {/* Size Chart White Logo at EXTREME RIGHT with small SIZE CHART text below */}
                  <button
                    type="button"
                    onClick={() => setShowSizeChart(true)}
                    title="View Size Chart"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ffffff",
                      padding: "2px",
                      cursor: "pointer",
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "auto",
                      marginRight: "-6px",
                      flexShrink: 0,
                      transition: "transform 0.15s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <svg width="38" height="38" viewBox="0 0 100 100" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
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
                    <span style={{ fontSize: "8.5px", fontWeight: "900", letterSpacing: "0.8px", color: "#ffffff", marginTop: "1px", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      SIZE CHART
                    </span>
                  </button>
                </div>

                {/* SELECT QUANTITY FOR SELECTED SIZE */}
                <div style={{ marginTop: 22 }}>
                  <div className="size-label" style={{ marginBottom: 8 }}>SELECT QUANTITY</div>

                  <div 
                    className="modal-qty-control"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "#0a0a0a",
                      border: "1px solid #333",
                      borderRadius: "2px",
                      padding: "0 4px",
                      height: "42px"
                    }}
                  >
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

                <button type="button"
                  className="add-btn filled-variant"
                  style={{ marginTop: 24, fontSize: 16, padding: "16px" }}
                  onClick={() => addToCart(selectedJersey, selectedSize, modalQty)}
                >
                  <span>ADD TO CART</span>
                  <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 14, letterSpacing: 2 }}>—</span>
                  <span>₹{selectedJersey.price * modalQty}</span>
                </button>

                {/* ── PRODUCT SPECIFICATIONS & DETAILS ── */}
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

                  {/* CUSTOMER REVIEW SUBMISSION FORM */}
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
                        <span>✍️</span> WRITE & POST A REVIEW
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

                      {/* Photo Upload Section */}
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

                        {/* Image Previews */}
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
                      <div style={{ color: "#aaa", fontSize: 13, letterSpacing: 1, fontWeight: 600 }}>No reviews for this jersey yet</div>
                      <div style={{ color: "#555", fontSize: 11, letterSpacing: 0.5, marginTop: 4 }}>Verified customer reviews will appear here.</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "340px", overflowY: "auto", paddingRight: 4 }}>
                      {jerseyReviews.map((rev) => (
                        <div key={rev.id} style={{ background: "#0c0c0c", border: "1px solid #1a1a1a", padding: "14px 14px 12px 14px", borderRadius: "4px", position: "relative", boxSizing: "border-box" }}>
                          {/* Card Header: Reviewer Name, Verified Badge & Star Rating */}
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

                          {/* Review Comment Body */}
                          <p style={{ color: "#b0b0b0", fontSize: "13px", lineHeight: 1.4, fontFamily: "'Barlow', sans-serif", margin: "6px 0 10px 0", wordBreak: "break-word" }}>
                            {rev.comment}
                          </p>

                          {/* Customer Review Photo Attachments */}
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

                          {/* Review Date Footer (Fixed clipping inside card) */}
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
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX FOR REVIEW PHOTOS */}
        {previewReviewPhoto && (
          <div className="modal-bg" style={{ zIndex: 130 }}>
            <button type="button" className="modal-bg-dismiss" onClick={() => setPreviewReviewPhoto(null)} />
            <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", margin: "auto", background: "#000", border: "1px solid #39ff14", padding: 8 }}>
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
          <div className="modal-bg" style={{ zIndex: 110 }}>
            <button type="button" className="modal-bg-dismiss" aria-label="Close size chart" onClick={() => setShowSizeChart(false)} />
            <div className="modal" style={{ maxWidth: "520px", border: "1px solid #39ff14", position: "relative" }}>
              <button type="button" className="modal-close-btn" style={{ right: "12px", left: "auto", zIndex: 10 }} onClick={() => setShowSizeChart(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <div style={{ position: "relative", background: "#0a0a0a" }}>
                
                {/* Header (Neon Green Bar) */}
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

                {/* Table Container */}
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
                </div>

                {/* Footer Section */}
                <div style={{
                  padding: "0 20px 24px",
                  textAlign: "center",
                  background: "#0a0a0a"
                }}>
                  {/* WEAR YOUR LEGEND flame text */}
                  <div style={{ display: "block", marginBottom: 4 }}>
                    <CartoonFlameText text="WEAR YOUR LEGEND" fontSize="clamp(20px, 6vw, 32px)" />
                  </div>
                  {/* website link */}
                  <div style={{
                    color: "#39ff14",
                    fontSize: "12px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: "3px",
                    marginTop: "6px",
                    textTransform: "uppercase",
                    fontWeight: "700"
                  }}>
                    thejerseyvault.in
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* CART PANEL */}
        {cartOpen && (
          <div className="cart-overlay">
            <button type="button" className="cart-backdrop" aria-label="Close cart" onClick={() => setCartOpen(false)} />
            <div className="cart-panel">
              <div className="cart-header">
                <div>
                  <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 4, fontStyle: "italic", color: "#888" }}>YOUR</span>
                  {" "}
                  <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 4, color: "#39ff14", fontStyle: "italic" }}>CART</span>
                  {cartCount > 0 && (
                    <span className="cart-count-badge">{cartCount} ITEM{cartCount !== 1 ? "S" : ""}</span>
                  )}
                </div>
                <button type="button" className="cart-close-btn" onClick={() => setCartOpen(false)}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#1e1e1e" }}>
                    <div style={{ fontSize: 48 }}>🛒</div>
                    <p style={{ marginTop: 12, letterSpacing: 4, fontSize: 12, fontWeight: 900, fontStyle: "italic", color: "#2a2a2a" }}>CART IS EMPTY</p>
                    <p style={{ marginTop: 8, letterSpacing: 3, fontSize: 12, color: "#1a1a1a" }}>ADD SOME FIRE JERSEYS</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}`} className="cart-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                      {item.image_url ? (
                        <img src={getFirstImage(item.image_url)} alt={item.name} className="cart-item-img" />
                      ) : (
                        <div style={{ width: 56, height: 56, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, border: "1px solid #1a1a1a", borderRadius: 2 }}>👕</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-tag">
                          <span className="cart-tag-size">{item.size}</span>
                          <div className="cart-qty-control">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              aria-label="Decrease quantity"
                              title="Decrease quantity"
                              onClick={() => updateCartQty(item.id, item.size, -1)}
                            >
                              −
                            </button>
                            <span style={{ color: "#39ff14", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900, padding: "0 10px", minWidth: 24, textAlign: "center" }}>
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              aria-label="Increase quantity"
                              title="Increase quantity"
                              onClick={() => updateCartQty(item.id, item.size, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="cart-item-price">₹{(item.price * item.qty).toLocaleString()}</div>
                      </div>
                      <button type="button" className="cart-remove-btn" title="Remove item" aria-label="Remove item" onClick={() => removeFromCart(item.id, item.size)}>✕</button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, paddingBottom: 76, background: "#080808" }}>
                  {/* FREE SHIPPING PROGRESS BANNER */}
                  <div style={{ margin: "0 20px 14px", padding: "12px 14px", background: "rgba(57, 255, 20, 0.06)", border: "1px solid rgba(57, 255, 20, 0.25)", borderRadius: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ color: "#39ff14", fontSize: 13, fontWeight: 800, letterSpacing: 1.5, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {total >= 1099 ? "🎉 FREE SHIPPING UNLOCKED!" : `🚚 ADD ₹${(1099 - total).toLocaleString()} MORE FOR FREE DELIVERY`}
                      </span>
                      <span style={{ color: "#39ff14", fontSize: 12, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {Math.min(100, Math.round((total / 1099) * 100))}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "5px", background: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (total / 1099) * 100)}%`, height: "100%", background: "#39ff14", boxShadow: "0 0 10px #39ff14", transition: "width 0.4s ease" }} />
                    </div>
                  </div>

                  <div className="cart-total-row">
                    <div>
                      <span className="cart-total-label" style={{ color: "#a1a1aa", fontSize: 13, letterSpacing: 4, fontWeight: 900 }}>ORDER TOTAL</span>
                    </div>
                    <span className="cart-total-amount">₹{total.toLocaleString()}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "0 20px" }}>
                    <button type="button" className="checkout-btn" style={{ width: "100%", margin: "14px 0", justifyContent: "center", textAlign: "center" }} onClick={handleCheckout}>
                      <span>PROCEED TO CHECKOUT</span>
                      <span className="checkout-arrow">→</span>
                    </button>
                  </div>
                  
                  <p className="cart-secure-note" style={{ textAlign: "center" }}>✦ SECURED BY RAZORPAY ✦</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
        {/* TOAST POPUP NOTIFICATION */}
        {toast && (
          <div 
            role="button"
            tabIndex={0}
            aria-label={toast.isCart !== false ? "Product added to cart notification. Click to view cart" : "Notification"}
            onClick={() => {
              if (toast.isCart !== false) setCartOpen(true);
              setToast(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (toast.isCart !== false) setCartOpen(true);
                setToast(null);
              }
            }}
            style={{
              position: "fixed",
              bottom: 28,
              right: 24,
              zIndex: 300,
              background: "#0d0d0d",
              border: "2px solid #39ff14",
              padding: "14px 22px",
              borderRadius: "4px",
              boxShadow: "0 0 30px rgba(57,255,20,0.45), 0 10px 35px rgba(0,0,0,0.9)",
              cursor: toast.isCart !== false ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: 14,
              animation: "toastIn 0.3s cubic-bezier(0.23,1,0.32,1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
              userSelect: "none"
            }}
            onMouseEnter={e => {
              if (toast.isCart !== false) {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
                e.currentTarget.style.boxShadow = "0 0 45px rgba(57,255,20,0.7), 0 12px 40px rgba(0,0,0,0.95)";
                e.currentTarget.style.background = "#111111";
              }
            }}
            onMouseLeave={e => {
              if (toast.isCart !== false) {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(57,255,20,0.45), 0 10px 35px rgba(0,0,0,0.9)";
                e.currentTarget.style.background = "#0d0d0d";
              }
            }}
          >
            <span style={{ fontSize: 26, display: "flex", alignItems: "center" }}>
              {toast.isCart !== false ? "🛒" : "🔗"}
            </span>
            <div>
              <div style={{ color: "#39ff14", fontSize: 14, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>
                {toast.isCart !== false ? "ADDED TO CART!" : "LINK COPIED!"}
              </div>
              <div style={{ color: "#eee", fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span>{typeof toast === "string" ? toast : (toast.text || toast.message || "")}</span>
                {toast.isCart !== false && (
                  <span style={{ 
                    background: "#39ff14", 
                    color: "#000", 
                    fontWeight: 900, 
                    padding: "3px 9px", 
                    borderRadius: "2px", 
                    fontSize: 11,
                    letterSpacing: 1,
                    display: "inline-flex",
                    alignItems: "center"
                  }}>
                    VIEW CART →
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        <AnnouncementPopup />
    </>
  );
}