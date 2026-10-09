import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Database, FileSpreadsheet, HardDrive, PlusCircle, Rows3, Sparkles, Star } from "lucide-react";
import { api } from "../lib/api";
import { fmt, fmtBytes } from "../lib/analyze";
import { useAuth } from "../context/AuthContext";
import { EmptyState, Skeleton, StatCard, fileMeta, timeAgo } from "../components/ui";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [ai, setAi] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/datasets/stats").then(setStats).catch((e) => setError(e.message));
    api("/api/ai/status").then((r) => setAi(r.enabled)).catch(() => setAi(false));
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{greeting()}, {user.name.split(" ")[0]} 👋</h1><p>Here's what's in your workspace.</p></div>
        <button className="btn primary" onClick={() => nav("/new")}><PlusCircle size={16} />New analysis</button>
      </div>

      {error && <div className="callout bad" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="grid c4">
        {!stats ? [0, 1, 2, 3].map((i) => <div key={i} className="card stat"><Skeleton h={14} w="50%" /><Skeleton h={30} w="40%" style={{ marginTop: 8 }} /></div>) : <>
          <StatCard icon={Database} label="Files saved" value={stats.datasets} sub="in your cloud library" />
          <StatCard icon={Rows3} label="Total rows" value={fmt(stats.rows)} sub="across all files" />
          <StatCard icon={HardDrive} label="Storage used" value={fmtBytes(stats.bytes)} sub="original file sizes" />
          <StatCard icon={Star} label="Starred" value={stats.starred} sub="quick-access files" />
        </>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", marginTop: 14, alignItems: "start" }}>
        <section className="card">
          <div className="card-head"><h3>Recent files</h3><Link to="/library" className="row sm" style={{ gap: 4 }}>View all <ArrowRight size={14} /></Link></div>
          {!stats ? <div className="card-pad stack"><Skeleton h={44} /><Skeleton h={44} /><Skeleton h={44} /></div>
            : stats.recent.length === 0 ? (
              <EmptyState icon={FileSpreadsheet} title="No files yet" action={<Link className="btn primary" to="/new">Upload your first spreadsheet</Link>}>Upload an Excel or CSV file to explore it with charts and AI insights.</EmptyState>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 6 }}>
                {stats.recent.map((d) => (
                  <li key={d._id}>
                    <Link to={`/workspace/${d._id}`} className="row" style={{ padding: "10px 12px", borderRadius: 8, color: "var(--text)", gap: 12 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                      <div className="avatar" style={{ borderRadius: 10 }}><FileSpreadsheet size={17} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div><div className="muted sm">{fileMeta(d)}</div></div>
                      <span className="muted sm">{timeAgo(d.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </section>

        <section className="card card-pad stack">
          <h3>Get more from your data</h3>
          <div className="row" style={{ alignItems: "flex-start" }}><Sparkles size={18} color="var(--primary)" style={{ flex: "none", marginTop: 2 }} /><p className="sm" style={{ color: "var(--text-2)" }}>
            <b>AI insights</b> - findings, risks and chart ideas, plus a chat that answers questions about your file. {ai === false && <span style={{ color: "var(--warn)" }}>AI isn't configured on the server yet (set GROQ_API_KEY).</span>}</p></div>
          <div className="row" style={{ alignItems: "flex-start" }}><Database size={18} color="var(--primary)" style={{ flex: "none", marginTop: 2 }} /><p className="sm" style={{ color: "var(--text-2)" }}><b>Save to cloud</b> to reopen a file any time, on any device, with your insights cached.</p></div>
          <Link to="/new" className="btn">Start an analysis</Link>
        </section>
      </div>
      <style>{`@media (max-width: 900px) { .page .grid[style*="2fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
