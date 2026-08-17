const fs = require('fs');
const path = require('path');

const homeFile = path.join(__dirname, '..', 'client', 'src', 'pages', 'Home.jsx');
let content = fs.readFileSync(homeFile, 'utf8');

const targetBlock = `{collectionSlug && COLLECTION_MAPPING[collectionSlug] ? (
          <section style={{ background: "#050505", padding: "60px 24px", textAlign: "center" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, fontStyle: "italic", marginBottom: 16, letterSpacing: 2, color: "#fff" }}>
                {COLLECTION_MAPPING[collectionSlug].h1}
              </h2>
              <p style={{ color: "#aaa", fontSize: 14, fontFamily: "'Barlow',sans-serif", lineHeight: 1.8 }}>
                {COLLECTION_MAPPING[collectionSlug].desc}
              </p>
            </div>
          </section>
        ) : (`;

const newBlock = `{collectionSlug && COLLECTION_MAPPING[collectionSlug] ? (
          <section style={{ background: "#050505", padding: "60px 24px", textAlign: "left" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {/* Breadcrumbs */}
              <nav aria-label="breadcrumb" style={{ marginBottom: "24px", fontSize: "13px", fontFamily: "'Barlow', sans-serif" }}>
                <Link to="/" style={{ color: "#39ff14", textDecoration: "none" }}>Home</Link> 
                <span style={{ margin: "0 8px", color: "#555" }}>/</span>
                <Link to="/collections" style={{ color: "#39ff14", textDecoration: "none" }}>Collections</Link>
                <span style={{ margin: "0 8px", color: "#555" }}>/</span>
                <span style={{ color: "#aaa" }}>{COLLECTION_MAPPING[collectionSlug].title}</span>
              </nav>

              <h2 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", marginBottom: 24, letterSpacing: 1, color: "#fff" }}>
                {COLLECTION_MAPPING[collectionSlug].h1}
              </h2>
              
              <div style={{ color: "#bbb", fontSize: 15, fontFamily: "'Barlow',sans-serif", lineHeight: 1.8, marginBottom: 40 }} dangerouslySetInnerHTML={{ __html: COLLECTION_MAPPING[collectionSlug].longDescription || COLLECTION_MAPPING[collectionSlug].desc }} />
              
              {COLLECTION_MAPPING[collectionSlug].faqs && (
                <div style={{ marginTop: 40, borderTop: "1px solid #222", paddingTop: 40 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 900, fontStyle: "italic", marginBottom: 24, color: "#fff" }}>Frequently Asked Questions</h3>
                  {COLLECTION_MAPPING[collectionSlug].faqs.map((faq, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: 18, fontWeight: 700, color: "#39ff14", marginBottom: 8, fontFamily: "'Barlow',sans-serif" }}>{faq.q}</h4>
                      <p style={{ fontSize: 15, color: "#aaa", fontFamily: "'Barlow',sans-serif", lineHeight: 1.6 }}>{faq.a}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Collections & Guides Placeholder (Semantic Hub) */}
              <div style={{ marginTop: 60, display: "flex", flexWrap: "wrap", gap: "40px" }}>
                <div style={{ flex: "1 1 300px" }}>
                  <h4 style={{ fontSize: 20, fontWeight: 900, fontStyle: "italic", borderBottom: "1px solid #333", paddingBottom: 12, marginBottom: 16 }}>Related Collections</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                    {Object.keys(COLLECTION_MAPPING).filter(k => k !== collectionSlug).sort(() => 0.5 - Math.random()).slice(0, 6).map(k => (
                      <li key={k} style={{ marginBottom: 10 }}>
                        <Link to={\`/collections/\${k}\`} style={{ color: "#888", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "#39ff14"} onMouseOut={e => e.target.style.color = "#888"}>
                          ➔ {COLLECTION_MAPPING[k].title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: "1 1 300px" }}>
                  <h4 style={{ fontSize: 20, fontWeight: 900, fontStyle: "italic", borderBottom: "1px solid #333", paddingBottom: 12, marginBottom: 16 }}>Related Guides</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                    <li style={{ marginBottom: 10 }}><Link to="/pages/care-guide" style={{ color: "#888", textDecoration: "none" }}>➔ Care Guide</Link></li>
                    <li style={{ marginBottom: 10 }}><Link to="/pages/size-guide" style={{ color: "#888", textDecoration: "none" }}>➔ Size Guide</Link></li>
                    <li style={{ marginBottom: 10 }}><Link to="/pages/retro-guide" style={{ color: "#888", textDecoration: "none" }}>➔ Retro Shirts Guide</Link></li>
                    <li style={{ marginBottom: 10 }}><Link to="/pages/player-vs-fan" style={{ color: "#888", textDecoration: "none" }}>➔ Player vs Fan Version</Link></li>
                    <li style={{ marginBottom: 10 }}><Link to="/pages/materials-guide" style={{ color: "#888", textDecoration: "none" }}>➔ Materials Guide</Link></li>
                  </ul>
                </div>
              </div>

            </div>
          </section>
        ) : (`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, newBlock);
  fs.writeFileSync(homeFile, content);
  console.log("Successfully injected Collection E-E-A-T block into Home.jsx");
} else {
  console.log("Could not find the target block in Home.jsx");
}
