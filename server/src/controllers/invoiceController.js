import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';

export const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    doc.pipe(res);

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

    // Header
    doc.fillColor('#39ff14').fontSize(24).text('JERSEYVAULT', 50, 50);
    doc.fillColor('#555555').fontSize(10).text('THE ULTIMATE JERSEY COLLECTION', 50, 80);

    doc.fillColor('#000000').fontSize(20).text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).text(`Order ID: ${order.id}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${orderDate}`, 400, 90, { align: 'right' });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#cccccc').stroke();

    // Customer
    doc.fillColor('#000000').fontSize(12).text('BILL TO:', 50, 140, { underline: true });
    doc.fontSize(10)
      .text(customerName, 50, 160)
      .text(address, 50, 175)
      .text(`${city}${city && state ? ', ' : ''}${state}${pincode ? ` - ${pincode}` : ''}`, 50, 190)
      .text(`Phone: ${phone}`, 50, 205)
      .text(`Email: ${email}`, 50, 220);

    // Payment
    doc.fontSize(12).text('PAYMENT METHOD:', 350, 140, { underline: true });
    doc.fontSize(10).text(payMethod, 350, 160).text(`Status: ${status}`, 350, 175);

    // Items table
    const tableTop = 270;
    doc.rect(50, tableTop, 495, 20).fill('#f0f0f0');
    doc.fillColor('#000000').fontSize(10)
      .text('DESCRIPTION', 60, tableTop + 5)
      .text('SIZE', 300, tableTop + 5)
      .text('QTY', 370, tableTop + 5)
      .text('PRICE', 430, tableTop + 5)
      .text('TOTAL', 495, tableTop + 5);

    let currentY = tableTop + 30;
    const items = Array.isArray(order.items) ? order.items : [];

    items.forEach((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      doc.text(item.name || 'Product', 60, currentY, { width: 220 });
      doc.text(item.size || '-', 300, currentY);
      doc.text(String(qty), 370, currentY);
      doc.text(`₹${price}`, 430, currentY);
      doc.text(`₹${price * qty}`, 495, currentY);
      currentY += 25;
    });

    const summaryY = currentY + 30;
    doc.moveTo(350, summaryY).lineTo(545, summaryY).strokeColor('#cccccc').stroke();

    doc.fontSize(10).text('SUBTOTAL:', 400, summaryY + 10).text(`₹${subtotal}`, 495, summaryY + 10);
    doc.text('SHIPPING:', 400, summaryY + 25).text(`₹${shipping}`, 495, summaryY + 25);

    if (isCOD) {
      doc.text('COD FEE:', 400, summaryY + 40).text(`₹${codFee}`, 495, summaryY + 40);
      doc.text('PAID ONLINE:', 400, summaryY + 55).text('₹99', 495, summaryY + 55);
      doc.fillColor('#39ff14').fontSize(12).text('BALANCE DUE (COD):', 350, summaryY + 75);
      doc.text(`₹${Math.max(0, total - 99)}`, 495, summaryY + 75);
    } else {
      doc.fillColor('#39ff14').fontSize(12).text('AMOUNT PAID:', 350, summaryY + 55);
      doc.text(`₹${total}`, 495, summaryY + 55);
    }

    doc.fillColor('#888888').fontSize(10)
      .text('Thank you for shopping with JerseyVault!', 50, 700, { align: 'center', width: 495 })
      .text('This is a computer generated invoice.', 50, 715, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    console.error('Invoice Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating invoice' });
    }
  }
};
