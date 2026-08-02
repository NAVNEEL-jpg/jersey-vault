import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function GuideLayout({ 
  title, 
  metaDescription, 
  canonicalUrl, 
  h1, 
  children, 
  faqs = [], 
  lastUpdated = "2026-08-01",
  author = "Jersey Vault Team" 
}) {
  const schemaBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.thejerseyvault.in/" },
      { "@type": "ListItem", "position": 2, "name": "Guides", "item": "https://www.thejerseyvault.in/pages" },
      { "@type": "ListItem", "position": 3, "name": title, "item": canonicalUrl }
    ]
  };

  const schemaFaq = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  } : null;

  return (
    <>
      <Helmet>
        <title>{title} | The Jersey Vault</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={`${title} | The Jersey Vault`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="The Jersey Vault" />
        <meta property="article:published_time" content={`${lastUpdated}T00:00:00Z`} />
        <meta property="article:modified_time" content={`${lastUpdated}T00:00:00Z`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${title} | The Jersey Vault`} />
        <meta name="twitter:description" content={metaDescription} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbs) }} />
        {schemaFaq && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }} />
        )}
      </Helmet>

      <main style={{ padding: "60px 24px", background: "#0a0a0a", minHeight: "100vh", color: "#ddd", marginTop: "64px" }}>
        <article style={{ maxWidth: 800, margin: "0 auto", background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "40px" }}>
          
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" style={{ marginBottom: "24px", fontSize: "13px", fontFamily: "'Barlow', sans-serif" }}>
            <Link to="/" style={{ color: "#39ff14", textDecoration: "none" }}>Home</Link> 
            <span style={{ margin: "0 8px", color: "#555" }}>/</span>
            <span style={{ color: "#aaa" }}>{title}</span>
          </nav>

          <header style={{ marginBottom: "40px", borderBottom: "1px solid #222", paddingBottom: "24px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: 900, fontStyle: "italic", margin: "0 0 16px 0", color: "#fff", letterSpacing: "1px" }}>
              {h1}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "14px", color: "#888", fontFamily: "'Barlow', sans-serif" }}>
              <span>By <strong>{author}</strong></span>
              <span>•</span>
              <span>Updated: {lastUpdated}</span>
            </div>
          </header>

          <div className="guide-content" style={{ fontFamily: "'Barlow', sans-serif", lineHeight: 1.8, fontSize: "16px" }}>
            {children}
          </div>

          <footer style={{ marginTop: "60px", paddingTop: "40px", borderTop: "1px solid #222" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>Keep Exploring</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Link to="/collections/retro" style={{ padding: "16px", border: "1px solid #333", borderRadius: "4px", textDecoration: "none", color: "#fff", background: "#151515", display: "block" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px", color: "#39ff14" }}>Retro Collection →</div>
                <div style={{ fontSize: "12px", color: "#888" }}>Discover classic football kits from the 90s and 2000s.</div>
              </Link>
              <Link to="/collections/player-version" style={{ padding: "16px", border: "1px solid #333", borderRadius: "4px", textDecoration: "none", color: "#fff", background: "#151515", display: "block" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px", color: "#39ff14" }}>Player Version Kits →</div>
                <div style={{ fontSize: "12px", color: "#888" }}>Shop the exact match-issue jerseys worn by the pros.</div>
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
                <Link to="/pages/size-guide" style={{ color: "#aaa", fontSize: "13px" }}>Size Guide</Link>
                <Link to="/pages/shipping-guide" style={{ color: "#aaa", fontSize: "13px" }}>Shipping & Delivery</Link>
                <Link to="/pages/returns-guide" style={{ color: "#aaa", fontSize: "13px" }}>Returns & Exchanges</Link>
            </div>
          </footer>
        </article>
      </main>
      
      <style>{`
        .guide-content h2 { font-size: 24px; font-weight: 800; color: #fff; margin: 40px 0 16px 0; }
        .guide-content h3 { font-size: 20px; font-weight: 700; color: #ddd; margin: 32px 0 12px 0; }
        .guide-content p { margin-bottom: 20px; color: #ccc; }
        .guide-content ul { margin: 0 0 24px 24px; color: #ccc; }
        .guide-content li { margin-bottom: 10px; }
        .guide-content strong { color: #fff; }
        .guide-content a { color: #39ff14; text-decoration: none; }
        .guide-content a:hover { text-decoration: underline; }
        .guide-content .faq-block { background: #151515; border: 1px solid #222; border-radius: 6px; padding: 20px; margin-bottom: 16px; }
        .guide-content .faq-q { font-weight: 700; color: #fff; margin-bottom: 8px; font-size: 18px; }
        .guide-content .faq-a { color: #aaa; margin-bottom: 0; }
      `}</style>
    </>
  );
}
