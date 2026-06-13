import PDFDocument from 'pdfkit';
import { COD_DEPOSIT } from '../controllers/paymentController.js';


/**
 * Generates a PDF buffer for a given order object.
 * Reuses the exact PDFKit logic previously in invoiceController.js.
 * @param {Object} order - The order object from the database.
 * @returns {Promise<Buffer>} - Resolves with the binary PDF buffer.
 */
export function generatePDFBuffer(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // To store the PDF data in memory
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const orderDate = order.created_at
        ? new Date(order.created_at).toLocaleDateString('en-IN')
        : new Date().toLocaleDateString('en-IN');

      const customerName = order.customer_name || order.shipping_address?.name || 'N/A';
      const address = order.address || order.shipping_address?.address || '';
      const city = order.city || order.shipping_address?.city || '';
      const state = order.state || order.shipping_address?.state || '';
      const pincode = order.pincode || order.shipping_address?.pincode || '';
      const phone = order.customer_phone || order.shipping_address?.phone || 'N/A';
      const email = order.customer_email || order.shipping_address?.email || 'N/A';
      const payMethod = (order.pay_method || order.payment_method || order.payment_type || 'N/A').toString().toUpperCase();
      const status = (order.status || 'pending').toString().toUpperCase();

      const subtotal = Number(order.subtotal ?? order.items_price ?? 0);
      const shipping = Number(order.shipping ?? order.shipping_price ?? 0);
      const total = Number(order.total ?? order.total_price ?? subtotal + shipping);
      const codFee = Number(order.cod_fee ?? 30);

      const isCOD = ['COD', 'CASH ON DELIVERY'].some(
        (k) => payMethod.includes(k) || (order.payment_type || '').toUpperCase() === 'COD'
      );

      const amountPaidOnline = isCOD ? COD_DEPOSIT : total;
      const balanceDue = isCOD ? Math.max(0, total - amountPaidOnline) : 0;

      // Header
      doc.fillColor('#39ff14').fontSize(24).text('JERSEYVAULT', 50, 50);
      doc.fillColor('#555555').fontSize(10)
        .text('The Ultimate Jersey Collection', 50, doc.y + 4)
        .text('www.thejerseyvault.in', 50, doc.y + 2)
        .text('support@thejerseyvault.in', 50, doc.y + 2)
        .text('+91 7029786817', 50, doc.y + 2);
      const leftHeaderY = doc.y;

      doc.fillColor('#000000').fontSize(20).text('INVOICE', 400, 50, { align: 'right', width: 145 });
      doc.fontSize(9)
        .text(`Invoice Number:\nINV-${(order.id || '').slice(-6).toUpperCase()}`, 400, doc.y + 10, { align: 'right', width: 145 })
        .text(`Order ID:\n${order.id}`, 400, doc.y + 5, { align: 'right', width: 145 })
        .text(`Tracking ID:\n${order.tracking_id || 'N/A'}`, 400, doc.y + 5, { align: 'right', width: 145 })
        .text(`Invoice Date:\n${orderDate}`, 400, doc.y + 5, { align: 'right', width: 145 });
      const rightHeaderY = doc.y;

      const headerBottom = Math.max(leftHeaderY, rightHeaderY) + 15;
      doc.moveTo(50, headerBottom).lineTo(545, headerBottom).strokeColor('#cccccc').stroke();

      const billingTop = headerBottom + 25;

      // Customer
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, billingTop, { underline: true });
      doc.font('Helvetica').fontSize(10).text(customerName, 50, billingTop + 20, { width: 250 });
      if (address) doc.text(address, { width: 250 });
      const cityStatePin = [city, state].filter(Boolean).join(', ') + (pincode ? ` - ${pincode}` : '');
      if (cityStatePin) doc.text(cityStatePin, { width: 250 });
      if (phone && phone !== 'N/A') doc.text(`Phone: ${phone}`, { width: 250 });
      if (email && email !== 'N/A') doc.text(`Email: ${email}`, { width: 250 });
      const leftHeight = doc.y;

      // Payment
      doc.fontSize(12).font('Helvetica-Bold').text('PAYMENT:', 350, billingTop, { underline: true });
      doc.font('Helvetica').fontSize(10).text(`Method: ${payMethod}`, 350, billingTop + 20, { width: 195 });
      doc.text(`Status: ${status}`, { width: 195 });
      const rightHeight = doc.y;

      // Items table
      const tableTop = Math.max(leftHeight, rightHeight) + 40;
      doc.rect(50, tableTop, 495, 25).fill('#eeeeee');
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
        .text('DESCRIPTION', 60, tableTop + 8)
        .text('SIZE', 300, tableTop + 8)
        .text('QTY', 370, tableTop + 8)
        .text('PRICE', 430, tableTop + 8)
        .text('TOTAL', 495, tableTop + 8);

      let currentY = tableTop + 35;
      const items = Array.isArray(order.items) ? order.items : [];
      doc.font('Helvetica');

      items.forEach((item, index) => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        const startY = currentY;

        doc.text(item.name || 'Product', 60, currentY, { width: 220 });
        const nameHeight = doc.y - startY;

        doc.text(item.size || '-', 300, startY);
        doc.text(String(qty), 370, startY);
        doc.text(`₹${price}`, 430, startY);
        doc.text(`₹${price * qty}`, 495, startY);

        currentY += Math.max(nameHeight, 15) + 10;

        // Row separator
        if (index < items.length - 1) {
          doc.moveTo(50, currentY - 5).lineTo(545, currentY - 5).strokeColor('#eeeeee').stroke();
        }
      });

      const summaryY = currentY + 15;
      doc.moveTo(350, summaryY).lineTo(545, summaryY).strokeColor('#cccccc').stroke();

      doc.font('Helvetica').fontSize(10).text('Subtotal:', 400, summaryY + 15).text(`₹${subtotal}`, 495, summaryY + 15);
      doc.text('Shipping:', 400, summaryY + 30).text(`₹${shipping}`, 495, summaryY + 30);

      let nextY = summaryY + 45;
      if (isCOD) {
        doc.text('COD Deposit:', 400, nextY).text(`₹${COD_DEPOSIT}`, 495, nextY);
        nextY += 15;
        doc.text('Amount Paid Online:', 400, nextY).text(`₹${COD_DEPOSIT}`, 495, nextY);
        nextY += 20;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text('BALANCE DUE ON DELIVERY:', 280, nextY);
        doc.text(`₹${balanceDue}`, 495, nextY);
      } else {
        nextY += 15;
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text('PAID IN FULL:', 350, nextY);
        doc.text(`₹${total}`, 495, nextY);
      }

      // Tracking prominence
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text('TRACKING:', 50, nextY - 15);
      doc.fillColor('#000000').fontSize(14).text(`Tracking ID: ${order.tracking_id || 'N/A'}`, 50, nextY + 5);

      doc.fillColor('#888888').font('Helvetica').fontSize(9)
        .text('Thank you for shopping with Jersey Vault.', 50, 715, { align: 'center', width: 495 })
        .text('For support: support@thejerseyvault.in | +91 7029786817 | www.thejerseyvault.in', 50, 730, { align: 'center', width: 495 })
        .text('This is a computer-generated invoice and does not require a signature.', 50, 745, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
