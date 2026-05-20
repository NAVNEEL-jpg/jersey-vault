export const FREE_SHIPPING_MIN = 1999;
export const SHIPPING_FEE = 99;

export function calcShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
}

export function calcOrderTotals(cart) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = calcShipping(subtotal);
  const total = subtotal + shipping;
  const freeShippingGap = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  return { subtotal, shipping, total, freeShippingGap };
}
