import React, { useEffect, useState } from 'react';
import "./Userinfo.css";
import { useNavigate } from 'react-router-dom';

function Userinfo() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });

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
          "https://excel-analytics-api-3u42.onrender.com/api/excel/files",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok) {
          // Group files by userId
          const grouped = data.reduce((acc, file) => {
            const existingUser = acc.find(u => u.userId === file.userId);
            if (existingUser) {
              existingUser.files.push({
                filename: file.filename,
                uploadedAt: file.uploadedAt
              });
            } else {
              acc.push({
                userId: file.userId,
                userName: file.userName || "Unknown User",
                files: [{ filename: file.filename, uploadedAt: file.uploadedAt }]
              });
            }
            return acc;
          }, []);
          setUsers(grouped);
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

  // Sorting handler
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedUsers = [...users].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setUsers(sortedUsers);
  };

  // Filtered users
  const filteredUsers = users.filter(
    (user) =>
      user.userName?.toLowerCase().includes(search.toLowerCase()) ||
      user.userId?.toLowerCase().includes(search.toLowerCase()) ||
      user.files.some(f => f.filename.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">📊 Users & Their Files</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Search by Name, Email, or File..."
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
                <th onClick={() => handleSort("userName")}>
                  User Name {sortConfig.key === "userName" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("userId")}>
                  User Email {sortConfig.key === "userId" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Files</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{user.userName}</td>
                  <td>{user.userId}</td>
                  <td>
                    {user.files.map((f, i) => (
                      <div key={i} className="file-entry">
                        <strong>{f.filename}</strong>
                        <span className="file-date"> ({formatDate(f.uploadedAt)})</span>
                      </div>
                    ))}
                  </td>
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

export default Userinfo;
