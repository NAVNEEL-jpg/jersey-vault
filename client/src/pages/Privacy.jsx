import { Link } from "react-router-dom";
import logo from "../assets/jerseyvault-logo.jpeg";

const sections = [
  {
    title: "Information We Collect",
    points: [
      "Personal details such as your name, email address, phone number, and delivery address when you place an order or create an account.",
      "Payment information processed securely through Razorpay. We do not store your card or UPI details on our servers.",
      "Order history and transaction data associated with your account.",
      "Device and browser information, IP address, and browsing behaviour on our website for analytics purposes.",
      "Communications you send us via email, WhatsApp, or Instagram.",
    ],
  },
  {
    title: "How We Use Your Information",
    points: [
      "To process and fulfil your orders, including shipping and delivery updates.",
      "To create and manage your JerseyVault account.",
      "To send order confirmations, invoices, and support responses.",
      "To improve our website, product listings, and overall user experience.",
      "To send promotional offers and new arrivals — only if you have opted in.",
      "To comply with legal obligations and prevent fraudulent transactions.",
    ],
  },
  {
    title: "Sharing Your Information",
    points: [
      "We do not sell, rent, or trade your personal data to third parties.",
      "We share necessary details with logistics and courier partners solely to deliver your orders.",
      "Payment data is handled by Razorpay under their own privacy and security standards.",
      "We may disclose information if required by law or to protect the rights and safety of JerseyVault and its users.",
    ],
  },
  {
    title: "Cookies & Tracking",
    points: [
      "We use cookies to remember your cart, login session, and preferences.",
      "Analytics cookies help us understand how visitors use our site so we can improve it.",
      "You can disable cookies in your browser settings, though some features may not work correctly.",
    ],
  },
  {
    title: "Data Security",
    points: [
      "All data transmitted on our website is encrypted using SSL/TLS.",
      "Passwords are hashed and never stored in plain text.",
      "Access to your personal data is restricted to authorised team members only.",
      "Despite our best efforts, no method of internet transmission is 100% secure. We encourage you to use strong, unique passwords.",
    ],
  },
  {
    title: "Your Rights",
    points: [
      "You may request access to the personal data we hold about you at any time.",
      "You can request correction or deletion of your data by contacting us.",
      "You may opt out of marketing emails at any time via the unsubscribe link.",
      "To exercise any of these rights, email us at support@thejerseyvault.in.",
    ],
  },
  {
    title: "Children's Privacy",
    points: [
      "Our services are not directed at children under the age of 13.",
      "We do not knowingly collect personal data from minors.",
      "If you believe a child has provided us with their data, please contact us immediately.",
    ],
  },
  {
    title: "Changes to This Policy",
    points: [
      "We may update this Privacy Policy from time to time.",
      "Changes will be posted on this page with a revised effective date.",
      "Continued use of our website after changes constitutes acceptance of the updated policy.",
    ],
  },
];

export default function Privacy() {
  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #39ff14; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; position:relative; display:flex; align-items:center; gap:6px; }
        .nav-link::after { content:''; position:absolute; left:0; bottom:-3px; width:0; height:2px; background:#39ff14; transition:width 0.25s cubic-bezier(0.25,1,0.5,1); border-radius:2px; }
        .nav-link:hover { color:#39ff14; }
        .nav-link:hover::after { width:100%; }
        .section-card { background:#111; border:1px solid #1a1a1a; padding:28px; margin-bottom:12px; animation:fadeUp 0.4s ease both; border-left:3px solid #1a1a1a; transition:border-color 0.2s; }
        .section-card:hover { border-left-color:#39ff14; }
        .point { display:flex; gap:12px; margin-bottom:10px; font-family:'Barlow',sans-serif; font-size:14px; color:#aaa; line-height:1.7; }
        .point::before { content:"—"; color:#39ff14; font-weight:900; flex-shrink:0; margin-top:1px; }
        .legal-nav { background:rgba(10,10,10,0.95); border-bottom:1px solid #1a1a1a; padding:0 24px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
        .legal-eyebrow { color:#39ff14; letter-spacing:6px; font-size:12px; font-weight:700; margin-bottom:8px; }
        .legal-footer-copy { color:#333; font-size:12px; letter-spacing:2px; }
        .legal-footer-link { color:#666; font-size:12px; letter-spacing:2px; text-decoration:none; transition:color 0.2s; }
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
        <span style={{ color:"#555", fontSize:12, letterSpacing:3 }}>PRIVACY POLICY</span>
      </nav>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"48px 24px" }}>
        {/* HEADER */}
        <div style={{ marginBottom:40, animation:"fadeUp 0.4s ease" }}>
          <p className="legal-eyebrow">LEGAL</p>
          <h1 style={{ fontSize:"clamp(36px,8vw,64px)", fontWeight:900, fontStyle:"italic", lineHeight:0.9 }}>
            PRIVACY <span style={{ color:"#39ff14" }}>POLICY</span>
          </h1>
          <p style={{ color:"#555", fontSize:13, fontFamily:"'Barlow',sans-serif", marginTop:14, letterSpacing:1, lineHeight:1.8 }}>
            Effective Date: January 1, 2026 · Last Updated: May 2026<br />
            This policy explains how JerseyVault collects, uses, and protects your personal information.
          </p>
        </div>

        {/* SECTIONS */}
        {sections.map((s, i) => (
          <div key={s.title} className="section-card" style={{ animationDelay:`${i * 0.06}s` }}>
            <h2 style={{ fontSize:20, fontWeight:900, letterSpacing:2, marginBottom:16, color:"#fff" }}>
              <span style={{ color:"#39ff14" }}>0{i + 1} / </span>{s.title.toUpperCase()}
            </h2>
            {s.points.map((p, j) => (
              <div key={j} className="point">{p}</div>
            ))}
          </div>
        ))}

        {/* CONTACT NOTE */}
        <div style={{ background:"#39ff1410", border:"1px solid #39ff1430", padding:"20px 24px", marginTop:24, animation:"fadeUp 0.4s ease" }}>
          <p style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:"#aaa", lineHeight:1.8 }}>
            For any privacy-related queries, contact us at{" "}
            <span style={{ color:"#39ff14", fontWeight:700 }}>support@thejerseyvault.in</span>{" "}
            or via WhatsApp at <span style={{ color:"#39ff14", fontWeight:700 }}>+91 70297 86817</span>.
          </p>
        </div>
      </div>

      {/* FOOTER */}
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