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
    <div className="container-fluid px-2 px-md-4 mt-4 mt-md-5 text-center">
      <div className="py-4 py-md-5 mb-4 rounded-4 shadow-lg border" style={{ backgroundColor: '#1a1d20', borderColor: '#fd7e14' }}>
        <h1 className="display-5 mb-4 fw-bolder text-white" style={{ letterSpacing: '-1px' }}>Welcome To Six One Productions</h1>
        <button className="btn btn-lg px-5 rounded-pill shadow fw-bold" style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14', color: '#fff' }} onClick={onGoToSchedule}>
          View Schedule
        </button>
      </div>
      <nav className="mx-auto" style={{ maxWidth: '800px' }}>
        <div className="row g-3 justify-content-center">
          {pageLinks.map(({ path, label }) => (
            <div key={path} className="col-6 col-md-4">
              <button
                type="button"
                className="btn btn-dark w-100 py-3 shadow-sm rounded-4 fw-semibold text-white"
                style={{ borderColor: '#fd7e14' }}
                onClick={() => onNavigate(path)}
              >
                {label}
              </button>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
