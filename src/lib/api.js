const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export const getToken = () => { try { return localStorage.getItem("ea-token"); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem("ea-token", t) : localStorage.removeItem("ea-token"); } catch { /* storage unavailable */ } };

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

/** Single place for auth headers, JSON, error normalisation and "session expired" handling. */
export async function api(path, { method = "GET", body, blob = false, signal } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method, signal,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ApiError("Can't reach the server. Check your connection (free hosts may need ~30s to wake up).", 0);
  }
  if (res.status === 401 && token && !path.startsWith("/api/auth/")) {
    setToken(null);
    window.dispatchEvent(new Event("ea:logout"));
  }
  if (!res.ok) {
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON error */ }
    throw new ApiError(data.msg || `Request failed (${res.status})`, res.status, data.code);
  }
  if (blob) return res.blob();
  return res.status === 204 ? null : res.json();
}

export async function downloadFile(path, filename) {
  const blob = await api(path, { blob: true });
  saveBlob(blob, filename);
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
