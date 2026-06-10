import { Link } from "react-router-dom";
import logo from "../assets/jerseyvault-logo.jpeg";
import ReactGA from "react-ga4";

// WhatsApp SVG
const WhatsAppIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Instagram SVG
const InstagramIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="url(#igGrad)">
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

export default function Contact() {
  return (
    <div style={{ fontFamily:"'Barlow Condensed', sans-serif", background:"#0a0a0a", minHeight:"100vh", color:"#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#39ff14; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes glow { 0%,100%{box-shadow:0 0 10px #39ff1440;} 50%{box-shadow:0 0 30px #39ff1480;} }
        .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; position:relative; }
        .nav-link::after { content:''; position:absolute; left:0; bottom:-3px; width:0; height:2px; background:#39ff14; transition:width 0.25s cubic-bezier(0.25,1,0.5,1); border-radius:2px; }
        .nav-link:hover { color:#39ff14; }
        .nav-link:hover::after { width:100%; }
        .contact-card { background:#111; border:1px solid #1a1a1a; padding:32px; animation:fadeUp 0.4s ease both; border-left:3px solid #1a1a1a; transition:all 0.3s; cursor:pointer; text-decoration:none; display:block; color:#fff; }
        .contact-card:hover { border-left-color:#39ff14; transform:translateY(-4px); box-shadow:0 12px 40px rgba(57,255,20,0.12); }
        .contact-card.wa:hover { border-left-color:#25D366; box-shadow:0 12px 40px rgba(37,211,102,0.25); }
        .contact-card.ig:hover { border-left-color:#bc1888; box-shadow:0 12px 40px rgba(188,24,136,0.25); }
        .number-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .number { font-size:22px; font-weight:900; letter-spacing:2px; color:#fff; }
        .sublabel { font-size:12px; letter-spacing:3px; color:#555; font-weight:700; margin-bottom:16px; }
        .legal-nav { background:rgba(10,10,10,0.95); border-bottom:1px solid #1a1a1a; padding:0 24px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
        .legal-eyebrow { color:#39ff14; letter-spacing:6px; font-size:12px; font-weight:700; margin-bottom:8px; }
        .contact-row { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
        .contact-icon-circle { width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .contact-icon-circle.wa { background:#25D36615; border:1px solid #25D36640; }
        .contact-icon-circle.ig { background:#bc188815; border:1px solid #bc188840; }
        .contact-cta { margin-top:16px; display:inline-block; padding:10px 24px; font-weight:900; font-size:13px; letter-spacing:3px; }
        .contact-cta.wa { background:#25D366; color:#000; }
        .contact-cta.ig { background:linear-gradient(90deg,#f09433,#bc1888); color:#fff; }
        .contact-region-label { font-size:12px; letter-spacing:2px; color:#555; margin-bottom:2px; }
        .contact-hours-label { font-size:12px; letter-spacing:3px; color:#39ff14; font-weight:700; margin-bottom:8px; }
        .legal-footer-copy { color:#333; font-size:12px; letter-spacing:2px; }
        .legal-footer-link { color:#666; font-size:12px; letter-spacing:2px; text-decoration:none; transition:color 0.2s; }
        .contact-hint { font-size:12px; font-family:'Barlow',sans-serif; color:#555; }
      `}</style>

      {/* NAV */}
      <nav className="legal-nav">
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <img src={logo} alt="JerseyVault logo" style={{ width:44, height:44, objectFit:"contain", mixBlendMode:"screen", filter:"brightness(1.1) contrast(1.05)", display:"block" }} />
          <span style={{ fontWeight:900, fontSize:20, letterSpacing:3, color:"#fff" }}>JERSEY<span style={{ color:"#39ff14" }}>VAULT</span></span>
        </Link>
        <div style={{ display:"flex", gap:32 }}>
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/tracking" className="nav-link">TRACK</Link>
          <Link to="/myorders" className="nav-link">MY ORDERS</Link>
        </div>
        <span style={{ color:"#555", fontSize:12, letterSpacing:3 }}>CONTACT</span>
      </nav>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"48px 24px" }}>

        {/* HEADER */}
        <div style={{ marginBottom:40, animation:"fadeUp 0.4s ease" }}>
          <p className="legal-eyebrow">GET IN TOUCH</p>
          <h1 style={{ fontSize:"clamp(36px,8vw,64px)", fontWeight:900, fontStyle:"italic", lineHeight:0.9 }}>
            CONTACT <span style={{ color:"#39ff14" }}>US</span>
          </h1>
          <p style={{ color:"#555", fontSize:13, fontFamily:"'Barlow',sans-serif", marginTop:14, letterSpacing:1, lineHeight:1.8 }}>
            We're here to help. Reach out via WhatsApp or Instagram — we typically respond within a few hours.
          </p>
        </div>

        {/* WHATSAPP CARD */}
        <a
          href="https://wa.me/917029786817"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card wa"
          style={{ marginBottom:12 }}
          onClick={() => ReactGA.event("whatsapp_click", { source: "Contact" })}
        >
          <div className="sublabel">WHATSAPP — FASTEST RESPONSE</div>
          <div className="contact-row">
            <div className="contact-icon-circle wa">
              <WhatsAppIcon />
            </div>
            <div>
              <div style={{ fontSize:13, letterSpacing:3, color:"#25D366", fontWeight:700, marginBottom:4 }}>WHATSAPP US</div>
              <div className="contact-hint">Tap to open WhatsApp chat</div>
            </div>
          </div>

          <div className="number-row">
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#25D366", flexShrink:0 }} />
            <div>
              <div className="contact-region-label">INDIA</div>
              <div className="number">+91 70297 86817</div>
            </div>
          </div>

          <div className="number-row">
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#25D366", flexShrink:0 }} />
            <div>
              <div className="contact-region-label">INTERNATIONAL</div>
              <div className="number">+1 (579) 475-9370</div>
            </div>
          </div>

          <div className="contact-cta wa">CHAT ON WHATSAPP →</div>
        </a>

        {/* INSTAGRAM CARD */}
        <a
          href="https://instagram.com/the_jerseyvault.in"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card ig"
          style={{ marginBottom:12 }}
        >
          <div className="sublabel">INSTAGRAM — DM US ANYTIME</div>
          <div className="contact-row">
            <div className="contact-icon-circle ig">
              <InstagramIcon />
            </div>
            <div>
              <div style={{ fontSize:13, letterSpacing:3, color:"#e6683c", fontWeight:700, marginBottom:4 }}>FOLLOW & DM US</div>
              <div className="contact-hint">Tap to open Instagram profile</div>
            </div>
          </div>

          <div className="number-row">
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#bc1888", flexShrink:0 }} />
            <div>
              <div className="contact-region-label">INSTAGRAM HANDLE</div>
              <div className="number" style={{ background:"linear-gradient(90deg,#f09433,#bc1888)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                @the_jerseyvault
              </div>
            </div>
          </div>

          <div className="contact-cta ig">OPEN INSTAGRAM →</div>
        </a>

        {/* EMAIL */}
        <div style={{ background:"#111", border:"1px solid #1a1a1a", padding:"24px 32px", animation:"fadeUp 0.4s ease 0.3s both", borderLeft:"3px solid #39ff14" }}>
          <div className="sublabel">EMAIL</div>
          <div style={{ fontSize:18, fontWeight:900, letterSpacing:2, color:"#39ff14" }}>support@thejerseyvault.in</div>
          <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:"#555", marginTop:6 }}>We respond within 24 hours on business days.</div>
        </div>

        {/* HOURS */}
        <div style={{ background:"#39ff1410", border:"1px solid #39ff1430", padding:"20px 24px", marginTop:12, animation:"fadeUp 0.4s ease 0.4s both" }}>
          <div className="contact-hours-label">SUPPORT HOURS</div>
          <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:"#aaa", lineHeight:1.8 }}>
            Monday – Saturday: 10:00 AM – 8:00 PM IST<br />
            Sunday: 11:00 AM – 5:00 PM IST
          </div>
        </div>
      </div>

      <footer style={{ borderTop:"1px solid #1a1a1a", padding:"32px 24px", textAlign:"center", marginTop:48 }}>
        <div style={{ fontWeight:900, fontSize:22, letterSpacing:4, marginBottom:8 }}>JERSEY<span style={{ color:"#39ff14" }}>VAULT</span></div>
        <p className="legal-footer-copy">© 2026 JERSEYVAULT. ALL RIGHTS RESERVED.</p>
        <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:16 }}>
          {[["PRIVACY","/privacy"],["TERMS","/terms"],["CONTACT","/contact"],["FAQ","/faq"]].map(([l,h]) => (
            <Link key={l} to={h} className="legal-footer-link"
              onMouseEnter={e=>e.target.style.color="#39ff14"} onMouseLeave={e=>e.target.style.color="#666"}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}