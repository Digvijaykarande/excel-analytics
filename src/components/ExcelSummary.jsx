import React, { useState } from "react";
import * as XLSX from "xlsx";
import { summarizeWithGemini } from "./summarizeWithGemini";

const ExcelSummary = () => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(firstSheet);

      const shortData = JSON.stringify(json.slice(0, 5), null, 2);

      setLoading(true);
      try {
        const result = await summarizeWithGemini(shortData);
        setSummary(result);
      } catch (error) {
        setSummary("Error: " + error.message);
      }
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h2>📊 Summarize Excel File with AI</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
      {loading && <p>⏳ Summarizing...</p>}
      {summary && (
        <div>
          <h3>📝 Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default ExcelSummary;
