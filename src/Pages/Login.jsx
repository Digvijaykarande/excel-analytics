import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import AuthArt from "../components/AuthArt";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try { await login(form.email, form.password); nav(loc.state?.from || "/", { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-form">
        <form onSubmit={submit} noValidate>
          <div><h1>Welcome back</h1><p className="muted" style={{ marginTop: 4 }}>Log in to continue to your workspace.</p></div>
          {error && <div className="callout bad" role="alert">{error}</div>}
          <div className="field"><label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input id="password" className="input" type={show ? "text" : "password"} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ paddingRight: 40 }} />
              <button type="button" className="btn ghost icon sm" style={{ position: "absolute", right: 3, top: 3 }} onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div></div>
          <button className="btn primary" style={{ height: 40 }} disabled={busy || !form.email || !form.password}>{busy && <Spinner />}Log in</button>
          <p className="muted" style={{ textAlign: "center" }}>New here? <Link to="/register">Create an account</Link></p>
        </form>
      </div>
    </div>
  );
}
