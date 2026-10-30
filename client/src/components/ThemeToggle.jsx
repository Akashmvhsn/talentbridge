import { Monitor, Moon, Sun } from 'lucide-react';
import { useUi } from '../context/UiContext.jsx';

const ORDER = ['system', 'light', 'dark'];
const ICONS = { system: Monitor, light: Sun, dark: Moon };

export default function ThemeToggle() {
  const { theme, setTheme } = useUi();
  const Icon = ICONS[theme];
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  return (
    <button
      className="icon-btn ghost"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      title={`Theme: ${theme}`}
    >
      <Icon size={18} />
    </button>
  );
}
