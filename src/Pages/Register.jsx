import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import AuthArt from "../components/AuthArt";

const strength = (p) => {
  let s = 0;
  if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const s = strength(form.password);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try { await register(form.name, form.email, form.password); nav("/", { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-form">
        <form onSubmit={submit} noValidate>
          <div><h1>Create your account</h1><p className="muted" style={{ marginTop: 4 }}>Free. Takes less than a minute.</p></div>
          {error && <div className="callout bad" role="alert">{error}</div>}
          <div className="field"><label htmlFor="name">Full name</label><input id="name" className="input" autoComplete="name" required autoFocus value={form.name} onChange={set("name")} /></div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="email" required value={form.email} onChange={set("email")} /></div>
          <div className="field"><label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" autoComplete="new-password" required value={form.password} onChange={set("password")} aria-describedby="pw-hint" />
            <div className="meter" aria-hidden><i style={{ width: `${(s / 4) * 100}%`, background: s <= 1 ? "var(--bad)" : s === 2 ? "var(--warn)" : "var(--good)" }} /></div>
            <span id="pw-hint" className="hint">At least 8 characters. Longer with mixed case, numbers and symbols is stronger.</span></div>
          <button className="btn primary" style={{ height: 40 }} disabled={busy || !form.name || !form.email || !form.password}>{busy && <Spinner />}Create account</button>
          <p className="muted" style={{ textAlign: "center" }}>Already have an account? <Link to="/login">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
