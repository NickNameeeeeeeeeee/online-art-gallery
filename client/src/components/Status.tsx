export const Loading = ({ label = "Loading artworks…" }: { label?: string }) => (
  <div className="status-panel" role="status">
    <span className="spinner" aria-hidden="true" />
    <p>{label}</p>
  </div>
);

export const ErrorPanel = ({ message }: { message: string }) => (
  <div className="status-panel error-panel" role="alert">
    <h2>Something went wrong</h2>
    <p>{message}</p>
  </div>
);

export const EmptyState = ({ title, message }: { title: string; message: string }) => (
  <div className="status-panel">
    <h2>{title}</h2>
    <p>{message}</p>
  </div>
);
