import React from 'react';
import '../stylesheets/About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-glass-card">
        <h1>About <span className="highlight">Excel Analytics</span></h1>
        <p>
          <strong>Excel Analytics</strong> is a powerful web platform designed to transform your raw spreadsheet data into
          meaningful insights through interactive charts and visualizations.
        </p>

        <div className="about-section">
          <h3>📁 Upload Excel Files</h3>
          <p>Users can upload `.xls` or `.xlsx` files directly from their device. The system processes and parses the data on the frontend using modern tools like <strong>XLSX.js</strong>.</p>
        </div>

        <div className="about-section">
          <h3>📊 Interactive Charts</h3>
          <p>Once uploaded, you can select any columns as <strong>X and Y axes</strong> to generate interactive <strong>bar, line, or pie charts</strong> using Chart.js. These charts are rendered dynamically based on your selected dataset.</p>
        </div>

        <div className="about-section">
          <h3>📥 Export & Download</h3>
          <p>Visualized charts can be downloaded in high-quality PNG or JPG format for reports, presentations, or documentation — all with a single click.</p>
        </div>

        <div className="about-section">
          <h3>🧠 Simple, Elegant, and Efficient</h3>
          <p>This platform uses a <strong>React-based frontend</strong> with a modern design approach (glassmorphism, responsiveness, clean UI) to provide a seamless experience for data analysts, students, and business users.</p>
        </div>

        <div className="developer-note">
          <p>
            Built with ❤️ by <strong>Digvijay Karande</strong>, a passionate developer focused on creating intelligent tools that simplify data handling and make analytics more accessible to everyone.
          </p>
        </div>
      </div>

      <div className="decorative-circle circle1"></div>
      <div className="decorative-circle circle2"></div>
    </div>
  );
};

export default About;
