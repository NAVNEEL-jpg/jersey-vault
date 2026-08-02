const fs = require('fs');
const path = require('path');
const GUIDES_DIR = path.join(__dirname, 'client', 'src', 'pages', 'guides');

const eeatPages = [
  { name: 'About Us', desc: 'Learn about Jersey Vault, Indias premier destination for authentic and high-quality football jerseys.' },
  { name: 'Quality Promise', desc: 'Our guarantee of unmatched fabric quality, precise detailing, and durable materials.' },
  { name: 'Why Choose Jersey Vault', desc: 'Discover why thousands of fans trust us for their football kits.' },
  { name: 'Customer Support', desc: 'Get in touch with our dedicated support team for all your queries.' },
  { name: 'Brand Story', desc: 'How Jersey Vault started from a passion for football and grew into a nationwide phenomenon.' },
  { name: 'Mission', desc: 'Our mission to bring global football culture to every fan in India.' },
  { name: 'Vision', desc: 'Our vision for the future of football apparel in India.' }
];

let appJsImports = '';
let appJsRoutes = '';

eeatPages.forEach(page => {
  const compName = page.name.replace(/[^a-zA-Z0-9]/g, '');
  const slug = page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const content = `import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function ${compName}() {
  return (
    <GuideLayout
      title="${page.name} | Jersey Vault"
      metaDescription="${page.desc}"
      canonicalUrl="https://www.thejerseyvault.in/pages/${slug}"
      h1="${page.name}"
    >
      <div className="eeat-content" style={{ fontSize: '16px', lineHeight: 1.8, color: '#ddd' }}>
        <p style={{ marginBottom: '20px' }}>
          ${page.desc} At Jersey Vault, we prioritize authenticity, customer satisfaction, and an undying love for the beautiful game.
        </p>
        <h2 style={{ color: '#39ff14', marginTop: '30px', marginBottom: '15px', fontSize: '24px', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
          Our Commitment
        </h2>
        <p style={{ marginBottom: '20px' }}>
          Every product we dispatch undergoes a rigorous multi-point quality check at our fulfillment center. We ensure that stitching, fabric technology (such as Dri-FIT or Heat.RDY), and badge application meet the highest standards. We never compromise on quality because we are fans ourselves.
        </p>
        <h2 style={{ color: '#39ff14', marginTop: '30px', marginBottom: '15px', fontSize: '24px', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
          The Jersey Vault Difference
        </h2>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '30px' }}>
          <li style={{ marginBottom: '10px' }}><strong>Premium Quality:</strong> We source only top-tier materials.</li>
          <li style={{ marginBottom: '10px' }}><strong>Fast Delivery:</strong> Reliable shipping across India with COD.</li>
          <li style={{ marginBottom: '10px' }}><strong>Dedicated Support:</strong> Real humans ready to help you with sizing or order issues.</li>
        </ul>
        <div style={{ marginTop: '40px', padding: '20px', background: '#111', borderLeft: '4px solid #39ff14', borderRadius: '4px' }}>
          <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '18px' }}>Need assistance?</h3>
          <p style={{ margin: 0, color: '#aaa' }}>Reach out to us via our <a href="/contact" style={{ color: '#39ff14' }}>Contact Page</a> or drop us a message on WhatsApp. We are here 24/7 for you.</p>
        </div>
      </div>
    </GuideLayout>
  );
}
`;

  fs.writeFileSync(path.join(GUIDES_DIR, compName + '.jsx'), content);
  
  appJsImports += `import ${compName} from "./pages/guides/${compName}";\n`;
  appJsRoutes += `            <Route path="/pages/${slug}" element={<${compName} />} />\n`;
});

let appContent = fs.readFileSync('client/src/App.js', 'utf8');
const importMarker = '// IMPORT_GUIDES_HERE';
const routeMarker = '{/* ROUTE_GUIDES_HERE */}';

if (!appContent.includes('import AboutUs')) {
  appContent = appContent.replace(importMarker, appJsImports + importMarker);
  appContent = appContent.replace(routeMarker, appJsRoutes + routeMarker);
  fs.writeFileSync('client/src/App.js', appContent);
}

console.log('EEAT pages generated successfully!');
