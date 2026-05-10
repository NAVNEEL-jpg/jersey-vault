import { supabase } from './supabase';

export const initiatePayment = (amountToPayNow, name, email, phone, cart, navigate, decrementStock, form, user, isCOD) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 1999 ? 0 : 99;
  const fullTotal = subtotal + shipping;
  const customerEmail = email || user?.email || "";

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY,
    amount: Math.round(amountToPayNow) * 100,
    currency: "INR",
    name: "JerseyVault",
    description: isCOD ? "Shipping Charge (COD)" : "Jersey Purchase",
    handler: async function (response) {
      const order = {
        id: response.razorpay_payment_id,
        items: cart,
        total: fullTotal,
        amountPaid: amountToPayNow,
        date: new Date().toLocaleDateString(),
        customer: { name, email: customerEmail, phone },
        payMethod: isCOD ? "COD (Shipping Paid Online)" : "Online",
      };

      const { error: insertError } = await supabase.from("orders").insert({
        id: response.razorpay_payment_id,
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
        total: fullTotal,
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
          customerEmail: customerEmail,
          orderId: response.razorpay_payment_id,
          date: new Date().toLocaleDateString(),
          items: cart,
          subtotal,
          shipping,
          total: fullTotal,
          amountPaid: amountToPayNow,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone,
          payMethod: isCOD ? "Cash on Delivery (Shipping Paid)" : "Online Payment",
        },
      });
      
      localStorage.setItem("latestOrder", JSON.stringify(order));
      navigate("/success");
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