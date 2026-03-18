type NavItem = { path: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Introduction" },
  { path: "/about-us", label: "About Us" },
  { path: "/legal", label: "Legal" },
  { path: "/why-choose-us", label: "Why Choose Us" },
  { path: "/what-sets-us-apart", label: "What Sets Us Apart" },
  { path: "/clientele", label: "Clientele" },
  { path: "/gallery", label: "Gallery" },
  { path: "/login", label: "Login" },
  { path: "/register", label: "Register" },
  { path: "/schedule", label: "Schedule" },
];

type NavBarProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
};

export function NavBar({ currentPath, onNavigate }: NavBarProps) {
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
          onClick={() => onNavigate("/")}
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
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {NAV_ITEMS.map(({ path, label }) => (
              <li key={path} className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn btn-link nav-link-bright ${isActive(path) ? "active" : ""}`}
                  onClick={() => onNavigate(path)}
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
