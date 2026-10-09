import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, Pencil, PlusCircle, Search, Star, Trash2 } from "lucide-react";
import { api, downloadFile } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { ConfirmDialog, EmptyState, Menu, Modal, Skeleton, Spinner, fileMeta, timeAgo } from "../components/ui";
import { Select } from "../components/Select";

const SORTS = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "name", label: "Name (A–Z)" }, { value: "largest", label: "Most rows" }];

export default function Library() {
  const toast = useToast();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [starred, setStarred] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [rename, setRename] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef();

  const load = useCallback(() => {
    const p = new URLSearchParams({ sort, page, limit: 24, ...(search ? { search } : {}), ...(starred ? { starred: "true" } : {}) });
    return api(`/api/datasets?${p}`).then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message));
  }, [sort, page, search, starred]);

  // debounce search so we don't hit the API on every keystroke
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(load, search ? 250 : 0); return () => clearTimeout(timer.current); }, [load, search]);

  const toggleStar = async (d) => {
    setData((x) => ({ ...x, items: x.items.map((i) => (i._id === d._id ? { ...i, starred: !i.starred } : i)) }));
    try { await api(`/api/datasets/${d._id}`, { method: "PATCH", body: { starred: !d.starred } }); }
    catch (e) { toast.error(e.message); load(); }
  };
  const doRename = async () => {
    setBusy(true);
    try { await api(`/api/datasets/${rename._id}`, { method: "PATCH", body: { name: rename.name } }); setRename(null); toast.success("Renamed"); load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const doDelete = async () => {
    setBusy(true);
    try { await api(`/api/datasets/${del._id}`, { method: "DELETE" }); setDel(null); toast.success("File deleted"); load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const download = (d) => downloadFile(`/api/datasets/${d._id}/download`, `${d.name}.xlsx`).catch((e) => toast.error(e.message));

  return (
    <div className="page">
      <div className="page-head"><div><h1>My files</h1><p>Spreadsheets you've saved to the cloud.</p></div>
        <Link to="/new" className="btn primary"><PlusCircle size={16} />New analysis</Link></div>

      <div className="row wrap" style={{ marginBottom: 16 }}>
        <div className="search" style={{ flex: "1 1 240px", maxWidth: 360 }}><Search size={16} /><input className="input" placeholder="Search files…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search files" /></div>
        <div style={{ width: 170 }}><Select value={sort} onChange={(v) => { setSort(v); setPage(1); }} options={SORTS} label="Sort files" /></div>
        <button className={`btn ${starred ? "primary" : ""}`} onClick={() => { setStarred(!starred); setPage(1); }} aria-pressed={starred}><Star size={15} />Starred</button>
      </div>

      {error && <div className="callout bad" role="alert">{error}</div>}
      {!data && !error && <div className="tag-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="card card-pad stack"><Skeleton h={18} w="70%" /><Skeleton h={14} w="50%" /><Skeleton h={32} /></div>)}</div>}
      {data && data.items.length === 0 && (
        <div className="card"><EmptyState icon={FileSpreadsheet} title={search || starred ? "No matching files" : "Nothing saved yet"} action={!search && !starred && <Link to="/new" className="btn primary">Upload a file</Link>}>
          {search || starred ? "Try a different search or clear the filters." : "Files you save with “Save & analyze” show up here."}</EmptyState></div>
      )}
      {data && data.items.length > 0 && (
        <>
          <div className="tag-grid">
            {data.items.map((d) => (
              <article key={d._id} className="card ds-card">
                <div className="row between" style={{ alignItems: "flex-start" }}>
                  <div className="avatar" style={{ borderRadius: 10 }}><FileSpreadsheet size={17} /></div>
                  <div className="row" style={{ gap: 2 }}>
                    <button className="btn ghost icon sm" onClick={() => toggleStar(d)} aria-label={d.starred ? "Unstar" : "Star"} aria-pressed={d.starred}><Star size={16} fill={d.starred ? "var(--c2)" : "none"} color={d.starred ? "var(--c2)" : "currentColor"} /></button>
                    <Menu items={[{ label: "Rename", icon: Pencil, onClick: () => setRename({ _id: d._id, name: d.name }) }, { label: "Download .xlsx", icon: Download, onClick: () => download(d) }, { label: "Delete", icon: Trash2, danger: true, onClick: () => setDel(d) }]} />
                  </div>
                </div>
                <div><h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={d.name}>{d.name}</h3><p className="muted sm">{fileMeta(d)}</p></div>
                <div className="row between"><span className="muted sm">{timeAgo(d.createdAt)}</span><button className="btn sm primary" onClick={() => nav(`/workspace/${d._id}`)}>Open</button></div>
              </article>
            ))}
          </div>
          {data.pages > 1 && <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
            <button className="btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="muted sm">Page {data.page} of {data.pages}</span><button className="btn sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}
        </>
      )}

      {rename && <Modal title="Rename file" onClose={() => setRename(null)} actions={<><button className="btn" onClick={() => setRename(null)}>Cancel</button><button className="btn primary" disabled={busy || !rename.name.trim()} onClick={doRename}>{busy && <Spinner />}Save</button></>}>
        <input className="input" maxLength={120} value={rename.name} onChange={(e) => setRename({ ...rename, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && rename.name.trim() && doRename()} aria-label="File name" /></Modal>}
      {del && <ConfirmDialog title="Delete this file?" message={`“${del.name}” and its data will be permanently deleted. This can't be undone.`} busy={busy} onConfirm={doDelete} onClose={() => setDel(null)} />}
    </div>
  );
}
