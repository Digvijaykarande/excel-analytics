import React, { useState } from 'react';

function UploadFilePage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage('Please select a file.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://excel-analytics-api-3u42.onrender.com/api/excel/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(
          `<strong>Upload successful!</strong><br>`
        );
      } else {
        setMessage('Upload failed: ' + (data.msg || 'Unknown error'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage('Something went wrong!');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Upload File</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Upload</button>
      </form>
      <div
        id="message"
        style={styles.message}
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial',
    padding: '40px',
    background: '#f4f4f4',
    minHeight: '100vh',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  input: {
    display: 'block',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    width: '100%',
  },
  message: {
    marginTop: '15px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
  },
  UploadFilePage:{
    marginTop:'0px',
   
  }
};

export default UploadFilePage;
