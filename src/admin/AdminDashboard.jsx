import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(
          "https://excel-analytics-api-3u42.onrender.com/api/users",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setUsers(data);
        } else {
          console.error("Error:", data.msg);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    setUsers((prev) =>
      [...prev].sort((a, b) => {
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
      })
    );
  };

  // Search filter
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.role?.toLowerCase().includes(search.toLowerCase())
  );

  // File Upload
  const handleFileUpload = async (userId) => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(
        `https://excel-analytics-api-3u42.onrender.com/api/upload/${userId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("File uploaded successfully!");
        setSelectedFile(null);
        setSelectedUser(null);
      } else {
        alert(data.msg || "Upload failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">⚙️ Admin Dashboard</h1>

      {/* Search Bar */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search by Name, Email, or Role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : filteredUsers.length > 0 ? (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => handleSort("name")}>
                  Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("email")}>
                  Email {sortConfig.key === "email" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("role")}>
                  Role {sortConfig.key === "role" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      className="upload-btn"
                      onClick={() => setSelectedUser(user._id)}
                    >
                      Upload File
                    </button>
                    <button className="edit-btn">Edit</button>
                    <button className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* File Upload Modal */}
          {selectedUser && (
            <div className="upload-modal">
              <div className="upload-box">
                <h3>Upload File for User</h3>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <div className="modal-actions">
                  <button
                    className="confirm-btn"
                    onClick={() => handleFileUpload(selectedUser)}
                  >
                    Upload
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setSelectedUser(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="no-users">No users found.</p>
      )}
    </div>
  );
}

export default AdminDashboard;
