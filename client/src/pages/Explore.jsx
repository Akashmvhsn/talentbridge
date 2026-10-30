import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, Building2, Briefcase, LayoutGrid, List, Plus, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import OpeningCard from '../components/OpeningCard.jsx';
import OpeningDetailSheet from '../components/OpeningDetailSheet.jsx';
import OpeningFormSheet from '../components/OpeningFormSheet.jsx';
import SkeletonCards from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

const MODES = [
  { label: 'All', value: '' },
  { label: 'Remote', value: 'Remote' },
  { label: 'Hybrid', value: 'Hybrid' },
  { label: 'On-site', value: 'On-site' },
];
const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const SORTS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Most trusted', value: 'trusted' },
  { label: 'Oldest first', value: 'oldest' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const readView = () => {
  try { return localStorage.getItem('tb_view') || 'grid'; } catch { return 'grid'; }
};

export default function Explore() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState(readView);
  const [showFilters, setShowFilters] = useState(false);
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null | {} (create) | opening (edit)

  // ?job=<id> deep link opens the detail drawer (used by "Share")
  const selectedId = params.get('job');
  const select = (id) => setParams(id ? { job: id } : {}, { replace: !id });

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (mode) p.set('workMode', mode);
    if (type) p.set('employmentType', type);
    if (sort !== 'newest') p.set('sort', sort);
    return api
      .get(`/openings?${p}`)
      .then((d) => { setOpenings(d.openings); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, mode, type, sort]);

  // debounce search typing
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const changeView = (v) => {
    setView(v);
    try { localStorage.setItem('tb_view', v); } catch { /* ignore */ }
  };

  const stats = useMemo(() => ({
    companies: new Set(openings.map((o) => o.company.toLowerCase())).size,
    hires: openings.reduce((n, o) => n + (o.placementCount || 0), 0),
  }), [openings]);

  const activeCount = [q, mode, type].filter(Boolean).length + (sort !== 'newest' ? 1 : 0);
  const clearAll = () => { setQ(''); setMode(''); setType(''); setSort('newest'); };

  return (
    <>
      <section className="explore-hero">
        <div className="hero-text">
          <p className="eyebrow light">{greeting()}, {user.name.split(' ')[0]} 👋</p>
          <h1>Find your next good move.</h1>
          <p className="lead">Openings shared by people who know the team — reach them directly.</p>
        </div>
        <div className="hero-stats">
          <div><Briefcase size={18} /><strong>{loading ? '–' : openings.length}</strong><span>open roles</span></div>
          <div><Building2 size={18} /><strong>{loading ? '–' : stats.companies}</strong><span>companies</span></div>
          <div><BadgeCheck size={18} /><strong>{loading ? '–' : stats.hires}</strong><span>verified hires</span></div>
        </div>
        <button className="btn light hero-cta" onClick={() => setForm({})}><Plus size={18} /> Share an opening</button>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </section>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles, companies, skills or places" aria-label="Search openings" />
          {q && <button className="clear" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
        </div>
        <button className={`btn secondary filter-toggle${showFilters ? ' on' : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={16} /> Filters {activeCount > 0 && <span className="count">{activeCount}</span>}
        </button>
      </div>

      <div className={`filter-panel${showFilters ? ' open' : ''}`}>
        <div className="filter-group">
          <span className="filter-label">Work mode</span>
          <div className="pills">
            {MODES.map((m) => (
              <button key={m.label} className={mode === m.value ? 'on' : ''} onClick={() => setMode(m.value)}>{m.label}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Employment type</span>
          <div className="pills">
            <button className={!type ? 'on' : ''} onClick={() => setType('')}>Any</button>
            {TYPES.map((t) => (
              <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="results-head">
        <div>
          <h2>{q || mode || type ? 'Matching openings' : 'Latest openings'}</h2>
          <p className="muted small">
            {loading ? 'Loading…' : `${openings.length} ${openings.length === 1 ? 'role' : 'roles'} found`}
            {activeCount > 0 && <> · <button className="link" onClick={clearAll}>Clear filters</button></>}
          </p>
        </div>
        <div className="row gap-sm">
          <select className="select-sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort openings">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="view-toggle" role="group" aria-label="Layout">
            <button className={view === 'grid' ? 'on' : ''} onClick={() => changeView('grid')} aria-label="Grid view"><LayoutGrid size={16} /></button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => changeView('list')} aria-label="List view"><List size={16} /></button>
          </div>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className={`list ${view === 'list' ? 'rows' : 'grid'}`}><SkeletonCards /></div>
      ) : openings.length === 0 ? (
        <EmptyState icon={SearchX} title="No openings match" text="Try a different search, or loosen your filters.">
          {activeCount > 0 && <button className="btn secondary" onClick={clearAll}>Clear all filters</button>}
        </EmptyState>
      ) : (
        <div className={`list ${view === 'list' ? 'rows' : 'grid'}`}>
          {openings.map((o, i) => (
            <div className="fade-up" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }} key={o._id}>
              <OpeningCard opening={o} onClick={() => select(o._id)} />
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setForm({})} aria-label="Share an opening"><Plus size={24} /></button>

      {selectedId && (
        <OpeningDetailSheet
          id={selectedId}
          onClose={() => select(null)}
          onChanged={load}
          onEdit={(o) => { select(null); setForm(o); }}
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
