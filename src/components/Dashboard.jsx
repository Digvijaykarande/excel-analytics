import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import "../stylesheets/Dashboard.css";

function Dashboard() {
  return (
    <div className='dashboard'>
      <Navbar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Dashboard;
