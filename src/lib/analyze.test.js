import test from "node:test";
import assert from "node:assert/strict";
import { buildSheet, inferType, toNumber, numericStats, profileSheet, aggregate, pearson, quickFindings, scatterPoints, fmt } from "./analyze.js";

const matrix = [
  ["Region", "Sales", "Date", "Units", "Region"],
  ["North", "$1,200", "2024-01-05", 10, ""],
  ["South", 800, "2024-01-20", 5, ""],
  ["North", "(100)", "2024-02-11", 7, ""],
  ["East", 400, "2024-02-15", 3, ""],
  [],
  ["North", 300, "2024-03-01", 2, ""],
];

test("toNumber handles currency, parentheses negatives, percents", () => {
  assert.equal(toNumber("$1,200"), 1200);
  assert.equal(toNumber("(100)"), -100);
  assert.equal(toNumber("12%"), 12);
  assert.equal(toNumber("n/a"), null);
  assert.equal(toNumber(""), null);
});

test("inferType does not treat plain numbers as dates and spots ids/booleans", () => {
  assert.equal(inferType([2020, 2021, 2022]), "number");
  assert.equal(inferType(["2024-01-01", "2024-02-01"]), "date");
  assert.equal(inferType([1, 2, 3], "Order ID"), "id");
  assert.equal(inferType(["yes", "no", "yes"]), "boolean");
});

test("buildSheet: skips blank rows/empty columns, dedupes headers, converts typed values", () => {
  const s = buildSheet("S", matrix);
  assert.deepEqual(s.columns.map((c) => c.name), ["Region", "Sales", "Date", "Units"]); // empty duplicate column dropped
  assert.equal(s.rows.length, 5);
  assert.equal(s.columns[1].type, "number");
  assert.equal(s.rows[0][1], 1200);
  assert.equal(s.rows[2][1], -100);
  assert.equal(s.columns[2].type, "date");
  const dup = buildSheet("D", [["a", "a", "a"], [1, 2, 3]]);
  assert.deepEqual(dup.columns.map((c) => c.name), ["a", "a (2)", "a (3)"]);
  assert.equal(buildSheet("E", [[], [null, ""]]), null);
});

test("numericStats: mean/median/std/outliers", () => {
  const s = numericStats([1, 2, 3, 4, 100]);
  assert.equal(s.mean, 22);
  assert.equal(s.median, 3);
  assert.equal(s.outliers, 1);
  assert.equal(numericStats([]), null);
  assert.equal(numericStats(["a", null]), null);
});

test("aggregate: sum/avg/count by category, sorting and top-N", () => {
  const s = buildSheet("S", matrix);
  const sum = aggregate(s, { x: "Region", y: ["Sales"], agg: "sum" });
  assert.deepEqual(sum.labels, ["North", "South", "East"]);       // sorted desc
  assert.deepEqual(sum.series[0].data, [1400, 800, 400]);
  const avg = aggregate(s, { x: "Region", y: ["Sales"], agg: "avg", sort: "label" });
  assert.deepEqual(avg.labels, ["East", "North", "South"]);
  assert.equal(avg.series[0].data[1], 466.6666666666667);
  const cnt = aggregate(s, { x: "Region", y: [], agg: "count", limit: 2 });
  assert.deepEqual(cnt.series[0].data, [3, 1]);
  assert.match(cnt.note, /top 2 of 3/i);
});

test("aggregate: dates are grouped chronologically", () => {
  const s = buildSheet("S", matrix);
  const r = aggregate(s, { x: "Date", y: ["Units"], agg: "sum" });
  assert.deepEqual(r.labels, ["2024-01", "2024-02", "2024-03"]);
  assert.deepEqual(r.series[0].data, [15, 10, 2]);
});

test("aggregate: many distinct numeric X values become 10 ranges, ordered numerically", () => {
  const rows = [["v", "n"], ...Array.from({ length: 100 }, (_, i) => [i * 3, 1])];
  const r = aggregate(buildSheet("S", rows), { x: "v", y: ["n"], agg: "sum" });
  assert.equal(r.labels.length, 10);
  assert.ok(toNumber(r.labels[0].split("–")[0]) < toNumber(r.labels[9].split("–")[0]));
});

test("pearson & profile & findings", () => {
  assert.ok(Math.abs(pearson([1, 2, 3, 4], [2, 4, 6, 8]) - 1) < 1e-9);
  assert.equal(pearson([1, 1, 1], [1, 2, 3]), null);
  const s = buildSheet("S", matrix);
  const p = profileSheet(s);
  assert.equal(p.rows, 5);
  assert.ok(p.quality > 0 && p.quality <= 100);
  assert.ok(Array.isArray(quickFindings(p)));
  assert.equal(scatterPoints(s, "Sales", "Units").length, 5);
});

test("fmt compacts large numbers", () => {
  assert.equal(fmt(1500000), "1.5M");
  assert.equal(fmt(12345), "12.3K");
  assert.equal(fmt(42), "42");
  assert.equal(fmt(NaN), "–");
});
