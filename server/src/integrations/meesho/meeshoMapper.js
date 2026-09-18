import crypto from 'crypto';
import { generateMeeshoProductName, generateMeeshoProductDescription } from './meeshoContentGenerator.js';
import { resolveProductColor } from './meeshoColorPipeline.js';
import { processAndHostProductImages } from './meeshoImagePipeline.js';

/**
 * Fixed Meesho Business Constants
 */
export const FIXED_MEESHO_VALUES = {
  fabric: 'Polyester',
  genericName: 'Active Tshirts',
  netQuantity: '1',
  neck: 'Round',
  printPattern: 'Ombre',
  sleeveLength: 'Short Sleeves',
  countryOfOrigin: 'India',
  netWeightGrams: 500,
  manufacturerName: 'thejerseyvault',
  manufacturerAddress: 'Uttarayan Apartment, 29/32 Kendua Main Road Baishnabghata Garia',
  manufacturerPincode: '700084',
  packerName: 'thejerseyvault',
  packerAddress: 'Uttarayan Apartment, 29/32 Kendua Main Road Baishnabghata Garia',
  packerPincode: '700084',
  importerName: 'Not Applicable',
  importerAddress: 'Not Applicable',
  importerPincode: 'Not Applicable',
  meeshoPrice: 400,
  mrp: 505,
  wrongReturnPrice: 390,
  initialInventoryPerSize: 100,
  sizes: [
    { size: 'S', chest: 38, length: 27 },
    { size: 'M', chest: 40, length: 28 },
    { size: 'L', chest: 42, length: 29 },
    { size: 'XL', chest: 44, length: 30 },
  ],
};

/**
 * Generates a deterministic SKU and Group ID for a given product.
 */
export function generateSkuDetails(product) {
  const teamName = (product.teams && product.teams.name) ? product.teams.name : 'JV';
  const teamCode = teamName.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase() || 'JV';

  let styleCode = 'KIT';
  const name = (product.name || '').toUpperCase();
  if (name.includes('AWAY')) styleCode = 'AW';
  else if (name.includes('THIRD')) styleCode = 'TK';
  else if (name.includes('SPECIAL')) styleCode = 'SE';
  else if (name.includes('HOME')) styleCode = 'HM';

  if (name.includes('26/27')) styleCode += '26';
  else if (name.includes('25/26')) styleCode += '25';
  else if (name.includes('WC')) styleCode += 'WC';

  let typeCode = 'F';
  if (product.type === 'PLAYER VERSION') typeCode = 'P';
  else if (product.type === 'CLEARANCE SALE') typeCode = 'C';

  const shortUuid = (product.id || '').replace(/-/g, '').substring(0, 4).toUpperCase();
  const baseGroupStyleId = `JV-${teamCode}-${styleCode}${typeCode}-${shortUuid}`;

  const skus = {};
  FIXED_MEESHO_VALUES.sizes.forEach((sObj) => {
    skus[sObj.size] = `${baseGroupStyleId}-${sObj.size}`;
  });

  return {
    groupId: baseGroupStyleId,
    styleId: baseGroupStyleId,
    skus,
  };
}

/**
 * Phase 2C Final Mapper with Cloudflare R2 Public Image Hosting integration.
 */
export async function mapProductToMeeshoRowsFinal(product) {
  // 1. Color Resolution Pipeline
  const colorResult = resolveProductColor(product);
  const resolvedColor = colorResult.color;

  // 2. Product-Specific Content Generation
  const meeshoProductName = generateMeeshoProductName(product);
  const meeshoDescription = generateMeeshoProductDescription(product, resolvedColor);

  // 3. Image Compliance & R2 Hosting Pipeline
  const imageAudit = await processAndHostProductImages(product);

  const skuInfo = generateSkuDetails(product);

  const img1 = (imageAudit.images[0] && imageAudit.images[0].processedUrl) || '';
  const img2 = (imageAudit.images[1] && imageAudit.images[1].processedUrl) || '';
  const img3 = (imageAudit.images[2] && imageAudit.images[2].processedUrl) || '';
  const img4 = (imageAudit.images[3] && imageAudit.images[3].processedUrl) || '';

  const rows = FIXED_MEESHO_VALUES.sizes.map((sObj) => {
    return {
      jvProductId: product.id,
      groupId: skuInfo.groupId,
      styleId: skuInfo.styleId,
      productName: meeshoProductName,
      skuId: skuInfo.skus[sObj.size],
      size: sObj.size,
      chestSize: sObj.chest,
      lengthSize: sObj.length,
      meeshoPrice: FIXED_MEESHO_VALUES.meeshoPrice,
      mrp: FIXED_MEESHO_VALUES.mrp,
      wrongReturnPrice: FIXED_MEESHO_VALUES.wrongReturnPrice,
      inventory: FIXED_MEESHO_VALUES.initialInventoryPerSize,
      image1: img1,
      image2: img2,
      image3: img3,
      image4: img4,
      description: meeshoDescription,
      color: resolvedColor,
      fabric: FIXED_MEESHO_VALUES.fabric,
      genericName: FIXED_MEESHO_VALUES.genericName,
      neck: FIXED_MEESHO_VALUES.neck,
      sleeveLength: FIXED_MEESHO_VALUES.sleeveLength,
      printPattern: FIXED_MEESHO_VALUES.printPattern,
      netQuantity: FIXED_MEESHO_VALUES.netQuantity,
      countryOfOrigin: FIXED_MEESHO_VALUES.countryOfOrigin,
      netWeightGrams: FIXED_MEESHO_VALUES.netWeightGrams,
      manufacturerName: FIXED_MEESHO_VALUES.manufacturerName,
      manufacturerAddress: FIXED_MEESHO_VALUES.manufacturerAddress,
      manufacturerPincode: FIXED_MEESHO_VALUES.manufacturerPincode,
      packerName: FIXED_MEESHO_VALUES.packerName,
      packerAddress: FIXED_MEESHO_VALUES.packerAddress,
      packerPincode: FIXED_MEESHO_VALUES.packerPincode,
      importerName: FIXED_MEESHO_VALUES.importerName,
      importerAddress: FIXED_MEESHO_VALUES.importerAddress,
      importerPincode: FIXED_MEESHO_VALUES.importerPincode,
    };
  });

  return {
    rows,
    productName: meeshoProductName,
    description: meeshoDescription,
    colorResult,
    imageAudit,
  };
}
