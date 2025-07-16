import React, { useEffect, useState } from 'react';
import '../stylesheets/MyProjects.css';

function MyProjects() {
  const [data, setData] = useState([]);

  useEffect(() => {
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
    fetchData();
  }, []);

  return (
    <div className="projects-container">
      <h2>📂 My Uploaded Excel Files</h2>
      <div className="cards">
        {data.map((file, index) => (
          <div className="card" key={file._id || index}>
            <h3>{file.filename}</h3>
            <p><strong>Uploaded:</strong> {new Date(file.uploadedAt).toLocaleString()}</p>
            <button onClick={() => window.open(`https://excel-analytics-api-3u42.onrender.com/api/excel/files/${file._id}`, '_blank')}>
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyProjects;
