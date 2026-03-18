export function GalleryPage() {
  return (
    <div className="container py-4">
      {/* <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item active" aria-current="page">Gallery</li>
        </ol>
      </nav> */}
      <div className="row">
        <div className="col-12">
          <h1 className="display-5 mb-4">Gallery</h1>
          <p className="lead mb-4">Photos and media from our events and work.</p>
          <div className="row g-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="col-6 col-md-4">
                <div className="card border-0 shadow-sm overflow-hidden">
                  <div className="ratio ratio-4x3 bg-light d-flex align-items-center justify-content-center">
                    <span className="text-muted">Image {i}</span>
                  </div>
                  <div className="card-body py-2">
                    <p className="card-text small text-muted mb-0">Caption for image {i}</p>
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
