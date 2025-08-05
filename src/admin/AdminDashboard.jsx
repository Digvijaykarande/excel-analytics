import React, { useEffect, useState } from 'react';
import "./AdminDashboard.css";
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch('https://excel-analytics-api-3u42.onrender.com/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(data);
          setLoading(false);
          console.log(data);
        } else {
          console.error('Error:', data.msg);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();
  }, [navigate]);

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {loading ? (
        <p className="loading-text">Loading users...</p>
      ) : users.length > 0 ? (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td className={`role ${user.role}`}>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-users">No users found.</p>
      )}
    </div>
  );
}

export default AdminDashboard;
