import { Link } from "react-router-dom";
import logo from "../assets/jerseyvault-logo.jpeg";
import { useState } from "react";
import ReactGA from "react-ga4";

const faqs = [
  {
    category: "ORDERING",
    items: [
      {
        q: "Are the jerseys authentic or replica?",
        a: "We sell both official licensed jerseys and high-quality replicas. Each product listing clearly states whether it is an official or replica jersey. All jerseys are accurately described — we never misrepresent what you're buying.",
      },
      {
        q: "How do I place an order?",
        a: "Browse our shop, select your jersey and size, add it to cart, and proceed to checkout. You can pay via UPI, Card, Net Banking, or Cash on Delivery. You'll receive a confirmation on your email and WhatsApp once the order is placed.",
      },
      {
        q: "Can I order without creating an account?",
        a: "Yes! You can checkout as a guest. However, creating an account lets you track orders, view order history, and makes future checkouts much faster.",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "Orders can be modified or cancelled within 12 hours of placement. After that, the order enters processing and cannot be changed. Contact us immediately on WhatsApp at +91 70297 86817 if you need to make changes.",
      },
    ],
  },
  {
    category: "SIZING",
    items: [
      {
        q: "How do I find the right size?",
        a: "We follow standard Indian sizing (XS, S, M, L, XL, XXL). Football jerseys tend to run slightly slim — if you're between sizes, we recommend sizing up. Refer to the size guide on each product page for chest and length measurements.",
      },
      {
        q: "Do jerseys shrink after washing?",
        a: "Our jerseys are made from polyester and are pre-shrunk. They should not shrink if washed as directed — cold water, gentle cycle, and air-dried. Avoid tumble drying or ironing directly on prints.",
      },
    ],
  },
  {
    category: "SHIPPING & DELIVERY",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 5–8 business days across India. Metro cities like Mumbai, Delhi, Bangalore, and Kolkata typically receive orders within 3–5 days. Remote areas may take slightly longer.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! Orders above ₹1,999 qualify for free shipping. Orders below ₹1,999 attract a flat shipping fee of ₹99.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order is dispatched, you'll receive a tracking ID via email and WhatsApp. You can also use our Track Order page on the website to check your delivery status anytime.",
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we only ship within India. International shipping is something we're actively working on — follow us on Instagram @the_jerseyvault for updates.",
      },
      {
        q: "What if my order is delayed?",
        a: "While we aim for timely delivery, delays can occur due to courier issues, weather, or remote locations. If your order hasn't arrived within 10 business days, contact us on WhatsApp and we'll resolve it immediately.",
      },
    ],
  },
  {
    category: "RETURNS & REFUNDS",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return policy from the date of delivery. Items must be unused, unwashed, with all original tags and packaging intact. We do not accept returns on items that show signs of use, washing, or damage caused by the customer.",
      },
      {
        q: "How do I initiate a return?",
        a: "Contact us on WhatsApp at +91 70297 86817 with your order ID and reason for return. We'll guide you through the process. Once we receive and inspect the item, your refund will be processed within 7–10 business days.",
      },
      {
        q: "I received a wrong or damaged item — what do I do?",
        a: "We sincerely apologise! Please message us on WhatsApp within 48 hours of delivery with photos of the item and your order ID. We'll send a replacement or issue a full refund at no extra cost.",
      },
      {
        q: "How long does a refund take?",
        a: "Refunds are processed within 7–10 business days after we receive and inspect the returned item. The amount is credited back to your original payment method — UPI, bank account, or card.",
      },
    ],
  },
  {
    category: "PAYMENTS",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI (PhonePe, GPay, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery (COD). All online payments are securely processed via Razorpay.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes, COD is available across most pin codes in India. Please have the exact amount ready at the time of delivery.",
      },
      {
        q: "Is it safe to pay online on JerseyVault?",
        a: "Absolutely. All online transactions are encrypted and processed through Razorpay, one of India's most trusted payment gateways. We never store your card or UPI details on our servers.",
      },
    ],
  },
];

export default function FAQ() {
  const [open, setOpen] = useState({});

  const toggle = (cat, question) => {
    const key = `${cat}-${question}`;
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ fontFamily:"'Barlow Condensed', sans-serif", background:"#0a0a0a", minHeight:"100vh", color:"#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#39ff14; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes expandIn { from{opacity:0;max-height:0;} to{opacity:1;max-height:400px;} }
        .nav-link { color:#bbb; text-decoration:none; font-weight:600; letter-spacing:2px; font-size:13px; transition:color 0.2s; cursor:pointer; position:relative; }
        .nav-link::after { content:''; position:absolute; left:0; bottom:-3px; width:0; height:2px; background:#39ff14; transition:width 0.25s cubic-bezier(0.25,1,0.5,1); border-radius:2px; }
        .nav-link:hover { color:#39ff14; }
        .nav-link:hover::after { width:100%; }
        .faq-item { background:#111; border:1px solid #1a1a1a; margin-bottom:6px; transition:border-color 0.2s; }
        .faq-item.open { border-color:#39ff1440; }
        .faq-q { display:flex; justify-content:space-between; align-items:center; padding:18px 20px; cursor:pointer; gap:16px; width:100%; background:transparent; border:none; color:inherit; font:inherit; text-align:left; }
        .faq-q:hover { background:#151515; }
        .faq-a { padding:0 20px 18px; font-family:'Barlow',sans-serif; font-size:14px; color:#888; line-height:1.8; border-top:1px solid #1a1a1a; padding-top:14px; overflow:hidden; }
        .faq-a.open { animation: expandIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
        .cat-label { font-size:12px; letter-spacing:4px; color:#39ff14; font-weight:700; margin:28px 0 10px; }
        .plus { width:24px; height:24px; border:1px solid #333; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:16px; transition:all 0.2s; color:#555; }
        .plus.open { background:#39ff14; color:#000; border-color:#39ff14; }
        .legal-nav { background:rgba(10,10,10,0.95); border-bottom:1px solid #1a1a1a; padding:0 24px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
        .legal-eyebrow { color:#39ff14; letter-spacing:6px; font-size:12px; font-weight:700; margin-bottom:8px; }
        .faq-cta-whatsapp { background:#25D366; color:#000; padding:12px 28px; font-weight:900; font-size:14px; letter-spacing:3px; text-decoration:none; display:inline-block; }
        .faq-cta-instagram { background:transparent; color:#fff; border:1px solid #333; padding:12px 28px; font-weight:900; font-size:14px; letter-spacing:3px; text-decoration:none; display:inline-block; }
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
        <span style={{ color:"#555", fontSize:12, letterSpacing:3 }}>FAQ</span>
      </nav>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"48px 24px" }}>

        {/* HEADER */}
        <div style={{ marginBottom:40, animation:"fadeUp 0.4s ease" }}>
          <p className="legal-eyebrow">HELP CENTER</p>
          <h1 style={{ fontSize:"clamp(36px,8vw,64px)", fontWeight:900, fontStyle:"italic", lineHeight:0.9 }}>
            FREQUENTLY ASKED <span style={{ color:"#39ff14" }}>QUESTIONS</span>
          </h1>
          <p style={{ color:"#555", fontSize:13, fontFamily:"'Barlow',sans-serif", marginTop:14, letterSpacing:1, lineHeight:1.8 }}>
            Can't find your answer? Message us on WhatsApp at <span style={{ color:"#39ff14" }}>+91 70297 86817</span>
          </p>
        </div>

        {/* FAQ ACCORDION */}
        {faqs.map((cat) => (
          <div key={cat.category}>
            <div className="cat-label">— {cat.category}</div>
            {cat.items.map((item) => {
              const key = `${cat.category}-${item.q}`;
              const isOpen = !!open[key];
              return (
                <div key={key} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button type="button" className="faq-q" onClick={() => toggle(cat.category, item.q)} aria-expanded={isOpen}>
                    <span style={{ fontWeight:700, fontSize:16, letterSpacing:1, lineHeight:1.4, color: isOpen ? "#fff" : "#ccc" }}>
                      {item.q}
                    </span>
                    <div className={`plus ${isOpen ? "open" : ""}`}>
                      {isOpen ? "−" : "+"}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="faq-a open">{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* STILL NEED HELP */}
        <div style={{ background:"#39ff1410", border:"1px solid #39ff1430", padding:"28px", marginTop:40, textAlign:"center", animation:"fadeUp 0.4s ease" }}>
          <div style={{ fontSize:28, marginBottom:12 }}>💬</div>
          <h3 style={{ fontSize:22, fontWeight:900, fontStyle:"italic", marginBottom:8 }}>STILL NEED <span style={{ color:"#39ff14" }}>HELP?</span></h3>
          <p style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:"#888", lineHeight:1.8, marginBottom:20 }}>
            Our support team is available Mon–Sat, 10AM–8PM IST.<br />
            We typically respond within a few hours.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="https://wa.me/917029786817" target="_blank" rel="noopener noreferrer" className="faq-cta-whatsapp"
               onClick={() => ReactGA.event("whatsapp_click", { source: "FAQ" })}>
              WHATSAPP US →
            </a>
            <a href="https://instagram.com/the_jerseyvault" target="_blank" rel="noopener noreferrer" className="faq-cta-instagram">
              DM ON INSTAGRAM
            </a>
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