import logo from "../assets/jerseyvault-logo.jpeg";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const statusColors = {
  pending: "#ff9900",
  preparing: "#00aaff",
  shipped: "#aa44ff",
  delivered: "#39ff14",
};

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const u = sessionData?.session?.user;

      if (!u) {
        setLoading(false);
        navigate('/auth', { state: { from: '/myorders' }, replace: true });
        return;
      }

      setUser(u);

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", u.email)
        .order("created_at", { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #39ff14; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        @keyframes glow { 0%,100%{box-shadow:0 0 10px #39ff1440;} 50%{box-shadow:0 0 30px #39ff1480;} }
        .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; position:relative; display:flex; align-items:center; gap:6px; }
        .nav-link::after { content:''; position:absolute; left:0; bottom:-3px; width:0; height:2px; background:#39ff14; transition:width 0.25s cubic-bezier(0.25,1,0.5,1); border-radius:2px; }
        .nav-link:hover { color:#39ff14; }
        .nav-link:hover::after { width:100%; }
        button.nav-link { background:none; border:none; padding:0; font-family:inherit; cursor:pointer; }
        .skeleton { background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        .order-card { background: #111; border: 1px solid #1a1a1a; padding: 24px; margin-bottom: 12px; animation: fadeUp 0.4s ease; border-left: 3px solid #1a1a1a; transition: border-color 0.25s, transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s; }
        .order-card:hover { border-left-color: #39ff14; transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
        .track-btn { display:inline-block; background:transparent; border:1px solid #39ff14; color:#39ff14; padding:8px 20px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:3px; text-decoration:none; transition:all 0.2s; }
        .track-btn:hover { background:#39ff14; color:#000; }
        .login-btn { background:#39ff14; color:#000; padding:14px 36px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:15px; letter-spacing:3px; text-decoration:none; display:inline-block; transition:transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease; animation:glow 2s infinite; }
        .login-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(57,255,20,0.4); }
        .legal-nav { background:rgba(10,10,10,0.95); border-bottom:1px solid #1a1a1a; padding:0 24px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
        .legal-eyebrow { color:#39ff14; letter-spacing:6px; font-size:12px; font-weight:700; margin-bottom:8px; }
        .orders-lock-icon { width:90px; height:90px; border-radius:50%; background:#39ff1410; border:2px solid #39ff1440; display:flex; align-items:center; justify-content:center; font-size:40px; margin:0 auto 24px; }
        .orders-back-link { background:transparent; color:#555; border:1px solid #222; padding:14px 36px; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:14px; letter-spacing:3px; text-decoration:none; display:inline-block; }
        .orders-item-placeholder { width:44px; height:44px; background:#0d0d0d; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .orders-stat-label { font-size:12px; letter-spacing:3px; color:#555; margin-top:4px; }
        .orders-status-badge { font-size:12px; font-weight:900; letter-spacing:2px; padding:3px 8px; }
        .orders-shipping-label { font-size:12px; letter-spacing:2px; color:#555; margin-top:2px; }
        .orders-items-label { font-size:12px; letter-spacing:3px; color:#555; margin-bottom:10px; }
        .orders-item-meta { color:#555; font-size:12px; letter-spacing:1px; margin-top:2px; }
        .orders-login-desc { color:#555; font-size:13px; font-family:'Barlow',sans-serif; letter-spacing:1px; line-height:1.8; max-width:360px; margin:0 auto 32px; }
      `}</style>

      {/* NAV */}
      <nav className="legal-nav">
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
         <img src={logo} alt="JerseyVault logo" style={{ width: 44, height: 44, objectFit: "contain", mixBlendMode: "screen", filter: "brightness(1.1) contrast(1.05)", display: "block" }} />
         <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#fff" }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
        </Link>
        <div style={{ display: "flex", gap: 32 }}>
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/tracking" className="nav-link">TRACK</Link>
          <Link to="/checkout" className="nav-link">CART</Link>
          {user ? (
            <button type="button" className="nav-link" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>LOGOUT</button>
          ) : (
            <Link to="/auth" className="nav-link">LOGIN</Link>
          )}
        </div>
        <span style={{ color: "#555", fontSize: 12, letterSpacing: 3 }}>MY ORDERS</span>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>

        {/* LOADING */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ marginBottom: 24 }}>
              <div className="skeleton" style={{ height: 14, width: "20%", marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 48, width: "50%", marginBottom: 8 }} />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", padding: 24 }}>
                <div className="skeleton" style={{ height: 20, width: "30%", marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: "40%" }} />
              </div>
            ))}
          </div>
        )}

        {/* NOT LOGGED IN */}
        {!loading && !user && (
          <div style={{ textAlign: "center", padding: "80px 0", animation: "fadeUp 0.4s ease" }}>
            <div className="orders-lock-icon">🔒</div>
            <h2 style={{ fontSize: "clamp(28px,6vw,48px)", fontWeight: 900, fontStyle: "italic", marginBottom: 12 }}>
              LOGIN TO VIEW <span style={{ color: "#39ff14" }}>YOUR ORDERS</span>
            </h2>
            <p className="orders-login-desc">
              You need to be logged in to see your order history and track your deliveries.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/auth" className="login-btn">LOGIN / SIGN UP →</Link>
              <Link to="/" className="orders-back-link">BACK TO STORE</Link>
            </div>
          </div>
        )}

        {/* LOGGED IN */}
        {!loading && user && (
          <>
            {/* HEADER */}
            <div style={{ marginBottom: 32, animation: "fadeUp 0.4s ease" }}>
              <p className="legal-eyebrow">YOUR ACCOUNT</p>
              <h1 style={{ fontSize: "clamp(36px,8vw,64px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9 }}>
                MY <span style={{ color: "#39ff14" }}>ORDERS</span>
              </h1>
              <p style={{ color: "#555", fontSize: 13, fontFamily: "'Barlow', sans-serif", marginTop: 12, letterSpacing: 1 }}>
                {user.email}
              </p>
            </div>

            {/* STATS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32, animation: "fadeUp 0.4s ease 0.1s both" }}>
              {[
                ["TOTAL ORDERS", orders.length, "#39ff14"],
                ["DELIVERED", orders.filter(o => o.status === "delivered").length, "#39ff14"],
                ["TOTAL SPENT", `₹${totalSpent.toLocaleString()}`, "#fff"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: "#111", border: "1px solid #1a1a1a", padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color }}>{val}</div>
                  <div className="orders-stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* NO ORDERS */}
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", animation: "fadeUp 0.4s ease" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
                <h2 style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", marginBottom: 8 }}>
                  NO ORDERS <span style={{ color: "#39ff14" }}>YET</span>
                </h2>
                <p style={{ color: "#555", fontSize: 13, fontFamily: "'Barlow', sans-serif", letterSpacing: 1, marginBottom: 24 }}>
                  You haven't placed any orders yet.
                </p>
                <Link to="/" className="login-btn">SHOP NOW →</Link>
              </div>

            ) : (
              /* ORDERS LIST */
              orders.map((order, i) => (
                <div key={order.id} className="order-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  {/* Order header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>{order.id}</span>
                        <span className="orders-status-badge" style={{
                          background: (statusColors[order.status] || "#555") + "22",
                          border: `1px solid ${(statusColors[order.status] || "#555")}44`,
                          color: statusColors[order.status] || "#555",
                        }}>
                          {order.status?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: "#555", fontSize: 12, fontFamily: "'Barlow', sans-serif", lineHeight: 1.8 }}>
                        <span>📅 {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span style={{ margin: "0 12px" }}>·</span>
                        <span>💳 {order.pay_method?.toUpperCase()}</span>
                        <span style={{ margin: "0 12px" }}>·</span>
                        <span>📍 {order.city}, {order.state}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#39ff14" }}>₹{order.total?.toLocaleString()}</div>
                      <div className="orders-shipping-label">
                        {order.shipping === 0 ? "FREE SHIPPING" : `+ ₹${order.shipping} SHIPPING`}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>
                    <div className="orders-items-label">ITEMS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {order.items?.map((item, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} style={{ width: 44, height: 44, objectFit: "cover", background: "#0d0d0d", flexShrink: 0 }} />
                            : <div className="orders-item-placeholder">👕</div>
                          }
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>{item.name}</div>
                            <div className="orders-item-meta">Size {item.size} · Qty {item.qty}</div>
                          </div>
                          <div style={{ fontWeight: 900, color: "#fff" }}>₹{item.price * item.qty}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Track button */}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1a1a1a" }}>
                    <Link to="/tracking" className="track-btn">TRACK ORDER →</Link>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}