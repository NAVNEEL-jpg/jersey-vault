import { supabase } from "../supabase";

export async function downloadInvoice(orderId, { admin = false } = {}) {
  if (!orderId) {
    alert("Order ID missing — cannot download invoice.");
    return false;
  }

  try {
    // Get order data from Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) throw new Error("Order not found");

    // Call Edge Function to generate PDF and send email
    const { data, error: fnError } = await supabase.functions.invoke("send-invoice", {
      body: {
        order: {
          id: order.id,
          orderId: order.id,
          total: order.total,
          payMethod: order.pay_method,
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          items: order.items || [],
          customer: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
          },
        }
      }
    });

    if (fnError) throw new Error(fnError.message);

    alert("✅ Invoice sent to customer's email successfully!");
    return true;

  } catch (e) {
    console.error("Invoice failed:", e);
    alert("❌ " + (e.message || "Could not send invoice."));
    return false;
  }
}