import { serve } from "https://deno.land/std/http/server.ts";
import { generateInvoicePDF } from "../_shared/invoiceTemplate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const order = body.order;

    if (!order) {
      throw new Error("Missing order in request body.");
    }

    const pdfBytes = await generateInvoicePDF(order);
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

    if (!FROM_EMAIL) {
      throw new Error("RESEND_FROM_EMAIL secret is not configured.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `JerseyVault <${FROM_EMAIL}>`,
        to: order.customer.email,
        subject: `Your JerseyVault Invoice ${order.orderId}`,
        html: `
          <h2>Order Confirmed ✅</h2>
          <p>Order ID: <strong>${order.orderId}</strong></p>
          <p>Tracking ID: <strong>${order.trackingId}</strong></p>
          <p>Your invoice PDF is attached.</p>
        `,
        attachments: [
          {
            filename: `${order.orderId}.pdf`,
            content: pdfBase64
          }
        ]
      })
    });

    const errorText = await res.text();

    console.log("FROM:", FROM_EMAIL);
    console.log("TO:", order.customer.email);
    console.log("SUBJECT:", `Your JerseyVault Invoice ${order.orderId}`);
    console.log("RESEND STATUS:", res.status);
    console.log("RESEND RESPONSE:", errorText);

    if (!res.ok) {
      throw new Error(`Resend failed: ${res.status} ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});