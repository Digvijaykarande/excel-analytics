import { createContext, useContext, useState } from "react";

/** Holds a freshly-parsed, not-yet-saved dataset so the Workspace can open it without a server round-trip. */
const Ctx = createContext(null);
export const useLocalDataset = () => useContext(Ctx);

export function DatasetProvider({ children }) {
  const [local, setLocal] = useState(null); // { name, originalName, sizeBytes, sheets }
  return <Ctx.Provider value={{ local, setLocal }}>{children}</Ctx.Provider>;
}
