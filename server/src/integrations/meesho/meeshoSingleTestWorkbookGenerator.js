import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import exceljs from 'exceljs';
import axios from 'axios';
import { generateMeeshoProductName, generateMeeshoProductDescription } from './meeshoContentGenerator.js';
import { resolveProductColor } from './meeshoColorPipeline.js';
import { processAndHostProductImages } from './meeshoImagePipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const PRODUCTS_JSON_PATH = path.resolve(__dirname, '../../data/products.json');

export async function generateTestWorkbook() {
  console.log(`\n===================================================================`);
  console.log(`  JERSEY VAULT × MEESHO: GENERATING 1-PRODUCT TEST WORKBOOK`);
  console.log(`===================================================================\n`);

  // 1. Read catalog product from products.json
  const rawProducts = JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
  const testProduct = rawProducts.find(p => p.name.includes('Barcelona 26/27 Away Jersey')) || rawProducts[0];

  console.log(`[Test Product Selected]: ${testProduct.name} (ID: ${testProduct.id})`);

  // 2. Resolve product attributes & images
  const colorObj = resolveProductColor(testProduct);
  const meeshoName = generateMeeshoProductName(testProduct);
  const meeshoDesc = generateMeeshoProductDescription(testProduct, colorObj.color);
  const imgPipelineResult = await processAndHostProductImages(testProduct);

  const activeR2Images = imgPipelineResult.images
    .map(i => i.processedUrl)
    .filter(Boolean);

  console.log(`[R2 Processed Public Images Verified Count]: ${activeR2Images.length}`);
  activeR2Images.forEach((url, i) => console.log(`  - Image ${i + 1}: ${url}`));

  // Perform HTTP 200 checks on R2 images
  for (let i = 0; i < activeR2Images.length; i++) {
    try {
      const check = await axios.get(activeR2Images[i], { timeout: 10000 });
      console.log(`  [HTTP Check ${i + 1}] Status: ${check.status} | Content-Type: ${check.headers['content-type']}`);
    } catch (err) {
      console.error(`  [HTTP Check ${i + 1} Failed]: ${err.message}`);
    }
  }

  // 3. Load official template structure
  const templatePath = path.resolve(WORKSPACE_ROOT, 'meesho_catalog_final_dry_run.xlsx');
  const wb = new exceljs.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];
  console.log(`[Sheet Name]: ${ws.name}`);

  // Load template workbook cleanly and build new worksheet with exact header + 4 rows
  const newWb = new exceljs.Workbook();
  const newWs = newWb.addWorksheet(ws.name);

  // Copy Header Row
  const headerRow = ws.getRow(1);
  newWs.addRow(headerRow.values);

  // Define 4 Size Variants (S, M, L, XL)
  const variants = [
    { size: 'S', chest: '38', length: '27', stock: 100 },
    { size: 'M', chest: '40', length: '28', stock: 100 },
    { size: 'L', chest: '42', length: '29', stock: 100 },
    { size: 'XL', chest: '44', length: '30', stock: 100 },
  ];

  const styleId = `JV-BAR-AWAY-2627`;
  const manufacturerInfo = 'thejerseyvault Uttarayan Apartment, 29/32 Kendua Main Road Baishnabghata Garia 700084';
  const packerInfo = 'thejerseyvault Uttarayan Apartment, 29/32 Kendua Main Road Baishnabghata Garia 700084';

  variants.forEach((v) => {
    const sku = `${styleId}-${v.size}`;
    const rowValues = [
      styleId,                                      // Group ID / Style ID
      sku,                                          // SKU Code
      meeshoName,                                   // Product Name
      meeshoDesc,                                   // Product Description
      '₹400',                                       // Meesho Price
      '₹505',                                       // MRP
      '₹390',                                       // Wrong/Defective Return Price
      v.size,                                       // Size
      v.stock,                                      // Inventory / Stock
      colorObj.color,                               // Color
      'Polyester',                                  // Fabric
      'Active Tshirts',                             // Generic Name
      '1',                                          // Net Quantity
      'Round',                                      // Neck
      'Ombre',                                      // Print/Pattern
      'Short Sleeves',                              // Sleeve Length
      'India',                                      // Country of Origin
      '500 grams',                                  // Net Weight
      v.chest,                                      // Chest Size (Inches)
      v.length,                                     // Length Size (Inches)
      activeR2Images[0] || '',                      // Front Image URL
      activeR2Images[1] || '',                      // Back Image URL
      activeR2Images[2] || '',                      // Side/Detail Image 1 URL
      activeR2Images[3] || '',                      // Detail Image 2 URL
      manufacturerInfo,                             // Manufacturer Details
      packerInfo,                                   // Packer Details
    ];
    newWs.addRow(rowValues);
  });

  const outputPath = path.resolve(WORKSPACE_ROOT, 'meesho_test_single_product.xlsx');
  await newWb.xlsx.writeFile(outputPath);
  console.log(`[Test Workbook Created]: ${outputPath} (${newWs.rowCount - 1} data rows)`);

  return {
    testProduct,
    meeshoName,
    variants,
    activeR2Images,
    outputPath,
    rowCount: newWs.rowCount - 1,
  };
}

if (process.argv[1] && process.argv[1].endsWith('meeshoSingleTestWorkbookGenerator.js')) {
  generateTestWorkbook();
}
