import { NavLink, Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const Layout = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link to="/" className="brand" onClick={closeMenu} aria-label="Atelier home">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>Atelier</span>
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav id="primary-navigation" className={open ? "primary-nav is-open" : "primary-nav"}>
          <NavLink to="/explore" onClick={closeMenu}>Explore</NavLink>
          {user && <NavLink to="/favorites" onClick={closeMenu}>Favorites</NavLink>}
          {user && <NavLink to="/collections" onClick={closeMenu}>My exhibitions</NavLink>}
          {user ? (
            <NavLink to="/settings" onClick={closeMenu}>Settings</NavLink>
          ) : (
            <NavLink to="/login" onClick={closeMenu}>Sign in</NavLink>
          )}
        </nav>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="site-footer">
        <div>
          <strong>Atelier</strong>
          <p>Art from museum collections, thoughtfully brought together.</p>
        </div>
        <p>Artwork data and images remain credited to their source museums.</p>
      </footer>
    </div>
  );
};
