import { supabase } from './supabase';
import { calcOrderTotals } from './utils/shipping';

async function finalizeOrder({
  orderId,
  name,
  email,
  phone,
  cart,
  navigate,
  decrementStock,
  form,
  user,
  isCOD,
  amountPaid,
}) {
  const { subtotal, shipping, total } = calcOrderTotals(cart);
  const customerEmail = email || user?.email || "";

  const order = {
    id: orderId,
    items: cart,
    total,
    amountPaid,
    date: new Date().toLocaleDateString(),
    customer: { name, email: customerEmail, phone },
    payMethod: isCOD ? "COD" : "Online",
    subtotal,
    shipping,
  };

  const { error: insertError } = await supabase.from("orders").insert({
    id: orderId,
    customer_name: name,
    customer_email: customerEmail,
    customer_phone: phone,
    address: form.address,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
    items: cart,
    subtotal,
    shipping,
    total,
    pay_method: isCOD ? "COD" : "Online",
    status: "pending",
  });

  if (insertError) {
    console.error("Supabase Insert Error:", insertError);
    alert("Payment successful, but failed to save order. Please contact support.");
  }

  if (decrementStock) await decrementStock();

  await supabase.functions.invoke("smooth-worker", {
    body: {
      customerName: name,
      customerEmail,
      orderId,
      date: order.date,
      items: cart,
      subtotal,
      shipping,
      total,
      amountPaid,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      phone,
      payMethod: isCOD ? "Cash on Delivery" : "Online Payment",
    },
  }).catch(() => {});

  localStorage.setItem("latestOrder", JSON.stringify(order));
  navigate("/success");
}

/** COD with free shipping — no Razorpay charge */
export async function placeCodOrderFree(name, email, phone, cart, navigate, decrementStock, form, user) {
  const orderId = `COD-${Date.now()}`;
  await finalizeOrder({
    orderId,
    name,
    email,
    phone,
    cart,
    navigate,
    decrementStock,
    form,
    user,
    isCOD: true,
    amountPaid: 0,
  });
}

export const initiatePayment = (amountToPayNow, name, email, phone, cart, navigate, decrementStock, form, user, isCOD) => {
  const { shipping, total } = calcOrderTotals(cart);
  const customerEmail = email || user?.email || "";

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY,
    amount: Math.round(amountToPayNow) * 100,
    currency: "INR",
    name: "JerseyVault",
    description: isCOD
      ? (shipping > 0 ? `Shipping fee (₹${shipping}) — COD order` : "Jersey Purchase")
      : `Order total (₹${total})`,
    handler: async function (response) {
      await finalizeOrder({
        orderId: response.razorpay_payment_id,
        name,
        email,
        phone,
        cart,
        navigate,
        decrementStock,
        form,
        user,
        isCOD,
        amountPaid: amountToPayNow,
      });
    },
    prefill: { name, email: customerEmail, contact: phone },
    theme: { color: "#39ff14" },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", function (response) {
    alert("Oops! Something went wrong. Payment Failed");
    console.error("Razorpay error:", response.error);
  });
  rzp.open();
};
