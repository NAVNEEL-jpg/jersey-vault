import { generatePDFBuffer } from '../utils/pdfGenerator.js';
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

    const pdfBuffer = await generatePDFBuffer(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Invoice Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating invoice' });
    }
  }
};
