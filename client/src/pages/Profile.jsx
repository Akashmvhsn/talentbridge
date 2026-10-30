import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BadgeCheck, Bookmark, Briefcase, Building2, LogOut, Mail, Monitor, Moon, Pencil, Radio, Sun } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUi } from '../context/UiContext.jsx';
import EditProfileSheet from '../components/EditProfileSheet.jsx';
import Avatar from '../components/Avatar.jsx';
import { TRUST_LEVELS, timeAgo, trustLevel } from '../lib/format.js';

const THEMES = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme, saved } = useUi();
  const [stats, setStats] = useState({ verifiedPlacements: 0, communitySignals: 0, placements: [] });
  const [posted, setPosted] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get('/users/me/stats').then(setStats).catch(() => {});
    api.get('/openings/mine').then((d) => setPosted(d.count)).catch(() => {});
  }, []);

  const level = trustLevel(stats.verifiedPlacements);

  return (
    <>
      <section className="profile-hero">
        <div className="cover"><div className="orb orb-1" /><div className="orb orb-2" /></div>
        <div className="profile-main">
          <div className="avatar-ring"><Avatar name={user.name} size={96} /></div>
          <div className="grow">
            <h1>{user.name}</h1>
            <p className="profile-meta">
              {user.role && <span><Briefcase size={14} /> {user.role}</span>}
              {user.company && <span><Building2 size={14} /> {user.company}</span>}
              <span><Mail size={14} /> {user.email}</span>
            </p>
          </div>
          <button className="btn secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edit profile</button>
        </div>
      </section>

      <div className="stat-row four">
        <div className="stat-tile"><span className="stat-icon"><Briefcase size={18} /></span><strong>{posted}</strong><span>openings shared</span></div>
        <div className="stat-tile"><span className="stat-icon"><BadgeCheck size={18} /></span><strong>{stats.verifiedPlacements}</strong><span>verified placements</span></div>
        <div className="stat-tile"><span className="stat-icon"><Radio size={18} /></span><strong>{stats.communitySignals}</strong><span>community signals</span></div>
        <Link to="/saved" className="stat-tile"><span className="stat-icon"><Bookmark size={18} /></span><strong>{Object.keys(saved).length}</strong><span>saved roles</span></Link>
      </div>

      <div className="profile-grid">
        <div className="card trust-card">
          <div className="row gap">
            <span className="trust-badge"><Award size={22} /></span>
            <div>
              <p className="eyebrow-sm">Trust level</p>
              <h3>{level.name}</h3>
            </div>
          </div>
          <div className="meter" aria-label={`Progress to next level: ${Math.round(level.progress * 100)}%`}>
            <span style={{ width: `${Math.max(4, level.progress * 100)}%` }} />
          </div>
          <p className="muted small">
            {level.next
              ? `${level.next.min - stats.verifiedPlacements} more verified placement${level.next.min - stats.verifiedPlacements > 1 ? 's' : ''} to reach ${level.next.name}.`
              : 'Top level reached — thank you for helping people get hired!'}
          </p>
          <ol className="levels">
            {TRUST_LEVELS.map((l) => (
              <li key={l.name} className={stats.verifiedPlacements >= l.min ? 'done' : ''}>
                <span />{l.name}
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h3>Verified placements</h3>
          <p className="muted small">When someone lands a role through your openings, their confirmation appears here.</p>
          {stats.placements.length === 0 ? (
            <div className="placeholder-box">
              <BadgeCheck size={22} />
              <span>No confirmations yet — share an opening to get started.</span>
            </div>
          ) : (
            <ul className="placement-list">
              {stats.placements.map((p) => (
                <li key={p._id}>
                  <Avatar name={p.user?.name} size={38} />
                  <div className="grow">
                    <strong>{p.user?.name}</strong>
                    <p className="muted small">{p.opening?.title} · {p.opening?.company}</p>
                  </div>
                  <span className="muted small">{timeAgo(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Appearance</h3>
          <p className="muted small">Choose how TalentBridge looks on this device.</p>
          <div className="theme-picker">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button key={value} className={theme === value ? 'on' : ''} onClick={() => setTheme(value)}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Account</h3>
          <p className="muted small">Signed in as {user.email}</p>
          <button className="btn danger full" onClick={logout}><LogOut size={16} /> Sign out</button>
        </div>
      </div>

      {editing && <EditProfileSheet onClose={() => setEditing(false)} />}
    </>
  );
}
