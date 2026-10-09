import { useCallback, useEffect, useState } from "react";

const current = () => document.documentElement.dataset.theme || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export function useTheme() {
  const [theme, setTheme] = useState(current);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try { localStorage.setItem("ea-theme", next); } catch { /* ignore */ }
      return next;
    });
  }, []);
  return { theme, toggle };
}
