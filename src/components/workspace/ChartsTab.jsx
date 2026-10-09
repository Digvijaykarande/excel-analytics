import { useEffect, useMemo, useRef, useState } from "react";
import { AreaChart, BarChart3, BarChartHorizontal, Download, LineChart, PieChart, Pin, Plus, ScatterIcon, Sparkles, Table2, Trash2, Wand2, DonutIcon } from "./icons";
import { AGGREGATIONS, suggestCharts } from "../../lib/analyze";
import { exportCsv, dataUrlToBlob } from "../../lib/files";
import { saveBlob } from "../../lib/api";
import { Segmented } from "../ui";
import { MultiSelect, Select } from "../Select";
import ChartFromSpec, { normalizeSpec, specToData } from "../ChartFromSpec";
import { useToast } from "../../context/ToastContext";

const TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 }, { value: "hbar", label: "Horizontal", icon: BarChartHorizontal }, { value: "line", label: "Line", icon: LineChart },
  { value: "area", label: "Area", icon: AreaChart }, { value: "pie", label: "Pie", icon: PieChart }, { value: "doughnut", label: "Doughnut", icon: DonutIcon }, { value: "scatter", label: "Scatter", icon: ScatterIcon },
];
const SORTS = [{ value: "", label: "Auto" }, { value: "desc", label: "High → low" }, { value: "asc", label: "Low → high" }, { value: "label", label: "By label" }];
const LIMITS = [{ value: 0, label: "All" }, { value: 5, label: "Top 5" }, { value: 10, label: "Top 10" }, { value: 20, label: "Top 20" }, { value: 50, label: "Top 50" }];
const EMPTY = { title: "", type: "bar", x: "", y: [], agg: "sum", sort: "", limit: 0, stacked: false };

const loadBoard = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const saveBoard = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export default function ChartsTab({ sheet, profile, spec, setSpec, boardKey, aiCharts = [] }) {
  const toast = useToast();
  const chartRef = useRef(null);
  const [board, setBoard] = useState(() => loadBoard(boardKey));
  useEffect(() => setBoard(loadBoard(boardKey)), [boardKey]);
  const update = (patch) => setSpec((s) => ({ ...s, ...patch }));

  const colOpts = useMemo(() => sheet.columns.map((c) => ({ value: c.name, label: c.name, type: c.type })), [sheet]);
  const numOpts = colOpts.filter((c) => c.type === "number");
  const rule = useMemo(() => suggestCharts(sheet, profile), [sheet, profile]);

  const scatter = spec.type === "scatter";
  const circular = spec.type === "pie" || spec.type === "doughnut";
  const valid = useMemo(() => normalizeSpec(spec, sheet), [spec, sheet]);
  const note = useMemo(() => (valid ? specToData(sheet, valid).note : ""), [valid, sheet]);

  // keep Y valid when the sheet or chart type changes
  useEffect(() => {
    const ok = spec.y.filter((n) => numOpts.some((o) => o.value === n));
    if (ok.length !== spec.y.length || (scatter && ok.length > 1) || (circular && ok.length > 1)) update({ y: scatter || circular ? ok.slice(0, 1) : ok });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.type, sheet]);

  const apply = (s) => { const n = normalizeSpec(s, sheet); if (!n) return toast.error("That chart doesn't fit this sheet's columns."); setSpec({ ...EMPTY, ...n }); };
  const pin = () => { if (!valid) return; const next = [...board, { ...valid, id: Date.now(), title: valid.title || defaultTitle(valid) }].slice(-12); setBoard(next); saveBoard(boardKey, next); toast.success("Pinned to your board"); };
  const unpin = (id) => { const next = board.filter((b) => b.id !== id); setBoard(next); saveBoard(boardKey, next); };
  const download = (fmtName) => { if (!chartRef.current) return; saveBlob(dataUrlToBlob(chartRef.current.toDataURL(fmtName)), `${(valid.title || "chart").replace(/[^\w-]+/g, "_")}.${fmtName}`); };
  const exportData = () => {
    const d = specToData(sheet, valid);
    if (valid.type === "scatter") return exportCsv("chart-data", [valid.x, valid.y[0]], d.points.map((p) => [p.x, p.y]));
    exportCsv("chart-data", [valid.x, ...d.series.map((s) => s.name)], d.labels.map((l, i) => [l, ...d.series.map((s) => s.data[i])]));
  };

  const allSuggestions = [...aiCharts.map((c) => ({ ...c, ai: true })), ...rule];

  return (
    <div className="stack" style={{ gap: 18 }}>
      {allSuggestions.length > 0 && (
        <div className="row wrap" style={{ gap: 8 }}>
          <span className="label row" style={{ gap: 6 }}><Wand2 size={14} />Suggested</span>
          <div className="sugg">{allSuggestions.map((s, i) => <button key={i} onClick={() => apply(s)} title={s.reason || ""}>{s.ai && <Sparkles size={12} style={{ marginRight: 4, verticalAlign: -1 }} />}{s.title || defaultTitle(s)}</button>)}</div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "minmax(250px, 320px) minmax(0, 1fr)", alignItems: "start" }} id="chart-builder">
        <section className="card card-pad stack">
          <div className="field"><label>Chart type</label>
            <Segmented label="Chart type" value={spec.type} onChange={(v) => update({ type: v })} options={TYPES.map((t) => ({ ...t, label: "" , title: t.label }))} />
            <span className="hint">{TYPES.find((t) => t.value === spec.type)?.label}</span></div>
          <div className="field"><label>{scatter ? "X axis (numeric)" : "Group by (X axis)"}</label>
            <Select label="X axis" value={spec.x} onChange={(v) => update({ x: v })} options={scatter ? numOpts : colOpts} placeholder="Choose a column" /></div>
          <div className="field"><label>{scatter ? "Y axis (numeric)" : circular ? "Value" : "Values (Y axis)"}</label>
            <MultiSelect label="Y axis" values={spec.y} max={scatter || circular ? 1 : 3} onChange={(y) => update({ y })} options={numOpts} placeholder={scatter ? "Choose a column" : "Optional - leave empty to count rows"} />
            {!scatter && <span className="hint">Up to {circular ? 1 : 3} numeric column{circular ? "" : "s"}.</span>}</div>
          {!scatter && <>
            <div className="field"><label>Aggregation</label><Select label="Aggregation" value={spec.agg} onChange={(v) => update({ agg: v })} options={AGGREGATIONS} /></div>
            <div className="grid c2" style={{ gap: 10 }}>
              <div className="field"><label>Sort</label><Select label="Sort" value={spec.sort || ""} onChange={(v) => update({ sort: v })} options={SORTS} /></div>
              <div className="field"><label>Limit</label><Select label="Limit" value={spec.limit || 0} onChange={(v) => update({ limit: v })} options={LIMITS} /></div>
            </div>
            {spec.type === "bar" && spec.y.length > 1 && <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={spec.stacked} onChange={(e) => update({ stacked: e.target.checked })} />Stack series</label>}
          </>}
          <div className="field"><label htmlFor="ctitle">Title</label><input id="ctitle" className="input" maxLength={80} placeholder="Optional" value={spec.title} onChange={(e) => update({ title: e.target.value })} /></div>
          <button className="btn" onClick={() => setSpec({ ...EMPTY })}>Reset</button>
        </section>

        <section className="card">
          <div className="card-head">
            <h3 style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{valid ? valid.title || defaultTitle(valid) : "Chart preview"}</h3>
            <div className="row wrap" style={{ gap: 6 }}>
              <button className="btn sm" disabled={!valid} onClick={() => download("png")}><Download size={14} />PNG</button>
              <button className="btn sm" disabled={!valid} onClick={() => download("jpg")}><Download size={14} />JPG</button>
              <button className="btn sm" disabled={!valid} onClick={exportData}><Table2 size={14} />CSV</button>
              <button className="btn sm primary" disabled={!valid} onClick={pin}><Pin size={14} />Pin</button>
            </div>
          </div>
          <div className="card-pad">
            {valid ? <>{valid.title && <p className="sm muted" style={{ marginBottom: 6 }}>{defaultTitle(valid)}</p>}<ChartFromSpec ref={chartRef} sheet={sheet} spec={valid} />{note && <p className="sm muted" style={{ marginTop: 8 }}>{note}</p>}</>
              : <div className="empty"><div className="ico"><BarChart3 size={24} /></div><h3 style={{ color: "var(--text)" }}>Pick what to plot</h3>
                  <p>{scatter ? "Choose two numeric columns for a scatter plot." : "Choose a column to group by - then optionally a numeric column to sum, average or count."}</p></div>}
          </div>
        </section>
      </div>
      <style>{`@media (max-width: 960px) { #chart-builder { grid-template-columns: 1fr !important; } }`}</style>

      {board.length > 0 && (
        <section>
          <div className="row" style={{ marginBottom: 10 }}><Pin size={16} /><h3>Pinned charts</h3><span className="muted sm">saved in this browser</span></div>
          <div className="grid c2">
            {board.map((b) => (
              <div className="card" key={b.id}>
                <div className="card-head"><h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</h3>
                  <div className="row" style={{ gap: 2 }}><button className="btn ghost icon sm" aria-label="Open in builder" onClick={() => apply(b)}><Plus size={15} /></button><button className="btn ghost icon sm" aria-label="Remove chart" onClick={() => unpin(b.id)}><Trash2 size={15} /></button></div></div>
                <div className="card-pad">{normalizeSpec(b, sheet) ? <ChartFromSpec sheet={sheet} spec={normalizeSpec(b, sheet)} small /> : <p className="muted sm">This chart doesn't match the current sheet.</p>}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function defaultTitle(s) {
  if (s.type === "scatter") return `${s.y?.[0] ?? ""} vs ${s.x}`;
  const what = s.y?.length ? `${AGGREGATIONS.find((a) => a.value === s.agg)?.label ?? "Sum"} of ${s.y.join(" & ")}` : "Count of rows";
  return `${what} by ${s.x}`;
}
export { EMPTY as EMPTY_SPEC };
