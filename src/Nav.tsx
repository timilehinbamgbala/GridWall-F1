import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./App.css";

const NAV_LINKS = [
  { label: "Race", to: "/race", icon: "R" },
  { label: "Standings", to: "/standings", icon: "S" },
  { label: "Drivers", to: "/drivers", icon: "D" },
  { label: "Circuits", to: "/circuits", icon: "C" },
  { label: "Fantasy", to: "/fantasy", icon: "F" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className="pw-nav" aria-label="Main navigation">
        <div className="pw-nav-left">
          {/* hamburger — mobile only */}
          <button
            className="pw-hamburger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`pw-ham-line${open ? " open" : ""}`} />
            <span className={`pw-ham-line${open ? " open" : ""}`} />
            <span className={`pw-ham-line${open ? " open" : ""}`} />
          </button>

          <Link to="/" className="pw-nav-logo" aria-label="GridWall home">
            <img
              src="/icons8-formula-1-100.png"
              alt="GridWall"
              className="pw-nav-logo-img"
            />
            <span className="pw-nav-logo-text">GridWall</span>
          </Link>
        </div>

        {/* desktop links */}
        <ul className="pw-nav-links">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <Link
                to={l.to}
                className={location.pathname === l.to ? "active" : ""}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <a
          href="https://chat.whatsapp.com/invite/gridwall"
          target="_blank"
          rel="noopener noreferrer"
          className="pw-nav-cta"
        >
          Join free
        </a>
      </nav>

      {/* overlay */}
      <div
        className={`pw-sidebar-overlay${open ? " visible" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* sidebar */}
      <aside
        className={`pw-sidebar${open ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        {/* sidebar header */}
        <div className="pw-sidebar-header">
          <Link to="/" className="pw-nav-logo">
            <img
              src="/icons8-formula-1-100.png"
              alt="GridWall"
              className="pw-nav-logo-img"
            />
            <span className="pw-nav-logo-text">GridWall</span>
          </Link>
          <button
            className="pw-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            &#x2715;
          </button>
        </div>

        {/* nav links */}
        <ul className="pw-sidebar-links">
          {NAV_LINKS.map((l, i) => (
            <li
              key={l.label}
              style={{ animationDelay: open ? `${i * 0.06}s` : "0s" }}
            >
              <Link
                to={l.to}
                className={`pw-sidebar-link${
                  location.pathname === l.to ? " active" : ""
                }`}
              >
                <span className="pw-sidebar-link-num">0{i + 1}</span>
                <span className="pw-sidebar-link-label">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* sidebar footer */}
        <div className="pw-sidebar-footer">
          <a
            href="https://chat.whatsapp.com/invite/gridwall"
            target="_blank"
            rel="noopener noreferrer"
            className="pw-btn-primary"
            style={{
              width: "100%",
              textAlign: "center",
              display: "block",
              textDecoration: "none",
            }}
          >
            Join free
          </a>
          <div className="pw-sidebar-footer-copy">
            Not affiliated with Formula One Group
          </div>
        </div>
      </aside>
    </>
  );
}
