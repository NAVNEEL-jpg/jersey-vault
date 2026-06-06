import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Agentation } from 'agentation';
import Success from "./pages/Success";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Tracking from "./pages/Tracking";
import MyOrders from "./pages/MyOrders";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Teams from "./pages/Teams";

const Checkout = lazy(() => import("./pages/Checkout"));
const Admin = lazy(() => import("./pages/AdminPage"));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="text-white p-5">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/success" element={<Success />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/teams" element={<Teams />} />
        </Routes>
      </Suspense>
      <Agentation />
    </Router>
  );
}

export default App;