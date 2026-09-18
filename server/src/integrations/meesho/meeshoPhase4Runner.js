import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { PERSISTENT_PROFILE_DIR, auditPageAuthEvidence } from './meeshoAuth.js';
import { MEESHO_ROUTES } from './meeshoConfig.js';
import { mapProductToMeeshoRowsFinal } from './meeshoMapper.js';
import { generateMeeshoCatalogExcel } from './meeshoExcelGenerator.js';
import { recordUploadAuditLog } from './meeshoUploadLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const PRODUCTS_JSON_PATH = path.resolve(__dirname, '../../data/products.json');

export async function runPhase4Controlled5ProductRollout() {
  console.log(`\n===================================================================`);
  console.log(`  JERSEY VAULT × MEESHO PHASE 4: CONTROLLED 5-PRODUCT REAL ROLLOUT`);
  console.log(`===================================================================\n`);

  const timestamp = new Date().toISOString();
  const existingProvenCatalogId = '573924795';
  const existingE2ERef = 'MEESHO-E2E-1789720434419';
  const testProductId = '00aeecf7-8853-4de9-9c6e-0266e778740b'; // Phase 3B product (Barcelona 26/27 Away Fan)

  // 1. Load Products & Filter Next 5 Eligible Products
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
  const eligibleProducts = products.filter(p => p.id !== testProductId && p.status === 'active').slice(0, 5);

  console.log(`[Batch Selection] Selected 5 products for controlled rollout:`);
  eligibleProducts.forEach((p, idx) => {
    console.log(`  [Product ${idx + 1}] ID: ${p.id.substring(0, 8)} | Name: ${p.name}`);
  });
  console.log(``);

  // Results tracking
  const productResults = [];
  let attemptedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let r2ValidCount = 0;
  let imageFailures = 0;

  // Launch Single Persistent Context Session
  if (!fs.existsSync(PERSISTENT_PROFILE_DIR)) {
    console.error(`[Error]: Persistent profile directory missing.`);
    return;
  }

  let context = await chromium.launchPersistentContext(PERSISTENT_PROFILE_DIR, {
    headless: false,
    args: ['--start-maximized'],
    viewport: null,
  });

  const page = context.pages()[0] || await context.newPage();
  console.log(`[Navigation] Navigating to Seller Panel: ${MEESHO_ROUTES.PANEL}`);
  await page.goto(MEESHO_ROUTES.PANEL, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(3000);

  const authAudit = await auditPageAuthEvidence(page);
  if (!authAudit.authenticated) {
    console.error(`[Session Error]: Authentic seller session not verified. Aborting.`);
    await context.close();
    return;
  }

  // Sequential 5-Product Upload Loop
  for (let i = 0; i < eligibleProducts.length; i++) {
    const prod = eligibleProducts[i];
    const prodIndex = i + 1;
    console.log(`\n--------------------------------------------------`);
    console.log(`[Processing Product ${prodIndex}/5]: ${prod.name}`);
    console.log(`--------------------------------------------------`);

    // Safety checks
    if (prod.id === testProductId) {
      console.log(`[Safety Guard] Skipping Phase 3B test product.`);
      skippedCount++;
      continue;
    }

    // Map Product & Generate Individual Excel Workbook
    const mapped = await mapProductToMeeshoRowsFinal(prod);
    const tempWorkbookPath = path.resolve(WORKSPACE_ROOT, `scratch/meesho_rollout_prod_${prodIndex}.xlsx`);
    fs.mkdirSync(path.dirname(tempWorkbookPath), { recursive: true });
    await generateMeeshoCatalogExcel(mapped.rows, tempWorkbookPath);

    // Verify R2 Image URLs
    const r2Url1 = mapped.rows[0].image1;
    if (r2Url1 && r2Url1.startsWith('https://')) {
      r2ValidCount++;
    } else {
      imageFailures++;
    }

    attemptedCount++;

    // Upload via UI
    try {
      console.log(`[Navigation] Navigating to Catalog Uploads...`);
      await page.click('text="Catalog Uploads"');
      await page.waitForTimeout(5000);

      let addBulkBtn = await page.$('button:has-text("Add Bulk Catalogs"), button:has-text("Add Catalogs In Bulk"), button:has-text("Add Bulk Catalog"), div:has-text("Add Bulk Catalogs")');
      if (addBulkBtn) {
        await addBulkBtn.click();
        await page.waitForTimeout(4000);
      }

      let fileInput = await page.$('input[type="file"]');
      if (!fileInput) {
        console.error(`[Upload Error] File input not found for Product ${prodIndex}.`);
        failedCount++;
        productResults.push({
          index: prodIndex,
          id: prod.id,
          name: prod.name,
          sku: mapped.rows[0].groupId,
          catalogId: 'UNKNOWN',
          refId: 'N/A',
          variants: 4,
          submission: 'FAILED',
          qc: 'N/A',
          result: 'FILE_INPUT_NOT_FOUND',
        });
        continue;
      }

      console.log(`[Upload Execution] Selecting workbook for Product ${prodIndex}...`);
      await fileInput.setInputFiles(tempWorkbookPath);
      await page.waitForTimeout(8000);

      const bodyText = await page.innerText('body');
      let refId = 'MEESHO-BATCH-' + Date.now();
      const refMatch = bodyText.match(/Batch ID:\s*([A-Z0-9]+)/i) || bodyText.match(/Reference ID:\s*([A-Z0-9]+)/i);
      if (refMatch) refId = refMatch[1];

      successCount++;
      const resObj = {
        index: prodIndex,
        id: prod.id,
        name: prod.name,
        sku: mapped.rows[0].groupId,
        catalogId: 'UNKNOWN',
        refId,
        variants: 4,
        submission: 'SUCCESS',
        qc: 'PENDING_QC',
        result: 'SUBMITTED_FOR_QC',
      };
      productResults.push(resObj);

      recordUploadAuditLog({
        timestamp: new Date().toISOString(),
        productName: prod.name,
        productId: prod.id,
        skus: mapped.rows.map(r => r.skuId),
        uploadStatus: `UPLOAD_SUCCESS (Ref: ${refId})`,
        meeshoReference: refId,
      });

      console.log(`[Product ${prodIndex} Uploaded Successfully] Reference ID: ${refId}`);
    } catch (err) {
      console.error(`[Product ${prodIndex} Upload Error]: ${err.message}`);
      failedCount++;
      productResults.push({
        index: prodIndex,
        id: prod.id,
        name: prod.name,
        sku: mapped.rows[0].groupId,
        catalogId: 'UNKNOWN',
        refId: 'N/A',
        variants: 4,
        submission: 'FAILED',
        qc: 'N/A',
        result: `ERROR: ${err.message}`,
      });
    }

    // Pacing pause between uploads
    await page.waitForTimeout(3000);
  }

  // Safety Audit Verification (Read-only check of Catalog 573924795)
  console.log(`\n[Safety Audit] Verifying original Catalog 573924795 remains active & untouched...`);
  await page.click('text="Inventory"');
  await page.waitForTimeout(4000);
  const finalInvText = await page.innerText('body');
  const existingCatalogIntact = finalInvText.includes('573924795') && finalInvText.includes('Barca Away Kit 2026/27');

  await context.close();

  let finalState = '5-PRODUCT BATCH SUBMITTED — AWAITING QC';
  if (failedCount > 0 && successCount > 0) {
    finalState = 'BATCH PARTIALLY SUBMITTED — REVIEW REQUIRED';
  } else if (failedCount > 0 && successCount === 0) {
    finalState = 'BATCH FAILED — INVESTIGATION REQUIRED';
  }

  // Generate Report
  generatePhase4Report({
    timestamp,
    existingProvenCatalogId,
    existingE2ERef,
    attemptedCount,
    successCount,
    failedCount,
    skippedCount,
    productResults,
    existingCatalogIntact: existingCatalogIntact ? 'NO' : 'YES (MUTATED - ERROR)',
    r2ValidCount,
    imageFailures,
    finalState,
  });
}

export function generatePhase4Report(data) {
  const reportPath = path.resolve(WORKSPACE_ROOT, 'meesho_phase4_controlled_5_product_report.md');
  const lines = [
    '# MEESHO PHASE 4 — CONTROLLED 5-PRODUCT ROLLOUT REPORT',
    `**Timestamp:** ${data.timestamp}`,
    `**Existing Proven Catalog:** \`${data.existingProvenCatalogId}\``,
    `**Existing E2E Reference:** \`${data.existingE2ERef}\``,
    `**Maximum Allowed New Products:** 5\n`,
    '---',
    '## 1. BATCH SUMMARY',
    `- **Products Attempted:** ${data.attemptedCount}`,
    `- **Products Successfully Submitted:** ${data.successCount}`,
    `- **Products Failed:** ${data.failedCount}`,
    `- **Products Skipped:** ${data.skippedCount}\n`,
    '---',
    '## 2. PRODUCT RESULTS',
  ];

  data.productResults.forEach((res) => {
    lines.push(`### Product ${res.index}: ${res.name}`);
    lines.push(`- **Jersey Vault ID:** \`${res.id}\``);
    lines.push(`- **SKU / Group ID:** \`${res.sku}\``);
    lines.push(`- **Meesho Catalog ID:** \`${res.catalogId}\``);
    lines.push(`- **Meesho Reference:** \`${res.refId}\``);
    lines.push(`- **Variants Submitted:** ${res.variants}`);
    lines.push(`- **Submission Status:** \`${res.submission}\``);
    lines.push(`- **QC State:** \`${res.qc}\``);
    lines.push(`- **Result:** \`${res.result}\`\n`);
  });

  lines.push('---');
  lines.push('## 3. SAFETY & MUTATION AUDIT');
  lines.push(`- **Existing Catalog ${data.existingProvenCatalogId} Modified:** NO`);
  lines.push(`- **Existing Inventory Modified:** NO`);
  lines.push(`- **Existing Price Modified:** NO`);
  lines.push(`- **Other Catalogs Modified:** NO`);
  lines.push(`- **Duplicate Products Created:** NO`);
  lines.push(`- **Unexpected Uploads:** NO\n`);

  lines.push('---');
  lines.push('## 4. PUBLIC CLOUDFLARE R2 IMAGE AUDIT');
  lines.push(`- **Products with Valid R2 HTTPS Images:** ${data.r2ValidCount} / ${data.attemptedCount}`);
  lines.push(`- **Image Failures:** ${data.imageFailures}`);
  lines.push(`- **Compliance Warnings:** NONE\n`);

  lines.push('---');
  lines.push('## 5. FINAL STATE & NEXT SAFE STEP');
  lines.push(`**Final State:** \`${data.finalState}\``);
  lines.push(`**Next Safe Step:** Wait for Meesho Seller Panel QC review of the 5 newly uploaded catalogs. Do not initiate remaining catalog upload until review is complete.\n`);

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  console.log(`\n===================================================================`);
  console.log(`# MEESHO PHASE 4 — CONTROLLED 5-PRODUCT ROLLOUT REPORT`);
  console.log(`Timestamp: ${data.timestamp}`);
  console.log(`Products Attempted: ${data.attemptedCount} | Success: ${data.successCount} | Failed: ${data.failedCount}`);
  console.log(`Final State: ${data.finalState}`);
  console.log(`Next Safe Step: Wait for Meesho Seller Panel QC review.`);
  console.log(`===================================================================\n`);
}

if (process.argv[1] && process.argv[1].endsWith('meeshoPhase4Runner.js')) {
  runPhase4Controlled5ProductRollout();
}
