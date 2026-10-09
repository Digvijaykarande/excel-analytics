import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Folder, Info, LayoutDashboard, LogOut, Menu, Moon, PlusCircle, Settings, Shield, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../lib/theme";

const link = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Primary">
        <NavLink to="/" className="brand"><span className="brand-mark"><BarChart3 size={18} /></span>Excel Analytics</NavLink>
        <button className="btn primary" style={{ margin: "0 4px 6px" }} onClick={() => nav("/new")}><PlusCircle size={16} />New analysis</button>
        <nav className="nav-group">
          <div className="nav-title">Workspace</div>
          <NavLink end to="/" className={link}><LayoutDashboard size={17} />Dashboard</NavLink>
          <NavLink to="/library" className={link}><Folder size={17} />My files</NavLink>
        </nav>
        <nav className="nav-group">
          <div className="nav-title">Account</div>
          <NavLink to="/settings" className={link}><Settings size={17} />Settings</NavLink>
          <NavLink to="/about" className={link}><Info size={17} />About</NavLink>
          {user?.role === "admin" && <NavLink to="/admin" className={link}><Shield size={17} />Admin</NavLink>}
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <div className="avatar" aria-hidden>{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
              <div className="muted sm" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
            </div>
            <button className="btn ghost icon sm" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
          <button className="btn ghost" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { logout(); nav("/login"); }}><LogOut size={16} />Log out</button>
        </div>
      </aside>
      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="btn icon" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
          <strong>Excel Analytics</strong>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
