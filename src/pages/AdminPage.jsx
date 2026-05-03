import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const statusOptions = ["pending", "preparing", "shipped", "delivered"];
const statusColors = {
  pending: "#ff9900",
  preparing: "#00aaff",
  shipped: "#aa44ff",
  delivered: "#39ff14",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [updatingId, setUpdatingId] = useState(null);

  // Check if logged-in user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) { navigate("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        setAuthed(true);
      } else {
        navigate("/");
      }
      setChecking(false);
    };
    checkAdmin();
  }, []);

  // Fetch orders
  useEffect(() => {
    if (!authed) return;
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setOrders(data); });
  }, [authed]);

  // Fetch products/stock
  useEffect(() => {
    if (!authed) return;
    supabase
      .from("products")
      .select("*")
      .order("name")
      .then(({ data }) => { if (data) setProducts(data); });
  }, [authed]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingId(null);
  };

  if (checking) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#39ff14", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, letterSpacing: 4 }}>
      CHECKING ACCESS...
    </div>
  );

  if (!authed) return null;

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #39ff14; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        .tab-btn { background: transparent; border: none; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 15px; letter-spacing: 3px; cursor: pointer; padding: 14px 28px; border-bottom: 2px solid transparent; color: #444; transition: all 0.2s; }
        .tab-btn.active { color: #39ff14; border-bottom-color: #39ff14; }
        .status-select { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 6px 10px; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; cursor: pointer; outline: none; }
        .order-card { background: #111; border: 1px solid #1a1a1a; padding: 20px; margin-bottom: 12px; animation: fadeUp 0.4s ease; transition: border-color 0.2s; }
        .order-card:hover { border-color: #2a2a2a; }
        .stock-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #1a1a1a; }
        .stock-row:last-child { border-bottom: none; }
        .stat-card { background: #111; border: 1px solid #1a1a1a; padding: 24px; text-align: center; border-left: 3px solid #39ff14; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(10,10,10,0.98)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#39ff14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000" }}>J</div>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
          <span style={{ background: "#39ff1420", border: "1px solid #39ff1440", color: "#39ff14", fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px", marginLeft: 8 }}>ADMIN</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: 12, letterSpacing: 2 }}>ADMIN PANEL</span>
          <button onClick={() => navigate("/")} style={{ background: "transparent", border: "1px solid #222", color: "#555", padding: "6px 16px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: "pointer" }}>
            ← STORE
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16, marginBottom: 32 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>TOTAL ORDERS</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#39ff14" }}>{orders.length}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>PENDING</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#ff9900" }}>{pendingCount}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>DELIVERED</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#39ff14" }}>{deliveredCount}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>TOTAL REVENUE</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: 28 }}>
          <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>📦 ORDERS ({orders.length})</button>
          <button className={`tab-btn ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}>📊 STOCK ({products.length})</button>
        </div>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
                <div style={{ fontSize: 60 }}>📦</div>
                <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO ORDERS YET</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="order-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    {/* Left — order info */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>{order.id}</span>
                        <span style={{ background: statusColors[order.status] + "22", border: `1px solid ${statusColors[order.status]}44`, color: statusColors[order.status], fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px" }}>
                          {order.status?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: "#888", fontSize: 13, fontFamily: "'Barlow', sans-serif", lineHeight: 1.8 }}>
                        <div>👤 <strong style={{ color: "#fff" }}>{order.customer_name}</strong></div>
                        <div>📧 {order.customer_email}</div>
                        <div>📞 {order.customer_phone}</div>
                        <div>📍 {order.address}, {order.city}, {order.state} — {order.pincode}</div>
                        <div>💳 {order.pay_method?.toUpperCase()}</div>
                        <div>🕐 {new Date(order.created_at).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Right — total + status updater */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "#39ff14", marginBottom: 12 }}>₹{order.total?.toLocaleString()}</div>
                      <div style={{ fontSize: 11, letterSpacing: 2, color: "#555", marginBottom: 6 }}>UPDATE STATUS</div>
                      <select
                        className="status-select"
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => updateStatus(order.id, e.target.value)}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                      </select>
                      {updatingId === order.id && <div style={{ color: "#39ff14", fontSize: 11, marginTop: 6, letterSpacing: 2 }}>UPDATING...</div>}
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ marginTop: 16, borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: "#555", marginBottom: 8 }}>ITEMS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {order.items?.map((item, i) => (
                        <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "6px 12px", fontSize: 12, letterSpacing: 1 }}>
                          {item.name} · Size {item.size} · Qty {item.qty} · <span style={{ color: "#39ff14" }}>₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === "stock" && (
          <div style={{ background: "#111", border: "1px solid #1a1a1a" }}>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
                <div style={{ fontSize: 60 }}>📊</div>
                <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO PRODUCTS</p>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="stock-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: 48, height: 48, objectFit: "cover", background: "#0d0d0d" }} />
                      : <div style={{ width: 48, height: 48, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👕</div>
                    }
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>{p.name}</div>
                      <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>₹{p.price} · {p.status?.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: p.stock === 0 ? "#ff4444" : p.stock <= 5 ? "#ff9900" : "#39ff14" }}>
                      {p.stock}
                    </div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#555" }}>IN STOCK</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}