import { Link } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nb-nav">
      <style>{`
        .nb-nav { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; background:#0a0a0a; border-bottom:1px solid #1a1a1a; color:#fff; font-family:'Barlow',sans-serif; position:sticky; top:0; z-index:50; }
        .nb-brand { font-weight: 900; letter-spacing: 2px; font-size: 18px; white-space: nowrap; }
        .nb-links { display: flex; gap: 20px; align-items: center; }
        .nb-link { color: #bbb; text-decoration: none; font-weight: 600; font-size: 13px; letter-spacing: 1px; transition: color 0.2s; }
        .nb-link:hover { color: #00E65B; }
        .nb-hamburger { display: none; align-items: center; justify-content: center; width: 32px; height: 32px; background: none; border: none; cursor: pointer; padding: 0; z-index: 130; }
        .nb-hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: all 0.2s; }
        .nb-mobile-menu { display: none; flex-direction: column; gap: 16px; padding: 20px 20px 40px; background: #070707; border-bottom: 1px solid #222; position: fixed; top: 52px; left: 0; right: 0; bottom: 0; z-index: 9999; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
        .nb-mobile-menu.open { display: flex; }
        .nb-mobile-menu .nb-link { font-size: 16px; letter-spacing: 2px; padding: 6px 0; border-bottom: 1px solid #1a1a1a; }
        @media (max-width: 520px) {
          .nb-links { display: none; }
          .nb-hamburger { display: flex; }
        }
        @media (min-width: 521px) {
          .nb-mobile-menu { display: none !important; }
          .nb-hamburger { display: none; }
        }
      `}</style>

      {/* Mobile hamburger */}
      <button type="button" className="nb-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
        {menuOpen ? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="2" x2="20" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="2" x2="2" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      <div className="nb-brand">
        JERSEY<span style={{ color: "#00E65B", fontWeight: 900 }}>VAULT</span>
      </div>

      {/* Desktop links */}
      <div className="nb-links">
        <Link to="/" className="nb-link">Home</Link>
        <Link to="/reviews" className="nb-link">Reviews</Link>
        <Link to="/tracking" className="nb-link">Track</Link>
        <Link to="/checkout" className="nb-link">Cart</Link>
      </div>

      {/* Mobile dropdown */}
      <div className={`nb-mobile-menu${menuOpen ? " open" : ""}`}>
        <Link to="/" className="nb-link" onClick={() => setMenuOpen(false)}>HOME</Link>
        <Link to="/reviews" className="nb-link" onClick={() => setMenuOpen(false)}>REVIEWS</Link>
        <Link to="/tracking" className="nb-link" onClick={() => setMenuOpen(false)}>TRACK ORDER</Link>
        <Link to="/checkout" className="nb-link" onClick={() => setMenuOpen(false)}>CART</Link>
      </div>
    </nav>
  );
}