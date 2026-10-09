import * as XLSX from "xlsx";
import { buildSheet } from "./analyze";
import { saveBlob } from "./api";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
const OK = /\.(xlsx|xls|csv|tsv|ods|xlsm)$/i;

/** Parse a user file entirely in the browser into typed sheets. Throws friendly errors. */
export async function parseFile(file) {
  if (!OK.test(file.name)) throw new Error("Unsupported file type. Use .xlsx, .xls, .csv, .tsv or .ods.");
  if (file.size > MAX_FILE_BYTES) throw new Error("File is larger than 25 MB.");
  if (file.size === 0) throw new Error("This file is empty.");

  let wb;
  try {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(buf, { type: "array", cellDates: true, dense: false });
  } catch {
    throw new Error("Couldn't read this file. It may be corrupted or password-protected.");
  }

  const sheets = [];
  for (const name of wb.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null, blankrows: false });
    const sheet = buildSheet(name, matrix);
    if (sheet) sheets.push(sheet);
  }
  if (!sheets.length) throw new Error("No data found. The file has no rows with values.");
  return { name: file.name.replace(/\.[^.]+$/, ""), originalName: file.name, sizeBytes: file.size, sheets };
}

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@]/.test(s) && typeof v === "string") s = `'${s}`; // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCsv(filename, columns, rows) {
  const lines = [columns.map((c) => csvCell(c.name ?? c)).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  saveBlob(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function exportXlsx(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s, i) => {
    const ws = XLSX.utils.aoa_to_sheet([s.columns.map((c) => c.name), ...s.rows]);
    XLSX.utils.book_append_sheet(wb, ws, (s.name || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, "_").slice(0, 31));
  });
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export const dataUrlToBlob = (url) => {
  const [head, b64] = url.split(",");
  const mime = /data:(.*?);/.exec(head)[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};
