import { supabase } from "../supabase";

export async function downloadInvoice(orderId, { admin = false } = {}) {
  if (!orderId) {
    alert("Order ID missing — cannot download invoice.");
    return false;
  }

  try {
    // Call Edge Function to generate PDF directly using orderId
    const { data, error: fnError } = await supabase.functions.invoke("download-invoice", {
      body: { orderId: orderId }
    });

    if (fnError) throw new Error(fnError.message);

    // Provide browser download for the PDF blob
    const blob = new Blob([data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert("✅ Invoice downloaded successfully!");
    return true;

  } catch (e) {
    console.error("Invoice failed:", e);
    alert("❌ " + (e.message || "Could not download invoice."));
    return false;
  }
}