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
    <div className="section">
      <h1>Welcome To Six One Productions</h1>
      <button className="toggleButton" onClick={onGoToSchedule}>
        View schedule
      </button>
      <nav className="mt-4">
        <p className="mb-2 small text-muted">Pages</p>
        <ul className="list-group list-group-flush">
          {pageLinks.map(({ path, label }) => (
            <li key={path} className="list-group-item bg-transparent border-0 px-0">
              <button
                type="button"
                className="btn btn-link linkButton p-0 text-start"
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

