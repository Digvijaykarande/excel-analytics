import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../stylesheets/Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = () => {
    toggleMenu();
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  return (
    <nav className="navbar">
      <div className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
      <div className="navbar-left">
        <h2 className="logo"><Link to='/dashboard' style={{color:"black"}}>📊 Excel Analytics</Link></h2>
      </div>

      <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
        <li>
          <Link to="/dashboard/about">About</Link>
        </li>
        <li>
          <a
            href="https://digvijaykarande.github.io/portfolio/"
            target="_blank"
            rel="noopener noreferrer"
           
          >
            Contact Developer
          </a>
        </li>
      </div>
    </nav>
  );
};

export default Navbar;
