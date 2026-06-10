import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
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
    const orderId = body.orderId;

    if (!orderId) {
      throw new Error("Missing orderId in request body.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dbOrder, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !dbOrder) {
      return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const mappedOrder = {
      orderId: dbOrder.id,
      trackingId: dbOrder.tracking_id,
      total: dbOrder.total,
      payMethod: dbOrder.pay_method,
      items: dbOrder.items || [],
      customer: {
        name: dbOrder.customer_name,
        email: dbOrder.customer_email,
        phone: dbOrder.customer_phone,
      },
    };

    const pdfBytes = await generateInvoicePDF(mappedOrder);

    return new Response(pdfBytes as BodyInit, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${mappedOrder.orderId}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
