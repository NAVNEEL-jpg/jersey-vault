export const API_BASE = process.env.REACT_APP_API_URL ?? "";

export const invoiceUrl = (orderId, admin = false) => {
  const path = admin
    ? `/api/admin/orders/${encodeURIComponent(orderId)}/invoice`
    : `/api/orders/${encodeURIComponent(orderId)}/invoice`;
  return `${API_BASE}${path}`;
};