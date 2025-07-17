import React, { useEffect, useState } from 'react';
import '../stylesheets/MyProjects.css';

function MyProjects() {
  const [data, setData] = useState([]);

  // Fetch files on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch('https://excel-analytics-api-3u42.onrender.com/api/excel/files', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      console.log(json);
      setData(json);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Delete file by ID
  const deleteFile = async (id) => {
    try {
      const res = await fetch(`https://excel-analytics-api-3u42.onrender.com/api/files/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (res.ok) {
        alert("File deleted successfully.");
        fetchData(); // Refresh list
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting file.");
    }
  };

  return (
    <div className="projects-container">
      <h2>📂 My Uploaded Excel Files</h2>
      <div className="cards">
        {data.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          data.map((file, index) => (
            <div className="card" key={file._id || index}>
              <h3>{file.filename}</h3>
              <p><strong>Uploaded:</strong> {new Date(file.uploadedAt).toLocaleString()}</p>

              <button
                onClick={() =>
                  window.open(
                    `https://excel-analytics-api-3u42.onrender.com/api/files/download/${encodeURIComponent(file.filename)}`
                  )
                }
              >
                Download
              </button>

              <button
                onClick={() => deleteFile(file._id)}
                style={{ backgroundColor: 'red', color: 'white', marginLeft:"5px"}}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyProjects;
