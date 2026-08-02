const fs = require('fs');
const path = require('path');
const GUIDES_DIR = path.join(__dirname, 'client', 'src', 'pages', 'guides');

let files = fs.readdirSync(GUIDES_DIR).filter(f => f.endsWith('.jsx') && f !== 'index.jsx' && f !== 'GuidesIndex.jsx');

let links = files.map(f => {
  const compName = f.replace('.jsx', '');
  const name = compName.replace(/([A-Z])/g, ' $1').trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `            <Link to="/pages/${slug}" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>${name}</Link>`;
}).join('\n');

const componentContent = `import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function GuidesIndex() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '40px 24px', fontFamily: "'Barlow', sans-serif" }}>
      <Helmet>
        <title>Football Jersey Guides & History | Jersey Vault</title>
        <meta name="description" content="Explore our extensive library of football jersey history, club legacy, kit authentication, and care guides." />
        <link rel="canonical" href="https://www.thejerseyvault.in/pages/guides" />
      </Helmet>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, marginBottom: '20px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>
          FOOTBALL JERSEY GUIDES & HISTORY
        </h1>
        <p style={{ color: '#aaa', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px' }}>
          Welcome to the ultimate repository of football kit knowledge. Whether you are looking to authenticate a vintage Nike Dri-FIT shirt, understand the evolution of your club's crest, or figure out how to wash a heat-pressed player issue jersey without ruining it, we have you covered.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
${links}
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(GUIDES_DIR, 'GuidesIndex.jsx'), componentContent);

// Add to App.js
let appContent = fs.readFileSync('client/src/App.js', 'utf8');

const importMarker = '// IMPORT_GUIDES_HERE';
const routeMarker = '{/* ROUTE_GUIDES_HERE */}';

if (!appContent.includes('import GuidesIndex')) {
  appContent = appContent.replace(importMarker, `import GuidesIndex from "./pages/guides/GuidesIndex";\n${importMarker}`);
  appContent = appContent.replace(routeMarker, `            <Route path="/pages/guides" element={<GuidesIndex />} />\n${routeMarker}`);
  fs.writeFileSync('client/src/App.js', appContent);
}

console.log('GuidesIndex generated successfully!');
