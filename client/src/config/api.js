/** API base — empty string uses CRA dev proxy (package.json) */
export const API_BASE =
  process.env.REACT_APP_API_URL ??
  (process.env.NODE_ENV === "production" ? "http://localhost:5000" : "");

export const invoiceUrl = (orderId, admin = false) => {
  const path = admin
    ? `/api/admin/orders/${encodeURIComponent(orderId)}/invoice`
    : `/api/orders/${encodeURIComponent(orderId)}/invoice`;
  return `${API_BASE}${path}`;
};
