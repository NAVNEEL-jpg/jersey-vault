const fs = require('fs');
const path = require('path');

const mappingFile = path.join(__dirname, '..', 'client', 'src', 'utils', 'collection-mapping.js');

let content = fs.readFileSync(mappingFile, 'utf8');

// We need to parse the object and inject longDescription and faqs.
// Since it's a JS object, we'll use regex to match each key and insert the fields.

const lines = content.split('\n');
let newContent = [];

let inObject = false;
let currentKey = "";
let currentTitle = "";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('export const COLLECTION_MAPPING = {')) {
    inObject = true;
    newContent.push(line);
    continue;
  }
  
  if (inObject && line.match(/^  "([^"]+)": {/)) {
    currentKey = line.match(/^  "([^"]+)": {/)[1];
    newContent.push(line);
    continue;
  }
  
  if (inObject && line.includes('title:')) {
    currentTitle = line.match(/title: "([^"]+)"/)[1];
    newContent.push(line);
    continue;
  }

  // Inject before the closing brace of each object
  if (inObject && line.trim() === '},' || (line.trim() === '}' && currentKey)) {
    // Generate unique text
    const longDesc = `The <strong>${currentTitle}</strong> collection at The Jersey Vault brings you the finest selection of premium football kits in India. Sourced meticulously to ensure master-quality authenticity, our ${currentTitle} jerseys are designed for fans who demand perfection. Whether you are looking for player-issue versions with athletic fits and heat-pressed details, or classic fan replicas built for durability and comfort, this collection offers unparalleled quality. Each piece in the ${currentTitle} lineup reflects the rich history and modern tactical evolution of the game, allowing supporters to wear their passion with pride. Elevate your match-day experience with breathable, sweat-wicking fabrics engineered for peak performance and everyday lifestyle wear.`;
    
    const faqs = `[
      { q: "Is the ${currentTitle} kit available in player version?", a: "Yes, we offer premium player-issue versions for the ${currentTitle} collection, featuring an athletic fit and authentic heat-transferred details." },
      { q: "How should I choose my size for ${currentTitle} jerseys?", a: "For fan versions, stick to your regular size. For player versions, we strongly recommend sizing up as they feature a tight, aerodynamic fit." },
      { q: "What is the delivery time in India?", a: "We offer pan-India shipping with Cash on Delivery (COD). Standard delivery typically takes 3-7 business days depending on your location." },
      { q: "Do these jerseys have the official brand logos?", a: "Yes, our master-quality kits include all manufacturer logos, club crests, and sponsor details exactly as worn by the professionals." }
    ]`;
    
    // Inject
    if (!content.includes('longDescription:') || !content.includes(currentTitle)) {
      // Avoid double injection if script runs twice
      newContent.push(`    longDescription: \`${longDesc}\`,`);
      newContent.push(`    faqs: ${faqs},`);
    }
    
    newContent.push(line);
    currentKey = "";
    continue;
  }
  
  newContent.push(line);
}

fs.writeFileSync(mappingFile, newContent.join('\n'));
console.log('Successfully expanded collection-mapping.js with unique long descriptions and FAQs.');
