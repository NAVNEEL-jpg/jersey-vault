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
        .nb-hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
        .nb-hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: all 0.2s; }
        .nb-mobile-menu { display: none; flex-direction: column; gap: 16px; padding: 16px 16px; background: rgba(10,10,10,0.98); border-bottom: 1px solid #222; position: absolute; top: 52px; left: 0; right: 0; z-index: 49; }
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

      <div className="nb-brand">
        JERSEY<span style={{ color: "#00E65B", fontWeight: 900 }}>VAULT</span>
      </div>

      {/* Desktop links */}
      <div className="nb-links">
        <Link to="/" className="nb-link">Home</Link>
        <Link to="/tracking" className="nb-link">Track</Link>
        <Link to="/checkout" className="nb-link">Cart</Link>
      </div>

      {/* Mobile hamburger */}
      <button type="button" className="nb-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
        <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
        <span style={{ opacity: menuOpen ? 0 : 1 }} />
        <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
      </button>

      {/* Mobile dropdown */}
      <div className={`nb-mobile-menu${menuOpen ? " open" : ""}`}>
        <Link to="/" className="nb-link" onClick={() => setMenuOpen(false)}>HOME</Link>
        <Link to="/tracking" className="nb-link" onClick={() => setMenuOpen(false)}>TRACK ORDER</Link>
        <Link to="/checkout" className="nb-link" onClick={() => setMenuOpen(false)}>CART</Link>
      </div>
    </nav>
  );
}