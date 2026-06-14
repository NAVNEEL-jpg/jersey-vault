import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const POPUP_CONFIG = {
  enabled: true,

  image: "/announcements/a1.jpeg",

  title: "FIFA WORLD CUP 2026",

  description:
    "Shop official World Cup jerseys before stock runs out.",

  buttonText: "SHOP NOW",

  redirectTo: "/?featured=true",

  showOncePerSession: true,

  startDate: null,

  endDate: null
};

export default function AnnouncementPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!POPUP_CONFIG.enabled) return;

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

  const handleCTA = () => {
    handleClose();
    navigate(POPUP_CONFIG.redirectTo);
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
        background: '#111',
        border: '1px solid #333',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        animation: 'popupFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* Close Button */}
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
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

        {/* Image */}
        <div style={{ width: '100%', height: '240px', overflow: 'hidden', borderBottom: '1px solid #222', background: '#0a0a0a' }}>
          <img 
            src={POPUP_CONFIG.image} 
            alt={POPUP_CONFIG.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Hide image container if image fails to load so it doesn't break layout
              e.currentTarget.parentElement.style.display = 'none';
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 6vw, 36px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '2px',
            color: '#fff',
            margin: POPUP_CONFIG.description ? '0 0 12px 0' : '0 0 24px 0',
            textTransform: 'uppercase',
            lineHeight: 1.1
          }}>
            {POPUP_CONFIG.title}
          </h2>

          {POPUP_CONFIG.description && (
            <p style={{
              color: '#aaa',
              fontSize: '15px',
              fontFamily: "'Barlow', sans-serif",
              letterSpacing: '1px',
              marginBottom: '24px',
              lineHeight: 1.5
            }}>
              {POPUP_CONFIG.description}
            </p>
          )}
          
          <button 
            onClick={handleCTA}
            style={{
              background: '#39ff14',
              color: '#000',
              border: 'none',
              padding: '16px 32px',
              fontWeight: 900,
              fontSize: '16px',
              letterSpacing: '3px',
              fontFamily: "'Barlow Condensed', sans-serif",
              cursor: 'pointer',
              width: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 0 10px rgba(57,255,20,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(57,255,20,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(57,255,20,0.2)';
            }}
          >
            {POPUP_CONFIG.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
