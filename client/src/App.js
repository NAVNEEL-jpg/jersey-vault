import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
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

// Initialize GA4 with your unique Measurement ID and debug mode for development
ReactGA.initialize([
  {
    trackingId: "G-0600VGPLMN",
    gtagOptions: {
      debug_mode: process.env.NODE_ENV === "development"
    }
  }
]);

// Component to track page views on route change
function PageTracker() {
  const location = React.useMemo(() => window.location, []);
  
  React.useEffect(() => {
    // We can't easily use useLocation without moving this inside Router,
    // but we'll handle the router tracking properly below.
  }, []);
  
  return null;
}

// Better approach: wrap the app content in a component that uses useLocation

function AppContent() {
  const location = useLocation();

  React.useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);

  return (
    <>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0'
        }}
        onFocus={(e) => {
          e.target.style.position = 'static';
          e.target.style.width = 'auto';
          e.target.style.height = 'auto';
          e.target.style.clip = 'auto';
          e.target.style.padding = '10px';
          e.target.style.background = '#000';
          e.target.style.color = '#fff';
          e.target.style.zIndex = '9999';
        }}
        onBlur={(e) => {
          e.target.style.position = 'absolute';
          e.target.style.width = '1px';
          e.target.style.height = '1px';
          e.target.style.clip = 'rect(0, 0, 0, 0)';
          e.target.style.padding = '0';
        }}
      >
        Skip to content
      </a>
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
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;