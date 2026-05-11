import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';

export const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch Order Data
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 2. Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fillColor('#39ff14').fontSize(24).text('JERSEYVAULT', 50, 50, { align: 'left' });
    doc.fillColor('#555').fontSize(10).text('THE ULTIMATE JERSEY COLLECTION', 50, 80);

    doc.fillColor('#000').fontSize(20).text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).text(`Order ID: ${order.id}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 400, 90, { align: 'right' });

    doc.moveTo(50, 115).lineTo(550, 115).stroke();

    // Customer Details
    doc.fontSize(12).text('BILL TO:', 50, 140, { underline: true });
    doc.fontSize(10).text(order.customer_name || order.shipping_address?.name || 'N/A', 50, 160);
    doc.text(order.address || order.shipping_address?.address || '', 50, 175);
    doc.text(`${order.city || order.shipping_address?.city || ''}, ${order.state || order.shipping_address?.state || ''} - ${order.pincode || order.shipping_address?.pincode || ''}`, 50, 190);
    doc.text(`Phone: ${order.customer_phone || order.shipping_address?.phone || 'N/A'}`, 50, 205);
    doc.text(`Email: ${order.customer_email || order.shipping_address?.email || 'N/A'}`, 50, 220);

    // Payment Info
    doc.fontSize(12).text('PAYMENT METHOD:', 350, 140, { underline: true });
    doc.fontSize(10).text(order.pay_method?.toUpperCase() || order.payment_method?.toUpperCase() || 'N/A', 350, 160);
    doc.text(`Status: ${order.status?.toUpperCase() || 'PENDING'}`, 350, 175);

    // Items Table Header
    const tableTop = 270;
    doc.fillColor('#f0f0f0').rect(50, tableTop, 500, 20).fill();
    doc.fillColor('#000').fontSize(10).text('DESCRIPTION', 60, tableTop + 5);
    doc.text('SIZE', 300, tableTop + 5);
    doc.text('QTY', 370, tableTop + 5);
    doc.text('PRICE', 430, tableTop + 5);
    doc.text('TOTAL', 500, tableTop + 5);

    // Items List
    let currentY = tableTop + 30;
    const items = Array.isArray(order.items) ? order.items : [];

    items.forEach(item => {
      doc.text(item.name || 'Product', 60, currentY, { width: 230 });
      doc.text(item.size || '-', 300, currentY);
      doc.text(item.qty?.toString() || '0', 370, currentY);
      doc.text(`₹${item.price || 0}`, 430, currentY);
      doc.text(`₹${(item.price * item.qty) || 0}`, 500, currentY);
      currentY += 25;
    });

    // Summary
    const summaryY = currentY + 30;
    doc.moveTo(350, summaryY).lineTo(550, summaryY).stroke();

    doc.text('SUBTOTAL:', 400, summaryY + 10);
    doc.text(`₹${order.subtotal || order.items_price || 0}`, 500, summaryY + 10);

    doc.text('SHIPPING:', 400, summaryY + 25);
    doc.text(`₹${order.shipping || order.shipping_price || 0}`, 500, summaryY + 25);

    const isCOD = order.pay_method === 'COD' || order.payment_method === 'COD' || order.payment_type === 'COD';
    const amountPaid = isCOD ? 99 : (order.total || order.total_price || 0);

    if (isCOD) {
      doc.text('COD FEE:', 400, summaryY + 40);
      doc.text(`₹${order.cod_fee || 30}`, 500, summaryY + 40);
      doc.text('PAID ONLINE:', 400, summaryY + 55);
      doc.text(`- ₹99`, 500, summaryY + 55);
    }

    doc.fillColor('#39ff14').fontSize(14).text('TOTAL DUE:', 350, summaryY + 75);
    const totalDue = order.total || order.total_price || 0;
    const finalAmount = isCOD ? (totalDue - 99) : 0;
    doc.text(`₹${finalAmount}`, 500, summaryY + 75);

    // Footer
    doc.fillColor('#888').fontSize(10).text('Thank you for shopping with JerseyVault!', 50, 700, { align: 'center' });
    doc.text('This is a computer generated invoice.', 50, 715, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Invoice Error:', error);
    res.status(500).json({ message: 'Error generating invoice' });
  }
};
