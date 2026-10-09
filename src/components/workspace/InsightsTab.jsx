import { AlertTriangle, Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { Spinner, EmptyState } from "../ui";
import { FindingList } from "./Overview";
import { defaultTitle } from "./ChartsTab";
import { timeAgo } from "../ui";

export default function InsightsTab({ insights, loading, error, onGenerate, onUseChart, aiEnabled, canCache }) {
  if (!insights && !loading) {
    return (
      <div className="card"><EmptyState icon={Sparkles} title="AI insights" action={<button className="btn primary" onClick={onGenerate} disabled={aiEnabled === false}><Sparkles size={16} />Generate insights</button>}>
        Get a plain-language summary, key findings, data risks, recommended next steps and chart ideas - based on a statistical profile of your data.
        {aiEnabled === false && <span style={{ display: "block", color: "var(--warn)", marginTop: 8 }}>AI isn't configured on the server (set GROQ_API_KEY in the backend .env).</span>}
        {error && <span style={{ display: "block", color: "var(--bad)", marginTop: 8 }}>{error}</span>}</EmptyState></div>
    );
  }
  if (loading && !insights) return <div className="card"><div className="empty"><Spinner size={28} /><p style={{ marginTop: 12 }}>Analyzing your data…</p></div></div>;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card card-pad stack" style={{ gap: 10 }}>
        <div className="row between wrap"><div className="row"><Sparkles size={18} color="var(--primary)" /><h2>{insights.headline || "Summary"}</h2></div>
          <div className="row"><span className="muted sm">{insights.generatedAt ? `Generated ${timeAgo(insights.generatedAt)}` : ""}{canCache ? " · saved" : ""}</span>
            <button className="btn sm" onClick={onGenerate} disabled={loading}>{loading ? <Spinner /> : <RefreshCw size={14} />}Regenerate</button></div></div>
        <p style={{ color: "var(--text-2)", lineHeight: 1.6 }}>{insights.summary}</p>
        {error && <div className="callout bad">{error}</div>}
      </section>

      {insights.findings?.length > 0 && <section className="card"><div className="card-head"><h3>Key findings</h3></div><div className="card-pad"><FindingList findings={insights.findings} /></div></section>}

      <div className="grid c2">
        {insights.risks?.length > 0 && <section className="card card-pad stack" style={{ gap: 10 }}><div className="row"><AlertTriangle size={16} color="var(--warn)" /><h3>Risks &amp; data caveats</h3></div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-2)" }}>{insights.risks.map((r, i) => <li key={i} style={{ margin: "6px 0" }}>{r}</li>)}</ul></section>}
        {insights.recommendations?.length > 0 && <section className="card card-pad stack" style={{ gap: 10 }}><div className="row"><Lightbulb size={16} color="var(--primary)" /><h3>Recommended next steps</h3></div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-2)" }}>{insights.recommendations.map((r, i) => <li key={i} style={{ margin: "6px 0" }}>{r}</li>)}</ul></section>}
      </div>

      {insights.suggestedCharts?.length > 0 && (
        <section className="card"><div className="card-head"><h3>Suggested charts</h3><span className="muted sm">Click to build</span></div>
          <div className="card-pad sugg">{insights.suggestedCharts.map((c, i) => <button key={i} onClick={() => onUseChart(c)} title={c.reason}>{c.title || defaultTitle(c)}</button>)}</div></section>
      )}
    </div>
  );
}
