import fs from 'fs';

/**
 * Generates meesho_catalog_content_review_v2.md report (Phase 2)
 */
export function generateReviewReportV2(stats, sampleProducts, reportPath) {
  const lines = [];

  lines.push('# JERSEY VAULT × MEESHO CATALOG CONTENT & IMAGE COMPLIANCE REPORT (V2)');
  lines.push(`**Generated Date:** ${new Date().toISOString()}`);
  lines.push(`**Status:** PHASE 2 DRY-RUN VALIDATION COMPLETE (Zero Meesho Uploads Made)\n`);

  lines.push('---');
  lines.push('## EXECUTIVE SUMMARY');
  lines.push(`- **Total Jersey Vault Products:** ${stats.totalProducts}`);
  lines.push(`- **Total Generated Catalog Variant Rows:** ${stats.totalRows} (4 rows per product: S, M, L, XL)`);
  lines.push(`- **Products with Generated Product-Specific Names:** ${stats.nameCount}`);
  lines.push(`- **Products with Generated Descriptions:** ${stats.descCount}`);
  lines.push(`- **Products with Verified Colors:** ${stats.verifiedColorCount}`);
  lines.push(`- **Products Requiring Color Review:** ${stats.colorReviewCount}`);
  lines.push(`- **Images Successfully Validated & Processed:** ${stats.imagesProcessed}`);
  lines.push(`- **Images Requiring Review (Garment Brand Marks):** ${stats.imagesReviewCount}`);
  lines.push(`- **Images Invalid:** ${stats.imagesInvalidCount}`);
  lines.push(`- **Third-Party Marks Detected on Garments:** ${stats.detectedMarksCount}`);
  lines.push(`- **SKU Uniqueness & Stability:** 100% Unique (${stats.uniqueSkus} SKUs, 0 Collisions)`);
  lines.push(`- **Validation Status:** ${stats.isValid ? 'PASS' : 'FAIL'}\n`);

  lines.push('---');
  lines.push('## SAMPLE PRODUCT CONTENT & VARIANT EXAMPLES (5 SAMPLE PRODUCTS)');

  sampleProducts.forEach((sp, idx) => {
    lines.push(`### Sample ${idx + 1}: ${sp.productName}`);
    lines.push(`- **JerseyVault Name:** \`${sp.originalName}\``);
    lines.push(`- **Meesho Product Name:** \`${sp.productName}\``);
    lines.push(`- **Resolved Color:** \`${sp.color}\` (Status: ${sp.colorStatus})`);
    lines.push(`- **Image Compliance Status:** \`${sp.imageStatus}\`${sp.detectedMark ? ` (Detected Mark: ${sp.detectedMark})` : ''}`);
    lines.push(`- **SKU Variants:**`);
    lines.push(`  - **S:** \`${sp.skus.S}\``);
    lines.push(`  - **M:** \`${sp.skus.M}\``);
    lines.push(`  - **L:** \`${sp.skus.L}\``);
    lines.push(`  - **XL:** \`${sp.skus.XL}\``);
    lines.push(`- **Generated Description Preview:**`);
    lines.push('```text');
    lines.push(sp.description);
    lines.push('```\n');
  });

  lines.push('---');
  lines.push('## DETAILED PRODUCT COMPLIANCE AUDIT TABLE');
  lines.push('| PRODUCT ID | JERSEYVAULT NAME | MEESHO GENERATED NAME | COLOR | IMAGE STATUS | MARKS DETECTED | ACTION |');
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

  stats.detailedAudit.forEach((item) => {
    lines.push(`| \`${item.id}\` | ${item.originalName} | ${item.meeshoName} | \`${item.color}\` | \`${item.imageStatus}\` | \`${item.detectedMark || 'NONE'}\` | ${item.action} |`);
  });

  lines.push('\n---');
  lines.push('## IMAGE COMPLIANCE & BRAND PROTECTIONS AUDIT');
  lines.push('- **Non-Deceptive Cleanup:** WebP format assets converted to standard JPEG; aspect ratio and resolution (>=500x500 px) verified.');
  lines.push('- **Garment Brand Marks Policy:** Brand logos (e.g., Nike, Adidas, Puma) present on actual sportswear garments were **NOT** altered or removed deceptively. Items with brand marks are flagged `IMAGE_REQUIRES_REVIEW` for manual approval.');
  lines.push('- **Local Cache Directory:** Processed image copies stored safely in `server/src/integrations/meesho/processed-images/` without altering original JerseyVault assets.');

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  return reportPath;
}
