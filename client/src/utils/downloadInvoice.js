import { supabase } from "../supabase";
import { invoiceUrl } from "../config/api";

export async function downloadInvoice(orderId, { admin = false } = {}) {
  if (!orderId) {
    alert("Order ID missing — cannot download invoice.");
    return false;
  }

  try {
    const url = invoiceUrl(orderId, { admin });
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to generate invoice (${res.status})`);
    }
    const blob = await res.blob();

    // Provide browser download for the PDF blob
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `Invoice-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);

    alert("✅ Invoice downloaded successfully!");
    return true;

  } catch (e) {
    console.error("Invoice failed:", e);
    alert("❌ " + (e.message || "Could not download invoice."));
    return false;
  }
}