import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./css_fiels/navbar.css";

function Navbar() {
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem("access_token");
  const isAdmin = localStorage.getItem("is_admin") === "true";
  const shopPath = !token ? "/login" : isAdmin ? "/products" : "/dashboard";

  return (
    <nav className="navbar">
      <Link className="logo" to="/" aria-label="Thamizhan Treats home">
        <img src="/images/logo.png" alt="Thamizhan Treats" />
      </Link>

      <button
        className="menu-toggle"
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="primary-navigation"
      >
        {open ? "×" : "☰"}
      </button>

      <div
        className={`nav-links ${open ? "active" : ""}`}
        id="primary-navigation"
      >
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <a href="#about" onClick={() => setOpen(false)}>Recipes</a>
        <Link
          to={shopPath}
          state={!token ? { from: { pathname: "/dashboard" } } : undefined}
          onClick={() => setOpen(false)}
        >
          Shop
        </Link>
        <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
        <Link to="/login" className="login-btn" onClick={() => setOpen(false)}>
          Login
        </Link>
      </div>

    </nav>
  );
}

export default Navbar;
