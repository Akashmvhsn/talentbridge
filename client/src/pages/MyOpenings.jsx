import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Briefcase, PenSquare, Plus, TrendingUp } from 'lucide-react';
import { api } from '../api/client.js';
import OpeningCard from '../components/OpeningCard.jsx';
import OpeningDetailSheet from '../components/OpeningDetailSheet.jsx';
import OpeningFormSheet from '../components/OpeningFormSheet.jsx';
import SkeletonCards from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function MyOpenings() {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);

  const load = useCallback(() => {
    api
      .get('/openings/mine')
      .then((d) => setOpenings(d.openings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const hires = openings.reduce((n, o) => n + (o.placementCount || 0), 0);
  const remote = openings.filter((o) => o.workMode === 'Remote').length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>My openings</h1>
          <p className="muted">Keep your shared opportunities accurate and current.</p>
        </div>
        <button className="btn" onClick={() => setForm({})}><Plus size={18} /> New opening</button>
      </header>

      {openings.length > 0 && (
        <div className="stat-row">
          <div className="stat-tile"><span className="stat-icon"><Briefcase size={18} /></span><strong>{openings.length}</strong><span>openings shared</span></div>
          <div className="stat-tile"><span className="stat-icon"><BadgeCheck size={18} /></span><strong>{hires}</strong><span>verified hires</span></div>
          <div className="stat-tile"><span className="stat-icon"><TrendingUp size={18} /></span><strong>{remote}</strong><span>remote roles</span></div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className="list grid"><SkeletonCards count={3} /></div>
      ) : openings.length === 0 ? (
        <EmptyState icon={PenSquare} title="Your first opening is waiting" text="Give someone the context they need to make a confident move. Upload a JD and we’ll fill in the details.">
          <button className="btn" onClick={() => setForm({})}><Plus size={18} /> Create opening</button>
        </EmptyState>
      ) : (
        <div className="list grid">
          {openings.map((o) => (
            <OpeningCard key={o._id} opening={o} showSave={false} onClick={() => setSelectedId(o._id)} />
          ))}
        </div>
      )}

      {selectedId && (
        <OpeningDetailSheet
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
          onEdit={(o) => { setSelectedId(null); setForm(o); }}
        />
      )}
      {form && (
        <OpeningFormSheet
          initial={form._id ? form : undefined}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); load(); }}
        />
      )}
    </>
  );
}
