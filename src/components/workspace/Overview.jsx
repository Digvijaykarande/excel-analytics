import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Columns3, Copy, Info, Rows3, ShieldCheck, Table2 } from "lucide-react";
import { StatCard } from "../ui";
import { fmt, quickFindings } from "../../lib/analyze";

const ICON = { good: CheckCircle2, warning: AlertTriangle, info: Info };

export function FindingList({ findings }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      {findings.map((f, i) => { const I = ICON[f.severity] || Info; return (
        <div key={i} className={`finding ${f.severity}`}><div className="dot"><I size={16} /></div><div><b>{f.title}</b><span>{f.detail}</span></div></div>
      ); })}
    </div>
  );
}

function Hist({ bins }) {
  const max = Math.max(...bins.map((b) => b.count), 1);
  return <div className="hist" aria-hidden>{bins.map((b, i) => <i key={i} style={{ height: `${(b.count / max) * 100}%` }} title={`${fmt(b.from)} – ${fmt(b.to)}: ${b.count}`} />)}</div>;
}

function TopBars({ items, total }) {
  return (
    <div className="bars">{items.slice(0, 5).map((t) => (
      <div className="bar-row" key={t.value}><span title={t.value} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.value}</span>
        <div className="meter"><i style={{ width: `${(t.count / total) * 100}%` }} /></div><span className="muted">{t.count}</span></div>
    ))}</div>
  );
}

function ColumnCard({ c, rows }) {
  return (
    <div className="card col-card">
      <div className="row between"><span className="name" title={c.name}>{c.name}</span><span className="badge"><span className={`type-dot t-${c.type}`} />{c.type}</span></div>
      {c.stats && <><Hist bins={c.histogram} />
        <div className="kv"><div><span>Min</span><b>{fmt(c.stats.min)}</b></div><div><span>Median</span><b>{fmt(c.stats.median)}</b></div><div><span>Max</span><b>{fmt(c.stats.max)}</b></div>
          <div><span>Mean</span><b>{fmt(c.stats.mean)}</b></div><div><span>Std dev</span><b>{fmt(c.stats.std)}</b></div><div><span>Sum</span><b>{fmt(c.stats.sum)}</b></div></div></>}
      {c.top && c.top.length > 0 && <TopBars items={c.top} total={Math.max(c.count, 1)} />}
      {c.type === "date" && <div className="kv" style={{ gridTemplateColumns: "1fr 1fr" }}><div><span>From</span><b>{c.min}</b></div><div><span>To</span><b>{c.max}</b></div></div>}
      <div className="row between sm muted"><span>{c.unique.toLocaleString()} unique</span>
        <span style={{ color: c.missingPct > 0.2 ? "var(--warn)" : undefined }}>{c.missing ? `${(c.missingPct * 100).toFixed(c.missingPct < 0.01 ? 1 : 0)}% missing` : "complete"}</span></div>
      {c.stats?.outliers > 0 && <span className="badge warn" style={{ alignSelf: "flex-start" }}>{c.stats.outliers} outlier{c.stats.outliers > 1 ? "s" : ""}</span>}
    </div>
  );
}

function Correlations({ profile }) {
  const numeric = profile.columns.filter((c) => c.type === "number").slice(0, 8);
  const map = useMemo(() => { const m = new Map(); profile.correlations.forEach((c) => { m.set(`${c.a}|${c.b}`, c.r); m.set(`${c.b}|${c.a}`, c.r); }); return m; }, [profile]);
  if (numeric.length < 2) return null;
  const color = (r) => (r === null ? "transparent" : `color-mix(in srgb, ${r >= 0 ? "var(--c1)" : "var(--c4)"} ${Math.round(Math.abs(r) * 85)}%, var(--surface))`);
  return (
    <section className="card">
      <div className="card-head"><h3>Correlations</h3><span className="muted sm">Pearson r between numeric columns · blue = positive, red = negative</span></div>
      <div className="card-pad corr" style={{ gridTemplateColumns: `110px repeat(${numeric.length}, minmax(52px, 1fr))` }} role="table" aria-label="Correlation matrix">
        <div />{numeric.map((c) => <div key={c.name} className="h" title={c.name}>{c.name}</div>)}
        {numeric.map((a) => [<div key={a.name} className="h" style={{ display: "flex", alignItems: "center" }} title={a.name}>{a.name}</div>,
          ...numeric.map((b) => { const r = a.name === b.name ? 1 : map.get(`${a.name}|${b.name}`) ?? null;
            return <div key={a.name + b.name} className="cell" style={{ background: color(r), color: r !== null && Math.abs(r) > 0.55 ? "#fff" : "var(--text)" }} title={`${a.name} × ${b.name}`}>{r === null ? "–" : r.toFixed(2)}</div>; })])}
      </div>
    </section>
  );
}

export default function Overview({ sheet, profile }) {
  const findings = useMemo(() => quickFindings(profile), [profile]);
  const q = profile.quality;
  const tone = q >= 85 ? "good" : q >= 60 ? "warn" : "bad";
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid c4">
        <StatCard icon={Rows3} label="Rows" value={fmt(profile.rows)} />
        <StatCard icon={Columns3} label="Columns" value={profile.columns.length} sub={`${profile.columns.filter((c) => c.type === "number").length} numeric`} />
        <StatCard icon={ShieldCheck} label="Data quality" value={`${q}/100`} tone={tone} sub={`${(profile.completeness * 100).toFixed(1)}% cells filled`} />
        <StatCard icon={Copy} label="Duplicate rows" value={fmt(profile.duplicates)} sub={`${fmt(profile.missingCells)} empty cells`} />
      </div>
      {findings.length > 0 && <section className="card"><div className="card-head"><h3>Quick findings</h3><span className="badge">Instant · no AI</span></div><div className="card-pad"><FindingList findings={findings} /></div></section>}
      <Correlations profile={profile} />
      <section>
        <div className="row" style={{ marginBottom: 10 }}><Table2 size={16} /><h3>Columns</h3></div>
        <div className="tag-grid">{profile.columns.map((c) => <ColumnCard key={c.name} c={c} rows={sheet.rows.length} />)}</div>
      </section>
    </div>
  );
}
