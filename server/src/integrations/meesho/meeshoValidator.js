/**
 * Validation Engine for Meesho Catalog Dry-Run Rows
 */
export function validateMeeshoCatalogRows(allRows, products) {
  const errors = [];
  const warnings = [];
  const reviewProducts = [];
  const seenSkus = new Set();
  const seenGroupStyles = new Map();

  let validRowCount = 0;

  allRows.forEach((row, idx) => {
    const rowNum = idx + 1;

    // Price rules check
    if (row.mrp <= row.meeshoPrice) {
      errors.push(`Row ${rowNum} (${row.skuId}): MRP (${row.mrp}) must be strictly greater than Meesho Price (${row.meeshoPrice})`);
    }
    if (row.meeshoPrice <= row.wrongReturnPrice) {
      errors.push(`Row ${rowNum} (${row.skuId}): Meesho Price (${row.meeshoPrice}) must be strictly greater than Wrong Return Price (${row.wrongReturnPrice})`);
    }

    // Inventory check
    if (typeof row.inventory !== 'number' || row.inventory < 0) {
      errors.push(`Row ${rowNum} (${row.skuId}): Inventory must be a non-negative integer`);
    }

    // SKU uniqueness check
    if (seenSkus.has(row.skuId)) {
      errors.push(`Row ${rowNum}: Duplicate SKU ID detected '${row.skuId}'`);
    } else {
      seenSkus.add(row.skuId);
    }

    // Group ID & Style ID consistency
    if (seenGroupStyles.has(row.jvProductId)) {
      const existing = seenGroupStyles.get(row.jvProductId);
      if (existing.groupId !== row.groupId || existing.styleId !== row.styleId) {
        errors.push(`Row ${rowNum}: Group ID or Style ID mismatch for product '${row.jvProductId}'`);
      }
    } else {
      seenGroupStyles.set(row.jvProductId, { groupId: row.groupId, styleId: row.styleId });
    }

    // Image check
    if (!row.image1) {
      warnings.push(`Row ${rowNum} (${row.skuId}): Primary Image URL is missing`);
    }

    // Color review check
    if (row.color === 'COLOR_REQUIRES_REVIEW') {
      // Flagged for user review
    }

    validRowCount++;
  });

  // Per product audit
  products.forEach((p) => {
    const pRows = allRows.filter((r) => r.jvProductId === p.id);
    const hasColorIssue = pRows.some((r) => r.color === 'COLOR_REQUIRES_REVIEW');
    const hasImageIssue = pRows.some((r) => !r.image1);

    if (pRows.length !== 4) {
      errors.push(`Product '${p.name}' (${p.id}): Expected 4 size rows (S, M, L, XL), found ${pRows.length}`);
    }

    if (hasColorIssue || hasImageIssue) {
      reviewProducts.push({
        id: p.id,
        name: p.name,
        colorStatus: hasColorIssue ? 'COLOR_REQUIRES_REVIEW' : 'OK',
        imageStatus: hasImageIssue ? 'IMAGE_REQUIRES_REVIEW' : 'OK',
        action: hasColorIssue
          ? 'Explicit color not found in product title/description. User must provide color choice.'
          : 'Check image URL accessibility.',
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    reviewProducts,
    totalRows: allRows.length,
    uniqueSkus: seenSkus.size,
    totalProducts: products.length,
    eligibleProducts: products.length - reviewProducts.length,
    reviewCount: reviewProducts.length,
  };
}
