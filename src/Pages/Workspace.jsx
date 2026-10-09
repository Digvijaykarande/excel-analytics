import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BarChart3, Bot, Cloud, Download, Eye, FileSpreadsheet, LayoutGrid, Sparkles, Table2 } from "lucide-react";
import { api, downloadFile } from "../lib/api";
import { aiPayload, profileSheet } from "../lib/analyze";
import { exportCsv, exportXlsx } from "../lib/files";
import { useLocalDataset } from "../context/DatasetContext";
import { useToast } from "../context/ToastContext";
import { Menu, PageLoader, Spinner, Tabs, fileMeta } from "../components/ui";
import { Select } from "../components/Select";
import DataTable from "../components/DataTable";
import Overview from "../components/workspace/Overview";
import ChartsTab, { EMPTY_SPEC } from "../components/workspace/ChartsTab";
import InsightsTab from "../components/workspace/InsightsTab";
import AskTab from "../components/workspace/AskTab";
import { normalizeSpec } from "../components/ChartFromSpec";

export default function Workspace() {
  const { id } = useParams();
  return id === "local" ? <LocalWorkspace /> : <RemoteWorkspace id={id} />;
}

function LocalWorkspace() {
  const { local, setLocal } = useLocalDataset();
  const nav = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  if (!local) return <Navigate to="/new" replace />;

  const save = async () => {
    setSaving(true);
    try {
      const body = { name: local.name, originalName: local.originalName, sizeBytes: local.sizeBytes, sheets: local.sheets.map(({ name, columns, rows }) => ({ name, columns, rows })) };
      const ds = await api("/api/datasets", { method: "POST", body });
      setLocal(null); toast.success("Saved to your library"); nav(`/workspace/${ds._id}`, { replace: true });
    } catch (e) { toast.error(e.message); setSaving(false); }
  };
  return <WorkspaceView meta={{ ...local, totalRows: local.sheets.reduce((n, s) => n + s.rows.length, 0), totalColumns: local.sheets[0].columns.length }} getSheet={async (i) => local.sheets[i]} dsKey="local" cloud={false} onSave={save} saving={saving} />;
}

function RemoteWorkspace({ id }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const cache = useMemo(() => new Map(), [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setMeta(null); setError(""); api(`/api/datasets/${id}`).then(setMeta).catch((e) => setError(e.status === 404 ? "This file doesn't exist or you don't have access to it." : e.message)); }, [id]);

  const getSheet = useCallback(async (i) => {
    if (!cache.has(i)) cache.set(i, api(`/api/datasets/${id}/sheets/${i}`).catch((e) => { cache.delete(i); throw e; }));
    return cache.get(i);
  }, [id, cache]);

  if (error) return <div className="page"><div className="callout bad">{error}</div></div>;
  if (!meta) return <PageLoader label="Opening file…" />;
  return <WorkspaceView meta={meta} getSheet={getSheet} dsKey={id} cloud onInsightsSaved={(insights) => api(`/api/datasets/${id}/insights`, { method: "PUT", body: { insights } }).catch(() => {})} />;
}

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutGrid }, { value: "data", label: "Data", icon: Table2 }, { value: "charts", label: "Charts", icon: BarChart3 },
  { value: "insights", label: "AI Insights", icon: Sparkles }, { value: "ask", label: "Ask AI", icon: Bot },
];

function WorkspaceView({ meta, getSheet, dsKey, cloud, onSave, saving, onInsightsSaved }) {
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [sheetIdx, setSheetIdx] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [spec, setSpec] = useState(EMPTY_SPEC);
  const [insights, setInsights] = useState(meta.insights || null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [aiEnabled, setAiEnabled] = useState(null);

  useEffect(() => { api("/api/ai/status").then((r) => setAiEnabled(r.enabled)).catch(() => setAiEnabled(false)); }, []);

  useEffect(() => {
    let live = true;
    setSheet(null); setLoadErr(""); setSpec(EMPTY_SPEC);
    getSheet(sheetIdx).then((s) => live && setSheet(s)).catch((e) => live && setLoadErr(e.message));
    return () => { live = false; };
  }, [sheetIdx, getSheet]);

  const profile = useMemo(() => (sheet ? profileSheet(sheet) : null), [sheet]);

  // first visit to Charts: start from the best automatic suggestion so the page is never empty
  useEffect(() => {
    if (tab === "charts" && sheet && profile && !spec.x) {
      import("../lib/analyze").then(({ suggestCharts }) => { const s = suggestCharts(sheet, profile)[0]; const n = s && normalizeSpec(s, sheet); if (n) setSpec({ ...EMPTY_SPEC, ...n }); });
    }
  }, [tab, sheet, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    if (!sheet) return;
    setAiBusy(true); setAiErr("");
    try {
      const { name, profile: p, sample } = aiPayload(meta.name, sheet, profile);
      const r = await api("/api/ai/insights", { method: "POST", body: { name, profile: p, sample } });
      const out = { ...r, sheet: sheetIdx };
      setInsights(out); onInsightsSaved?.(out);
    } catch (e) { setAiErr(e.message); toast.error(e.message); }
    finally { setAiBusy(false); }
  };

  const useChart = (c) => { const n = normalizeSpec(c, sheet); if (!n) return toast.error("That suggestion doesn't match this sheet's columns."); setSpec({ ...EMPTY_SPEC, ...n }); setTab("charts"); };
  const sheetOpts = (meta.sheets || []).map((s, i) => ({ value: i, label: s.name, hint: `${(s.rows?.length ?? s.rowCount ?? 0).toLocaleString()} rows` }));
  const insightsForSheet = insights && (insights.sheet ?? 0) === sheetIdx ? insights : null;

  const exportMenu = [
    { label: "Download .xlsx", icon: Download, onClick: () => (cloud ? downloadFile(`/api/datasets/${dsKey}/download`, `${meta.name}.xlsx`).catch((e) => toast.error(e.message)) : exportXlsx(meta.name, meta.sheets)) },
    { label: "Download current sheet (.csv)", icon: Download, onClick: () => sheet && exportCsv(`${meta.name}-${sheet.name}`, sheet.columns, sheet.rows) },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
          <div className="avatar" style={{ borderRadius: 12, width: 44, height: 44 }}><FileSpreadsheet size={22} /></div>
          <div><h1 style={{ wordBreak: "break-word" }}>{meta.name}</h1><p className="muted" style={{ marginTop: 2 }}>{fileMeta(sheet ? { ...meta, totalRows: sheet.rows.length, totalColumns: sheet.columns.length } : meta)} {!cloud && <span className="badge warn" style={{ marginLeft: 6 }}>Not saved</span>}</p></div>
        </div>
        <div className="row wrap">
          {(meta.sheets?.length || 0) > 1 && <div style={{ width: 200 }}><Select label="Sheet" value={sheetIdx} onChange={setSheetIdx} options={sheetOpts} /></div>}
          {!cloud && <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? <Spinner /> : <Cloud size={16} />}Save to cloud</button>}
          <Menu items={exportMenu} />
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => (t.value === "insights" && insightsForSheet ? { ...t, badge: "✓" } : t))} />

      {loadErr && <div className="callout bad" role="alert">{loadErr}</div>}
      {!sheet && !loadErr && <PageLoader label="Loading sheet…" />}
      {sheet && profile && (
        <>
          {tab === "overview" && <Overview sheet={sheet} profile={profile} />}
          {tab === "data" && <DataTable sheet={sheet} onExport={(rows) => exportCsv(`${meta.name}-view`, sheet.columns, rows)} />}
          {tab === "charts" && <ChartsTab sheet={sheet} profile={profile} spec={spec} setSpec={setSpec} boardKey={`ea-board-${dsKey}-${sheetIdx}`} aiCharts={insightsForSheet?.suggestedCharts?.map((c) => normalizeSpec(c, sheet)).filter(Boolean) || []} />}
          {tab === "insights" && <InsightsTab insights={insightsForSheet} loading={aiBusy} error={aiErr} onGenerate={generate} onUseChart={useChart} aiEnabled={aiEnabled} canCache={cloud} />}
          {tab === "ask" && <AskTab name={meta.name} sheet={sheet} profile={profile} aiEnabled={aiEnabled} />}
        </>
      )}
    </div>
  );
}
