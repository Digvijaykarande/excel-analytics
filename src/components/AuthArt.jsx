import { BarChart3, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function AuthArt() {
  return (
    <div className="auth-art">
      <div className="row" style={{ gap: 12 }}><span className="brand-mark" style={{ background: "#fff", color: "#2563eb" }}><BarChart3 size={18} /></span><strong style={{ fontSize: 18 }}>Excel Analytics</strong></div>
      <h1 style={{ fontSize: 34, lineHeight: 1.15 }}>From spreadsheet to insight in seconds.</h1>
      <ul>
        <li className="row"><Zap size={18} /> Drop a file - it's parsed privately in your browser</li>
        <li className="row"><BarChart3 size={18} /> Sum, average or count by any column, in 7 chart types</li>
        <li className="row"><Sparkles size={18} /> AI insights and a chat that answers questions about your data</li>
        <li className="row"><ShieldCheck size={18} /> Your files stay yours - nobody else can open them</li>
      </ul>
    </div>
  );
}
