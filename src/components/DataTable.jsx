import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { fmt } from "../lib/analyze";
import { Select } from "./Select";

const PAGE_SIZES = [{ value: 25, label: "25 / page" }, { value: 50, label: "50 / page" }, { value: 100, label: "100 / page" }];

export default function DataTable({ sheet, onExport }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ col: -1, dir: "asc" });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);

  const rows = useMemo(() => {
    let r = sheet.rows;
    const s = q.trim().toLowerCase();
    if (s) r = r.filter((row) => row.some((v) => v !== null && String(v).toLowerCase().includes(s)));
    if (sort.col >= 0) {
      const c = sort.col, m = sort.dir === "asc" ? 1 : -1;
      r = [...r].sort((a, b) => {
        const x = a[c], y = b[c];
        if (x === null) return 1; if (y === null) return -1; // blanks always last
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * m;
      });
    }
    return r;
  }, [sheet, q, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages - 1);
  const slice = rows.slice(cur * size, cur * size + size);
  const clickSort = (i) => setSort((s) => (s.col !== i ? { col: i, dir: "asc" } : s.dir === "asc" ? { col: i, dir: "desc" } : { col: -1, dir: "asc" }));

  return (
    <div className="card">
      <div className="card-head">
        <div className="search" style={{ width: "min(320px, 100%)" }}><Search size={16} /><input className="input" placeholder="Search all columns…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Search rows" /></div>
        <div className="row"><span className="muted sm">{rows.length.toLocaleString()} of {sheet.rows.length.toLocaleString()} rows</span>
          {onExport && <button className="btn sm" onClick={() => onExport(rows)}><Download size={14} />Export view</button>}</div>
      </div>
      <div className="table-wrap" style={{ maxHeight: 560 }}>
        <table className="t">
          <thead><tr>
            <th className="num" style={{ width: 56 }}>#</th>
            {sheet.columns.map((c, i) => (
              <th key={i} className={`sortable ${c.type === "number" ? "num" : ""}`} onClick={() => clickSort(i)} aria-sort={sort.col === i ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} title={`${c.name} (${c.type})`}>
                <span className="row" style={{ gap: 6, justifyContent: c.type === "number" ? "flex-end" : "flex-start" }}>
                  <span className={`type-dot t-${c.type}`} />{c.name}{sort.col === i && (sort.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                </span>
              </th>
            ))}
          </tr></thead>
          <tbody>
            {slice.map((r, ri) => (
              <tr key={ri}>
                <td className="num muted">{cur * size + ri + 1}</td>
                {r.map((v, ci) => v === null || v === undefined
                  ? <td key={ci} className="null">empty</td>
                  : <td key={ci} className={sheet.columns[ci].type === "number" ? "num" : ""} title={String(v)}>{typeof v === "number" ? (sheet.columns[ci].type === "id" ? String(v) : fmt(v)) : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</td>)}
              </tr>
            ))}
            {slice.length === 0 && <tr><td colSpan={sheet.columns.length + 1} className="muted" style={{ textAlign: "center", padding: 32 }}>No rows match “{q}”.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <div style={{ width: 130 }}><Select value={size} onChange={(v) => { setSize(v); setPage(0); }} options={PAGE_SIZES} label="Rows per page" /></div>
        <div className="row">
          <span className="muted sm">Page {cur + 1} of {pages}</span>
          <button className="btn icon sm" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
          <button className="btn icon sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
