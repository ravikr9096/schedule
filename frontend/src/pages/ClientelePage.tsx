export function ClientelePage() {
  return (
    <div className="container py-4">
      {/* <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item active" aria-current="page">Clientele</li>
        </ol>
      </nav> */}
      <div className="row">
        <div className="col-12">
          <h1 className="display-5 mb-4">Clientele</h1>
          <p className="lead mb-4">Partners and clients we are proud to work with.</p>
          <div className="row g-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="col-6 col-md-4">
                <div className="card border-0 shadow-sm text-center">
                  <div className="card-body py-4">
                    <div className="placeholder-glow">
                      <span className="placeholder col-8 rounded">Logo / Name</span>
                    </div>
                    <p className="card-text small text-muted mt-2 mb-0">Client {i}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
