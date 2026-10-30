import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass } from 'lucide-react';
import { useUi } from '../context/UiContext.jsx';
import OpeningCard from '../components/OpeningCard.jsx';
import OpeningDetailSheet from '../components/OpeningDetailSheet.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Openings bookmarked on this device
export default function Saved() {
  const { saved, removeSaved, toast } = useUi();
  const [selectedId, setSelectedId] = useState(null);
  const items = useMemo(() => Object.values(saved).sort((a, b) => b.savedAt - a.savedAt), [saved]);

  const clearAll = () => {
    if (!window.confirm('Remove all saved openings?')) return;
    items.forEach((o) => removeSaved(o._id));
    toast('Saved list cleared', 'info');
  };

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Shortlist</p>
          <h1>Saved openings</h1>
          <p className="muted">Roles you bookmarked to revisit. Stored on this device.</p>
        </div>
        {items.length > 0 && <button className="btn secondary" onClick={clearAll}>Clear all</button>}
      </header>

      {items.length === 0 ? (
        <EmptyState icon={Bookmark} title="Nothing saved yet" text="Tap the bookmark on any opening to keep it here for later.">
          <Link className="btn" to="/"><Compass size={18} /> Explore openings</Link>
        </EmptyState>
      ) : (
        <div className="list grid">
          {items.map((o) => (
            <OpeningCard key={o._id} opening={o} onClick={() => setSelectedId(o._id)} />
          ))}
        </div>
      )}

      {selectedId && (
        <OpeningDetailSheet id={selectedId} onClose={() => setSelectedId(null)} onEdit={() => setSelectedId(null)} />
      )}
    </>
  );
}
