import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../lib/theme";
import { Modal, Segmented, Spinner } from "../components/ui";

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState("");
  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState("");

  const run = (key, fn) => async (e) => { e?.preventDefault(); setBusy(key); try { await fn(); } catch (err) { toast.error(err.message); } finally { setBusy(""); } };

  const saveName = run("name", async () => { setUser(await api("/api/users/me", { method: "PATCH", body: { name } })); toast.success("Profile updated"); });
  const savePw = run("pw", async () => { await api("/api/users/me/password", { method: "POST", body: pw }); setPw({ currentPassword: "", newPassword: "" }); toast.success("Password changed"); });
  const delAccount = run("del", async () => { await api("/api/users/me", { method: "DELETE", body: { password: delPw } }); logout(); nav("/login"); });

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head"><div><h1>Settings</h1><p>Manage your profile, security and appearance.</p></div></div>
      <div className="stack">
        <form className="card card-pad stack" onSubmit={saveName}>
          <h2>Profile</h2>
          <div className="field"><label htmlFor="n">Name</label><input id="n" className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Email</label><input className="input" value={user.email} disabled /><span className="hint">Email can't be changed.</span></div>
          <div><button className="btn primary" disabled={busy === "name" || name.trim().length < 2 || name === user.name}>{busy === "name" && <Spinner />}Save changes</button></div>
        </form>

        <div className="card card-pad stack">
          <h2>Appearance</h2>
          <Segmented label="Theme" value={theme} onChange={(v) => v !== theme && toggle()} options={[{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }]} />
        </div>

        <form className="card card-pad stack" onSubmit={savePw}>
          <h2>Change password</h2>
          <div className="field"><label htmlFor="cp">Current password</label><input id="cp" type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
          <div className="field"><label htmlFor="np">New password</label><input id="np" type="password" autoComplete="new-password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /><span className="hint">At least 8 characters.</span></div>
          <div><button className="btn primary" disabled={busy === "pw" || !pw.currentPassword || pw.newPassword.length < 8}>{busy === "pw" && <Spinner />}Update password</button></div>
        </form>

        <div className="card card-pad stack" style={{ borderColor: "color-mix(in srgb, var(--bad) 35%, var(--border))" }}>
          <h2 style={{ color: "var(--bad)" }}>Danger zone</h2>
          <p className="muted">Deleting your account permanently removes your profile and every file you saved.</p>
          <div><button className="btn danger" onClick={() => setDelOpen(true)}>Delete my account</button></div>
        </div>
      </div>
      {delOpen && <Modal title="Delete account" onClose={() => setDelOpen(false)} actions={<><button className="btn" onClick={() => setDelOpen(false)}>Cancel</button><button className="btn danger solid" disabled={!delPw || busy === "del"} onClick={delAccount}>{busy === "del" && <Spinner />}Delete forever</button></>}>
        <p className="muted" style={{ marginBottom: 12 }}>Enter your password to confirm. This can't be undone.</p>
        <input className="input" type="password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} aria-label="Password" /></Modal>}
    </div>
  );
}
