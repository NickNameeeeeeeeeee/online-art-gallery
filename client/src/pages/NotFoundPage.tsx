import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <div className="status-panel page-top">
    <p className="eyebrow">404</p>
    <h1>This gallery room does not exist.</h1>
    <Link className="button primary" to="/">Return home</Link>
  </div>
);
