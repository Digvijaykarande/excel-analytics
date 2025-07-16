import React, { useState,useRef } from 'react';
import * as XLSX from 'xlsx';
import ChartDisplay from './ChartDisplay';
import '../stylesheets/ChartPage.css'; 

function ChartPage() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [xKey, setXKey] = useState('');
  const [yKey, setYKey] = useState('');
  const [chartType, setChartType] = useState('bar');
  const chartRef = useRef(); 


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const wb = XLSX.read(event.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsedData = XLSX.utils.sheet_to_json(ws);
      const keys = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
      setData(parsedData);
      setColumns(keys);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="chart-page">
      <div className="upload-section">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
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
    <div className='download-btns'>
      <button onClick={() => chartRef.current.downloadImage('png')}>Download as PNG</button>
      <button onClick={() => chartRef.current.downloadImage('jpg')}>Download as JPG</button>
    </div>
  </div>
)}

  </div>
  );
}

export default ChartPage;
