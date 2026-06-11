import { Link, useLocation } from "react-router-dom";
import "./App.css";
import Nav from "./Nav";

const PAGE_NAMES: Record<string, string> = {
  "/circuits": "Circuit Guide",
  "/fantasy": "Prediction League",
  "/live": "Live Timing",
  "/feed": "Fan Feed",
};

export default function ComingSoon() {
  const { pathname } = useLocation();
  const pageName = PAGE_NAMES[pathname] ?? "This page";

  return (
    <div className="pw-root">
      <header>
        <Nav />
      </header>
      <main className="cs-main">
        <div className="cs-inner">
          <img src="/coming-soon.jpg" alt="Coming soon" className="cs-img" />
          <div className="cs-text">
            <div className="cs-label">Under construction</div>
            <h1 className="cs-title">{pageName}</h1>
            <p className="cs-desc">
              This section is still in development as a lone developer lol.
              Check back soon...Thank you
            </p>
            <Link to="/" className="pw-btn-primary cs-btn">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
