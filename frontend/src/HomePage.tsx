type Props = {
  onGoToSchedule: () => void;
  onNavigate: (path: string) => void;
};

export function HomePage({ onGoToSchedule, onNavigate }: Props) {
  const pageLinks = [
    { path: "/introduction", label: "Introduction" },
    { path: "/about-us", label: "About Us" },
    { path: "/legal", label: "Legal" },
    { path: "/why-choose-us", label: "Why Choose Us" },
    { path: "/what-sets-us-apart", label: "What Sets Us Apart" },
    { path: "/clientele", label: "Clientele" },
    { path: "/gallery", label: "Gallery" },
  ];

  return (
    <div className="container mt-5 text-center">
      <h1 className="display-4 mb-4 fw-bold">Welcome To Six One Productions</h1>
      <button className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm" onClick={onGoToSchedule}>
        View schedule
      </button>
      <nav className="mt-5 mx-auto" style={{ maxWidth: '400px' }}>
        <p className="mb-2 small text-muted">Pages</p>
        <ul className="list-group shadow-sm">
          {pageLinks.map(({ path, label }) => (
            <li key={path} className="list-group-item list-group-item-action p-0">
              <button
                type="button"
                className="btn w-100 text-start p-3 text-decoration-none"
                onClick={() => onNavigate(path)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
