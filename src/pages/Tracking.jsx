import { useState } from "react";

const statusColors = ["#555", "#ffaa00", "#00aaff", "#ff6600", "#39ff14"];
const statusLabels = ["", "ORDER PLACED", "PACKED", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED"];

export default function TrackingPage() {
  const [inputId, setInputId] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");

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

      let found = null;

      if (realOrder && inputId.trim().toUpperCase() === realOrder.id) {
        found = realOrder;
      }

      if (found) {
        setOrder(found);
      } else {
        setOrder(null);
        setError("Order not found ❌");
      }

      setLoading(false);
    }, 1200);
  };

  const total = order ? order.items.reduce((s, i) => s + i.price * i.qty, 0) : 0;

  // fallback timeline if not present
  const timeline = order?.timeline || [
    { label: "ORDER PLACED", sub: order?.date || "", done: true, icon: "✓" },
    { label: "PACKED", sub: "", done: false, icon: "📦" },
    { label: "SHIPPED", sub: "", done: false, icon: "🚚" },
    { label: "OUT FOR DELIVERY", sub: "", done: false, icon: "🛵" },
    { label: "DELIVERED", sub: "", done: false, icon: "🏠" },
  ];

  const currentStatus = order?.status ?? 0;
  const isDelivered = currentStatus === 4;

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      
      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#39ff14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000" }}>J</div>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>
            JERSEY<span style={{ color: "#39ff14" }}>VAULT</span>
          </span>
        </div>
        <span style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>ORDER TRACKING</span>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>

        {/* TITLE */}
        <h1 style={{ fontSize: 50, fontWeight: 900, textAlign: "center" }}>
          TRACK YOUR <span style={{ color: "#39ff14" }}>ORDER</span>
        </h1>

        {/* INPUT */}
        <div style={{ display: "flex", marginTop: 30 }}>
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            placeholder="ENTER ORDER ID"
            style={{ flex: 1, padding: 14, background: "#111", border: "1px solid #222", color: "#fff" }}
          />
          <button onClick={handleTrack} style={{ padding: "14px 24px", background: "#39ff14", color: "#000", fontWeight: 900 }}>
            {loading ? "TRACKING..." : "TRACK"}
          </button>
        </div>

        {/* ERROR */}
        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

        {/* RESULT */}
        {order && (
          <div style={{ marginTop: 30 }}>

            {/* STATUS */}
            <div style={{ padding: 20, border: "1px solid #1a1a1a", marginBottom: 10 }}>
              <div style={{ color: "#555", fontSize: 12 }}>CURRENT STATUS</div>
              <div style={{ fontSize: 24, color: statusColors[currentStatus + 1] }}>
                {statusLabels[currentStatus + 1]}
              </div>
            </div>

            {/* ITEMS */}
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: 10, borderBottom: "1px solid #1a1a1a" }}>
                <div>
                  {item.name} (x{item.qty})
                </div>
                <div>₹{item.price * item.qty}</div>
              </div>
            ))}

            <h3 style={{ marginTop: 20 }}>Total: ₹{total}</h3>

            {/* DETAILS */}
            <div style={{ marginTop: 20 }}>
              <p>Order ID: {order.id}</p>
              <p>Email: {order.customer?.email}</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}