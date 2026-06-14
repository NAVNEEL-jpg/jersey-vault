import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";

const sections = [
  {
    title: "Acceptance of Terms",
    points: [
      "By accessing or using thejerseyvault.in, you agree to be bound by these Terms & Conditions.",
      "If you do not agree with any part of these terms, please discontinue use of the website immediately.",
      "We reserve the right to update these terms at any time. Continued use of the site implies acceptance.",
    ],
  },
  {
    title: "Products & Authenticity",
    points: [
      "All jerseys sold on JerseyVault are officially licensed or replica products, clearly described in each listing.",
      "Product images are for illustrative purposes. Slight colour variations may occur due to screen settings.",
      "We reserve the right to discontinue any product at any time without prior notice.",
      "Sizes follow standard Indian sizing. Please refer to our size guide before ordering.",
    ],
  },
  {
    title: "Ordering & Payments",
    points: [
      "Orders are confirmed only after successful payment or COD confirmation.",
      "We accept UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery.",
      "Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes.",
      "JerseyVault reserves the right to cancel any order due to stock unavailability, pricing errors, or suspected fraud.",
      "In case of cancellation, a full refund will be processed within 5–7 business days.",
    ],
  },
  {
    title: "Shipping & Delivery",
    points: [
      "We ship across India. International shipping is not available at this time.",
      "Standard delivery takes 5–8 business days. Express options may be available at checkout.",
      "Free shipping is available on orders above ₹1,999.",
      "Delivery timelines are estimates and may vary due to courier delays, remote locations, or public holidays.",
      "Once dispatched, a tracking ID will be shared via email or WhatsApp.",
    ],
  },
  {
    title: "Returns & Refunds",
    points: [
      "We offer a 30-day return policy from the date of delivery.",
      "Items must be unused, unwashed, and returned in original packaging with all tags intact.",
      "Returns are not accepted for items damaged due to misuse, or items marked as final sale.",
      "Refunds are processed within 7–10 business days after the returned item is received and inspected.",
      "Shipping charges are non-refundable unless the return is due to our error.",
      "To initiate a return, contact us via WhatsApp at +91 70297 86817.",
    ],
  },
  {
    title: "User Accounts",
    points: [
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You must provide accurate and complete information when creating an account.",
      "JerseyVault reserves the right to suspend or terminate accounts involved in fraudulent or abusive activity.",
      "You may delete your account at any time by contacting our support team.",
    ],
  },
  {
    title: "Intellectual Property",
    points: [
      "All content on thejerseyvault.in — including logos, images, text, and design — is owned by JerseyVault.",
      "You may not reproduce, distribute, or use our content without explicit written permission.",
      "Team logos and player names used on jerseys remain the property of their respective owners and governing bodies.",
    ],
  },
  {
    title: "Limitation of Liability",
    points: [
      "JerseyVault is not liable for indirect, incidental, or consequential damages arising from the use of our site or products.",
      "Our total liability shall not exceed the amount paid for the specific order in question.",
      "We are not responsible for delays caused by third-party courier services.",
    ],
  },
  {
    title: "Governing Law",
    points: [
      "These terms are governed by the laws of India.",
      "Any disputes shall be subject to the exclusive jurisdiction of courts in West Bengal, India.",
      "We encourage resolution of disputes through direct communication before any legal proceedings.",
    ],
  },
];

export default function Terms() {
  return (
    <div style={{ fontFamily:"'Barlow Condensed', sans-serif", background:"#0a0a0a", minHeight:"100vh", color:"#fff" }}>
      <Helmet><link rel="canonical" href="https://www.thejerseyvault.in/terms" /></Helmet>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#39ff14; }
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
        <Link to="/" style={{ textDecoration:"none" }}>
          <BrandLogo />
        </Link>
        <div style={{ display:"flex", gap:32 }}>
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/tracking" className="nav-link">TRACK</Link>
          <Link to="/myorders" className="nav-link">MY ORDERS</Link>
        </div>
        <span style={{ color:"#555", fontSize:12, letterSpacing:3 }}>TERMS & CONDITIONS</span>
      </nav>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"48px 24px" }}>
        {/* HEADER */}
        <div style={{ marginBottom:40, animation:"fadeUp 0.4s ease" }}>
          <p className="legal-eyebrow">LEGAL</p>
          <h1 style={{ fontSize:"clamp(36px,8vw,64px)", fontWeight:900, fontStyle:"italic", lineHeight:0.9 }}>
            TERMS & <span style={{ color:"#39ff14" }}>CONDITIONS</span>
          </h1>
          <p style={{ color:"#555", fontSize:13, fontFamily:"'Barlow',sans-serif", marginTop:14, letterSpacing:1, lineHeight:1.8 }}>
            Effective Date: January 1, 2026 · Last Updated: May 2026<br />
            Please read these terms carefully before using JerseyVault.
          </p>
        </div>

        {/* SECTIONS */}
        {sections.map((s, i) => (
          <div key={s.title} className="section-card" style={{ animationDelay:`${i * 0.06}s` }}>
            <h2 style={{ fontSize:20, fontWeight:900, letterSpacing:2, marginBottom:16 }}>
              <span style={{ color:"#39ff14" }}>0{i + 1} / </span>{s.title.toUpperCase()}
            </h2>
            {s.points.map((p, j) => (
              <div key={j} className="point">{p}</div>
            ))}
          </div>
        ))}

        <div style={{ background:"#39ff1410", border:"1px solid #39ff1430", padding:"20px 24px", marginTop:24, animation:"fadeUp 0.4s ease" }}>
          <p style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:"#aaa", lineHeight:1.8 }}>
            For any questions regarding these terms, reach us at{" "}
            <span style={{ color:"#39ff14", fontWeight:700 }}>support@thejerseyvault.in</span>{" "}
            or WhatsApp <span style={{ color:"#39ff14", fontWeight:700 }}>+91 70297 86817</span>.
          </p>
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