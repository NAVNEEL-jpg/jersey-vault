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

const JERSEY_TYPES = ["PLAYER VERSION", "FAN VERSION", "RETRO"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const EMPTY_FORM = {
  name: "",
  price: "",
  status: "active",
  image_url: "",
  type: "FAN VERSION",
  size_stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [updatingId, setUpdatingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) { setChecking(false); navigate("/"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin") { setAuthed(true); setChecking(false); }
      else { setChecking(false); navigate("/"); }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!authed) return;
    supabase.from("orders").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setOrders(data); });
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    supabase.from("products").select("*").order("name")
      .then(({ data }) => { if (data) setProducts(data); });
  }, [authed]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingId(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError("");
  };

  const handleSizeStockChange = (size, value) => {
    setFormData(prev => ({
      ...prev,
      size_stock: { ...prev.size_stock, [size]: parseInt(value) || 0 }
    }));
  };

  const handleAddProduct = async () => {
    const { name, price } = formData;
    if (!name.trim()) { setFormError("Product name is required."); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setFormError("Enter a valid price."); return; }

    setFormSaving(true);
    const totalStock = SIZES.reduce((s, sz) => s + (formData.size_stock[sz] || 0), 0);
    const payload = {
      name: name.trim(),
      price: Number(price),
      stock: totalStock,
      size_stock: formData.size_stock,
      status: formData.status,
      image_url: formData.image_url.trim() || null,
      type: formData.type,
    };

    const { data, error } = await supabase.from("products").insert([payload]).select().single();
    if (error) {
      setFormError("Failed to add product: " + error.message);
      setFormSaving(false);
      return;
    }
    setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData(EMPTY_FORM);
    setShowAddForm(false);
    setFormSaving(false);
  };

  const handleDeleteProduct = async (id) => {
    setDeletingId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
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
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }
        .tab-btn { background: transparent; border: none; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 15px; letter-spacing: 3px; cursor: pointer; padding: 14px 28px; border-bottom: 2px solid transparent; color: #444; transition: all 0.2s; }
        .tab-btn.active { color: #39ff14; border-bottom-color: #39ff14; }
        .status-select { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 6px 10px; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; cursor: pointer; outline: none; }
        .order-card { background: #111; border: 1px solid #1a1a1a; padding: 20px; margin-bottom: 12px; animation: fadeUp 0.4s ease; transition: border-color 0.2s; }
        .order-card:hover { border-color: #2a2a2a; }
        .stat-card { background: #111; border: 1px solid #1a1a1a; padding: 24px; text-align: center; border-left: 3px solid #39ff14; }
        .add-product-form { background: #0d0d0d; border: 1px solid #39ff1430; padding: 28px; margin-bottom: 20px; animation: slideDown 0.3s ease; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 10px; letter-spacing: 3px; color: #555; font-weight: 700; }
        .form-input { background: #111; border: 1px solid #1e1e1e; color: #fff; padding: 10px 14px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; outline: none; transition: border-color 0.2s; width: 100%; }
        .form-input:focus { border-color: #39ff14; }
        .form-input::placeholder { color: #333; }
        .form-select { background: #111; border: 1px solid #1e1e1e; color: #fff; padding: 10px 14px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 1px; outline: none; cursor: pointer; width: 100%; transition: border-color 0.2s; }
        .form-select:focus { border-color: #39ff14; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .btn-primary { background: #39ff14; color: #000; border: none; padding: 12px 28px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 14px; letter-spacing: 3px; cursor: pointer; transition: background 0.2s, transform 0.1s; }
        .btn-primary:hover { background: #fff; }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #555; border: 1px solid #222; padding: 12px 24px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: #555; color: #aaa; }
        .btn-danger { background: transparent; color: #ff4444; border: 1px solid #ff444430; padding: 6px 14px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 11px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; }
        .btn-danger:hover { background: #ff444415; border-color: #ff4444; }
        .btn-danger:disabled { opacity: 0.3; cursor: not-allowed; }
        .btn-danger-confirm { background: #ff4444; color: #fff; border: none; padding: 6px 14px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 11px; letter-spacing: 2px; cursor: pointer; }
        .btn-cancel-sm { background: transparent; color: #555; border: 1px solid #222; padding: 6px 10px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 1px; cursor: pointer; }
        .btn-cancel-sm:hover { color: #aaa; }
        .stock-row-item { padding: 16px 20px; border-bottom: 1px solid #1a1a1a; transition: background 0.15s; }
        .stock-row-item:last-child { border-bottom: none; }
        .stock-row-item:hover { background: #0a0a0a; }
        .add-product-toggle { background: transparent; border: 1px dashed #39ff1440; color: #39ff14; padding: 12px 24px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 13px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .add-product-toggle:hover { background: #39ff1410; border-color: #39ff14; }
        .form-error { color: #ff4444; font-size: 12px; letter-spacing: 1px; background: #ff444410; border: 1px solid #ff444430; padding: 10px 14px; margin-top: 4px; }
        .image-preview { width: 48px; height: 48px; object-fit: cover; background: #0d0d0d; border: 1px solid #1a1a1a; }
        .type-badge { display: inline-block; font-size: 9px; font-weight: 900; letter-spacing: 2px; padding: 2px 7px; }
        .type-badge.player { background: #00aaff22; border: 1px solid #00aaff44; color: #00aaff; }
        .type-badge.fan { background: #39ff1422; border: 1px solid #39ff1444; color: #39ff14; }
        .type-badge.retro { background: #ff990022; border: 1px solid #ff990044; color: #ff9900; }
        .size-stock-input { width: 100%; background: #111; border: 1px solid #333; color: #fff; padding: 4px; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; text-align: center; outline: none; }
        .size-stock-input:focus { border-color: #39ff14; }
        .size-add-btn { width: 100%; background: #39ff14; color: #000; border: none; padding: 4px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 11px; cursor: pointer; margin-top: 3px; letter-spacing: 1px; }
        .size-add-btn:hover { background: #fff; }
        .size-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ─── MOBILE RESPONSIVE ──────────────────────────────────── */

        /* Nav: hide secondary label on small screens */
        @media (max-width: 480px) {
          .admin-nav-label { display: none; }
          .admin-nav-store-btn { padding: 6px 10px !important; font-size: 11px !important; }
          .tab-btn { padding: 14px 16px; font-size: 13px; letter-spacing: 2px; }
          .admin-badge { display: none; }
        }

        /* Stats grid: 2-col on mobile instead of 4 */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 500px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stat-card { padding: 16px 12px; }
          .stat-card .stat-value { font-size: 28px !important; }
          .stat-card .stat-label { font-size: 9px !important; letter-spacing: 2px !important; }
        }

        /* Order card: stack info + status control on mobile */
        .order-card-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }
        .order-status-block { text-align: right; }
        @media (max-width: 600px) {
          .order-card { padding: 14px; }
          .order-card-inner { flex-direction: column; }
          .order-status-block {
            text-align: left;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 12px;
            border-top: 1px solid #1a1a1a;
            flex-wrap: wrap;
          }
          .order-status-block .status-label { display: none; }
          .order-total { font-size: 22px !important; margin-bottom: 0 !important; }
          .status-select { flex: 1; min-width: 120px; font-size: 14px; padding: 8px 10px; }
        }

        /* Add product form grid → single col on mobile */
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
          .add-product-form { padding: 18px; }
          .form-actions { flex-direction: column; }
          .form-actions .btn-primary,
          .form-actions .btn-ghost { width: 100%; text-align: center; padding: 14px; }
        }

        /* Size stock grid: 3-col on mobile (instead of 6) */
        .size-grid-add {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        .size-grid-stock {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        @media (max-width: 540px) {
          .size-grid-add  { grid-template-columns: repeat(3, 1fr); }
          .size-grid-stock { grid-template-columns: repeat(3, 1fr); }
        }

        /* Stock row: keep delete button accessible on narrow screens */
        .stock-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        @media (max-width: 480px) {
          .stock-row-item { padding: 12px; }
          .stock-row-top { align-items: flex-start; gap: 8px; }
          .stock-product-name { font-size: 14px !important; }
          .btn-danger, .btn-danger-confirm { font-size: 10px; padding: 5px 10px; }
        }

        /* Image URL row: stack on very narrow */
        .image-url-row { display: flex; gap: 10px; align-items: center; }
        @media (max-width: 400px) {
          .image-url-row { flex-direction: column; align-items: flex-start; }
          .image-preview { width: 40px; height: 40px; }
        }

        /* Main content padding */
        .admin-content { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
        @media (max-width: 480px) {
          .admin-content { padding: 20px 12px; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(10,10,10,0.98)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#39ff14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000" }}>J</div>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
          <span className="admin-badge" style={{ background: "#39ff1420", border: "1px solid #39ff1440", color: "#39ff14", fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px", marginLeft: 8 }}>ADMIN</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="admin-nav-label" style={{ color: "#555", fontSize: 12, letterSpacing: 2 }}>ADMIN PANEL</span>
          <button className="admin-nav-store-btn" onClick={() => navigate("/")} style={{ background: "transparent", border: "1px solid #222", color: "#555", padding: "6px 16px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: "pointer" }}>
            ← STORE
          </button>
        </div>
      </nav>

      <div className="admin-content">

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label" style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>TOTAL ORDERS</div>
            <div className="stat-value" style={{ fontSize: 36, fontWeight: 900, color: "#39ff14" }}>{orders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>PENDING</div>
            <div className="stat-value" style={{ fontSize: 36, fontWeight: 900, color: "#ff9900" }}>{pendingCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>DELIVERED</div>
            <div className="stat-value" style={{ fontSize: 36, fontWeight: 900, color: "#39ff14" }}>{deliveredCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>TOTAL REVENUE</div>
            <div className="stat-value" style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>₹{totalRevenue.toLocaleString()}</div>
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
                  <div className="order-card-inner">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
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
                    <div className="order-status-block">
                      <div className="order-total" style={{ fontSize: 28, fontWeight: 900, color: "#39ff14", marginBottom: 12 }}>₹{order.total?.toLocaleString()}</div>
                      <div className="status-label" style={{ fontSize: 11, letterSpacing: 2, color: "#555", marginBottom: 6 }}>UPDATE STATUS</div>
                      <select className="status-select" value={order.status} disabled={updatingId === order.id} onChange={e => updateStatus(order.id, e.target.value)}>
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                      </select>
                      {updatingId === order.id && <div style={{ color: "#39ff14", fontSize: 11, marginTop: 6, letterSpacing: 2 }}>UPDATING...</div>}
                    </div>
                  </div>
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
          <div>
            <div style={{ marginBottom: 20 }}>
              <button className="add-product-toggle" onClick={() => { setShowAddForm(f => !f); setFormData(EMPTY_FORM); setFormError(""); }}>
                {showAddForm ? "✕ CANCEL" : "+ ADD NEW PRODUCT"}
              </button>
            </div>

            {showAddForm && (
              <div className="add-product-form">
                <div style={{ fontSize: 11, letterSpacing: 4, color: "#39ff14", marginBottom: 20, fontWeight: 900 }}>NEW PRODUCT</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">PRODUCT NAME *</label>
                      <input className="form-input" type="text" placeholder="e.g. Argentina 2024 Home" value={formData.name} onChange={e => handleFormChange("name", e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">TYPE OF JERSEY *</label>
                      <select className="form-select" value={formData.type} onChange={e => handleFormChange("type", e.target.value)}>
                        {JERSEY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">PRICE (₹) *</label>
                      <input className="form-input" type="number" min="0" placeholder="799" value={formData.price} onChange={e => handleFormChange("price", e.target.value)} inputMode="numeric" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">STATUS</label>
                      <select className="form-select" value={formData.status} onChange={e => handleFormChange("status", e.target.value)}>
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                        <option value="draft">DRAFT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: 10, display: "block" }}>STOCK PER SIZE *</label>
                    <div className="size-grid-add">
                      {SIZES.map(size => (
                        <div key={size} style={{ background: "#111", border: "1px solid #1e1e1e", padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 11, letterSpacing: 2, color: "#39ff14", fontWeight: 900, marginBottom: 6 }}>{size}</div>
                          <input
                            className="form-input"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.size_stock[size]}
                            onChange={e => handleSizeStockChange(size, e.target.value)}
                            style={{ padding: "6px", textAlign: "center" }}
                            inputMode="numeric"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">IMAGE URL</label>
                    <div className="image-url-row">
                      <input className="form-input" type="url" placeholder="https://..." value={formData.image_url} onChange={e => handleFormChange("image_url", e.target.value)} />
                      {formData.image_url && (
                        <img src={formData.image_url} alt="preview" className="image-preview" onError={e => { e.target.style.display = "none"; }} />
                      )}
                    </div>
                  </div>

                  {formError && <div className="form-error">{formError}</div>}

                  <div className="form-actions" style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                    <button className="btn-primary" onClick={handleAddProduct} disabled={formSaving}>
                      {formSaving ? "ADDING..." : "✓ ADD PRODUCT"}
                    </button>
                    <button className="btn-ghost" onClick={() => { setShowAddForm(false); setFormData(EMPTY_FORM); setFormError(""); }}>
                      CANCEL
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: "#111", border: "1px solid #1a1a1a" }}>
              {products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
                  <div style={{ fontSize: 60 }}>📊</div>
                  <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO PRODUCTS — ADD ONE ABOVE</p>
                </div>
              ) : (
                products.map(p => (
                  <StockRow
                    key={p.id}
                    product={p}
                    deletingId={deletingId}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    onDelete={handleDeleteProduct}
                    onUpdate={(id, newSizeStock) => {
                      setProducts(prev => prev.map(x => x.id === id ? { ...x, size_stock: newSizeStock } : x));
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StockRow({ product: p, deletingId, confirmDeleteId, setConfirmDeleteId, onDelete, onUpdate }) {
  const [sizeInputs, setSizeInputs] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSizeRestock = async (size) => {
    const qty = parseInt(sizeInputs[size] || 0);
    if (!qty || qty <= 0) return;
    setSaving(true);
    const newSizeStock = { ...(p.size_stock || {}), [size]: (p.size_stock?.[size] || 0) + qty };
    await supabase.from("products").update({ size_stock: newSizeStock }).eq("id", p.id);
    onUpdate(p.id, newSizeStock);
    setSizeInputs(prev => ({ ...prev, [size]: "" }));
    setSaving(false);
  };

  const isConfirming = confirmDeleteId === p.id;
  const isDeleting = deletingId === p.id;
  const typeClass = p.type === "PLAYER VERSION" ? "player" : p.type === "FAN VERSION" ? "fan" : p.type === "RETRO" ? "retro" : "";
  const totalStock = SIZES.reduce((s, sz) => s + (p.size_stock?.[sz] || 0), 0);

  return (
    <div className="stock-row-item">
      {/* Top: image + name + delete */}
      <div className="stock-row-top">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          {p.image_url
            ? <img src={p.image_url} alt={p.name} style={{ width: 48, height: 48, objectFit: "cover", background: "#0d0d0d", flexShrink: 0 }} />
            : <div style={{ width: 48, height: 48, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👕</div>
          }
          <div style={{ minWidth: 0 }}>
            <div className="stock-product-name" style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ color: "#555", fontSize: 12 }}>₹{p.price} · {p.status?.toUpperCase()}</span>
              {p.type && <span className={`type-badge ${typeClass}`}>{p.type}</span>}
              <span style={{ fontSize: 12, fontWeight: 900, color: totalStock === 0 ? "#ff4444" : totalStock <= 10 ? "#ff9900" : "#39ff14" }}>
                TOTAL: {totalStock}
              </span>
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, marginLeft: 12 }}>
          {!isConfirming ? (
            <button className="btn-danger" onClick={() => setConfirmDeleteId(p.id)} disabled={isDeleting}>🗑 REMOVE</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: "#ff4444", marginBottom: 2 }}>CONFIRM DELETE?</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-cancel-sm" onClick={() => setConfirmDeleteId(null)}>NO</button>
                <button className="btn-danger-confirm" onClick={() => onDelete(p.id)} disabled={isDeleting}>
                  {isDeleting ? "..." : "YES, DELETE"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-size stock grid */}
      <div className="size-grid-stock">
        {SIZES.map(size => {
          const stock = p.size_stock?.[size] || 0;
          return (
            <div key={size} style={{ background: "#0d0d0d", border: `1px solid ${stock === 0 ? "#ff444440" : "#1a1a1a"}`, padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#555", marginBottom: 4, fontWeight: 700 }}>{size}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: stock === 0 ? "#ff4444" : stock <= 2 ? "#ff9900" : "#39ff14", marginBottom: 6 }}>{stock}</div>
              <input
                type="number"
                min="1"
                placeholder="+"
                value={sizeInputs[size] || ""}
                onChange={e => setSizeInputs(prev => ({ ...prev, [size]: e.target.value }))}
                className="size-stock-input"
                inputMode="numeric"
              />
              <button className="size-add-btn" onClick={() => handleSizeRestock(size)} disabled={saving}>
                {saving ? "..." : "+ADD"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}