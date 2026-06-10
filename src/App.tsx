import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./Home";
import RaceLive from "./RaceLive";
import Standings from "./Standings";
import Drivers from "./Drivers";

// ── Page loader — shows on every route change ─────────────────────────────────
function PageLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 900);
    return () => {
      clearTimeout(t);
      setVisible(false);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="gw-loader-overlay">
      <div className="gw-loader-wrap">
        <svg className="gw-loader-ring" viewBox="0 0 50 50">
          <circle className="gw-loader-track" cx="25" cy="25" r="20" />
          <circle className="gw-loader-spin" cx="25" cy="25" r="20" />
        </svg>
        <img src="/f1.png" alt="" className="gw-loader-icon" />
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <PageLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/race" element={<RaceLive />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/drivers" element={<Drivers />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
