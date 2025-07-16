import React from 'react';
import { Link } from 'react-router-dom';
import '../stylesheets/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="logo">Excel Analytics</h2>
      </div>

      <ul className="navbar-links">
        <li><Link to="/dashboard/about">About</Link></li>
        <li><a href='https://digvijaykarande.github.io/portfolio/'>Contact Developer</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
