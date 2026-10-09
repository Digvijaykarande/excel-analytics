import { BarChart3, Brain, Download, Lock, Table2, UploadCloud } from "lucide-react";

const FEATURES = [
  { icon: UploadCloud, title: "Private by default", text: "Spreadsheets are parsed in your browser (.xlsx, .xls, .csv, .tsv, .ods). Save to the cloud only when you want to." },
  { icon: Table2, title: "Instant data profile", text: "Column types, missing values, duplicates, outliers, distributions and correlations - plus a data-quality score." },
  { icon: BarChart3, title: "Real aggregation charts", text: "Sum, average, count, min, max or median by any column. Bar, horizontal bar, line, area, pie, doughnut and scatter, with Top-N and sorting." },
  { icon: Brain, title: "AI analyst", text: "Get findings, risks and chart suggestions, then ask questions in plain English. AI sees a statistical profile, not your whole file." },
  { icon: Download, title: "Export anywhere", text: "Download charts as PNG/JPG, the aggregated data as CSV, or your cleaned data as .xlsx or .csv." },
  { icon: Lock, title: "Secure accounts", text: "Hashed passwords, rate limiting, per-user data isolation and role-based admin tools." },
];

export default function About() {
  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className="page-head"><div><h1>About Excel Analytics</h1><p>Turn raw spreadsheets into charts and insights without writing a formula.</p></div></div>
      <div className="grid c3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card card-pad stack" style={{ gap: 8 }}>
            <div className="avatar" style={{ borderRadius: 10 }}><f.icon size={18} /></div>
            <h3>{f.title}</h3><p className="muted">{f.text}</p>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 28 }}>Built with React, Chart.js, Express and MongoDB by <a href="https://digvijaykarande.github.io/portfolio/" target="_blank" rel="noopener noreferrer">Digvijay Karande</a>.</p>
    </div>
  );
}
