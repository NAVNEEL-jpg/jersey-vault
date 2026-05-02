import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Success from "./pages/Success";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Tracking from "./pages/Tracking";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </Router>
  );
}

export default App;