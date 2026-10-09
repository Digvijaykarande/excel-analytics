import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Cloud, FileSpreadsheet, Play } from "lucide-react";
import { Dropzone, Spinner } from "../components/ui";
import { parseFile } from "../lib/files";
import { api } from "../lib/api";
import { fmt, fmtBytes } from "../lib/analyze";
import { useLocalDataset } from "../context/DatasetContext";
import { useToast } from "../context/ToastContext";

export default function NewAnalysis() {
  const nav = useNavigate();
  const toast = useToast();
  const { setLocal } = useLocalDataset();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  const onFile = async (file) => {
    setError(""); setParsed(null); setBusy(true);
    try {
      const p = await parseFile(file);
      setParsed(p); setName(p.name);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const open = () => { setLocal({ ...parsed, name: name.trim() || parsed.name }); nav("/workspace/local"); };

  const saveAndOpen = async () => {
    setSaving(true);
    try {
      const body = { name: name.trim() || parsed.name, originalName: parsed.originalName, sizeBytes: parsed.sizeBytes, sheets: parsed.sheets.map(({ name, columns, rows }) => ({ name, columns, rows })) };
      const ds = await api("/api/datasets", { method: "POST", body });
      toast.success("Saved to your library");
      nav(`/workspace/${ds._id}`);
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const total = parsed?.sheets.reduce((n, s) => n + s.rows.length, 0) || 0;
  const truncated = parsed?.sheets.some((s) => s.truncated);

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-head"><div><h1>New analysis</h1><p>Your file is read in your browser. Nothing is uploaded unless you choose to save it.</p></div></div>
      {!parsed && <Dropzone onFile={onFile} busy={busy} />}
      {error && <div className="callout bad" role="alert" style={{ marginTop: 14 }}><AlertCircle size={18} style={{ flex: "none" }} />{error}</div>}

      {parsed && (
        <div className="card">
          <div className="card-head"><div className="row"><FileSpreadsheet size={20} color="var(--primary)" /><div><h3>{parsed.originalName}</h3><span className="muted sm">{fmtBytes(parsed.sizeBytes)} · {parsed.sheets.length} sheet{parsed.sheets.length > 1 ? "s" : ""} · {total.toLocaleString()} rows</span></div></div>
            <button className="btn sm" onClick={() => { setParsed(null); setError(""); }}>Choose another file</button></div>
          <div className="card-pad stack">
            <div className="field"><label htmlFor="ds-name">Name</label><input id="ds-name" className="input" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></div>
            {truncated && <div className="callout"><AlertCircle size={18} style={{ flex: "none" }} />Only the first 50,000 rows of a large sheet are analysed.</div>}
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Detected sheets</div>
              <div className="table-wrap card"><table className="t"><thead><tr><th>Sheet</th><th className="num">Rows</th><th className="num">Columns</th><th>Column types</th></tr></thead><tbody>
                {parsed.sheets.map((s) => {
                  const counts = s.columns.reduce((a, c) => ({ ...a, [c.type]: (a[c.type] || 0) + 1 }), {});
                  return <tr key={s.name}><td><b>{s.name}</b></td><td className="num">{fmt(s.rows.length)}</td><td className="num">{s.columns.length}</td>
                    <td><span className="row wrap" style={{ gap: 6 }}>{Object.entries(counts).map(([t, n]) => <span key={t} className="badge"><span className={`type-dot t-${t}`} />{n} {t}</span>)}</span></td></tr>;
                })}
              </tbody></table></div>
            </div>
            <div className="row wrap" style={{ justifyContent: "flex-end" }}>
              <button className="btn" onClick={open} disabled={saving}><Play size={16} />Analyze without saving</button>
              <button className="btn primary" onClick={saveAndOpen} disabled={saving}>{saving ? <Spinner /> : <Cloud size={16} />}Save &amp; analyze</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
