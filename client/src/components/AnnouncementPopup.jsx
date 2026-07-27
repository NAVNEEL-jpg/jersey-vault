import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const POPUP_CONFIG = {
  enabled: true,

  image: "/announcements/a1.jpeg",

  buttonText: "SHOP WORLD CUP KITS NOW",

  redirectTo: "/?featured=true",

  showOncePerSession: true,

  startDate: null,

  endDate: null
};

export default function AnnouncementPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!POPUP_CONFIG.enabled) return;

    // Suppress WC advertisement popup when customer opens a dynamic product link
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('product') || searchParams.get('id')) {
      return;
    }

    if (POPUP_CONFIG.startDate || POPUP_CONFIG.endDate) {
      const now = new Date();
      if (POPUP_CONFIG.startDate && now < new Date(POPUP_CONFIG.startDate)) return;
      if (POPUP_CONFIG.endDate && now > new Date(POPUP_CONFIG.endDate)) return;
    }

    const hasSeenPopup = sessionStorage.getItem('jv_announcement_seen');
    if (POPUP_CONFIG.showOncePerSession && hasSeenPopup) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (POPUP_CONFIG.showOncePerSession) {
      sessionStorage.setItem('jv_announcement_seen', 'true');
    }
  };

  const handleLinkClick = () => {
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Barlow Condensed', sans-serif"
    }}>
      <style>{`
        @keyframes popupFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        borderRadius: '12px',
        overflow: 'hidden',
        animation: 'popupFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        filter: 'drop-shadow(0 0 40px rgba(57,255,20,0.7))'
      }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            color: '#fff',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.2s',
            backdropFilter: 'blur(2px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
        >
          ✕
        </button>

        {/* Image as NavLink */}
        <Link
          to={POPUP_CONFIG.redirectTo}
          onClick={handleLinkClick}
          style={{
            display: 'block',
            textDecoration: 'none',
            position: 'relative'
          }}
          aria-label="SHOP WORLD CUP KITS NOW"
        >
          <img
            src={POPUP_CONFIG.image}
            alt="SHOP WORLD CUP KITS NOW"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px', cursor: 'pointer' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </Link>
      </div>
    </div>
  );
}
