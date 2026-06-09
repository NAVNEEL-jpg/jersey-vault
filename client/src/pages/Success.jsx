import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { downloadInvoice } from "../utils/downloadInvoice";
import { supabase } from "../supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500;600&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --green: #39ff14;
    --green-dim: rgba(57,255,20,0.12);
    --green-border: rgba(57,255,20,0.25);
    --black: #0a0a0a;
    --surface: #111;
    --border: #1c1c1c;
    --muted: #555;
    --muted2: #333;
  }

  body { background: var(--black); }

  .page {
    background: var(--black);
    min-height: 100vh;
    font-family: 'Barlow', sans-serif;
    color: #fff;
    display: flex;
    flex-direction: column;
  }

  /* NAV — matches tracking page exactly */
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }

  .logo-box {
    width: 36px;
    height: 36px;
    background: var(--green);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 18px;
    color: #000;
    flex-shrink: 0;
  }

  .logo-text {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 22px;
    letter-spacing: 1px;
    line-height: 1;
  }

  .logo-text .g { color: var(--green); }

  .nav-tag {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--muted);
    text-transform: uppercase;
    text-align: right;
    line-height: 1.4;
  }

  /* Bottom green bar */
  .bottom-bar {
    position: fixed;
    bottom: 0; left: 0;
    width: 100%; height: 3px;
    background: var(--green);
    box-shadow: 0 0 12px var(--green);
    z-index: 99;
  }

  /* BODY */
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 44px 20px 72px;
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
  }

  /* Icon */
  .icon-wrap {
    font-size: 60px;
    line-height: 1;
    margin-bottom: 26px;
    animation: bounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
  }

  @keyframes bounceIn {
    from { opacity: 0; transform: scale(0.4); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* Heading — italic bold condensed, same energy as TRACK YOUR ORDER */
  .heading {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-style: italic;
    font-size: clamp(52px, 15vw, 72px);
    line-height: 0.88;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 16px;
    animation: fadeUp 0.5s ease 0.2s both;
  }

  .heading .w { color: #fff; display: block; }
  .heading .g {
    color: var(--green);
    display: block;
    text-shadow: 0 0 28px rgba(57,255,20,0.45);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .subtext {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 1.5px;
    color: var(--muted);
    text-align: center;
    line-height: 1.6;
    margin-bottom: 36px;
    animation: fadeUp 0.5s ease 0.3s both;
  }

  /* Order ID block */
  .order-block {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 20px;
    margin-bottom: 12px;
    position: relative;
    animation: fadeUp 0.5s ease 0.35s both;
  }

  .order-block::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 100%; height: 2px;
    background: var(--green);
    box-shadow: 0 0 10px var(--green);
  }

  .ob-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ob-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .ob-value {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 2px;
  }

  .status-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--green-dim);
    border: 1px solid var(--green-border);
    padding: 7px 14px;
  }

  .dot {
    width: 7px; height: 7px;
    background: var(--green);
    border-radius: 50%;
    animation: blink 1.2s ease-in-out infinite;
    box-shadow: 0 0 6px var(--green);
  }

  @keyframes blink {
    0%,100% { opacity: 1; }
    50% { opacity: 0.2; }
  }

  .pill-text {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--green);
    text-transform: uppercase;
  }

  /* Item row */
  .item-block {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--green);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
    animation: fadeUp 0.5s ease 0.4s both;
  }

  .item-icon { font-size: 30px; flex-shrink: 0; }

  .item-info { flex: 1; }

  .item-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .item-meta {
    font-size: 12px;
    color: var(--muted);
    margin-top: 3px;
    letter-spacing: 0.5px;
  }

  .item-price {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px;
    font-weight: 900;
    color: var(--green);
  }

  /* Progress tracker */
  .tracker {
    width: 100%;
    margin-bottom: 28px;
    animation: fadeUp 0.5s ease 0.45s both;
  }

  .tracker-lbl {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .steps {
    display: flex;
    align-items: flex-start;
  }

  .step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    position: relative;
    z-index: 2;
  }

  .s-node {
    width: 30px; height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    font-family: 'Barlow Condensed', sans-serif;
    flex-shrink: 0;
  }

  .s-node.on  { background: var(--green); color: #000; box-shadow: 0 0 14px rgba(57,255,20,0.55); }
  .s-node.off { background: #111; border: 1px solid var(--border); color: var(--muted); }

  .s-lbl {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-align: center;
  }

  .s-lbl.on  { color: var(--green); }
  .s-lbl.off { color: var(--muted2); }

  .conn {
    flex: 1;
    height: 2px;
    margin-top: 14px;
    position: relative;
    z-index: 1;
  }

  .conn.done   { background: var(--green); box-shadow: 0 0 5px var(--green); }
  .conn.undone { background: var(--border); }

  /* Buttons — TRACK style */
  .btn-primary {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--green);
    color: #000;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 18px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    margin-bottom: 10px;
    transition: box-shadow 0.2s, letter-spacing 0.2s;
    animation: fadeUp 0.5s ease 0.5s both;
  }

  .btn-primary:hover {
    box-shadow: 0 0 28px rgba(57,255,20,0.45);
    letter-spacing: 4px;
  }

  .btn-secondary {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--muted);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 16px;
    border: 1px solid var(--border);
    cursor: pointer;
    text-decoration: none;
    margin-bottom: 24px;
    transition: border-color 0.2s, color 0.2s;
    animation: fadeUp 0.5s ease 0.55s both;
  }

  .btn-secondary:hover { border-color: #2a2a2a; color: #777; }

  /* Tip line */
  .tip {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--muted2);
    text-align: center;
    animation: fadeUp 0.5s ease 0.6s both;
  }

  .tip .hl { color: var(--green); }

  /* Confetti */
  .particle {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 200;
    animation: fall linear forwards;
  }

  @keyframes fall {
    from { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    to   { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }
`;

function createConfettiParticles() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    dur: `${2.5 + Math.random() * 2.5}s`,
    color: Math.random() > 0.45 ? "#39ff14" : "#ffffff",
    size: `${3 + Math.random() * 5}px`,
  }));
}

function Confetti() {
  const [particles, setParticles] = useState(createConfettiParticles);

  useEffect(() => {
    const t = setTimeout(() => setParticles([]), 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: "-10px",
            background: p.color,
            width: p.size,
            height: p.size,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
}

const STEPS = [
  { label: "Confirmed", icon: "✓", on: true  },
  { label: "Preparing", icon: "2", on: false },
  { label: "Shipped",   icon: "3", on: false },
  { label: "Delivered", icon: "4", on: false },
];

function loadLatestOrder() {
  try {
    const data = localStorage.getItem("latestOrder");
    if (!data) return null;

    const parsed = JSON.parse(data);

    if (!parsed.orderId) {
      parsed.orderId =
        "JV-" +
        Math.random().toString(36).substring(2, 7).toUpperCase() +
        "-" +
        Date.now().toString().slice(-4);
    }

    if (!parsed.trackingId) {
      parsed.trackingId =
        "TRK-" +
        Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    localStorage.setItem("latestOrder", JSON.stringify(parsed));
    return parsed;
  } catch {
    return null;
  }
}

export default function Success() {
  const [order] = useState(loadLatestOrder);

  useEffect(() => {
    if (!order) return;

    const saveOrder = async () => {
      if (order.savedToDB) return;

      const { error } = await supabase
        .from("orders")
        .insert({
          order_id: order.orderId,
          tracking_id: order.trackingId,
          customer_name: order.customer?.name,
          email: order.customer?.email,
          phone: order.customer?.phone,
          address: order.customer?.address,
          items: order.items,
          total: order.total,
          payment_method: order.payMethod,
          amount_paid: order.amountPaid || order.total,
          status: "Confirmed",
        });

      if (!error) {
        const updated = { ...order, savedToDB: true };
        localStorage.setItem("latestOrder", JSON.stringify(updated));
      }
    };

    saveOrder();
    
    // Automatically send invoice email using Supabase client to include Auth headers
    supabase.functions.invoke("send-invoice", {
      body: { order },
    }).catch(err => console.error("Auto-invoice failed:", err));
  }, [order]);
  return (
    <>
      <style>{css}</style>
      <div className="page">
        <Confetti />

        {/* NAV */}
        <nav className="nav">
          <a href="/" className="logo">
            <div className="logo-box">J</div>
            <div className="logo-text">
              JERSEY<span className="g">VAULT</span>
            </div>
          </a>
          <div className="nav-tag">ORDER<br />CONFIRMED</div>
        </nav>

        {/* CONTENT */}
        <div className="body">

          <div className="icon-wrap">✅</div>

          <h1 className="heading">
            <span className="w">ORDER</span>
            <span className="g">CONFIRMED!</span>
          </h1>

          <p className="subtext">
            Thank you for your purchase, <span className="hl">{order?.customer?.name || "Loading..."}</span>!<br />
            Your jersey is locked in and being prepared.<br />
            Get ready to represent.
          </p>

{/* Order ID */}
<div className="order-block">
  <div className="ob-row">

    <div>
  <div className="ob-label">Order ID</div>

  <div className="ob-value">
    {order ? order.orderId : "Loading..."}
  </div>

  {/* TRACKING ID */}
  <div
    style={{
      marginTop: 10,
      fontSize: 13,
      color: "var(--muted)",
      letterSpacing: 1,
    }}
  >
    Tracking ID:

    <span
      style={{
        color: "var(--green)",
        fontWeight: 700,
        marginLeft: 8,
      }}
    >
      {order?.trackingId}
    </span>
  </div>
</div>
              <div className="status-pill">
                <div className="dot" />
                <div className="pill-text">{order?.payMethod?.includes('COD') ? "COD Advance Paid" : "Paid"}</div>
              </div>
            </div>
            {order?.payMethod?.includes('COD') && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>To pay on delivery:</span>
                <span style={{ color: "var(--green)", fontWeight: 900 }}>₹{(order.total - order.amountPaid).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Item */}
          {order?.items?.map((item) => (
  <div className="item-block" key={`${item.name}-${item.size}-${item.number ?? item.qty}`}>
    <div className="item-icon">👕</div>

    <div className="item-info">
      <div className="item-name">
        {item.name}
      </div>

      <div className="item-meta">
        Size: {item.size} &nbsp;·&nbsp;
        #{item.number} &nbsp;·&nbsp;
        Qty: {item.qty}
      </div>
    </div>

    <div className="item-price">
      ₹{item.price * item.qty}
    </div>
  </div>
))}

   
          {/* Progress */}
          <div className="tracker">
            <div className="tracker-lbl">Delivery Status</div>
            <div className="steps">
              {STEPS.map((s, i) => (
                <>
                  <div className="step" key={s.label}>
                    <div className={`s-node ${s.on ? "on" : "off"}`}>{s.icon}</div>
                    <div className={`s-lbl ${s.on ? "on" : "off"}`}>{s.label}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`conn ${i === 0 ? "done" : "undone"}`} key={`c-${i}`} />
                  )}
                </>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <Link to="/tracking" className="btn-primary">
            TRACK YOUR ORDER →
          </Link>
          <button
            type="button"
            className="btn-secondary"
            style={{ color: "var(--green)", borderColor: "var(--green-border)", width: "100%" }}
          disabled={!order}
            onClick={() => downloadInvoice(order?.orderId || order?.id)}
          >
            📄 DOWNLOAD INVOICE
          </button>
          <Link to="/" className="btn-secondary">
            Continue Shopping
          </Link>

          <p className="tip">
            💡 Confirmation sent to <span className="hl">{order?.customer?.email || "Loading..."}</span>
          </p>
        </div>

        <div className="bottom-bar" />
      </div>
    </>
  );
}