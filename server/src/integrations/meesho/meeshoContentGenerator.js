/**
 * Content Generator for Meesho Listings - Phase 2B (Strict QA & Compliance)
 */

/**
 * Generates a clean, product-specific Meesho Product Name.
 * STRICT RULES: No unsupported claims ("Official", "Authentic", "Licensed", "Original"), max 100 chars.
 */
export function generateMeeshoProductName(product) {
  let name = (product.name || '').trim();

  // Strip unsupported keywords if present
  name = name.replace(/\b(official|authentic|original|licensed|merchandise|dry-fit|performance)\b/gi, '').trim();

  // Standardize common terms
  if (name.includes('WC Jersey')) {
    name = name.replace('WC Jersey', 'World Cup Football Jersey');
  } else if (name.includes('Jersey') && !name.includes('Football Jersey')) {
    name = name.replace('Jersey', 'Football Jersey');
  }

  // Format Version/Edition without claims
  if (product.type === 'PLAYER VERSION' && !name.toLowerCase().includes('player edition')) {
    name = name.replace(/\(player version\)/gi, '').trim() + ' - Player Edition';
  } else if (product.type === 'FAN VERSION' && !name.toLowerCase().includes('fan edition')) {
    name = name.replace(/\(fan version\)/gi, '').trim() + ' - Fan Edition';
  } else if (product.type === 'CLEARANCE SALE') {
    name = name.replace(/\(clearance sale\)/gi, '').trim();
  }

  // Clean double spaces
  name = name.replace(/\s+/g, ' ').trim();

  // Truncate to 100 characters if required
  if (name.length > 100) {
    name = name.substring(0, 97).trim() + '...';
  }

  return name;
}

/**
 * Generates a structured, product-specific Meesho Product Description.
 * STRICT RULES:
 * - NO unsupported technology claims ("Dry-Fit", "enhanced ventilation", "maximum mobility", "performance technology")
 * - NO fake licensing claims ("Official", "Authentic", "Licensed")
 * - NO fabricated sponsorships, player names, or material percentages
 * - Fabric attribute is strictly: Polyester
 */
export function generateMeeshoProductDescription(product, color) {
  const productName = generateMeeshoProductName(product);
  const teamName = (product.teams && product.teams.name) ? product.teams.name : 'Sports Club';
  
  let fitType = 'Standard Fit';
  if (product.type === 'PLAYER VERSION') fitType = 'Slim Fit / Player Edition';
  else if (product.type === 'FAN VERSION') fitType = 'Regular Fit / Fan Edition';
  else if (product.type === 'CLEARANCE SALE') fitType = 'Regular Fit';

  const resolvedColor = (color && color !== 'COLOR_REQUIRES_REVIEW') ? color : 'Multicolor / Team Colors';

  const lines = [
    `${productName}`,
    '',
    `Sports football jersey for ${teamName}. Suitable for active sports, training, and casual fan wear.`,
    '',
    'Product Details:',
    `- Fabric: Polyester`,
    `- Neck: Round`,
    `- Sleeve Length: Short Sleeves`,
    `- Pattern: Ombre`,
    `- Color: ${resolvedColor}`,
    `- Fit / Edition: ${fitType}`,
    `- Net Quantity: 1 N`,
    '',
    'Care Instructions: Machine wash cold with similar colors inside out. Tumble dry low or line dry in shade. Do not bleach. Do not iron directly on print.'
  ];

  return lines.join('\n');
}
