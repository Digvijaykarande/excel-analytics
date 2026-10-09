import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { fmt } from "../lib/analyze";

Chart.register(...registerables);

const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const palette = () => Array.from({ length: 8 }, (_, i) => cssVar(`--c${i + 1}`));
const alpha = (hex, a) => {
  const m = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : hex;
};

/** Re-render charts whenever the theme flips (Chart.js caches colours at construction time). */
function useThemeKey() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => setK((n) => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const h = () => setK((n) => n + 1);
    mq?.addEventListener?.("change", h);
    return () => { mo.disconnect(); mq?.removeEventListener?.("change", h); };
  }, []);
  return k;
}

/**
 * props: type (bar|hbar|line|area|pie|doughnut|scatter), labels, series [{name,data}], points (scatter),
 * xLabel, yLabel, stacked, height
 */
const ChartCanvas = forwardRef(function ChartCanvas({ type, labels = [], series = [], points = [], xLabel, yLabel, stacked, small }, ref) {
  const canvas = useRef(null);
  const chart = useRef(null);
  const themeKey = useThemeKey();

  useImperativeHandle(ref, () => ({
    toDataURL(format = "png") {
      // paint a solid background so JPG/PNG exports aren't transparent/black
      const src = canvas.current;
      const out = document.createElement("canvas");
      out.width = src.width; out.height = src.height;
      const ctx = out.getContext("2d");
      ctx.fillStyle = cssVar("--surface") || "#fff";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(src, 0, 0);
      return out.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
    },
  }));

  useEffect(() => {
    const colors = palette();
    const text = cssVar("--text-2"), grid = cssVar("--border"), surface = cssVar("--surface");
    const circular = type === "pie" || type === "doughnut";
    const isScatter = type === "scatter";
    const cType = type === "hbar" ? "bar" : type === "area" ? "line" : type;

    let data;
    if (isScatter) {
      data = { datasets: [{ label: `${yLabel} vs ${xLabel}`, data: points, backgroundColor: alpha(colors[0], 0.55), borderColor: colors[0], pointRadius: 3.5, pointHoverRadius: 6 }] };
    } else if (circular) {
      const first = series[0]?.data || [];
      data = { labels, datasets: [{ label: series[0]?.name, data: first, backgroundColor: labels.map((_, i) => colors[i % colors.length]), borderColor: surface, borderWidth: 2 }] };
    } else {
      data = {
        labels,
        datasets: series.map((s, i) => {
          const col = colors[i % colors.length];
          const line = cType === "line";
          return {
            label: s.name, data: s.data, borderColor: col, borderWidth: line ? 2.5 : 0,
            backgroundColor: line ? (type === "area" ? alpha(col, 0.18) : col) : alpha(col, 0.88),
            fill: type === "area", tension: 0.3, pointRadius: labels.length > 60 ? 0 : 3, pointHoverRadius: 5,
            borderRadius: line ? 0 : 5, maxBarThickness: 56,
          };
        }),
      };
    }

    const horizontal = type === "hbar";
    const allInt = !isScatter && series.every((s) => s.data.every((v) => Number.isInteger(v)));
    const axisBase = { ticks: { color: text, maxRotation: 45, autoSkipPadding: 12 }, grid: { color: grid }, border: { color: grid } };
    const scales = circular ? {} : {
      x: { ...axisBase, stacked: stacked && !isScatter, type: isScatter ? "linear" : "category", title: { display: Boolean(isScatter ? xLabel : horizontal ? yLabel : xLabel), text: isScatter ? xLabel : horizontal ? yLabel : xLabel, color: text }, grid: { display: horizontal || isScatter, color: grid },
        ticks: { ...axisBase.ticks, callback: horizontal || isScatter ? (v) => fmt(Number(v)) : function (v) { const l = String(this.getLabelForValue(v)); return l.length > 16 ? `${l.slice(0, 15)}…` : l; } } },
      y: { ...axisBase, stacked: stacked && !isScatter, beginAtZero: !isScatter, ...(allInt && !horizontal ? { ticks: { ...axisBase.ticks, precision: 0, callback: (v) => fmt(Number(v)) } } : {}), title: { display: Boolean(isScatter ? yLabel : horizontal ? xLabel : yLabel), text: isScatter ? yLabel : horizontal ? xLabel : yLabel, color: text },
        ticks: { ...axisBase.ticks, callback: horizontal ? function (v) { const l = String(this.getLabelForValue(v)); return l.length > 18 ? `${l.slice(0, 17)}…` : l; } : (v) => fmt(Number(v)) } },
    };

    chart.current?.destroy();
    chart.current = new Chart(canvas.current, {
      type: cType, data,
      options: {
        indexAxis: horizontal ? "y" : "x", responsive: true, maintainAspectRatio: false,
        animation: { duration: 350 }, interaction: { mode: isScatter ? "nearest" : "index", intersect: isScatter },
        plugins: {
          legend: { display: circular || series.length > 1, position: circular ? "right" : "top", labels: { color: text, usePointStyle: true, boxWidth: 8 } },
          tooltip: { callbacks: { label: (c) => { const v = c.parsed?.y ?? c.parsed; return isScatter ? `(${fmt(c.parsed.x)}, ${fmt(c.parsed.y)})` : ` ${c.dataset.label ? `${c.dataset.label}: ` : ""}${fmt(typeof v === "number" ? (horizontal ? c.parsed.x : v) : c.raw)}`; } } },
        },
        scales,
      },
    });
    return () => { chart.current?.destroy(); chart.current = null; };
  }, [type, labels, series, points, xLabel, yLabel, stacked, themeKey]);

  return <div className={`chart-box ${small ? "sm" : ""}`}><canvas ref={canvas} role="img" aria-label={`${type} chart of ${yLabel || "values"} by ${xLabel || "category"}`} /></div>;
});

export default ChartCanvas;
