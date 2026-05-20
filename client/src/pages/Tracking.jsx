import { useState } from "react";
import { Link } from "react-router-dom";

const statusColors = ["#555", "#ffaa00", "#00aaff", "#ff6600", "#39ff14"];
const statusLabels = ["", "ORDER PLACED", "PACKED", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED"];

const defaultSteps = [
  { label: "ORDER PLACED", sub: "", icon: "✓" },
  { label: "PACKED", sub: "", icon: "📦" },
  { label: "SHIPPED", sub: "", icon: "🚚" },
  { label: "OUT FOR DELIVERY", sub: "", icon: "🛵" },
  { label: "DELIVERED", sub: "", icon: "🏠" },
];

export default function TrackingPage() {
  const [inputId, setInputId] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = () => {
    if (!inputId.trim()) {
      setError("Please enter an Order ID");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      const data = localStorage.getItem("latestOrder");
      const realOrder = data ? JSON.parse(data) : null;
      if (realOrder && inputId.trim().toUpperCase() === realOrder.id) {
        setOrder(realOrder);
      } else {
        setOrder(null);
        setError("Order not found ❌");
      }
      setLoading(false);
    }, 1200);
  };

  const total = order ? order.items.reduce((s, i) => s + i.price * i.qty, 0) : 0;
  const currentStatus = order?.status ?? 0;
  const timeline = order?.timeline || defaultSteps.map((s, i) => ({
    ...s,
    sub: i === 0 ? (order?.date || "") : "",
    done: i <= currentStatus,
  }));

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        .track-input { flex:1; padding:14px 16px; background:#111; border:1px solid #555; color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:15px; letter-spacing:1px; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .track-input:focus { border-color:#39ff14; box-shadow:0 0 10px rgba(57,255,20,0.15); }
        .track-btn { padding:14px 24px; background:#39ff14; color:#000; font-weight:900; letter-spacing:3px; border:none; cursor:pointer; font-family:'Barlow Condensed',sans-serif; transition:transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease; }
        .track-btn:hover { transform:translateY(-2px); box-shadow:0 12px 30px rgba(57,255,20,0.4); }
        .timeline-wrap { position:relative; padding-left:28px; margin-top:24px; }
        .timeline-line { position:absolute; left:11px; top:8px; bottom:8px; width:2px; background:linear-gradient(to bottom, #39ff14 0%, #222 100%); }
        .timeline-step { position:relative; padding:0 0 28px 24px; }
        .timeline-step:last-child { padding-bottom:0; }
        .timeline-dot { position:absolute; left:-28px; top:2px; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; transition:all 0.3s; }
        .timeline-dot.done { background:#39ff14; color:#000; box-shadow:0 0 12px rgba(57,255,20,0.5); }
        .timeline-dot.pending { background:#111; color:#444; border:1px solid #333; }
        .status-card { background:#111; border:1px solid #1a1a1a; padding:24px; margin-bottom:16px; border-left:3px solid #39ff14; }
        .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; position:relative; }
        .nav-link::after { content:''; position:absolute; left:0; bottom:-3px; width:0; height:2px; background:#39ff14; transition:width 0.25s cubic-bezier(0.25,1,0.5,1); }
        .nav-link:hover { color:#39ff14; }
        .nav-link:hover::after { width:100%; }
      `}</style>

      <nav style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, background: "#39ff14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000" }}>J</div>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#fff" }}>
            JERSEY<span style={{ color: "#39ff14" }}>VAULT</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 28 }}>
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/myorders" className="nav-link">MY ORDERS</Link>
        </div>
        <span style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>TRACKING</span>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ color: "#39ff14", letterSpacing: 6, fontSize: 11, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>SHIPMENT STATUS</p>
        <h1 style={{ fontSize: "clamp(36px,8vw,56px)", fontWeight: 900, textAlign: "center", lineHeight: 0.95 }}>
          TRACK YOUR <span style={{ color: "#39ff14" }}>ORDER</span>
        </h1>

        <div style={{ display: "flex", marginTop: 32, gap: 0 }}>
          <input
            className="track-input"
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            placeholder="ENTER ORDER ID"
          />
          <button className="track-btn" onClick={handleTrack}>
            {loading ? "..." : "TRACK →"}
          </button>
        </div>

        {error && <p style={{ color: "#ff4444", marginTop: 12, fontSize: 13, letterSpacing: 1 }}>{error}</p>}

        {order && (
          <div style={{ marginTop: 32, animation: "fadeUp 0.4s ease" }}>
            <div className="status-card">
              <div style={{ color: "#555", fontSize: 11, letterSpacing: 3, marginBottom: 6 }}>CURRENT STATUS</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: statusColors[currentStatus + 1] || "#39ff14" }}>
                {statusLabels[currentStatus + 1] || "PROCESSING"}
              </div>
              <div style={{ color: "#555", fontSize: 12, marginTop: 8, fontFamily: "'Barlow',sans-serif" }}>Order ID: {order.id}</div>
            </div>

            <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 16, fontWeight: 700 }}>DELIVERY TIMELINE</div>
              <div className="timeline-wrap">
                <div className="timeline-line" />
                {timeline.map((step, i) => {
                  const done = step.done ?? i <= currentStatus;
                  return (
                    <div key={i} className="timeline-step">
                      <div className={`timeline-dot ${done ? "done" : "pending"}`}>{done ? (step.icon || "✓") : "·"}</div>
                      <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 2, color: done ? "#fff" : "#444" }}>{step.label}</div>
                      {step.sub && <div style={{ color: "#555", fontSize: 12, marginTop: 4, fontFamily: "'Barlow',sans-serif" }}>{step.sub}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#111", border: "1px solid #1a1a1a", padding: 20, marginTop: 16 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < order.items.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                  <div style={{ fontWeight: 700, letterSpacing: 1 }}>{item.name} ×{item.qty}</div>
                  <div style={{ color: "#39ff14", fontWeight: 900 }}>₹{item.price * item.qty}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: "1px solid #1a1a1a", fontWeight: 900, fontSize: 20 }}>
                <span style={{ letterSpacing: 3, color: "#555" }}>TOTAL</span>
                <span style={{ color: "#39ff14" }}>₹{total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
