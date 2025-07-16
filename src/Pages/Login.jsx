import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../stylesheets/Login.css";

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('https://excel-analytics-api-3u42.onrender.com/api/auth/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
  
      const data = await res.json();

      if (res.ok) {
        setFormData({ email: "", password: "" });
        localStorage.setItem("token", data.token);  // Store token properly
        navigate("/");
      } else {
        alert("Login failed: " + (data.msg || "Something went wrong"));
      }

    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };

  return (
    <div className='login-page'>
      <form onSubmit={handleSubmit} className='login-form'>
        <h2>Login</h2>
        <input
          type='email'
          name='email'
          placeholder='Enter Email'
          className='email'
          required
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type='password'
          name='password'
          placeholder='Enter Password'
          className='password'
          required
          value={formData.password}
          onChange={handleChange}
        /><br />

        <button type='submit'>Login</button>
        <br />

        <p className='login-link'>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
