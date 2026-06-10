import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib";

export async function generateInvoicePDF(order: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText("JERSEYVAULT", {
    x: 50,
    y: 760,
    size: 26,
    font: bold,
    color: rgb(0.22, 1, 0.08)
  });

  page.drawText(`Order ID: ${order.orderId}`, {
    x: 50,
    y: 710,
    size: 14,
    font
  });

  page.drawText(`Tracking ID: ${order.trackingId}`, {
    x: 50,
    y: 690,
    size: 14,
    font
  });

  page.drawText(`Customer: ${order.customer?.name}`, {
    x: 50,
    y: 650,
    size: 13,
    font
  });

  let y = 580;

  if (order.items && Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      page.drawText(
        `${item.name} | ${item.size} | Qty:${item.qty}`,
        {
          x: 50,
          y,
          size: 12,
          font
        }
      );
      y -= 24;
    });
  }

  page.drawText(`TOTAL: INR ${order.total}`, {
    x: 50,
    y: y - 20,
    size: 18,
    font: bold
  });

  return await pdfDoc.save();
}
