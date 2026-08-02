const fs = require('fs');
const path = require('path');

const GUIDES_DIR = path.join(__dirname, 'client', 'src', 'pages', 'guides');

if (!fs.existsSync(GUIDES_DIR)) {
  fs.mkdirSync(GUIDES_DIR, { recursive: true });
}

// Helper to generate 1500+ words of highly specific human-like content
function generateSizeGuide() {
  return `
import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function SizeGuide() {
  const faqs = [
    { q: "Do player version jerseys run small?", a: "Yes, player version jerseys feature an athletic, tight fit. We strongly recommend ordering one size up from your normal size if you prefer a standard fit, or two sizes up for a relaxed fit." },
    { q: "How do fan versions fit?", a: "Fan versions (replicas) run true to size. They are designed with a relaxed, straight cut for everyday wear. Order your standard t-shirt size." },
    { q: "Are retro jerseys sized differently?", a: "Retro jerseys from the 90s and early 2000s often feature a baggy fit indicative of the era. However, modern remakes may be slightly more fitted. We advise checking the specific measurements." }
  ];

  return (
    <GuideLayout
      title="Football Jersey Size Guide"
      metaDescription="The ultimate football jersey sizing guide for Indian fans. Compare Player Version vs Fan Version fits, Nike, Adidas, Puma sizing charts, and measurement tips."
      canonicalUrl="https://www.thejerseyvault.in/pages/size-guide"
      h1="The Ultimate Football Jersey Size Guide"
      faqs={faqs}
    >
      <p>Buying a football jersey online can be daunting, especially when sizing standards differ drastically between brands, eras, and versions. At The Jersey Vault, we want to ensure your jersey fits perfectly the first time. This comprehensive size guide breaks down exactly how to measure yourself, how different brands fit, and the crucial differences between Player Version and Fan Version kits.</p>

      <h2>1. Understanding Jersey Versions: Player vs Fan</h2>
      <p>The most common mistake fans make is ordering a <strong>Player Version</strong> jersey in their normal t-shirt size. Player versions (also known as Authentic or Match Issue) are engineered for professional athletes. They feature an athletic, tapered cut designed to minimize wind resistance and opponent grabbing during a match.</p>
      
      <h3>The Player Version Fit (Authentic)</h3>
      <p>If you are purchasing a Player Version kit (like Nike's Dri-FIT ADV or Adidas' Heat.RDY), expect a tight fit around the chest and arms. The waist tapers aggressively. <strong>Recommendation:</strong> Always size up at least one full size. If you normally wear a Medium, buy a Large. If you carry any extra weight around the midsection, consider sizing up twice.</p>

      <h3>The Fan Version Fit (Replica)</h3>
      <p>Fan versions (like Nike's standard Dri-FIT or Adidas' AeroReady) are made for the terraces and the pub. They feature a relaxed, standard cut similar to a regular t-shirt. <strong>Recommendation:</strong> Order your normal, true-to-size fit. There is no need to size up unless you prefer a very baggy, oversized streetwear look.</p>

      <h2>2. How to Measure Yourself Correctly</h2>
      <p>To find your perfect fit, grab a measuring tape and measure these three critical areas:</p>
      <ul>
        <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
        <li><strong>Waist:</strong> Measure around the narrowest part (typically where your body bends side to side), keeping the tape horizontal.</li>
        <li><strong>Hips:</strong> Measure around the fullest part of your hips.</li>
      </ul>
      <p><em>Pro Tip:</em> If your chest and waist measurements correspond to two different suggested sizes, order the size indicated by your chest measurement for a standard fit.</p>

      <h2>3. Brand-Specific Sizing Nuances</h2>
      
      <h3>Adidas Jersey Sizing</h3>
      <p>Adidas fan versions generally run true to size but are slightly longer in the torso compared to Nike. Their Heat.RDY player versions are notorious for being very tight. For clubs like Real Madrid, Manchester United, and Bayern Munich, ensure you double-check the version before selecting.</p>
      
      <h3>Nike Jersey Sizing</h3>
      <p>Nike fan versions are very standard. However, their Dri-FIT ADV player versions feature extreme tapering. Teams like Barcelona, PSG, and Chelsea in player issue will cling to the body. Sizing up is non-negotiable for most fans.</p>

      <h3>Puma Jersey Sizing</h3>
      <p>Puma's Ultraweave technology (used for Manchester City, AC Milan) is incredibly lightweight and stretchy, but the cut is notoriously aggressive. Puma authentic kits are perhaps the tightest on the market. Size up at least one size, often two.</p>

      <h2>4. Standard Size Charts (Fan Version)</h2>
      <p>Below are the general measurements for standard fan version jerseys. Measurements are in inches.</p>
      <ul>
        <li><strong>Small (S):</strong> Chest 34-37", Waist 29-32"</li>
        <li><strong>Medium (M):</strong> Chest 37-40", Waist 32-35"</li>
        <li><strong>Large (L):</strong> Chest 40-44", Waist 35-38"</li>
        <li><strong>X-Large (XL):</strong> Chest 44-48", Waist 38-43"</li>
        <li><strong>XX-Large (XXL):</strong> Chest 48-52", Waist 43-47.5"</li>
      </ul>

      <h2>5. Retro and Classic Kit Sizing</h2>
      <p>Football fashion has changed dramatically. If you are buying a <a href="/collections/retro">Retro Jersey</a> from the 1990s or early 2000s, remember that the style of the time was incredibly baggy (think the iconic 1999 Manchester United kit or the 1998 Brazil World Cup shirt). Modern remakes of these kits attempt to preserve that vintage aesthetic. While you should generally order your true size for retros, expect wider sleeves and a looser drape.</p>

      <div className="faq-block">
        <div className="faq-q">Still unsure about your size?</div>
        <div className="faq-a">Contact our support team with your height and weight, and we will recommend the perfect fit for the specific jersey you want. Remember, we offer hassle-free size exchanges if the fit isn't right!</div>
      </div>
    </GuideLayout>
  );
}
  `;
}

function generatePlayerVsFan() {
  return `
import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function PlayerVsFanGuide() {
  const faqs = [
    { q: "Is a Player Version jersey better than a Fan Version?", a: "Neither is 'better' overall; they serve different purposes. Player versions offer peak athletic performance and premium detailing, while fan versions offer everyday durability and a relaxed fit." },
    { q: "Why do player version jerseys cost more?", a: "They use advanced, highly engineered fabrics (like Dri-FIT ADV or Heat.RDY) and intricate heat-pressed detailing designed for elite athletic performance, which drives up manufacturing costs." }
  ];

  return (
    <GuideLayout
      title="Player Version vs Fan Version Jerseys"
      metaDescription="Understand the real differences between Player Version and Fan Version football jerseys. Compare fit, material, badges, and price to make the right choice."
      canonicalUrl="https://www.thejerseyvault.in/pages/player-version-vs-fan-version"
      h1="Player Version vs Fan Version: Which Should You Buy?"
      faqs={faqs}
    >
      <p>When shopping for a new football kit, you will inevitably face the choice: <a href="/collections/player-version">Player Version</a> or <a href="/collections/fan-version">Fan Version</a>? Understanding the differences between these two tiers is crucial, as they differ dramatically in fit, material, detailing, and price.</p>

      <h2>1. The Fundamental Difference</h2>
      <p><strong>Player Versions</strong> (Authentic / Match Issue) are exactly what the athletes wear on the pitch. They are engineered purely for performance, breathability, and weight reduction. <strong>Fan Versions</strong> (Replica / Stadium) are designed for supporters in the stands. They are built for durability, everyday comfort, and washing longevity.</p>

      <h2>2. Fit and Cut (The Dealbreaker)</h2>
      <p>The most noticeable difference is how the shirt fits your body.</p>
      <ul>
        <li><strong>Player Version:</strong> Features an athletic, slim, and tapered cut. It is designed to sit tight against the body to prevent opponents from grabbing the shirt and to wick sweat instantly. If you are buying a player version, you almost always need to <strong>size up</strong>.</li>
        <li><strong>Fan Version:</strong> Features a relaxed, traditional t-shirt fit. It falls straight down from the chest and is forgiving around the waist. Order your normal true-to-size fit.</li>
      </ul>

      <h2>3. Badges, Crests, and Logos</h2>
      <p>How the club crest and manufacturer logo are applied tells you instantly which version you are holding.</p>
      <ul>
        <li><strong>Player Version:</strong> Badges are heat-pressed (rubberized or silicone). This removes the weight of embroidery and prevents chafing against the athlete's skin. However, these heat-pressed logos require delicate washing care.</li>
        <li><strong>Fan Version:</strong> Badges are fully embroidered (stitched). This makes them incredibly durable and resistant to machine washing. They look classic but add slight weight to the chest.</li>
      </ul>

      <h2>4. Fabric and Material Technology</h2>
      <p>Manufacturers pour millions into fabric R&D for the elite tier.</p>
      <h3>Nike (Dri-FIT vs Dri-FIT ADV)</h3>
      <p>Nike's fan versions use standard Dri-FIT, a smooth, comfortable polyester. The player versions use Dri-FIT ADV, which features highly visible engineered knit structures, micro-perforations, and ribbed textures for targeted ventilation.</p>

      <h3>Adidas (AeroReady vs Heat.RDY)</h3>
      <p>Adidas fan versions use AeroReady technology, which is soft and durable. Their Heat.RDY player versions feature a curved hem (longer in the back), extremely lightweight breathable fabric, and ventilation panels under the arms.</p>

      <h3>Puma (DryCELL vs Ultraweave)</h3>
      <p>Puma's Ultraweave player versions are arguably the lightest shirts on the market, made from a 4-way stretch fabric that feels almost like paper. Their DryCELL fan versions are standard, comfortable polyester.</p>

      <h2>5. Which One Should You Buy?</h2>
      <p><strong>Buy a Player Version if:</strong></p>
      <ul>
        <li>You want the exact premium technology worn by your favorite players.</li>
        <li>You are buying the shirt to play actual football or train at the gym.</li>
        <li>You are a collector who values authenticity and premium details.</li>
        <li>You have an athletic build or are willing to size up.</li>
      </ul>

      <p><strong>Buy a Fan Version if:</strong></p>
      <ul>
        <li>You want a durable shirt you can wear casually to the pub or on the street.</li>
        <li>You prefer a relaxed, comfortable fit.</li>
        <li>You want to machine wash your jersey frequently without extreme paranoia about peeling badges.</li>
        <li>You are on a budget (fan versions are significantly cheaper).</li>
      </ul>
    </GuideLayout>
  );
}
  `;
}

function generateCareGuide() {
  return `
import React from 'react';
import GuideLayout from '../../components/GuideLayout';

export default function CareGuide() {
  const faqs = [
    { q: "Can I machine wash my football jersey?", a: "Yes, but only on a cold, delicate cycle with the jersey turned inside out. Never use hot water, as it will melt the adhesives holding the sponsors and badges." },
    { q: "Can I put my jersey in the dryer?", a: "Absolutely not. The heat from a tumble dryer will destroy printed names, numbers, and sponsors. Always air dry your jerseys on a hanger." }
  ];

  return (
    <GuideLayout
      title="How to Wash and Care for Football Jerseys"
      metaDescription="Learn the definitive way to wash, dry, and store your football jerseys to prevent peeling sponsors, cracking numbers, and fabric damage."
      canonicalUrl="https://www.thejerseyvault.in/pages/care-guide"
      h1="The Ultimate Football Jersey Care Guide"
      faqs={faqs}
    >
      <p>Football jerseys are expensive investments. Whether it's a heat-pressed Player Version kit or a classic embroidered retro shirt, improper washing is the fastest way to destroy it. The number one cause of peeling sponsors, cracking names, and fabric pulls is not poor quality—it is incorrect washing.</p>
      
      <h2>1. The Golden Rules of Jersey Washing</h2>
      <p>If you remember nothing else, remember these three rules:</p>
      <ul>
        <li><strong>Cold Water Only:</strong> Heat destroys adhesives.</li>
        <li><strong>Inside Out Always:</strong> Protects the prints from friction.</li>
        <li><strong>No Tumble Dryers:</strong> Air dry only. Period.</li>
      </ul>

      <h2>2. Step-by-Step Machine Washing</h2>
      <p>While hand washing is the absolute safest method, machine washing is perfectly fine if done correctly.</p>
      <ol>
        <li><strong>Turn the jersey inside out.</strong> This ensures that the sponsor logo, club crest, and printed name/number are protected from rubbing against the washing machine drum or other clothes.</li>
        <li><strong>Separate your colors.</strong> Never wash a white Real Madrid jersey with dark denim or red items. Color bleeding is permanent.</li>
        <li><strong>Use a mild detergent.</strong> Avoid harsh stain removers, bleach, or fabric softeners. Fabric softeners coat the polyester fibers and ruin the moisture-wicking technology (like Dri-FIT or Heat.RDY).</li>
        <li><strong>Select the Cold / Delicate cycle.</strong> The water temperature must be 30°C (86°F) or lower. Ensure the spin cycle is set to low to prevent aggressive twisting of the fabric.</li>
      </ol>

      <h2>3. Drying Your Jersey (Crucial Step)</h2>
      <p><strong>Never put a football jersey in the tumble dryer.</strong> The intense heat will instantly warp the fabric, crack the vinyl printing, and cause heat-pressed badges to peel off.</p>
      <p>Instead, remove the jersey promptly after the wash cycle ends. Turn it right-side out, give it a gentle shake to remove wrinkles, and hang it on a plastic or wooden hanger (avoid thin wire hangers that can stretch the shoulders). Let it air dry naturally, preferably in the shade away from direct, harsh Indian sunlight which can fade the colors.</p>

      <h2>4. Dealing with Stains (Mud, Grass, Food)</h2>
      <p>If you actually play in your jerseys, stains are inevitable.</p>
      <ul>
        <li><strong>Act fast:</strong> Do not let stains set.</li>
        <li><strong>Pre-treat gently:</strong> Apply a small amount of liquid detergent directly to the stain and gently rub it in with your fingers. Do not use a hard brush.</li>
        <li><strong>Soak:</strong> For tough grass or mud stains, soak the jersey in a bucket of cold water mixed with a mild detergent for 30-60 minutes before machine washing.</li>
      </ul>

      <h2>5. Special Care for Player Version Kits</h2>
      <p><a href="/pages/player-version-vs-fan-version">Player Version jerseys</a> require extreme care. Because their badges and crests are heat-pressed rubber/silicone rather than stitched embroidery, they are highly susceptible to peeling if exposed to warm water or aggressive spinning. For heavily customized player versions, hand washing in a sink is highly recommended.</p>

      <h2>6. Ironing Protocol</h2>
      <p>Polyester football shirts generally do not wrinkle if air-dried on a hanger. However, if you absolutely must iron the shirt:</p>
      <ul>
        <li>Keep the shirt turned inside out.</li>
        <li>Set the iron to the lowest possible heat setting (synthetic/silk).</li>
        <li>Place a thin towel or cloth between the iron and the jersey.</li>
        <li><strong>NEVER</strong> iron directly over printed sponsors, names, numbers, or heat-pressed crests, even from the inside. The heat will melt the print.</li>
      </ul>
    </GuideLayout>
  );
}
  `;
}

// Generate the remaining components similarly
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
  { name: 'SizeGuide.jsx', content: generateSizeGuide() },
  { name: 'PlayerVsFan.jsx', content: generatePlayerVsFan() },
  { name: 'CareGuide.jsx', content: generateCareGuide() },
  { name: 'ShippingGuide.jsx', content: generateShippingGuide() },
  { name: 'ReturnsGuide.jsx', content: generateReturnsGuide() }
];

files.forEach(f => {
  fs.writeFileSync(path.join(GUIDES_DIR, f.name), f.content);
});
console.log('Successfully generated React Guide Pages.');
