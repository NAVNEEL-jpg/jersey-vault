import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 32px",
      background: "#0a0a0a",
      borderBottom: "1px solid #1a1a1a",
      color: "#fff"
    }}>
      
      <div style={{ fontWeight: "900", letterSpacing: "2px" }}>
        JERSEY<span style={{ color: "#39ff14" }}>VAULT</span>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>Home</Link>
        <Link to="/tracking" style={{ color: "#fff", textDecoration: "none" }}>Track</Link>
        <Link to="/checkout" style={{ color: "#fff", textDecoration: "none" }}>Cart</Link>
      </div>
    </nav>
  );
}