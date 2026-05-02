import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react"

const jerseys = [
  { id: 1, name: "FC Barcelona", number: "10", player: "MESSI", price: 1299, category: "Football", color: "#A50044", accent: "#004D98", emoji: "⚽", tag: "BESTSELLER" },
  { id: 2, name: "Mumbai Indians", number: "45", player: "ROHIT", price: 999, category: "Cricket", color: "#004BA0", accent: "#D1AB3E", emoji: "🏏", tag: "HOT" },
  { id: 3, name: "Chicago Bulls", number: "23", player: "JORDAN", price: 1599, category: "Basketball", color: "#CE1141", accent: "#000000", emoji: "🏀", tag: "LEGEND" },
  { id: 4, name: "Real Madrid", number: "7", player: "RONALDO", price: 1399, category: "Football", color: "#FEBE10", accent: "#ffffff", emoji: "⚽", tag: "CLASSIC" },
  { id: 5, name: "CSK", number: "7", player: "DHONI", price: 1099, category: "Cricket", color: "#F9CD05", accent: "#0081C8", emoji: "🏏", tag: "ICONIC" },
  { id: 6, name: "LA Lakers", number: "24", player: "KOBE", price: 1799, category: "Basketball", color: "#552583", accent: "#FDB927", emoji: "🏀", tag: "TRIBUTE" },
  { id: 7, name: "Manchester City", number: "17", player: "DE BRUYNE", price: 1349, category: "Football", color: "#6CABDD", accent: "#1C2C5B", emoji: "⚽", tag: "NEW" },
  { id: 8, name: "RCB", number: "18", player: "KOHLI", price: 1199, category: "Cricket", color: "#D4000D", accent: "#FFD700", emoji: "🏏", tag: "POPULAR" },
];

const categories = ["All", "Football", "Cricket", "Basketball"];

export default function JerseyStore() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedJersey, setSelectedJersey] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [toast, setToast] = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  const filtered = jerseys.filter(j =>
    (activeCategory === "All" || j.category === activeCategory) &&
    (j.name.toLowerCase().includes(searchQuery.toLowerCase()) || j.player.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (jersey, size) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === jersey.id && i.size === size);
      if (existing) return prev.map(i => i.id === jersey.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...jersey, size, qty: 1 }];
    });
    showToast(`${jersey.player} #${jersey.number} added to cart!`);
    setSelectedJersey(null);
  };

  const removeFromCart = (id, size) => setCart(prev => prev.filter(i => !(i.id === id && i.size === size)));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  return (
    <>
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #39ff14; border-radius: 2px; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
        @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        @keyframes toastIn { from{opacity:0;transform:translateX(100px);} to{opacity:1;transform:translateX(0);} }
        @keyframes marquee { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
        @keyframes glow { 0%,100%{box-shadow:0 0 10px #39ff1440;} 50%{box-shadow:0 0 30px #39ff1480;} }
        .nav-link { color:#888; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; }
        .nav-link:hover { color:#39ff14; }
        .cat-btn { background:transparent; border:1px solid #333; color:#888; padding:8px 20px; font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; letter-spacing:2px; cursor:pointer; transition:all 0.2s; text-transform:uppercase; }
        .cat-btn.active, .cat-btn:hover { background:#39ff14; border-color:#39ff14; color:#000; }
        .card { background:#111; border:1px solid #1a1a1a; overflow:hidden; cursor:pointer; transition:transform 0.3s, border-color 0.3s; position:relative; }
        .card:hover { transform:translateY(-6px); border-color:#39ff14; }
        .card:hover .card-overlay { opacity:1; }
        .card-overlay { position:absolute; inset:0; background:linear-gradient(to top, #000 0%, transparent 60%); opacity:0.6; transition:opacity 0.3s; pointer-events:none; }
        .add-btn { background:#39ff14; color:#000; border:none; width:100%; padding:12px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:15px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; text-transform:uppercase; }
        .add-btn:hover { background:#fff; }
        .size-btn { background:transparent; border:1px solid #333; color:#888; width:44px; height:44px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .size-btn.selected { background:#39ff14; border-color:#39ff14; color:#000; }
        .size-btn:hover:not(.selected) { border-color:#39ff14; color:#39ff14; }
        .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
        .modal { background:#111; border:1px solid #2a2a2a; width:90%; max-width:480px; overflow:hidden; animation:fadeUp 0.3s ease; }
        .cart-panel { position:fixed; right:0; top:0; bottom:0; width:360px; background:#0f0f0f; border-left:1px solid #222; z-index:200; display:flex; flex-direction:column; animation:slideDown 0.3s ease; }
        .cart-item { display:flex; gap:12px; padding:16px; border-bottom:1px solid #1a1a1a; align-items:center; }
        .checkout-btn { background:linear-gradient(90deg,#39ff14,#00ff88); color:#000; border:none; width:calc(100% - 32px); margin:16px; padding:16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:16px; letter-spacing:3px; cursor:pointer; animation:glow 2s infinite; }
        .checkout-btn:hover { background:#fff; }
        .search-input { background:#111; border:1px solid #222; color:#fff; padding:10px 16px; font-family:'Barlow Condensed',sans-serif; font-size:15px; width:220px; outline:none; letter-spacing:1px; }
        .search-input:focus { border-color:#39ff14; }
        .search-input::placeholder { color:#444; }
        .tag { position:absolute; top:12px; right:12px; background:#39ff14; color:#000; font-size:10px; font-weight:900; letter-spacing:2px; padding:3px 8px; z-index:2; }
        .jersey-visual { display:flex; align-items:center; justify-content:center; height:180px; position:relative; overflow:hidden; }
        .jersey-num { font-size:90px; font-style:italic; font-weight:900; opacity:0.15; position:absolute; bottom:-10px; right:10px; line-height:1; }
        .jersey-emoji { font-size:60px; position:relative; z-index:1; filter:drop-shadow(0 0 20px currentColor); }
        .ticker { background:#39ff14; color:#000; padding:8px 0; overflow:hidden; white-space:nowrap; }
        .ticker-inner { display:inline-flex; animation:marquee 18s linear infinite; }
        .ticker-item { font-weight:900; letter-spacing:3px; font-size:12px; padding:0 40px; }
        .hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse at 30% 50%, #39ff1410 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #00ff8808 0%, transparent 50%); pointer-events:none; }
        .hero-line { position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(90deg, transparent, #39ff14, transparent); }
        @media(max-width:600px){.cart-panel{width:100%;} .search-input{width:140px;}}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, background:"#39ff14", color:"#000", padding:"14px 20px", fontWeight:900, letterSpacing:2, fontSize:13, zIndex:999, animation:"toastIn 0.3s ease" }}>
          ✓ {toast}
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ position:"sticky", top:0, zIndex:50, background:"rgba(10,10,10,0.95)", backdropFilter:"blur(10px)", borderBottom:"1px solid #1a1a1a", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, animation:"slideDown 0.5s ease" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, background:"#39ff14", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:"#000" }}>J</div>
          <span style={{ fontWeight:900, fontSize:20, letterSpacing:3, color:"#fff" }}>JERSEY<span style={{ color:"#39ff14" }}>VAULT</span></span>
        </div>
        <div style={{ display:"flex", gap:32 }}>
         <div style={{ display:"flex", gap:32 }}>
  <Link to="/" className="nav-link">HOME</Link>

  <span 
    className="nav-link" 
    onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}
  >
    SHOP
  </span>

  <Link to="/tracking" className="nav-link">TRACK</Link>

  <Link to="/checkout" className="nav-link">CART</Link>
</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <input className="search-input" placeholder="SEARCH..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <button onClick={() => setCartOpen(true)} style={{ background:"transparent", border:"1px solid #39ff14", color:"#39ff14", padding:"8px 16px", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, letterSpacing:2, display:"flex", alignItems:"center", gap:8, transition:"all 0.2s" }}
            onMouseEnter={e => { e.target.style.background="#39ff14"; e.target.style.color="#000"; }}
            onMouseLeave={e => { e.target.style.background="transparent"; e.target.style.color="#39ff14"; }}>
            🛒 CART {cartCount > 0 && <span style={{ background:"#39ff14", color:"#000", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900 }}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ display:"inline-flex" }}>
              {["FREE SHIPPING ABOVE ₹1999", "AUTHENTIC LICENSED JERSEYS", "EASY 30-DAY RETURNS", "COD AVAILABLE", "SIZES XS TO XXL"].map(t => (
                <span key={t} className="ticker-item">★ {t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section style={{ position:"relative", padding:"80px 24px 60px", textAlign:"center", overflow:"hidden", opacity: heroVisible ? 1 : 0, transition:"opacity 0.8s ease" }}>
        <div className="hero-bg" />
        <p style={{ color:"#39ff14", letterSpacing:6, fontSize:12, fontWeight:700, marginBottom:16, animation:"fadeUp 0.6s ease 0.2s both" }}>THE ULTIMATE COLLECTION</p>
        <h1 style={{ fontSize:"clamp(52px,10vw,100px)", fontWeight:900, fontStyle:"italic", lineHeight:0.9, letterSpacing:-2, animation:"fadeUp 0.6s ease 0.3s both" }}>
          WEAR YOUR<br /><span style={{ color:"#39ff14", WebkitTextStroke:"0px" }}>LEGEND</span>
        </h1>
        <p style={{ color:"#555", marginTop:20, fontSize:16, letterSpacing:2, fontFamily:"'Barlow',sans-serif", fontWeight:400, animation:"fadeUp 0.6s ease 0.4s both" }}>Official jerseys from football, cricket & basketball</p>
        <div style={{ marginTop:32, display:"flex", gap:12, justifyContent:"center", animation:"fadeUp 0.6s ease 0.5s both" }}>
          <button onClick={() => document.getElementById('shop').scrollIntoView({behavior:'smooth'})}
            style={{ background:"#39ff14", color:"#000", border:"none", padding:"14px 36px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:3, cursor:"pointer", animation:"pulse 2s infinite" }}>
            SHOP NOW
          </button>
          <button style={{ background:"transparent", color:"#fff", border:"1px solid #333", padding:"14px 36px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, letterSpacing:3, cursor:"pointer" }}>
            VIEW TEAMS
          </button>
        </div>
        <div className="hero-line" />
      </section>

      {/* STATS BAR */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", borderTop:"1px solid #1a1a1a", borderBottom:"1px solid #1a1a1a", background:"#0d0d0d" }}>
        {[["500+","JERSEYS"],["50K+","CUSTOMERS"],["100%","AUTHENTIC"]].map(([num, label]) => (
          <div key={label} style={{ textAlign:"center", padding:"20px 0", borderRight:"1px solid #1a1a1a" }}>
            <div style={{ fontSize:28, fontWeight:900, color:"#39ff14" }}>{num}</div>
            <div style={{ fontSize:11, letterSpacing:3, color:"#555", marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* SHOP SECTION */}
      <section id="shop" style={{ padding:"60px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32, flexWrap:"wrap", gap:16 }}>
          <h2 style={{ fontSize:36, fontWeight:900, fontStyle:"italic", letterSpacing:1 }}>
            <span style={{ color:"#39ff14" }}>/ </span>SHOP ALL
          </h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {categories.map(c => (
              <button key={c} className={`cat-btn ${activeCategory === c ? "active" : ""}`} onClick={() => setActiveCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"#333" }}>
            <div style={{ fontSize:60 }}>🔍</div>
            <p style={{ marginTop:16, letterSpacing:3, fontSize:14 }}>NO RESULTS FOUND</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:2 }}>
            {filtered.map((jersey, i) => (
              <div key={jersey.id} className="card" onClick={() => { setSelectedJersey(jersey); setSelectedSize("M"); }}
                style={{ animation:`fadeUp 0.5s ease ${i * 0.07}s both` }}>
                <div className="tag">{jersey.tag}</div>
                <div className="jersey-visual" style={{ background:`linear-gradient(135deg, ${jersey.color}22, #111)` }}>
                  <span className="jersey-num" style={{ color: jersey.color }}>{jersey.number}</span>
                  <span className="jersey-emoji">{jersey.emoji}</span>
                </div>
                <div className="card-overlay" />
                <div style={{ padding:"16px 16px 0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:11, color:"#555", letterSpacing:2, marginBottom:2 }}>{jersey.category.toUpperCase()}</div>
                      <div style={{ fontSize:20, fontWeight:900, letterSpacing:1 }}>{jersey.name}</div>
                      <div style={{ fontSize:13, color:"#39ff14", fontWeight:700, letterSpacing:2, marginTop:2 }}>#{jersey.number} {jersey.player}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>₹{jersey.price}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding:"12px 16px 16px" }}>
                  <button className="add-btn" onClick={e => { e.stopPropagation(); setSelectedJersey(jersey); setSelectedSize("M"); }}>
                    SELECT SIZE →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section style={{ background:"#0d0d0d", padding:"60px 24px", borderTop:"1px solid #1a1a1a" }}>
        <h2 style={{ fontSize:32, fontWeight:900, fontStyle:"italic", textAlign:"center", marginBottom:40 }}>WHY <span style={{ color:"#39ff14" }}>JERSEYVAULT</span></h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:24 }}>
          {[
            ["🏅","LICENSED AUTHENTIC","Every jersey is officially licensed and verified"],
            ["🚚","FAST DELIVERY","Ships within 24–48 hours across India"],
            ["↩️","30-DAY RETURNS","No questions asked easy returns"],
            ["🔒","SECURE PAYMENTS","Razorpay — UPI, Cards, Netbanking"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ background:"#111", border:"1px solid #1a1a1a", padding:24, textAlign:"center", transition:"border-color 0.3s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#39ff14"}
              onMouseLeave={e => e.currentTarget.style.borderColor="#1a1a1a"}>
              <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div>
              <div style={{ fontWeight:900, letterSpacing:2, fontSize:14, marginBottom:8 }}>{title}</div>
              <div style={{ color:"#555", fontSize:13, fontFamily:"'Barlow',sans-serif", lineHeight:1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:"#050505", borderTop:"1px solid #1a1a1a", padding:"40px 24px", textAlign:"center" }}>
        <div style={{ fontWeight:900, fontSize:28, letterSpacing:4, marginBottom:8 }}>JERSEY<span style={{ color:"#39ff14" }}>VAULT</span></div>
        <p style={{ color:"#333", fontSize:12, letterSpacing:2 }}>© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
        <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:16 }}>
          {["PRIVACY","TERMS","CONTACT","FAQ"].map(l => (
            <span key={l} style={{ color:"#444", fontSize:11, letterSpacing:2, cursor:"pointer", transition:"color 0.2s" }}
              onMouseEnter={e => e.target.style.color="#39ff14"} onMouseLeave={e => e.target.style.color="#444"}>{l}</span>
          ))}
        </div>
      </footer>

      {/* SIZE PICKER MODAL */}
      {selectedJersey && (
        <div className="modal-bg" onClick={() => setSelectedJersey(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ background:`linear-gradient(135deg, ${selectedJersey.color}33, #0d0d0d)`, padding:40, textAlign:"center", position:"relative" }}>
              <button onClick={() => setSelectedJersey(null)} style={{ position:"absolute", top:12, right:16, background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>✕</button>
              <div style={{ fontSize:80, lineHeight:1 }}>{selectedJersey.emoji}</div>
              <div style={{ fontSize:11, letterSpacing:3, color:"#555", marginTop:8 }}>{selectedJersey.category.toUpperCase()}</div>
              <div style={{ fontSize:28, fontWeight:900, marginTop:4 }}>{selectedJersey.name}</div>
              <div style={{ color:"#39ff14", fontWeight:700, letterSpacing:2, fontSize:14 }}>#{selectedJersey.number} {selectedJersey.player}</div>
              <div style={{ fontSize:24, fontWeight:900, marginTop:8 }}>₹{selectedJersey.price}</div>
            </div>
            <div style={{ padding:24 }}>
              <div style={{ fontSize:12, letterSpacing:3, color:"#555", marginBottom:12, fontWeight:700 }}>SELECT SIZE</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {sizes.map(s => (
                  <button key={s} className={`size-btn ${selectedSize === s ? "selected" : ""}`} onClick={() => setSelectedSize(s)}>{s}</button>
                ))}
              </div>
              <button className="add-btn" style={{ marginTop:24, fontSize:16 }} onClick={() => addToCart(selectedJersey, selectedSize)}>
                ADD TO CART — ₹{selectedJersey.price}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART PANEL */}
      {cartOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:150 }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)" }} onClick={() => setCartOpen(false)} />
          <div className="cart-panel">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px", borderBottom:"1px solid #1a1a1a" }}>
              <span style={{ fontWeight:900, fontSize:20, letterSpacing:3 }}>YOUR CART</span>
              <button onClick={() => setCartOpen(false)} style={{ background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:"auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px", color:"#333" }}>
                  <div style={{ fontSize:50 }}>🛒</div>
                  <p style={{ marginTop:12, letterSpacing:2, fontSize:13 }}>CART IS EMPTY</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={`${item.id}-${item.size}`} className="cart-item">
                    <div style={{ width:50, height:50, background:`${item.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>{item.emoji}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:900, fontSize:14, letterSpacing:1 }}>{item.name}</div>
                      <div style={{ color:"#555", fontSize:11, letterSpacing:2, marginTop:2 }}>{item.player} · SIZE {item.size} · QTY {item.qty}</div>
                      <div style={{ color:"#39ff14", fontWeight:700, marginTop:4 }}>₹{item.price * item.qty}</div>
                    </div>
                    <button onClick={() => removeFromCart(item.id, item.size)} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:18, transition:"color 0.2s" }}
                      onMouseEnter={e => e.target.style.color="#ff4444"} onMouseLeave={e => e.target.style.color="#444"}>✕</button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div style={{ borderTop:"1px solid #1a1a1a", paddingTop:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", padding:"0 20px 12px", fontSize:18, fontWeight:900, letterSpacing:2 }}>
                  <span style={{ color:"#555" }}>TOTAL</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
               <button
  className="checkout-btn"
  onClick={() => {
  localStorage.setItem("cart", JSON.stringify(cart));
  navigate("/checkout");
}}
>
  PROCEED TO CHECKOUT →
</button>
                <p style={{ textAlign:"center", color:"#333", fontSize:11, letterSpacing:2, paddingBottom:16 }}>FREE SHIPPING ON ORDERS ABOVE ₹1999</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
