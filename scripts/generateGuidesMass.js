const fs = require('fs');
const path = require('path');
const GUIDES_DIR = path.join(__dirname, 'client', 'src', 'pages', 'guides');

const topics = [
  'Barcelona Club History', 'Real Madrid Club History', 'Manchester United Club History', 'Manchester City Club History',
  'Arsenal Club History', 'Chelsea Club History', 'Liverpool Club History', 'Tottenham Club History', 'PSG Club History',
  'Juventus Club History', 'AC Milan Club History', 'Inter Milan Club History', 'Bayern Munich Club History',
  'Messi Career Jerseys', 'Cristiano Ronaldo Career Jerseys', 'Mbappe Kit Evolution', 'Bellingham First Season',
  'Neymar Classic Kits', 'Ronaldinho Iconic Jerseys', 'Zidane Best Kits', 'Maradona Napoli Jerseys',
  'Pele Brazil Kits', 'Beckham United to Madrid', 'Rooney Manchester United Eras', 'Henry Arsenal Invincibles',
  'World Cup 1994 Kits', 'World Cup 1998 Kits', 'World Cup 2002 Kits', 'World Cup 2006 Kits', 'World Cup 2010 Kits',
  'World Cup 2014 Kits', 'World Cup 2018 Kits', 'World Cup 2022 Kits',
  'Champions League 1999', 'Champions League 2005 Istanbul', 'Champions League 2008', 'Champions League 2012',
  'Champions League 2014 La Decima', 'Champions League 2022',
  'How to authenticate a Nike jersey', 'How to authenticate an Adidas jersey', 'How to authenticate a Puma jersey',
  'Understanding Nike Dri-FIT ADV', 'Understanding Adidas Heat.RDY', 'Understanding Puma Ultraweave',
  'The evolution of football shirt sponsors', 'History of numbered football shirts', 'Why football shirts have stars',
  'Football shirt typography guide', 'How to store your football shirts', 'Removing stains from football shirts',
  'How to frame a football shirt', 'The rise of football shirts in streetwear', 'Blokecore fashion guide',
  'Top 10 Premier League kits of all time', 'Top 10 La Liga kits of all time', 'Top 10 Serie A kits of all time',
  'Top 10 International kits of all time', 'The most controversial football kits', 'Banned football kits',
  'Football kits that changed the rules', 'Why do some kits have long sleeves', 'The return of the collar in football kits',
  'Goalkeeper kit evolution', 'Why do goalkeepers wear different colors', 'The best goalkeeper kits of the 90s',
  'Jorge Campos iconic kits', 'Peter Schmeichel iconic kits', 'Gianluigi Buffon iconic kits',
  'The history of the Brazil yellow shirt', 'The history of the Argentina stripes', 'The history of the France blue shirt',
  'The history of the England white shirt', 'The history of the Italy blue shirt', 'The history of the Netherlands orange shirt',
  'Why does Germany wear white', 'Why does Italy wear blue', 'Why does Netherlands wear orange',
  'The worst football kits in history', 'Football kits ruined by sponsors', 'The best sponsorless football kits',
  'Centenary football kits', 'Anniversary football kits', 'Special edition football kits',
  'Blackout football kits', 'Whiteout football kits', 'Neon football kits',
  'The impact of fast fashion on football kits', 'Sustainable football kits', 'Recycled ocean plastic football kits',
  'How football kits are manufactured', 'The economics of football kit deals', 'The biggest kit supplier deals in history',
  'Nike vs Adidas football rivalry', 'Puma\'s rise in football', 'Castore\'s entry into football',
  'Umbro\'s legacy in football', 'Kappa\'s iconic 90s designs', 'Macron\'s dominance in lower leagues',
  'Hummel\'s unique chevron designs'
];

function createGuideComponent(topic) {
  const componentName = topic.replace(/[^a-zA-Z0-9]/g, '');
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  return `import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function ${componentName}() {
  const faqs = [
    { q: "What makes ${topic} so significant?", a: "${topic} represents a major milestone in football history and culture, influencing designs and fans globally." },
    { q: "Where can I buy kits related to ${topic}?", a: "You can explore our extensive collection of retro, classic, and modern kits directly on The Jersey Vault." }
  ];

  return (
    <GuideLayout
      title="${topic} | Jersey Vault Guide"
      metaDescription="The ultimate guide to ${topic}. Discover the history, significance, and best classic kits related to this iconic era of football."
      canonicalUrl="https://www.thejerseyvault.in/pages/${slug}"
      h1="${topic}"
      faqs={faqs}
    >
      <p>Welcome to our comprehensive guide on <strong>${topic}</strong>. Football is more than just a game; it's a tapestry of history, culture, and iconic moments immortalized in the fabric of the kits worn by legends.</p>
      
      <h2>The Legacy and Impact</h2>
      <p>${topic} holds a special place in the hearts of football purists. From the tactical innovations on the pitch to the sartorial choices that defined an era, the kits associated with this topic are highly sought after by collectors worldwide. We pride ourselves on sourcing the highest quality versions of these legendary shirts.</p>

      <h2>Key Elements and Design Language</h2>
      <p>When examining ${topic}, one must appreciate the nuances in design. Whether it is the transition from heavy cotton to lightweight polyester, or the evolution of heat-pressed sponsors versus embroidered crests, the manufacturing techniques tell a story of technological advancement in sportswear.</p>

      <h2>Collecting and Preserving</h2>
      <p>For collectors, finding items related to ${topic} in pristine condition is a true challenge. We recommend following our <a href="/pages/care-guide">Care Guide</a> to ensure any classic pieces you acquire remain in mint condition for years to come.</p>
      
      <div style={{ marginTop: "24px" }}>
        <a href="/collections/retro" style={{ display: "inline-block", background: "#39ff14", color: "#000", padding: "12px 24px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", borderRadius: "4px", textDecoration: "none" }}>
          Explore Retro Collection
        </a>
      </div>
    </GuideLayout>
  );
}
`;
}

if (!fs.existsSync(GUIDES_DIR)) {
  fs.mkdirSync(GUIDES_DIR, { recursive: true });
}

let appJsImports = '';
let appJsRoutes = '';

topics.forEach(topic => {
  const compName = topic.replace(/[^a-zA-Z0-9]/g, '');
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  fs.writeFileSync(path.join(GUIDES_DIR, compName + '.jsx'), createGuideComponent(topic));
  
  appJsImports += `import ${compName} from "./pages/guides/${compName}";\n`;
  appJsRoutes += `            <Route path="/pages/${slug}" element={<${compName} />} />\n`;
});

// Update App.js
let appContent = fs.readFileSync('client/src/App.js', 'utf8');

const importMarker = '// IMPORT_GUIDES_HERE';
const routeMarker = '{/* ROUTE_GUIDES_HERE */}';

if (!appContent.includes(importMarker)) {
  appContent = appContent.replace('import ReturnsGuide from "./pages/guides/ReturnsGuide";', 'import ReturnsGuide from "./pages/guides/ReturnsGuide";\n' + importMarker);
}
if (!appContent.includes(routeMarker)) {
  appContent = appContent.replace('<Route path="/pages/returns-guide" element={<ReturnsGuide />} />', '<Route path="/pages/returns-guide" element={<ReturnsGuide />} />\n' + routeMarker);
}

appContent = appContent.replace(importMarker, appJsImports);
appContent = appContent.replace(routeMarker, appJsRoutes);

fs.writeFileSync('client/src/App.js', appContent);

console.log('Successfully generated 100 dynamic SEO guide pages and injected them into App.js!');
