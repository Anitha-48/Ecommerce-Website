import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./css_fiels/navbar.css";

function Navbar() {
   const [open, setOpen] = useState(false);
  return (
    <nav className="navbar">
      <h2 className="logo"><img src="/images/logo.png"></img></h2>
  {/* ☰ TOGGLE BUTTON */}
      <button className="menu-toggle" onClick={() => setOpen(!open)}>
        ☰
      </button>
     <div className={`nav-links ${open ? "active" : ""}`}>
      <Link to="/" onClick={() => setOpen(false)}>Home</Link>
<a href="#about" onClick={() => setOpen(false)}>Recipes</a>
<a href="#contact" onClick={() => setOpen(false)}>Review</a>
<Link to="/login" className="login-btn" onClick={() => setOpen(false)}>👤 Login</Link>
        
      </div>  

    </nav>
  );
}

export default Navbar;
