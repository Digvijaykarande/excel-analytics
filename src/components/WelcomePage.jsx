import React from 'react';
import '../stylesheets/WelcomePage.css';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="glass-card">
        <h1>Welcome to <span className="brand">Excel Analytics</span></h1>
        <p>Your all-in-one solution for visualizing Excel data with smart charts and AI-powered summaries.</p>
        <div className="button-group">
          <button className="primary-btn" onClick={() => navigate('/dashboard/chartpage')}>Start Exploring</button>
          <button className="secondary-btn" onClick={() => navigate('/dashboard/about')}>Learn More</button>
        </div>
      </div>
      <div className="decorative-circle circle1"></div>
      <div className="decorative-circle circle2"></div>
    </div>
  );
};

export default WelcomePage;
