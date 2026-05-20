import { invoiceUrl } from "../config/api";
import { supabase } from "../supabase";

export async function downloadInvoice(orderId, { admin = false } = {}) {
  if (!orderId) {
    alert("Order ID missing — cannot download invoice.");
    return false;
  }

  try {
    // ── Retrieve auth token ──────────────────────────────────────────────────
    // Primary: ask Supabase SDK for the live session (auto-refreshes if needed)
    const { data: { session } } = await supabase.auth.getSession();
    let token = session?.access_token;

    // Fallback: parse directly from localStorage if SDK returns nothing
    if (!token) {
      const raw = localStorage.getItem("sb-clytujskrmcnstzuvuaf-auth-token");
      if (raw) {
        try { token = JSON.parse(raw).access_token; } catch (_) {}
      }
    }

    if (!token) throw new Error("Not authorized, no token");

    // ── Fetch invoice with auth header ───────────────────────────────────────
    const res = await fetch(invoiceUrl(orderId, admin), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server returned ${res.status}`);
    }

    const blob = await res.blob();
    if (!blob.size) throw new Error("Empty invoice file");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Invoice download failed:", e);
    alert(e.message || "Could not download invoice. Make sure the server is running.");
    return false;
  }
}
