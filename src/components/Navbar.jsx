import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../stylesheets/Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
      <div className="navbar-left">
        <h2 className="logo">📊 Excel Analytics</h2>
      </div>

      <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
        <li><Link to="/dashboard/about" onClick={toggleMenu}>About</Link></li>
        <li><a href="https://digvijaykarande.github.io/portfolio/" target="_blank" rel="noopener noreferrer" onClick={toggleMenu}>Contact Developer</a></li>
      </div>
    </nav>
  );
};

export default Navbar;
