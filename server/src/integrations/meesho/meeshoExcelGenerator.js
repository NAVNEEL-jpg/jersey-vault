import ExcelJS from 'exceljs';
import path from 'path';

/**
 * Generates the official Meesho Dry-Run XLSX file.
 */
export async function generateMeeshoCatalogExcel(allRows, outputPath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Jersey Vault Meesho Sync Engine';
  workbook.lastModifiedBy = 'Jersey Vault Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Active T-Shirts Catalog', {
    properties: { tabColor: { argb: 'FF007ACC' } },
  });

  // Official Meesho Active T-Shirts Template Columns
  sheet.columns = [
    { header: 'Group ID', key: 'groupId', width: 25 },
    { header: 'Style ID', key: 'styleId', width: 25 },
    { header: 'Product Name', key: 'productName', width: 45 },
    { header: 'SKU ID', key: 'skuId', width: 25 },
    { header: 'Size', key: 'size', width: 10 },
    { header: 'Meesho Selling Price (INR)', key: 'meeshoPrice', width: 22 },
    { header: 'MRP (INR)', key: 'mrp', width: 15 },
    { header: 'Wrong/Defective Returns Price (INR)', key: 'wrongReturnPrice', width: 30 },
    { header: 'Inventory', key: 'inventory', width: 15 },
    { header: 'Primary Image URL', key: 'image1', width: 45 },
    { header: 'Image 2 URL', key: 'image2', width: 45 },
    { header: 'Image 3 URL', key: 'image3', width: 45 },
    { header: 'Image 4 URL', key: 'image4', width: 45 },
    { header: 'Product Description', key: 'description', width: 50 },
    { header: 'Color', key: 'color', width: 25 },
    { header: 'Fabric', key: 'fabric', width: 20 },
    { header: 'Generic Name', key: 'genericName', width: 20 },
    { header: 'Neck', key: 'neck', width: 15 },
    { header: 'Sleeve Length', key: 'sleeveLength', width: 20 },
    { header: 'Print or Pattern Type', key: 'printPattern', width: 25 },
    { header: 'Net Quantity', key: 'netQuantity', width: 15 },
    { header: 'Country of Origin', key: 'countryOfOrigin', width: 20 },
    { header: 'Net Weight (Grams)', key: 'netWeightGrams', width: 20 },
    { header: 'Chest Size (Inches)', key: 'chestSize', width: 20 },
    { header: 'Length Size (Inches)', key: 'lengthSize', width: 20 },
    { header: 'Manufacturer Name', key: 'manufacturerName', width: 25 },
    { header: 'Manufacturer Address', key: 'manufacturerAddress', width: 50 },
    { header: 'Manufacturer Pincode', key: 'manufacturerPincode', width: 20 },
    { header: 'Packer Name', key: 'packerName', width: 25 },
    { header: 'Packer Address', key: 'packerAddress', width: 50 },
    { header: 'Packer Pincode', key: 'packerPincode', width: 20 },
    { header: 'Importer Name', key: 'importerName', width: 25 },
    { header: 'Importer Address', key: 'importerAddress', width: 30 },
    { header: 'Importer Pincode', key: 'importerPincode', width: 20 },
    { header: 'JV Product UUID (Internal)', key: 'jvProductId', width: 40 },
  ];

  // Header Styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E79' },
  };
  headerRow.height = 28;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Populate Rows
  allRows.forEach((rowObj) => {
    sheet.addRow(rowObj);
  });

  // Apply row height & border styling to data rows
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20;
      row.alignment = { vertical: 'middle' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    }
  });

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}
