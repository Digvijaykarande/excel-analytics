import { useEffect, useRef, useState } from "react";
import { AlertTriangle, FileSpreadsheet, Loader2, MoreVertical, Upload } from "lucide-react";
import { fmtBytes } from "../lib/analyze";

export function Spinner({ size = 16 }) { return <Loader2 size={size} className="spin" aria-label="Loading" />; }

export function PageLoader({ label = "Loading…" }) {
  return <div className="empty"><Spinner size={26} /><p style={{ marginTop: 10 }}>{label}</p></div>;
}

export function Skeleton({ h = 20, w = "100%", style }) { return <div className="skel" style={{ height: h, width: w, ...style }} />; }

export function EmptyState({ icon: Icon = FileSpreadsheet, title, children, action }) {
  return (
    <div className="empty">
      <div className="ico"><Icon size={24} /></div>
      <h3 style={{ color: "var(--text)", marginBottom: 4 }}>{title}</h3>
      {children && <p style={{ maxWidth: 420, margin: "0 auto" }}>{children}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="card stat">
      <div className="k">{Icon && <Icon size={14} />}{label}</div>
      <div className="v" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

export function Modal({ title, children, onClose, actions }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector("input,button,textarea")?.focus();
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>
        <div>{children}</div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Delete", busy, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} actions={<>
      <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
      <button className="btn danger solid" onClick={onConfirm} disabled={busy}>{busy && <Spinner />} {confirmLabel}</button>
    </>}>
      <div className="row" style={{ alignItems: "flex-start" }}><AlertTriangle size={20} color="var(--bad)" style={{ flex: "none", marginTop: 2 }} /><p style={{ color: "var(--text-2)" }}>{message}</p></div>
    </Modal>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} title={o.title || o.label} onClick={() => onChange(o.value)}>
          {o.icon && <o.icon size={15} />}{o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" className="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>
          {t.icon && <t.icon size={16} />}{t.label}{t.badge != null && <span className="badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

export function Dropzone({ onFile, busy, accept = ".xlsx,.xls,.csv,.tsv,.ods" }) {
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const pick = (f) => f && onFile(f);
  return (
    <div className={`dropzone ${over ? "over" : ""}`} role="button" tabIndex={0} aria-label="Upload a spreadsheet"
      onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click())}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}>
      <div className="ico">{busy ? <Spinner size={26} /> : <Upload size={26} />}</div>
      <h3>{busy ? "Reading your file…" : "Drop a spreadsheet here, or click to browse"}</h3>
      <p className="muted" style={{ marginTop: 6 }}>.xlsx, .xls, .csv, .tsv or .ods · up to 25 MB · parsed in your browser</p>
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

export function Menu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="kebab" ref={ref}>
      <button className="btn ghost icon sm" aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}><MoreVertical size={16} /></button>
      {open && (
        <div className="menu" role="menu">
          {items.map((it) => (
            <button key={it.label} role="menuitem" className={it.danger ? "danger" : ""} onClick={() => { setOpen(false); it.onClick(); }}>{it.icon && <it.icon size={15} />}{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export const fileMeta = (ds) => `${ds.totalRows?.toLocaleString?.() ?? 0} rows · ${ds.totalColumns ?? 0} cols · ${fmtBytes(ds.sizeBytes)}`;

export function timeAgo(date) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(date)) / 1000));
  const t = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [n, u] of t) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
}
