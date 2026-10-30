import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

const UiContext = createContext(null);
export const useUi = () => useContext(UiContext);

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable: keep in memory only */
  }
};

// Theme, saved openings (kept on this device) and toast notifications
export function UiProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'system');
  const [saved, setSaved] = useState(() => read('tb_saved', {}));
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      delete root.dataset.theme;
      try { localStorage.removeItem('tb_theme'); } catch { /* ignore */ }
    } else {
      root.dataset.theme = theme;
      try { localStorage.setItem('tb_theme', theme); } catch { /* ignore */ }
    }
  }, [theme]);

  useEffect(() => write('tb_saved', saved), [saved]);

  const toast = useCallback((message, kind = 'success') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const isSaved = useCallback((id) => !!saved[id], [saved]);
  const toggleSaved = useCallback(
    (o) => {
      const wasSaved = !!saved[o._id];
      setSaved((s) => {
        const next = { ...s };
        if (next[o._id]) delete next[o._id];
        else {
          const { _id, title, company, location, workMode, employmentType, placementCount, createdAt, requirements } = o;
          next[o._id] = { _id, title, company, location, workMode, employmentType, placementCount, createdAt, requirements, savedAt: Date.now() };
        }
        return next;
      });
      toast(wasSaved ? 'Removed from saved' : 'Saved for later', wasSaved ? 'info' : 'success');
    },
    [saved, toast]
  );
  const removeSaved = useCallback((id) => setSaved((s) => { const n = { ...s }; delete n[id]; return n; }), []);

  const icons = { success: CheckCircle2, error: XCircle, info: Info };

  return (
    <UiContext.Provider value={{ theme, setTheme, saved, isSaved, toggleSaved, removeSaved, toast }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.kind] || Info;
          return (
            <div key={t.id} className={`toast ${t.kind}`}>
              <Icon size={18} /> {t.message}
            </div>
          );
        })}
      </div>
    </UiContext.Provider>
  );
}
