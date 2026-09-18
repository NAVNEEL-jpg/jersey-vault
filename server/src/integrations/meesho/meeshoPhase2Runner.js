import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapProductToMeeshoRowsV2 } from './meeshoMapper.js';
import { validateMeeshoCatalogRows } from './meeshoValidator.js';
import { generateMeeshoCatalogExcel } from './meeshoExcelGenerator.js';
import { generateReviewReportV2 } from './meeshoReviewReporterV2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const ARTIFACT_DIR = 'C:\\Users\\Saptarshi\\.gemini\\antigravity-ide\\brain\\d9deda39-17a7-4453-8be8-fa25015a080b';

async function runPhase2() {
  console.log('\n===================================================================');
  console.log('  JERSEY VAULT × MEESHO PHASE 2: PRODUCT CONTENT & IMAGE PIPELINE');
  console.log('===================================================================\n');

  const productsPath = path.resolve(__dirname, '../../data/products.json');
  if (!fs.existsSync(productsPath)) {
    console.error(`[Error] products.json not found at: ${productsPath}`);
    process.exit(1);
  }

  const rawProducts = fs.readFileSync(productsPath, 'utf8');
  const products = JSON.parse(rawProducts);

  console.log(`[Info] Processing ${products.length} Jersey Vault products through Phase 2 Pipeline...`);

  let allRows = [];
  let detailedAudit = [];
  let sampleProducts = [];

  let verifiedColorCount = 0;
  let colorReviewCount = 0;
  let imagesProcessed = 0;
  let imagesReviewCount = 0;
  let imagesInvalidCount = 0;
  let detectedMarksCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const mapResult = await mapProductToMeeshoRowsV2(p);

    allRows = allRows.concat(mapResult.rows);

    if (mapResult.colorStatus === 'OK') verifiedColorCount++;
    else colorReviewCount++;

    if (mapResult.imageStatus === 'IMAGE_PROCESSED' || mapResult.imageStatus === 'IMAGE_OK') imagesProcessed++;
    else if (mapResult.imageStatus === 'IMAGE_REQUIRES_REVIEW') imagesReviewCount++;
    else if (mapResult.imageStatus === 'IMAGE_INVALID') imagesInvalidCount++;

    if (mapResult.detectedMark) detectedMarksCount++;

    let action = 'Fully Validated';
    if (mapResult.colorStatus !== 'OK') action = 'User color verification recommended';
    if (mapResult.imageStatus === 'IMAGE_REQUIRES_REVIEW') action = `Garment mark '${mapResult.detectedMark}' detected. Flagged for review.`;

    detailedAudit.push({
      id: p.id,
      originalName: p.name,
      meeshoName: mapResult.productName,
      color: mapResult.color,
      imageStatus: mapResult.imageStatus,
      detectedMark: mapResult.detectedMark,
      action,
    });

    if (sampleProducts.length < 5) {
      const skus = {};
      mapResult.rows.forEach((r) => {
        skus[r.size] = r.skuId;
      });

      sampleProducts.push({
        originalName: p.name,
        productName: mapResult.productName,
        color: mapResult.color,
        colorStatus: mapResult.colorStatus,
        imageStatus: mapResult.imageStatus,
        detectedMark: mapResult.detectedMark,
        description: mapResult.description,
        skus,
      });
    }
  }

  const validationResult = validateMeeshoCatalogRows(allRows, products);

  const stats = {
    totalProducts: products.length,
    totalRows: allRows.length,
    nameCount: products.length,
    descCount: products.length,
    verifiedColorCount,
    colorReviewCount,
    imagesProcessed,
    imagesReviewCount,
    imagesInvalidCount,
    detectedMarksCount,
    uniqueSkus: validationResult.uniqueSkus,
    isValid: validationResult.isValid,
    detailedAudit,
  };

  // Print 5 Sample Outputs required by Part 14
  console.log('\n-------------------------------------------------------------------');
  console.log('  SAMPLE OUTPUT (5 DIFFERENT PRODUCTS)');
  console.log('-------------------------------------------------------------------');
  sampleProducts.forEach((sp, idx) => {
    console.log(`\n--- SAMPLE ${idx + 1} ---`);
    console.log(`JerseyVault Product: ${sp.originalName}`);
    console.log(`Meesho Product Name: ${sp.productName}`);
    console.log(`Color:               ${sp.color} (Status: ${sp.colorStatus})`);
    console.log(`Image Status:        ${sp.imageStatus}${sp.detectedMark ? ` [Mark: ${sp.detectedMark}]` : ''}`);
    console.log(`SKUs:                S: ${sp.skus.S} | M: ${sp.skus.M} | L: ${sp.skus.L} | XL: ${sp.skus.XL}`);
    console.log(`Description Preview: \n${sp.description.substring(0, 180)}...\n`);
  });

  // Generate Dry-Run XLSX V2
  const excelFileName = 'meesho_catalog_dry_run_v2.xlsx';
  const rootExcelPath = path.resolve(WORKSPACE_ROOT, excelFileName);
  const artifactExcelPath = path.resolve(ARTIFACT_DIR, excelFileName);

  await generateMeeshoCatalogExcel(allRows, rootExcelPath);
  if (fs.existsSync(ARTIFACT_DIR)) {
    await generateMeeshoCatalogExcel(allRows, artifactExcelPath);
  }

  // Generate Review Report MD V2
  const reportFileName = 'meesho_catalog_content_review_v2.md';
  const rootReportPath = path.resolve(WORKSPACE_ROOT, reportFileName);
  const artifactReportPath = path.resolve(ARTIFACT_DIR, reportFileName);

  generateReviewReportV2(stats, sampleProducts, rootReportPath);
  if (fs.existsSync(ARTIFACT_DIR)) {
    generateReviewReportV2(stats, sampleProducts, artifactReportPath);
  }

  console.log('-------------------------------------------------------------------');
  console.log('  PHASE 2 SUMMARY & FILE LOCATIONS');
  console.log('-------------------------------------------------------------------');
  console.log(`- Total Products:                    ${stats.totalProducts}`);
  console.log(`- Generated Unique Titles & Descs:  ${stats.nameCount}`);
  console.log(`- Verified Colors:                   ${stats.verifiedColorCount} / ${stats.totalProducts}`);
  console.log(`- Color Review Count:                ${stats.colorReviewCount}`);
  console.log(`- Images Processed / Cached:         ${stats.imagesProcessed}`);
  console.log(`- Images Requiring Review:           ${stats.imagesReviewCount}`);
  console.log(`- Garment Brand Marks Detected:     ${stats.detectedMarksCount}`);
  console.log(`- Total Catalog Rows:                ${stats.totalRows}`);
  console.log(`- Validation Status:                 ${stats.isValid ? 'PASS' : 'FAIL'}`);
  console.log(`\nGenerated Files:`);
  console.log(`  - Excel V2:  ${rootExcelPath}`);
  console.log(`  - Report V2: ${rootReportPath}\n`);
  console.log('===================================================================');
  console.log('  PHASE 2 COMPLETE — ZERO UPLOADS OR DB MUTATIONS MADE');
  console.log('===================================================================\n');
}

runPhase2();
