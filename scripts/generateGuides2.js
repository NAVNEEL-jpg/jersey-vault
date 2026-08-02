const fs = require('fs');
const path = require('path');

const GUIDES_DIR = path.join(__dirname, 'client', 'src', 'pages', 'guides');

if (!fs.existsSync(GUIDES_DIR)) {
  fs.mkdirSync(GUIDES_DIR, { recursive: true });
}

function generateShippingGuide() {
  return `
import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function ShippingGuide() {
  return (
    <GuideLayout
      title="Shipping and Delivery Policy"
      metaDescription="Details on Jersey Vault's shipping timelines, Cash on Delivery (COD) availability, and order tracking across India."
      canonicalUrl="https://www.thejerseyvault.in/pages/shipping-guide"
      h1="Shipping & Delivery Information"
    >
      <p>We know you are excited to receive your new kit. We partner with India's most reliable courier services (BlueDart, Delhivery, ExpressBees) to ensure your jersey reaches you safely and quickly.</p>
      <h2>Standard Delivery Timelines</h2>
      <ul>
        <li><strong>Metro Cities (Mumbai, Delhi, Bangalore, Chennai, Kolkata):</strong> 3-5 business days.</li>
        <li><strong>Tier 2 & 3 Cities:</strong> 5-7 business days.</li>
        <li><strong>North East & J&K:</strong> 7-10 business days.</li>
      </ul>
      <h2>Cash on Delivery (COD)</h2>
      <p>We proudly offer Cash on Delivery across 95% of Indian pincodes. A nominal convenience fee may apply to COD orders. To ensure seamless delivery, please keep the exact cash ready when the delivery executive arrives.</p>
      <h2>Customized Jerseys</h2>
      <p>If you ordered a jersey with a custom name and number, please allow an additional 24-48 hours for processing. Custom printing requires precision heat-pressing in our warehouse before dispatch.</p>
    </GuideLayout>
  );
}
`;
}

function generateReturnsGuide() {
  return `
import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function ReturnsGuide() {
  return (
    <GuideLayout
      title="Returns & Exchanges Policy"
      metaDescription="Learn about Jersey Vault's hassle-free return and size exchange policies for football jerseys."
      canonicalUrl="https://www.thejerseyvault.in/pages/returns-guide"
      h1="Returns & Exchanges"
    >
      <p>We want you to be 100% satisfied with your purchase. If the fit isn't right, we offer a straightforward exchange process.</p>
      <h2>Size Exchanges</h2>
      <p>If you ordered the wrong size, you can request an exchange within 7 days of delivery. The jersey must be unworn, unwashed, and have all original tags intact. <strong>Note:</strong> We highly recommend reviewing our <a href="/pages/size-guide">Size Guide</a> before ordering, especially for Player Version kits.</p>
      <h2>Customized Jerseys</h2>
      <p><strong>Strict Policy:</strong> Jerseys that have been customized with a specific name and number (e.g., 'MESSI 10' or your own name) are <strong>FINAL SALE</strong> and cannot be returned or exchanged under any circumstances, unless the item arrived defective.</p>
      <h2>How to Initiate an Exchange</h2>
      <p>Please contact our support team via WhatsApp or email with your Order ID and photo evidence of the tags. We will arrange a reverse pickup from your address.</p>
    </GuideLayout>
  );
}
`;
}

const files = [
  { name: 'ShippingGuide.jsx', content: generateShippingGuide() },
  { name: 'ReturnsGuide.jsx', content: generateReturnsGuide() }
];

files.forEach(f => {
  fs.writeFileSync(path.join(GUIDES_DIR, f.name), f.content);
});
console.log('Successfully generated remaining React Guide Pages.');
