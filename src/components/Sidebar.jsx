import React, { useState, useEffect } from 'react';
import { useNavigate,Link, redirect } from "react-router-dom";
import "../stylesheets/Sidebar.css";

const Sidebar = () => {
  const services = [];
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token){
        navigate("/login"); 
        return;
      }

      try {
        const res = await fetch("https://excel-analytics-api-3u42.onrender.com/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          console.error("User fetch failed:", data.msg);
          navigate('/login')
        }
      } catch (err) {
        console.error("Error fetching user:", err);
         navigate("/login"); 
      }
    };

    fetchUser();
  }, [navigate]);

  if (!user) {
    return (
      <div className="sidebar">
        <p>Loading user data...</p>
      </div>
    );
     navigate("/login"); 
  }

  return (
    <div className="sidebar">
      
      <div className="profile-section">
        <img src="https://img.icons8.com/?size=100&id=23242&format=png&color=000000" alt="Profile" className="profile-pic" />
        <div>
          <p className="greeting">Good Day 👋</p>
          <h3 className="username">{user.name}</h3>
        </div>
      </div>

     
      <div className="menu">
      <p className="section-title">Menu</p>
      <ul>
    <li ><span className='icon'></span><Link to='/dashboard'>Dashboard</Link></li>
    <li ><span className='icon'></span><Link to='/dashboard/chartpage'>New Project +</Link></li>
    <li><span className='icon'></span><Link to="/dashboard/summarypage">AI Summary</Link></li>
    <li><span className='icon'></span><Link to='/dashboard/myprojects'>My Projects</Link></li>
    <li><span className='icon'></span><Link to='/dashboard/uploadfile'>Save Files in cloud</Link></li>
    <li><span className='icon'></span><Link to="/dashboard/about">About</Link></li>
    <li><span className='icon'></span><a href='https://digvijaykarande.github.io/portfolio/'>Contact Developer</a></li>
    </ul>
    </div>

      
      <div className="services">
        <p className="section-title">Services</p>
        <ul>
          {services.map((service, idx) => (
            <li key={idx}>
              <span className="icon small-icon"></span>
              {service}
            </li>
          ))}
        </ul>
      </div>

     
      <div className="cta">
        <button className="create-btn" onClick={handleLogout}>Logout</button>
        
      </div>
    </div>
  );
};

export default Sidebar;  