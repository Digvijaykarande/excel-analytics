import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

/**
 * Accessible custom dropdown (listbox pattern): keyboard nav, type-to-search for long lists, click-outside / Esc to close,
 * and it flips upward near the bottom of the viewport. Replaces the native <select> elements
 * (which could not show column types, search, or multi-select).
 * options: [{ value, label, type?, hint? }]
 */
function useCombo({ options, onPick, multi }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const root = useRef(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => String(o.label).toLowerCase().includes(s)) : options;
  }, [options, q]);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const toggle = () => {
    if (!open && root.current) {
      const r = root.current.getBoundingClientRect();
      setUp(window.innerHeight - r.bottom < 320 && r.top > 320);
    }
    setOpen((o) => !o); setQ(""); setActive(0);
  };

  const onKey = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); toggle(); }
      return;
    }
    if (e.key === "Escape") { setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) { onPick(filtered[active]); if (!multi) setOpen(false); } }
  };

  useEffect(() => { if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, open, listId]);
  return { open, setOpen, q, setQ, active, setActive, up, root, listId, filtered, toggle, onKey };
}

function Popover({ c, isSelected, onPick, searchable, multi, label }) {
  return (
    <div className={`sel-pop ${c.up ? "up" : ""}`}>
      {searchable && (
        <div className="sel-search search">
          <Search size={15} />
          <input className="input" autoFocus placeholder="Search…" value={c.q} onChange={(e) => { c.setQ(e.target.value); c.setActive(0); }} onKeyDown={c.onKey} aria-label={`Search ${label || "options"}`} />
        </div>
      )}
      <ul className="sel-list" role="listbox" id={c.listId} aria-multiselectable={multi || undefined}>
        {c.filtered.length === 0 && <li className="sel-empty">No matches</li>}
        {c.filtered.map((o, i) => (
          <li key={String(o.value)} id={`${c.listId}-${i}`} role="option" className="sel-opt" aria-selected={isSelected(o)} data-active={i === c.active}
            onMouseEnter={() => c.setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(o); if (!multi) c.setOpen(false); }}>
            {o.type && <span className={`type-dot t-${o.type}`} title={o.type} />}
            <span className="grow">{o.label}</span>
            {o.hint && <span className="muted sm">{o.hint}</span>}
            {isSelected(o) && <Check size={15} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Select({ value, onChange, options, placeholder = "Select…", label, clearable, disabled }) {
  const c = useCombo({ options, onPick: (o) => onChange(o.value) });
  const current = options.find((o) => o.value === value);
  return (
    <div className="sel" ref={c.root} onKeyDown={c.onKey}>
      <button type="button" className="sel-btn" disabled={disabled} aria-haspopup="listbox" aria-expanded={c.open} aria-label={label} aria-controls={c.listId} onClick={c.toggle}>
        {current?.type && <span className={`type-dot t-${current.type}`} />}
        <span className={`val ${current ? "" : "ph"}`}>{current ? current.label : placeholder}</span>
        {clearable && current ? <X size={14} className="muted" onClick={(e) => { e.stopPropagation(); onChange(""); }} /> : <ChevronDown size={16} className="muted" />}
      </button>
      {c.open && <Popover c={c} isSelected={(o) => o.value === value} onPick={(o) => onChange(o.value)} searchable={options.length > 8} label={label} />}
    </div>
  );
}

export function MultiSelect({ values, onChange, options, placeholder = "Select…", label, max = 3 }) {
  const toggleVal = (v) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else if (values.length < max) onChange([...values, v]);
  };
  const c = useCombo({ options, onPick: (o) => toggleVal(o.value), multi: true });
  return (
    <div className="sel" ref={c.root} onKeyDown={c.onKey}>
      <div className="sel-btn" role="button" tabIndex={0} aria-haspopup="listbox" aria-expanded={c.open} aria-label={label} onClick={c.toggle}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); c.toggle(); } }} style={{ minHeight: 36, height: "auto", padding: "4px 10px 4px 8px" }}>
        {values.length === 0 ? <span className="val ph" style={{ paddingLeft: 4 }}>{placeholder}</span> : (
          <div className="chips">
            {values.map((v) => (
              <span className="chip" key={v}><span title={v}>{v}</span>
                <button type="button" aria-label={`Remove ${v}`} onClick={(e) => { e.stopPropagation(); toggleVal(v); }}><X size={12} /></button></span>
            ))}
          </div>
        )}
        <ChevronDown size={16} className="muted" />
      </div>
      {c.open && (
        <Popover c={c} isSelected={(o) => values.includes(o.value)} onPick={(o) => toggleVal(o.value)} searchable={options.length > 8} multi label={label} />
      )}
      {c.open && values.length >= max && <div className="sm muted" style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 61, display: "none" }}>Max {max}</div>}
    </div>
  );
}
