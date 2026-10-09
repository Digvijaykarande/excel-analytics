import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import { PageLoader } from "./components/ui";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import NewAnalysis from "./Pages/NewAnalysis";
import Library from "./Pages/Library";
import Settings from "./Pages/Settings";
import About from "./Pages/About";
import NotFound from "./Pages/NotFound";

// heavy pages (chart.js + tables) load on demand
const Workspace = lazy(() => import("./Pages/Workspace"));
const Admin = lazy(() => import("./Pages/Admin"));

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader label="Signing you in…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewAnalysis />} />
          <Route path="workspace/:id" element={<Workspace />} />
          <Route path="library" element={<Library />} />
          <Route path="settings" element={<Settings />} />
          <Route path="about" element={<About />} />
          <Route path="admin" element={<Protected admin><Admin /></Protected>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
