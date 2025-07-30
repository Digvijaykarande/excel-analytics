import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ChartDisplay from './ChartDisplay';
import '../stylesheets/ChartPage.css'; 
import { summarizeWithGemini } from "./summarizeWithGemini";

function ChartPage() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [xKey, setXKey] = useState('');
  const [yKey, setYKey] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortData, setShortData] = useState(""); // New state for summary input

  const chartRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const binaryData = evt.target.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      setData(jsonData);
      setColumns(Object.keys(jsonData[0] || {}));
      setShortData(JSON.stringify(jsonData.slice(0, 5), null, 2)); // Save shortData for summary
    };

    reader.readAsBinaryString(file);
  };

  const generateSummary = async () => {
    if (!shortData) return;
    setLoading(true);
    try {
      const result = await summarizeWithGemini(shortData);
      setSummary(result);
    } catch (error) {
      setSummary("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="chart-page">
      <div className="upload-section">
  <label htmlFor="fileUpload" className="custom-file-upload">
    📁 Upload Excel File
  </label>
  <input
    id="fileUpload"
    type="file"
    accept=".xlsx, .xls"
    onChange={handleFile}
  />
</div>


      {columns.length > 0 && (
        <div className="controls">
          <label>X-Axis:</label>
          <select onChange={(e) => setXKey(e.target.value)} defaultValue="">
            <option value="">Select</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>

          <label>Y-Axis:</label>
          <select onChange={(e) => setYKey(e.target.value)} defaultValue="">
            <option value="">Select</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>

          <label>Chart Type:</label>
          <select onChange={(e) => setChartType(e.target.value)} defaultValue="bar">
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </div>
      )}

      {xKey && yKey && (
        <div className="chart-container">
          <ChartDisplay
            ref={chartRef}
            data={data}
            xKey={xKey}
            yKey={yKey}
            type={chartType}
          />
          <div className="download-btns">
            <button onClick={() => chartRef.current.downloadImage('png')}>Download as PNG</button>
            <button onClick={() => chartRef.current.downloadImage('jpg')}>Download as JPG</button>
          </div>

        <div className="summary-section">
          <button onClick={generateSummary} className="summary-btn">Summarize With AI</button>
          {summary && (
            <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto", color: "white" }}>
              <h2>📊 Summary of Excel Data</h2>
              {loading ? <p>⏳ Summarizing...</p> : <pre style={{ whiteSpace: "pre-wrap" }}>{summary}</pre>}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

export default ChartPage;
