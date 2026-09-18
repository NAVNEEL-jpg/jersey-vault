import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapProductToMeeshoRowsV3 } from './meeshoMapper.js';
import { validateMeeshoCatalogRows } from './meeshoValidator.js';
import { generateMeeshoCatalogExcel } from './meeshoExcelGenerator.js';
import { generateReviewReportV3 } from './meeshoReviewReporterV3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const ARTIFACT_DIR = 'C:\\Users\\Saptarshi\\.gemini\\antigravity-ide\\brain\\d9deda39-17a7-4453-8be8-fa25015a080b';

async function runPhase2B() {
  console.log('\n===================================================================');
  console.log('  JERSEY VAULT × MEESHO PHASE 2B: CONTENT & IMAGE QA CORRECTION');
  console.log('===================================================================\n');

  const productsPath = path.resolve(__dirname, '../../data/products.json');
  if (!fs.existsSync(productsPath)) {
    console.error(`[Error] products.json not found at: ${productsPath}`);
    process.exit(1);
  }

  const rawProducts = fs.readFileSync(productsPath, 'utf8');
  const products = JSON.parse(rawProducts);

  console.log(`[Info] Auditing & Processing ${products.length} Jersey Vault products through Phase 2B Pipeline...`);

  let allRows = [];
  let imageProductSummary = [];
  let detailedImageAudit = [];
  let colorAudit = [];
  let sampleProducts = [];

  let totalSelectedImages = 0;
  let totalProcessedImages = 0;
  let totalImageReviewCount = 0;
  let totalMarksDetected = 0;
  let verifiedColorCount = 0;
  let colorReviewCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const mapResult = await mapProductToMeeshoRowsV3(p);

    allRows = allRows.concat(mapResult.rows);

    // Color Audit Tracking
    colorAudit.push({
      productId: p.id,
      productName: p.name,
      color: mapResult.colorResult.color,
      sourceType: mapResult.colorResult.sourceType,
      sourceDetail: mapResult.colorResult.sourceDetail,
      confidence: mapResult.colorResult.confidence,
    });

    if (mapResult.colorResult.status === 'OK') verifiedColorCount++;
    else colorReviewCount++;

    // Image Audit Tracking
    const imgAudit = mapResult.imageAudit;
    totalSelectedImages += imgAudit.validImageCount;
    totalProcessedImages += imgAudit.processedImageCount;
    totalImageReviewCount += imgAudit.reviewCount;

    imageProductSummary.push({
      productId: p.id,
      productName: p.name,
      originalImageCount: imgAudit.originalImageCount,
      validImageCount: imgAudit.validImageCount,
      processedImageCount: imgAudit.processedImageCount,
      rejectedImageCount: imgAudit.rejectedImageCount,
      reviewCount: imgAudit.reviewCount,
    });

    imgAudit.images.forEach((imgObj) => {
      if (imgObj.detectedMark) totalMarksDetected++;
      detailedImageAudit.push({
        productId: p.id,
        imageNum: imgObj.imageNum,
        detectedMark: imgObj.detectedMark,
        detectionConfidence: imgObj.detectionConfidence || 'N/A',
        partOfGarment: imgObj.partOfGarment || 'No',
        action: imgObj.action,
        status: imgObj.status,
      });
    });

    // Sample Products (5 items)
    if (sampleProducts.length < 5) {
      const skus = {};
      mapResult.rows.forEach((r) => {
        skus[r.size] = r.skuId;
      });

      sampleProducts.push({
        originalName: p.name,
        productName: mapResult.productName,
        color: mapResult.colorResult.color,
        colorSourceType: mapResult.colorResult.sourceType,
        colorSourceDetail: mapResult.colorResult.sourceDetail,
        imageAudit: imgAudit,
        description: mapResult.description,
        skus,
      });
    }
  }

  const validationResult = validateMeeshoCatalogRows(allRows, products);

  const stats = {
    totalProducts: products.length,
    totalRows: allRows.length,
    totalSelectedImages,
    totalProcessedImages,
    totalImageReviewCount,
    totalMarksDetected,
    verifiedColorCount,
    colorReviewCount,
    descCorrectedCount: products.length,
    uniqueSkus: validationResult.uniqueSkus,
    isValid: validationResult.isValid,
    imageProductSummary,
    detailedImageAudit,
    colorAudit,
  };

  // Print 5 Sample Outputs required by Issue 14
  console.log('\n-------------------------------------------------------------------');
  console.log('  SAMPLE OUTPUT (5 DIFFERENT PRODUCTS - QA CORRECTION)');
  console.log('-------------------------------------------------------------------');
  sampleProducts.forEach((sp, idx) => {
    console.log(`\n--- SAMPLE ${idx + 1} ---`);
    console.log(`JerseyVault Product: ${sp.originalName}`);
    console.log(`Meesho Product Name: ${sp.productName}`);
    console.log(`Color:               ${sp.color} (Source: ${sp.colorSourceType})`);
    console.log(`Images Processed:    ${sp.imageAudit.processedImageCount} / ${sp.imageAudit.validImageCount}`);
    console.log(`SKUs:                S: ${sp.skus.S} | M: ${sp.skus.M} | L: ${sp.skus.L} | XL: ${sp.skus.XL}`);
    console.log(`Description Preview: \n${sp.description.substring(0, 180)}...\n`);
  });

  // Generate Dry-Run XLSX V3
  const excelFileName = 'meesho_catalog_dry_run_v3.xlsx';
  const rootExcelPath = path.resolve(WORKSPACE_ROOT, excelFileName);
  const artifactExcelPath = path.resolve(ARTIFACT_DIR, excelFileName);

  await generateMeeshoCatalogExcel(allRows, rootExcelPath);
  if (fs.existsSync(ARTIFACT_DIR)) {
    await generateMeeshoCatalogExcel(allRows, artifactExcelPath);
  }

  // Generate Review Report MD V3
  const reportFileName = 'meesho_catalog_content_review_v3.md';
  const rootReportPath = path.resolve(WORKSPACE_ROOT, reportFileName);
  const artifactReportPath = path.resolve(ARTIFACT_DIR, reportFileName);

  generateReviewReportV3(stats, sampleProducts, rootReportPath);
  if (fs.existsSync(ARTIFACT_DIR)) {
    generateReviewReportV3(stats, sampleProducts, artifactReportPath);
  }

  console.log('-------------------------------------------------------------------');
  console.log('  PHASE 2B QA SUMMARY & FILE LOCATIONS');
  console.log('-------------------------------------------------------------------');
  console.log(`- Total Products:                    ${stats.totalProducts}`);
  console.log(`- Total Catalog Rows (144 SKUs):    ${stats.totalRows}`);
  console.log(`- Total Selected Images Processed:   ${stats.totalProcessedImages} / ${stats.totalSelectedImages}`);
  console.log(`- Garment Brand Marks Audited:      ${stats.totalMarksDetected}`);
  console.log(`- Verified Colors (with Sources):   ${stats.verifiedColorCount} / ${stats.totalProducts}`);
  console.log(`- Unsupported Claims Removed:       Yes (Fabric = Polyester enforced)`);
  console.log(`- Validation Engine Status:          ${stats.isValid ? 'PASS' : 'FAIL'}`);
  console.log(`\nGenerated Output Files:`);
  console.log(`  - Excel V3:  ${rootExcelPath}`);
  console.log(`  - Report V3: ${rootReportPath}\n`);
  console.log('===================================================================');
  console.log('  PHASE 2B COMPLETE — ZERO UPLOADS OR DB MUTATIONS MADE');
  console.log('===================================================================\n');
}

runPhase2B();
