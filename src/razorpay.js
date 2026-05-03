export const initiatePayment = (amount, name, email, phone, cart, navigate) => {
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY,
    amount: amount * 100,
    currency: "INR",
    name: "JerseyVault",
    description: "Jersey Purchase",
    handler: function (response) {
      const order = {
        id: response.razorpay_payment_id,
        items: cart,
        total: amount,
        date: new Date().toLocaleDateString(),
        customer: { name, email, phone },
        payMethod: "Online",
      };
      localStorage.setItem("latestOrder", JSON.stringify(order));
      navigate("/success");
    },
    prefill: { name, email, contact: phone },
    theme: { color: "#39ff14" },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
};