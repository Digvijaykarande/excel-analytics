import { forwardRef, useMemo } from "react";
import ChartCanvas from "./ChartCanvas";
import { aggregate, scatterPoints } from "../lib/analyze";

export const CHART_TYPES = ["bar", "hbar", "line", "area", "pie", "doughnut", "scatter"];

/** Makes an untrusted spec (from AI, localStorage, or UI state) safe for THIS sheet; returns null if unusable. */
export function normalizeSpec(spec, sheet) {
  if (!spec || !sheet) return null;
  const col = (n) => sheet.columns.find((c) => c.name === n);
  if (!col(spec.x)) return null;
  const type = CHART_TYPES.includes(spec.type) ? spec.type : "bar";
  const numeric = (spec.y || []).filter((n) => col(n)?.type === "number");
  const agg = ["sum", "avg", "count", "min", "max", "median"].includes(spec.agg) ? spec.agg : "sum";
  if (type === "scatter" && (col(spec.x).type !== "number" || !numeric.length)) return null;
  return { title: spec.title || "", type, x: spec.x, y: type === "scatter" ? numeric.slice(0, 1) : numeric.slice(0, 3), agg: numeric.length ? agg : "count", sort: spec.sort, limit: Number(spec.limit) || 0, stacked: Boolean(spec.stacked) };
}

export function specToData(sheet, spec) {
  if (spec.type === "scatter") return { points: scatterPoints(sheet, spec.x, spec.y[0]), labels: [], series: [], note: "" };
  const r = aggregate(sheet, spec);
  const circular = spec.type === "pie" || spec.type === "doughnut";
  return { points: [], labels: r.labels, series: circular ? r.series.slice(0, 1) : r.series, note: r.note };
}

const ChartFromSpec = forwardRef(function ChartFromSpec({ sheet, spec, small }, ref) {
  const data = useMemo(() => specToData(sheet, spec), [sheet, spec]);
  const yLabel = spec.type === "scatter" ? spec.y[0] : spec.y.length ? `${spec.agg === "avg" ? "Average" : spec.agg[0].toUpperCase() + spec.agg.slice(1)} of ${spec.y.join(", ")}` : "Count";
  if (!data.labels.length && !data.points.length) return <div className="empty muted">No data to plot for this selection.</div>;
  return <ChartCanvas ref={ref} type={spec.type} labels={data.labels} series={data.series} points={data.points} xLabel={spec.x} yLabel={yLabel} stacked={spec.stacked} small={small} />;
});
export default ChartFromSpec;
