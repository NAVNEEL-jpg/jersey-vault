const fs = require('fs');
const path = require('path');

const GUIDES_DIR = path.join(__dirname, 'client', 'src', 'pages', 'guides');

function generatePage(name, title, desc, h1) {
  return `
import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function ${name}() {
  return (
    <GuideLayout
      title="${title}"
      metaDescription="${desc}"
      canonicalUrl="https://www.thejerseyvault.in/pages/${name.toLowerCase()}"
      h1="${h1}"
    >
      <p>Welcome to our comprehensive guide on ${title}. At Jersey Vault, we are dedicated to providing the ultimate football jersey experience in India.</p>
      <h2>What You Need to Know</h2>
      <p>Whether you're looking for the best fit, authentic patches, or long-lasting print quality, understanding the nuances of your football kit is essential. Player versions are tailored for elite performance, featuring lightweight, sweat-wicking technologies like Nike Dri-FIT ADV and Adidas Heat.RDY. In contrast, fan versions provide a classic, relaxed fit perfect for everyday wear and durability.</p>
      <h2>Maintenance and Care</h2>
      <p>Proper maintenance guarantees the longevity of your jersey. Always wash inside out with cold water to protect heat-pressed sponsor logos, and never tumble dry. When customizing, ensure high-quality vinyl prints are used to match the exact specifications worn by players on the pitch.</p>
      <h2>Why Shop with Us?</h2>
      <p>We source only the highest quality kits, ensuring correct stitching, accurate sizing, and authentic design language. Experience seamless delivery across India, including COD options, and join thousands of satisfied football fans.</p>
    </GuideLayout>
  );
}
`;
}

const files = [
  { name: 'SizeGuide.jsx', title: 'Size Guide', desc: 'Find the perfect fit for your football jersey with our detailed size guide.', h1: 'Football Jersey Size Guide' },
  { name: 'PlayerVsFan.jsx', title: 'Player Version vs Fan Version', desc: 'Understand the difference between authentic match issue and replica fan football jerseys.', h1: 'Player Version vs Fan Version' },
  { name: 'BuyingGuide.jsx', title: 'Football Jersey Buying Guide', desc: 'The ultimate guide to buying football jerseys in India. Tips for collectors and beginners.', h1: 'The Ultimate Football Jersey Buying Guide' },
  { name: 'CareGuide.jsx', title: 'Jersey Care Guide', desc: 'Learn how to wash, dry, and store your football kits to prevent peeling and damage.', h1: 'Football Jersey Care & Maintenance' },
  { name: 'MaterialsGuide.jsx', title: 'Football Jersey Materials Guide', desc: 'Discover the advanced fabrics used in modern football kits, from Dri-FIT to Heat.RDY.', h1: 'Football Jersey Materials & Technology' },
  { name: 'RetroGuide.jsx', title: 'Retro Jersey Guide', desc: 'Everything you need to know about collecting and wearing classic vintage football shirts.', h1: 'The Retro Football Jersey Guide' },
  { name: 'PatchGuide.jsx', title: 'Patch Guide', desc: 'A detailed look at sleeve patches for the Premier League, Champions League, and more.', h1: 'Football Jersey Patch Guide' },
  { name: 'PrintingGuide.jsx', title: 'Printing Guide', desc: 'How jersey customization works: official fonts, vinyl pressing, and care instructions.', h1: 'Jersey Customization & Printing Guide' }
];

files.forEach(f => {
  fs.writeFileSync(path.join(GUIDES_DIR, f.name), generatePage(f.name.replace('.jsx',''), f.title, f.desc, f.h1));
});
console.log('Successfully generated remaining React Guide Pages.');
