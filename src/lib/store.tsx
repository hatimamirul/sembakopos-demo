import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { seed, type State } from "./pos";

const KEY = "sembakopos-demo-v1";
type Ctx = { state: State; setState: (s: State) => void; reset: () => void };
const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, set] = useState<State>(() => seed());
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw));
    } catch {
      /* data rusak: pakai sampel */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);
  const reset = () => set(seed());
  return <C.Provider value={{ state, setState: set, reset }}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
