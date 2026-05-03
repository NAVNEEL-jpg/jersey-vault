import { supabase } from './supabase';

export const initiatePayment = (amount, name, email, phone, cart, navigate, decrementStock) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 1999 ? 0 : 99;

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY,
    amount: amount * 100,
    currency: "INR",
    name: "JerseyVault",
    description: "Jersey Purchase",
    handler: async function (response) {
      const order = {
        id: response.razorpay_payment_id,
        items: cart,
        total: amount,
        date: new Date().toLocaleDateString(),
        customer: { name, email, phone },
        payMethod: "Online",
      };

      // ✅ Save order to Supabase
      await supabase.from("orders").insert({
        id: response.razorpay_payment_id,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        items: cart,
        subtotal,
        shipping,
        total: amount,
        pay_method: "Online",
        status: "pending",
      });

      // ✅ Decrement stock
      if (decrementStock) await decrementStock();

      localStorage.setItem("latestOrder", JSON.stringify(order));
      navigate("/success");
    },
    prefill: { name, email, contact: phone },
    theme: { color: "#39ff14" },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};