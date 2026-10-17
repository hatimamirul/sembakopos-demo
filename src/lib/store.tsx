import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { seed, type State } from "./pos";
import { loadState, persistState } from './persistence';
import { defaultProfile, defaultReceipt } from './settings';
type Ctx = { state: State; setState: (s: State) => boolean; reset: () => void; storageError: string; ready: boolean };
const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, set] = useState<State>(() => seed());
  const [ready, setReady] = useState(false);
  const [storageError, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    try {
      set(loadState(localStorage));
    } catch {
      setBlocked(true);
      setError('Data browser tidak dapat dibaca. Data asli tidak ditimpa. Coba buka kembali browser atau simpan salinan data sebelum melanjutkan.');
    }
    setReady(true);
  }, []);
  const setState = (next: State) => {
    if (!ready || blocked) return false;
    const result = persistState(localStorage, next);
    if (!result.ok) { setError(result.error); return false; }
    set(next); setError(''); return true;
  };
  const reset = () => { setState({ ...seed(), profile: state.profile ?? defaultProfile, receipt: state.receipt ?? defaultReceipt }); };
  return <C.Provider value={{ state, setState, reset, storageError, ready: ready && !blocked }}>{ready ? children : <p className="p-5 text-muted-foreground">Memuat data browser…</p>}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
