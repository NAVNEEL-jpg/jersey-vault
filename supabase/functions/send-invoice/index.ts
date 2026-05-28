import { serve } from "https://deno.land/std/http/server.ts"
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib"

serve(async (req) => {

  const body = await req.json()

  const order = body.order

  const pdfDoc = await PDFDocument.create()

  const page = pdfDoc.addPage([600, 800])

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  page.drawText("JERSEYVAULT", {
    x: 50,
    y: 760,
    size: 26,
    font: bold,
    color: rgb(0.22, 1, 0.08)
  })

  page.drawText(`Order ID: ${order.orderId}`, {
    x: 50,
    y: 710,
    size: 14,
    font
  })

  page.drawText(`Tracking ID: ${order.trackingId}`, {
    x: 50,
    y: 690,
    size: 14,
    font
  })

  page.drawText(`Customer: ${order.customer?.name}`, {
    x: 50,
    y: 650,
    size: 13,
    font
  })

  let y = 580

  order.items.forEach((item: any) => {

    page.drawText(
      `${item.name} | ${item.size} | Qty:${item.qty}`,
      {
        x: 50,
        y,
        size: 12,
        font
      }
    )

    y -= 24
  })

  page.drawText(`TOTAL: ₹${order.total}`, {
    x: 50,
    y: y - 20,
    size: 18,
    font: bold
  })

  const pdfBytes = await pdfDoc.save()

  const pdfBase64 = btoa(
    String.fromCharCode(...pdfBytes)
  )

  const RESEND_API_KEY =
    Deno.env.get("RESEND_API_KEY")

  await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",

      headers: {
        "Authorization":
          `Bearer ${RESEND_API_KEY}`,

        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({

        from:
          "JerseyVault <onboarding@resend.dev>",

        to:
          order.customer.email,

        subject:
          `Your JerseyVault Invoice ${order.orderId}`,

        html: `
          <h2>Order Confirmed ✅</h2>

          <p>
            Order ID:
            <strong>${order.orderId}</strong>
          </p>

          <p>
            Tracking ID:
            <strong>${order.trackingId}</strong>
          </p>

          <p>
            Your invoice PDF is attached.
          </p>
        `,

        attachments: [
          {
            filename:
              `${order.orderId}.pdf`,

            content:
              pdfBase64
          }
        ]
      })
    }
  )

  return new Response(
    JSON.stringify({
      success: true
    }),
    {
      headers: {
        "Content-Type":
          "application/json"
      }
    }
  )
})