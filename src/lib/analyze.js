/**
 * Pure analysis helpers (no React, no DOM) so they can be unit-tested in Node.
 * Everything the old app did badly lives here done properly: type inference, real statistics,
 * aggregation (the old chart plotted raw rows and could never "sum by category"), outliers, correlations.
 */

export const MAX_ROWS = 50000;

/* ---------- parsing helpers ---------- */

export function toNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.trim();
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  s = s.replace(/[$€£₹¥,\s%]/g, "");
  if (!/^-?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}

const isBlank = (v) => v === null || v === undefined || v === "" || (typeof v === "string" && !v.trim());

export function parseDate(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?/.test(s) && !/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const isoDate = (d) => d.toISOString().slice(0, 10);

export function inferType(values, name = "") {
  const present = values.filter((v) => !isBlank(v));
  if (!present.length) return "text";

  if (present.every((v) => typeof v === "boolean" || ["true", "false", "yes", "no"].includes(String(v).toLowerCase()))) return "boolean";

  const dates = present.filter((v) => parseDate(v) !== null);
  // plain numbers must never be mistaken for dates, so only strings / Date objects count
  if (dates.length / present.length >= 0.9 && present.every((v) => typeof v !== "number")) return "date";

  const nums = present.filter((v) => toNumber(v) !== null);
  if (nums.length / present.length >= 0.9) {
    const unique = new Set(nums.map(toNumber)).size;
    const looksId = /(^|[\s_-])(id|code|sku|no|number|ref)$|^id$/i.test(name.trim());
    if (looksId && unique === nums.length) return "id";
    return "number";
  }

  const unique = new Set(present.map((v) => String(v).trim().toLowerCase())).size;
  return unique <= 30 || unique / present.length < 0.5 ? "category" : "text";
}

function dedupeHeaders(raw) {
  const seen = new Map();
  return raw.map((h, i) => {
    let name = isBlank(h) ? `Column ${i + 1}` : String(h).trim();
    const n = (seen.get(name) || 0) + 1;
    seen.set(name, n);
    return n > 1 ? `${name} (${n})` : name;
  });
}

/** Turns a raw matrix (array of arrays, first non-empty row = header) into a typed sheet. */
export function buildSheet(name, matrix) {
  const rowsRaw = matrix.filter((r) => Array.isArray(r) && r.some((c) => !isBlank(c)));
  if (!rowsRaw.length) return null;
  const width = Math.max(...rowsRaw.map((r) => r.length));
  const header = dedupeHeaders(Array.from({ length: width }, (_, i) => rowsRaw[0][i]));
  let body = rowsRaw.slice(1);
  const truncated = body.length > MAX_ROWS;
  if (truncated) body = body.slice(0, MAX_ROWS);

  // drop columns that are entirely empty (very common with exported sheets)
  const keep = header.map((_, c) => body.some((r) => !isBlank(r[c])));
  const idx = keep.map((k, i) => (k ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return null;

  const columns = idx.map((c) => {
    const values = body.map((r) => r[c]);
    return { name: header[c], type: inferType(values, header[c]) };
  });

  const rows = body.map((r) =>
    idx.map((c, k) => {
      let v = r[c];
      if (isBlank(v)) return null;
      const t = columns[k].type;
      if (t === "number" || t === "id") return toNumber(v);
      if (t === "date") { const d = parseDate(v); return d ? isoDate(d) : null; }
      if (t === "boolean") return typeof v === "boolean" ? v : ["true", "yes"].includes(String(v).toLowerCase());
      if (v instanceof Date) return isoDate(v);
      return String(v).trim();
    })
  );
  return { name, columns, rows, truncated };
}

/* ---------- statistics ---------- */

const sum = (a) => a.reduce((s, v) => s + v, 0);

export function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function numericStats(values) {
  const v = values.filter((x) => typeof x === "number" && Number.isFinite(x));
  if (!v.length) return null;
  const sorted = [...v].sort((a, b) => a - b);
  const mean = sum(v) / v.length;
  const variance = v.length > 1 ? sum(v.map((x) => (x - mean) ** 2)) / (v.length - 1) : 0;
  const q1 = quantile(sorted, 0.25), q3 = quantile(sorted, 0.75), iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
  const outliers = iqr === 0 ? 0 : v.filter((x) => x < lo || x > hi).length;
  return {
    count: v.length, sum: sum(v), mean, median: quantile(sorted, 0.5),
    min: sorted[0], max: sorted[sorted.length - 1], std: Math.sqrt(variance),
    q1, q3, outliers, outlierBounds: [lo, hi],
  };
}

export function histogram(values, bins = 10) {
  const v = values.filter((x) => typeof x === "number" && Number.isFinite(x));
  if (!v.length) return [];
  const min = Math.min(...v), max = Math.max(...v);
  if (min === max) return [{ from: min, to: max, count: v.length }];
  const step = (max - min) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({ from: min + i * step, to: min + (i + 1) * step, count: 0 }));
  for (const x of v) out[Math.min(bins - 1, Math.floor((x - min) / step))].count++;
  return out;
}

export function topValues(values, n = 8) {
  const m = new Map();
  for (const v of values) if (!isBlank(v)) m.set(String(v), (m.get(String(v)) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));
}

export function pearson(a, b) {
  const pairs = [];
  for (let i = 0; i < a.length; i++) if (typeof a[i] === "number" && typeof b[i] === "number") pairs.push([a[i], b[i]]);
  if (pairs.length < 3) return null;
  const mx = sum(pairs.map((p) => p[0])) / pairs.length;
  const my = sum(pairs.map((p) => p[1])) / pairs.length;
  let num = 0, dx = 0, dy = 0;
  for (const [x, y] of pairs) { num += (x - mx) * (y - my); dx += (x - mx) ** 2; dy += (y - my) ** 2; }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? null : num / den;
}

export function duplicateRowCount(rows) {
  const seen = new Set();
  let dup = 0;
  for (const r of rows) {
    const k = JSON.stringify(r);
    if (seen.has(k)) dup++; else seen.add(k);
  }
  return dup;
}

/** Full profile of one sheet: per-column stats, data quality score, strongest correlations. */
export function profileSheet(sheet) {
  const { columns, rows } = sheet;
  const cols = columns.map((c, i) => {
    const values = rows.map((r) => r[i]);
    const missing = values.filter(isBlank).length;
    const present = values.length - missing;
    const unique = new Set(values.filter((v) => !isBlank(v))).size;
    const base = { name: c.name, type: c.type, index: i, count: present, missing, missingPct: values.length ? missing / values.length : 0, unique };
    if (c.type === "number") {
      const stats = numericStats(values);
      return { ...base, stats, histogram: histogram(values) };
    }
    if (c.type === "date") {
      const ds = values.filter((v) => !isBlank(v)).sort();
      return { ...base, min: ds[0], max: ds[ds.length - 1] };
    }
    if (c.type === "category" || c.type === "boolean") return { ...base, top: topValues(values, 8) };
    return { ...base, top: topValues(values, 3) };
  });

  const numericIdx = cols.filter((c) => c.type === "number").map((c) => c.index);
  const correlations = [];
  for (let a = 0; a < numericIdx.length && a < 25; a++) {
    for (let b = a + 1; b < numericIdx.length && b < 25; b++) {
      const r = pearson(rows.map((x) => x[numericIdx[a]]), rows.map((x) => x[numericIdx[b]]));
      if (r !== null) correlations.push({ a: columns[numericIdx[a]].name, b: columns[numericIdx[b]].name, r });
    }
  }
  correlations.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));

  const cells = rows.length * columns.length || 1;
  const missingCells = cols.reduce((s, c) => s + c.missing, 0);
  const duplicates = duplicateRowCount(rows);
  const completeness = 1 - missingCells / cells;
  const uniqueness = rows.length ? 1 - duplicates / rows.length : 1;
  const outlierCols = cols.filter((c) => c.stats && c.stats.outliers > 0).length;
  const quality = Math.round(Math.max(0, Math.min(100, (completeness * 0.7 + uniqueness * 0.3) * 100 - Math.min(10, outlierCols * 2))));

  return { rows: rows.length, columns: cols, correlations, missingCells, duplicates, completeness, quality };
}

/** Rule-based observations: instant, free, always available (AI insights are an upgrade, not a dependency). */
export function quickFindings(profile) {
  const out = [];
  const { columns: cols } = profile;
  if (profile.quality >= 90) out.push({ severity: "good", title: "Clean dataset", detail: `Data quality score is ${profile.quality}/100 with ${(profile.completeness * 100).toFixed(1)}% of cells filled.` });
  const worst = [...cols].sort((a, b) => b.missingPct - a.missingPct)[0];
  if (worst && worst.missingPct >= 0.05) out.push({ severity: worst.missingPct > 0.3 ? "warning" : "info", title: `Missing values in "${worst.name}"`, detail: `${(worst.missingPct * 100).toFixed(0)}% of rows (${worst.missing.toLocaleString()}) have no value.` });
  if (profile.duplicates > 0) out.push({ severity: "warning", title: "Duplicate rows", detail: `${profile.duplicates.toLocaleString()} rows are exact duplicates of another row.` });
  const skewed = cols.find((c) => c.stats && c.stats.std > 0 && Math.abs(c.stats.mean - c.stats.median) / c.stats.std > 0.5);
  if (skewed) out.push({ severity: "info", title: `"${skewed.name}" is skewed`, detail: `Mean ${fmt(skewed.stats.mean)} vs median ${fmt(skewed.stats.median)} - a few large values pull the average. Prefer the median.` });
  const out2 = cols.find((c) => c.stats && c.stats.outliers > 0);
  if (out2) out.push({ severity: "info", title: `Outliers in "${out2.name}"`, detail: `${out2.stats.outliers} value(s) fall outside ${fmt(out2.stats.outlierBounds[0])} to ${fmt(out2.stats.outlierBounds[1])}.` });
  const strong = profile.correlations.find((c) => Math.abs(c.r) >= 0.7);
  if (strong) out.push({ severity: "info", title: "Strong relationship", detail: `"${strong.a}" and "${strong.b}" move ${strong.r > 0 ? "together" : "in opposite directions"} (r = ${strong.r.toFixed(2)}).` });
  const constant = cols.find((c) => c.count > 1 && c.unique === 1);
  if (constant) out.push({ severity: "info", title: `"${constant.name}" never changes`, detail: "Every row has the same value, so it adds no information." });
  return out;
}

/* ---------- aggregation for charts ---------- */

export const AGGREGATIONS = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "count", label: "Count" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "median", label: "Median" },
];

function applyAgg(values, agg) {
  if (agg === "count") return values.length;
  const nums = values.filter((v) => typeof v === "number");
  if (!nums.length) return 0;
  switch (agg) {
    case "avg": return sum(nums) / nums.length;
    case "min": return Math.min(...nums);
    case "max": return Math.max(...nums);
    case "median": return quantile([...nums].sort((a, b) => a - b), 0.5);
    default: return sum(nums);
  }
}

/**
 * spec: { x, y: string[], agg, sort: 'none'|'asc'|'desc'|'label', limit }
 * returns { labels, series: [{name, data}], note }
 */
export function aggregate(sheet, spec) {
  const { columns, rows } = sheet;
  const xi = columns.findIndex((c) => c.name === spec.x);
  if (xi < 0) return { labels: [], series: [], note: "Pick a column for the X axis." };
  const xType = columns[xi].type;
  const ys = (spec.y || []).map((n) => columns.findIndex((c) => c.name === n)).filter((i) => i >= 0);
  const agg = spec.agg || "sum";
  const useCount = agg === "count" || ys.length === 0;
  let note = "";

  // Build the grouping key for each row.
  let keyOf;
  let ordered = false; // natural ordering (dates / numeric bins) that sorting must respect by default
  if (xType === "date") {
    const ds = rows.map((r) => r[xi]).filter(Boolean).sort();
    const span = ds.length ? (new Date(ds[ds.length - 1]) - new Date(ds[0])) / 864e5 : 0;
    const len = span > 365 * 2 ? 4 : span > 45 ? 7 : 10; // year / month / day
    keyOf = (r) => (r[xi] ? String(r[xi]).slice(0, len) : null);
    ordered = true;
    note = `Grouped by ${len === 4 ? "year" : len === 7 ? "month" : "day"}.`;
  } else if (xType === "number") {
    const nums = rows.map((r) => r[xi]).filter((v) => typeof v === "number");
    const uniq = new Set(nums).size;
    if (uniq > 30) {
      const min = Math.min(...nums), max = Math.max(...nums), step = (max - min) / 10 || 1;
      keyOf = (r) => {
        const v = r[xi];
        if (typeof v !== "number") return null;
        const b = Math.min(9, Math.floor((v - min) / step));
        return `${fmt(min + b * step)} – ${fmt(min + (b + 1) * step)}`;
      };
      ordered = true;
      note = "Numeric X grouped into 10 ranges.";
    } else {
      keyOf = (r) => (typeof r[xi] === "number" ? r[xi] : null);
      ordered = true;
    }
  } else {
    keyOf = (r) => (isBlank(r[xi]) ? null : String(r[xi]));
  }

  const groups = new Map();
  for (const r of rows) {
    const k = keyOf(r);
    if (k === null) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  let entries = [...groups.entries()];
  if (ordered) entries.sort((a, b) => (typeof a[0] === "number" ? a[0] - b[0] : 0)); // bins/dates already sort lexically below
  if (ordered && typeof entries[0]?.[0] === "string" && xType === "date") entries.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (ordered && xType === "number" && typeof entries[0]?.[0] === "string") {
    const start = (s) => toNumber(String(s).split("–")[0]) ?? 0;
    entries.sort((a, b) => start(a[0]) - start(b[0]));
  }

  const seriesDefs = useCount ? [{ name: "Count", idx: -1 }] : ys.map((i) => ({ name: columns[i].name, idx: i }));
  const series = seriesDefs.map((s) => ({
    name: s.name,
    data: entries.map(([, grp]) => (s.idx < 0 ? grp.length : applyAgg(grp.map((r) => r[s.idx]), agg))),
  }));
  let labels = entries.map(([k]) => String(k));

  // sorting & top-N (categories default to descending by first series so "Top 10" is meaningful)
  const sort = spec.sort || (ordered ? "label" : "desc");
  let order = labels.map((_, i) => i);
  if (sort === "desc") order.sort((a, b) => series[0].data[b] - series[0].data[a]);
  else if (sort === "asc") order.sort((a, b) => series[0].data[a] - series[0].data[b]);
  else if (sort === "label" && !ordered) order.sort((a, b) => labels[a].localeCompare(labels[b], undefined, { numeric: true }));

  const limit = spec.limit && spec.limit > 0 ? spec.limit : 0;
  const maxPoints = ordered ? 400 : 200;
  const cut = limit || maxPoints;
  if (order.length > cut) {
    if (limit) note = `${note} Showing top ${limit} of ${order.length}.`.trim();
    else note = `${note} Showing first ${maxPoints} of ${order.length} groups - use Top N to narrow.`.trim();
    order = order.slice(0, cut);
  }
  labels = order.map((i) => labels[i]);
  series.forEach((s) => (s.data = order.map((i) => s.data[i])));
  return { labels, series, note: note.trim() };
}

export function scatterPoints(sheet, xName, yName, max = 1500) {
  const xi = sheet.columns.findIndex((c) => c.name === xName);
  const yi = sheet.columns.findIndex((c) => c.name === yName);
  if (xi < 0 || yi < 0) return [];
  const pts = [];
  for (const r of sheet.rows) if (typeof r[xi] === "number" && typeof r[yi] === "number") pts.push({ x: r[xi], y: r[yi] });
  if (pts.length <= max) return pts;
  const step = pts.length / max;
  return Array.from({ length: max }, (_, i) => pts[Math.floor(i * step)]);
}

/** Smart default chart suggestions from the profile (free, no AI needed). */
export function suggestCharts(sheet, profile) {
  const cols = profile.columns;
  const nums = cols.filter((c) => c.type === "number");
  const cats = cols.filter((c) => c.type === "category" && c.unique > 1 && c.unique <= 40);
  const dates = cols.filter((c) => c.type === "date");
  const out = [];
  if (dates[0] && nums[0]) out.push({ title: `${nums[0].name} over time`, type: "line", x: dates[0].name, y: [nums[0].name], agg: "sum" });
  if (cats[0] && nums[0]) out.push({ title: `${nums[0].name} by ${cats[0].name}`, type: "bar", x: cats[0].name, y: [nums[0].name], agg: "sum", limit: 10 });
  if (cats[0]) out.push({ title: `Share of rows by ${cats[0].name}`, type: "doughnut", x: cats[0].name, y: [], agg: "count", limit: 8 });
  if (nums.length >= 2) out.push({ title: `${nums[0].name} vs ${nums[1].name}`, type: "scatter", x: nums[0].name, y: [nums[1].name], agg: "sum" });
  if (cats[1] && nums[0]) out.push({ title: `Average ${nums[0].name} by ${cats[1].name}`, type: "hbar", x: cats[1].name, y: [nums[0].name], agg: "avg", limit: 10 });
  return out.slice(0, 5);
}

/* ---------- AI payload ---------- */

/** Compact statistical profile sent to the AI (never the whole file). */
export function aiPayload(name, sheet, profile) {
  const cols = profile.columns.slice(0, 60).map((c) => {
    const o = { name: c.name, type: c.type, missing: c.missing, unique: c.unique };
    if (c.stats) Object.assign(o, { min: round(c.stats.min), max: round(c.stats.max), mean: round(c.stats.mean), median: round(c.stats.median), sum: round(c.stats.sum), outliers: c.stats.outliers });
    if (c.type === "date") Object.assign(o, { from: c.min, to: c.max });
    if (c.top) o.top = c.top.slice(0, 6);
    return o;
  });
  const sample = sheet.rows.slice(0, 8).map((r) => Object.fromEntries(sheet.columns.slice(0, 30).map((c, i) => [c.name, r[i]])));
  return {
    name,
    profile: { rows: profile.rows, columnCount: profile.columns.length, quality: profile.quality, duplicates: profile.duplicates, columns: cols, topCorrelations: profile.correlations.slice(0, 6).map((c) => ({ ...c, r: round(c.r) })) },
    sample,
  };
}

/* ---------- formatting ---------- */

function round(n, d = 2) { return typeof n === "number" ? Number(n.toFixed(d)) : n; }

export function fmt(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "–";
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (a >= 1e4) return (n / 1e3).toFixed(1).replace(/\.?0+$/, "") + "K";
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", { maximumFractionDigits: a < 1 ? 4 : 2 });
}

export function fmtBytes(b) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  return `${(b / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
}
