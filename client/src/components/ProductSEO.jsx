import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { generateProductSlug } from '../utils/product-slugs';

export default function ProductSEO({ jersey, reviews = [] }) {
  if (!jersey) return null;

  const productName = jersey.name.toUpperCase();
  const isPlayerVersion = productName.includes("PLAYER") || (jersey.category || "").toUpperCase().includes("PLAYER") || (jersey.type || "").toUpperCase().includes("PLAYER");
  const jerseyType = isPlayerVersion ? "Player Version" : "Fan Version";
  const brandName = "Jersey Vault";

  const breadcrumbs = [
    { name: "Home", url: "https://www.thejerseyvault.in/" },
    { name: "Collections", url: "https://www.thejerseyvault.in/teams" },
    { name: productName, url: `https://www.thejerseyvault.in/product/${generateProductSlug(jersey.name)}` }
  ];

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1) 
    : "5.0";

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": jersey.name,
    "image": jersey.image_url,
    "sku": jersey.id || `JV-${generateProductSlug(jersey.name).substring(0, 10).toUpperCase()}`,
    "description": jersey.description || `Buy the official ${jersey.name} in India. Premium quality ${jerseyType} football kit with secure delivery.`,
    "brand": {
      "@type": "Brand",
      "name": brandName
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.thejerseyvault.in/product/${generateProductSlug(jersey.name)}`,
      "priceCurrency": "INR",
      "price": jersey.price,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": jersey.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "d"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 3,
            "maxValue": 7,
            "unitCode": "d"
          }
        }
      }
    },
    ...(reviews.length > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": avgRating,
        "reviewCount": reviews.length
      },
      "review": reviews.slice(0, 3).map(r => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating || 5,
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": r.reviewer_name || "Verified Buyer"
        }
      }))
    })
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": b.name,
      "item": b.url
    }))
  };

  const faqs = [
    {
      question: `Is the ${jersey.name} a Player Version or Fan Version?`,
      answer: `This is a ${jerseyType} kit. ${isPlayerVersion ? "It features an athletic slim fit, heat-pressed badges, and advanced breathable fabric meant for on-pitch performance." : "It features a relaxed standard fit with embroidered badges, perfect for casual everyday wear."}`
    },
    {
      question: "How should I choose my size?",
      answer: isPlayerVersion ? "Player versions run very tight. We highly recommend ordering ONE SIZE UP from your normal t-shirt size for a comfortable fit." : "Fan versions run true to size. You can confidently order your standard t-shirt size."
    },
    {
      question: "Is Cash on Delivery (COD) available?",
      answer: "Yes! We offer Cash on Delivery across 95% of Indian pincodes."
    },
    {
      question: "What is your return and exchange policy?",
      answer: "We offer a 7-day hassle-free size exchange policy for uncustomized jerseys with tags attached."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };

  return (
    <div className="product-seo-container" style={{ padding: "40px 24px", maxWidth: "800px", margin: "0 auto", background: "#050505", borderTop: "1px solid #1a1a1a", marginTop: 40, fontFamily: "'Barlow', sans-serif" }}>
      <Helmet>
        <title>{jersey.name} | Buy Online India | {brandName}</title>
        <meta name="description" content={`Buy the ${jersey.name} online in India. Premium ${jerseyType}, 7-day exchanges, and COD available. Get yours today at Jersey Vault.`} />
        <link rel="canonical" href={`https://www.thejerseyvault.in/product/${generateProductSlug(jersey.name)}`} />
        
        <meta property="og:title" content={`${jersey.name} | ${brandName}`} />
        <meta property="og:description" content={`Premium quality ${jerseyType} kit available now.`} />
        <meta property="og:image" content={jersey.image_url} />
        <meta property="og:url" content={`https://www.thejerseyvault.in/product/${generateProductSlug(jersey.name)}`} />
        <meta property="og:type" content="product" />
        
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Breadcrumbs UI */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "20px", fontSize: "12px", color: "#888", display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span>/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span style={{ color: "#fff", fontWeight: 700 }}>{b.name}</span>
            ) : (
              <Link to="/" style={{ color: "#39ff14", textDecoration: "none" }}>{b.name}</Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Dynamic SEO Description */}
      <section style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", marginBottom: 16, letterSpacing: 1, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
          ABOUT THE {productName}
        </h1>
        
        <div style={{ color: "#aaa", fontSize: 15, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 16 }}>
            Experience the ultimate football culture with the <strong>{jersey.name}</strong>. Designed for true supporters in India, this <strong>{jerseyType.toLowerCase()}</strong> is crafted from premium polyester materials offering unmatched breathability and sweat-wicking performance on and off the pitch.
          </p>
          
          <h2 style={{ fontSize: 18, color: "#39ff14", marginTop: 24, marginBottom: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Material & Fit</h2>
          <p style={{ marginBottom: 16 }}>
            {isPlayerVersion 
              ? "Engineered with advanced ultra-lightweight fabric. The player issue features an athletic, slim fit with 3D heat-pressed rubberized logos for zero distraction. We highly recommend sizing up for a comfortable fit."
              : "Built for everyday durability and comfort. The fan version features a relaxed, straight cut with high-density embroidered crests that withstand frequent washing."
            }
          </p>
          
          <h2 style={{ fontSize: 18, color: "#39ff14", marginTop: 24, marginBottom: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Quality Promise & Shipping</h2>
          <p style={{ marginBottom: 16 }}>
            Every kit undergoes a strict quality check at our Indian warehouse before dispatch. Enjoy <strong>Cash on Delivery (COD)</strong> nationwide with fast 4-7 day tracked shipping via Delhivery or BlueDart. If the fit isn't right, our 7-day hassle-free exchange policy has you covered.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "40px" }}>
        <div style={{ flex: "1 1 45%", background: "#111", padding: "16px", borderRadius: "6px", border: "1px solid #222" }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>🛡️</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>Premium Quality</div>
          <div style={{ color: "#888", fontSize: "12px" }}>Imported Thailand master quality materials.</div>
        </div>
        <div style={{ flex: "1 1 45%", background: "#111", padding: "16px", borderRadius: "6px", border: "1px solid #222" }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>📦</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>Fast Delivery & COD</div>
          <div style={{ color: "#888", fontSize: "12px" }}>Pay at your doorstep anywhere in India.</div>
        </div>
        <div style={{ flex: "1 1 45%", background: "#111", padding: "16px", borderRadius: "6px", border: "1px solid #222" }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>🔄</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>Easy Size Exchanges</div>
          <div style={{ color: "#888", fontSize: "12px" }}>7-day hassle-free size replacement policy.</div>
        </div>
        <div style={{ flex: "1 1 45%", background: "#111", padding: "16px", borderRadius: "6px", border: "1px solid #222" }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>🔒</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>Secure Checkout</div>
          <div style={{ color: "#888", fontSize: "12px" }}>256-bit encrypted Razorpay integration.</div>
        </div>
      </section>

      {/* Dynamic FAQ */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>FREQUENTLY ASKED QUESTIONS</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {faqs.map((faq, index) => (
            <div key={index} style={{ borderBottom: "1px solid #222", paddingBottom: "16px" }}>
              <div style={{ color: "#39ff14", fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>Q: {faq.question}</div>
              <div style={{ color: "#aaa", fontSize: "14px", lineHeight: 1.6 }}>{faq.answer}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Internal Linking to Guides & Collections */}
      <section style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
        <div style={{ flex: "1 1 300px", background: "#0c0c0c", padding: "20px", borderRadius: "6px", border: "1px solid #222" }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>HELPFUL GUIDES</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link to="/pages/player-vs-fan" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Player vs Fan Version →</Link>
            <Link to="/pages/size-guide" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Complete Size Guide →</Link>
            <Link to="/pages/care-guide" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Washing & Care Guide →</Link>
            <Link to="/pages/returns-guide" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Returns Policy →</Link>
            <Link to="/pages/materials-guide" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Materials Guide →</Link>
          </div>
        </div>

        <div style={{ flex: "1 1 300px", background: "#0c0c0c", padding: "20px", borderRadius: "6px", border: "1px solid #222" }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>EXPLORE COLLECTIONS</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link to="/collections/retro" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Retro Classic Kits →</Link>
            <Link to="/collections/player-version" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Elite Player Editions →</Link>
            <Link to="/collections/premier-league" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Premier League →</Link>
            <Link to="/collections/la-liga" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>La Liga →</Link>
            <Link to="/collections/international" style={{ color: "#39ff14", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>International Teams →</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
