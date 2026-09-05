const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE =
  process.env.REACT_APP_API_URL ||
  (isLocalhost
    ? ''
    : (typeof window === 'undefined' ? 'http://localhost:5000' : 'https://jersey-vault-backend.onrender.com'));

export const invoiceUrl = (orderId, admin = false) => {
  const path = admin
    ? `/api/admin/orders/${encodeURIComponent(orderId)}/invoice`
    : `/api/orders/${encodeURIComponent(orderId)}/invoice`;
  return `${API_BASE}${path}`;
};