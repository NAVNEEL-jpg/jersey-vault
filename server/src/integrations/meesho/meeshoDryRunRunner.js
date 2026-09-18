import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapProductToMeeshoRows } from './meeshoMapper.js';
import { validateMeeshoCatalogRows } from './meeshoValidator.js';
import { generateMeeshoCatalogExcel } from './meeshoExcelGenerator.js';
import { generateReviewReport } from './meeshoReviewReporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const ARTIFACT_DIR = 'C:\\Users\\Saptarshi\\.gemini\\antigravity-ide\\brain\\d9deda39-17a7-4453-8be8-fa25015a080b';

async function runDryRun() {
  console.log('\n======================================================');
  console.log('  JERSEY VAULT × MEESHO PHASE 1: DRY-RUN GENERATOR');
  console.log('======================================================\n');

  const productsPath = path.resolve(__dirname, '../../data/products.json');
  if (!fs.existsSync(productsPath)) {
    console.error(`[Error] products.json not found at: ${productsPath}`);
    process.exit(1);
  }

  const rawProducts = fs.readFileSync(productsPath, 'utf8');
  const products = JSON.parse(rawProducts);

  console.log(`[Info] Loaded ${products.length} Jersey Vault products from products.json`);

  let allRows = [];
  products.forEach((product) => {
    const { rows } = mapProductToMeeshoRows(product);
    allRows = allRows.concat(rows);
  });

  console.log(`[Info] Generated ${allRows.length} catalog variant rows (4 sizes per product)`);

  // Run validation
  const validationResult = validateMeeshoCatalogRows(allRows, products);

  console.log('\n--- VALIDATION SUMMARY ---');
  console.log(`- Is Valid: ${validationResult.isValid}`);
  console.log(`- Total Products: ${validationResult.totalProducts}`);
  console.log(`- Eligible Products: ${validationResult.eligibleProducts}`);
  console.log(`- Products Requiring Color/Image Review: ${validationResult.reviewCount}`);
  console.log(`- Total Rows: ${validationResult.totalRows}`);
  console.log(`- Unique SKUs: ${validationResult.uniqueSkus}`);
  console.log(`- Errors Count: ${validationResult.errors.length}`);
  console.log(`- Warnings Count: ${validationResult.warnings.length}\n`);

  if (validationResult.errors.length > 0) {
    console.error('[Validation Errors Detected]:');
    validationResult.errors.forEach((err) => console.error(`  - ${err}`));
  }

  // Generate Dry-Run XLSX files
  const excelFileName = 'meesho_catalog_dry_run.xlsx';
  const rootExcelPath = path.resolve(WORKSPACE_ROOT, excelFileName);
  const artifactExcelPath = path.resolve(ARTIFACT_DIR, excelFileName);

  await generateMeeshoCatalogExcel(allRows, rootExcelPath);
  if (fs.existsSync(ARTIFACT_DIR)) {
    await generateMeeshoCatalogExcel(allRows, artifactExcelPath);
  }
  console.log(`[Success] Generated Dry-Run Excel Catalog at:`);
  console.log(`  - Root: ${rootExcelPath}`);
  if (fs.existsSync(ARTIFACT_DIR)) console.log(`  - Artifact: ${artifactExcelPath}`);

  // Generate Review Report MD files
  const reportFileName = 'meesho_catalog_review.md';
  const rootReportPath = path.resolve(WORKSPACE_ROOT, reportFileName);
  const artifactReportPath = path.resolve(ARTIFACT_DIR, reportFileName);

  generateReviewReport(validationResult, validationResult.reviewProducts, rootReportPath);
  if (fs.existsSync(ARTIFACT_DIR)) {
    generateReviewReport(validationResult, validationResult.reviewProducts, artifactReportPath);
  }
  console.log(`[Success] Generated Catalog Review Report at:`);
  console.log(`  - Root: ${rootReportPath}`);
  if (fs.existsSync(ARTIFACT_DIR)) console.log(`  - Artifact: ${artifactReportPath}`);

  console.log('\n======================================================');
  console.log('  DRY-RUN COMPLETE — ZERO UPLOADS OR DB MUTATIONS MADE');
  console.log('======================================================\n');
}

runDryRun();
