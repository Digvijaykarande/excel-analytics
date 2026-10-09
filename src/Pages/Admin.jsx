import { useCallback, useEffect, useState } from "react";
import { Database, Rows3, Search, Shield, Trash2, Users, UserPlus } from "lucide-react";
import { api } from "../lib/api";
import { fmt, fmtBytes } from "../lib/analyze";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ConfirmDialog, EmptyState, PageLoader, StatCard, Tabs, timeAgo } from "../components/ui";
import { Select } from "../components/Select";
import ChartCanvas from "../components/ChartCanvas";

const TABS = [{ value: "overview", label: "Overview", icon: Shield }, { value: "users", label: "Users", icon: Users }, { value: "files", label: "Files", icon: Database }];
const ROLES = [{ value: "user", label: "User" }, { value: "admin", label: "Admin" }];
const USER_SORTS = [{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "name", label: "Name" }, { value: "email", label: "Email" }];

export default function Admin() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="page">
      <div className="page-head"><div><h1>Admin</h1><p>Platform usage and account management. File contents are never shown here.</p></div></div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "overview" && <AdminOverview />}
      {tab === "users" && <AdminUsers />}
      {tab === "files" && <AdminFiles />}
    </div>
  );
}

function useLoad(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api(path).then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message)), [path]);
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);
  return { data, error, reload: load };
}

function AdminOverview() {
  const { data, error } = useLoad("/api/admin/stats");
  if (error) return <div className="callout bad">{error}</div>;
  if (!data) return <PageLoader />;
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid c4">
        <StatCard icon={Users} label="Users" value={fmt(data.users)} sub={`${data.newUsers} joined this week`} />
        <StatCard icon={Database} label="Files" value={fmt(data.datasets)} />
        <StatCard icon={Rows3} label="Rows stored" value={fmt(data.rows)} />
        <StatCard icon={UserPlus} label="Storage" value={fmtBytes(data.bytes)} sub="original file sizes" />
      </div>
      <section className="card"><div className="card-head"><h3>Files saved per day</h3><span className="muted sm">last 14 days</span></div>
        <div className="card-pad"><ChartCanvas type="bar" labels={data.uploadsPerDay.map((d) => d.date.slice(5))} series={[{ name: "Files", data: data.uploadsPerDay.map((d) => d.count) }]} xLabel="Day" yLabel="Files" small /></div></section>
      <section className="card"><div className="card-head"><h3>Most active users</h3></div>
        <div className="table-wrap"><table className="t"><thead><tr><th>User</th><th className="num">Files</th><th className="num">Rows</th></tr></thead><tbody>
          {data.topUsers.map((u) => <tr key={u._id}><td><b>{u.name || "Deleted user"}</b><div className="muted sm">{u.email}</div></td><td className="num">{u.datasets}</td><td className="num">{fmt(u.rows)}</td></tr>)}
          {data.topUsers.length === 0 && <tr><td colSpan={3} className="muted" style={{ textAlign: "center", padding: 24 }}>No activity yet.</td></tr>}</tbody></table></div></section>
    </div>
  );
}

function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [q, setQ] = useState("");
  useEffect(() => { const t = setTimeout(() => setQ(search), 250); return () => clearTimeout(t); }, [search]);
  const { data, error, reload } = useLoad(`/api/admin/users?sort=${sort}${q ? `&search=${encodeURIComponent(q)}` : ""}`);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const setRole = async (u, role) => { try { await api(`/api/admin/users/${u._id}/role`, { method: "PATCH", body: { role } }); toast.success(`${u.name} is now ${role}`); reload(); } catch (e) { toast.error(e.message); } };
  const remove = async () => { setBusy(true); try { await api(`/api/admin/users/${del._id}`, { method: "DELETE" }); toast.success("User deleted"); setDel(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };

  return (
    <>
      <div className="row wrap" style={{ marginBottom: 14 }}>
        <div className="search" style={{ flex: "1 1 240px", maxWidth: 360 }}><Search size={16} /><input className="input" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" /></div>
        <div style={{ width: 150 }}><Select label="Sort users" value={sort} onChange={setSort} options={USER_SORTS} /></div>
      </div>
      {error && <div className="callout bad">{error}</div>}
      {!data && !error && <PageLoader />}
      {data && <div className="card"><div className="table-wrap"><table className="t"><thead><tr><th>User</th><th>Role</th><th className="num">Files</th><th className="num">Rows</th><th>Joined</th><th /></tr></thead><tbody>
        {data.map((u) => (
          <tr key={u._id}>
            <td><b>{u.name}</b><div className="muted sm">{u.email}</div></td>
            <td style={{ width: 130, overflow: "visible" }}>{u._id === me._id ? <span className="badge primary">You · Admin</span> : <Select label={`Role for ${u.name}`} value={u.role} onChange={(r) => r !== u.role && setRole(u, r)} options={ROLES} />}</td>
            <td className="num">{u.datasets}</td><td className="num">{fmt(u.rows)}</td><td className="muted">{timeAgo(u.createdAt)}</td>
            <td style={{ textAlign: "right" }}>{u._id !== me._id && <button className="btn ghost icon sm" aria-label={`Delete ${u.name}`} onClick={() => setDel(u)}><Trash2 size={15} color="var(--bad)" /></button>}</td>
          </tr>))}
        {data.length === 0 && <tr><td colSpan={6}><EmptyState icon={Users} title="No users found" /></td></tr>}
      </tbody></table></div></div>}
      {del && <ConfirmDialog title="Delete user?" message={`${del.name} (${del.email}) and all ${del.datasets} of their files will be permanently deleted.`} busy={busy} onConfirm={remove} onClose={() => setDel(null)} />}
    </>
  );
}

function AdminFiles() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => { const t = setTimeout(() => setQ(search), 250); return () => clearTimeout(t); }, [search]);
  const { data, error, reload } = useLoad(`/api/admin/datasets${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const remove = async () => { setBusy(true); try { await api(`/api/admin/datasets/${del._id}`, { method: "DELETE" }); toast.success("File deleted"); setDel(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  return (
    <>
      <div className="search" style={{ maxWidth: 360, marginBottom: 14 }}><Search size={16} /><input className="input" placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search files" /></div>
      {error && <div className="callout bad">{error}</div>}
      {!data && !error && <PageLoader />}
      {data && <div className="card"><div className="table-wrap"><table className="t"><thead><tr><th>File</th><th>Owner</th><th className="num">Rows</th><th className="num">Size</th><th>Uploaded</th><th /></tr></thead><tbody>
        {data.map((d) => (<tr key={d._id}><td><b>{d.name}</b></td><td>{d.user ? <>{d.user.name}<div className="muted sm">{d.user.email}</div></> : <span className="muted">Deleted user</span>}</td>
          <td className="num">{fmt(d.totalRows)}</td><td className="num">{fmtBytes(d.sizeBytes)}</td><td className="muted">{timeAgo(d.createdAt)}</td>
          <td style={{ textAlign: "right" }}><button className="btn ghost icon sm" aria-label={`Delete ${d.name}`} onClick={() => setDel(d)}><Trash2 size={15} color="var(--bad)" /></button></td></tr>))}
        {data.length === 0 && <tr><td colSpan={6}><EmptyState icon={Database} title="No files found" /></td></tr>}
      </tbody></table></div></div>}
      {del && <ConfirmDialog title="Delete file?" message={`“${del.name}” will be permanently deleted.`} busy={busy} onConfirm={remove} onClose={() => setDel(null)} />}
    </>
  );
}
