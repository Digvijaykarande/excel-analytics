import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../stylesheets/Register.css";

function Register() {
  const [formData, setFormData] = useState({
    name: '',
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
      const res = await fetch('https://excel-analytics-api-3u42.onrender.com/api/auth/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert(" Registration successful!");
        setFormData({ name: "", email: "", password: "" });
        navigate("/login");
      } else {
        alert(" Registration failed: " + (data.msg || "Something went wrong"));
      }

    } catch (error) {
      console.log(error);
      alert(" Network error");
    }
  };

  return (
    <div className='register-container'>
      <form onSubmit={handleSubmit} className='register-form'>
        <h2>Create Account</h2>

        <input
          type='text'
          name='name'
          placeholder='Full Name'
          required
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type='email'
          name='email'
          placeholder='Email Address'
          required
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type='password'
          name='password'
          placeholder='Password'
          required
          value={formData.password}
          onChange={handleChange}
        />

        <button type='submit'>Register</button>

        <p className='login-link'>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
