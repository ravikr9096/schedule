import { useRef } from "react";

type NavItem = { path: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { path: "/login", label: "Login" },
  { path: "/register", label: "Register" },
  { path: "/schedule", label: "Schedule" },
];

type NavBarProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
};

export function NavBar({ currentPath, onNavigate }: NavBarProps) {
  const collapseRef = useRef<HTMLDivElement>(null);

  const collapseNavbar = () => {
    const el = collapseRef.current;
    if (!el) return;
    el.classList.remove("show");
    document
      .querySelector<HTMLButtonElement>('[data-bs-target="#navbarNav"]')
      ?.setAttribute("aria-expanded", "false");
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    collapseNavbar();
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "introduction";
    return currentPath === path.slice(1).replace(/\/$/, "");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light mb-3 nav-bar-bright">
      <div className="container-fluid">
        <button
          type="button"
          className="navbar-brand btn btn-link text-decoration-none fw-bold nav-brand"
          onClick={() => handleNavigate("/")}
        >
          SixOne Productions
        </button>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div ref={collapseRef} className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {NAV_ITEMS.map(({ path, label }) => (
              <li key={path} className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn btn-link nav-link-bright ${isActive(path) ? "active" : ""}`}
                  onClick={() => handleNavigate(path)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
