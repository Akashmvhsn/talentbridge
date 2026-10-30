import { BadgeCheck, Bookmark, Briefcase, Clock, MapPin } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { useUi } from '../context/UiContext.jsx';
import { isNew, timeAgo } from '../lib/format.js';

const MODE_CLASS = { Remote: 'remote', Hybrid: 'hybrid', 'On-site': 'onsite' };

export default function OpeningCard({ opening, onClick, showSave = true, footer }) {
  const { isSaved, toggleSaved } = useUi();
  const saved = isSaved(opening._id);
  const skills = (opening.requirements || []).slice(0, 3);

  return (
    <article className="card opening-card" onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick?.()} tabIndex={0} role="button">
      <div className="oc-top">
        <Avatar name={opening.company} size={48} square />
        <div className="oc-title">
          <h3>{opening.title}</h3>
          <p className="company">
            {opening.company}
            {isNew(opening.createdAt) && <span className="new-tag">New</span>}
          </p>
        </div>
        {showSave && (
          <button
            className={`save-btn${saved ? ' on' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleSaved(opening); }}
            aria-label={saved ? 'Remove from saved' : 'Save opening'}
            aria-pressed={saved}
          >
            <Bookmark size={18} />
          </button>
        )}
      </div>

      <div className="tags">
        <span className={`tag mode ${MODE_CLASS[opening.workMode] || ''}`}>{opening.workMode}</span>
        <span className="tag"><Briefcase size={12} /> {opening.employmentType}</span>
        <span className="tag"><MapPin size={12} /> {opening.location}</span>
      </div>

      {skills.length > 0 && (
        <p className="skills">{skills.join(' · ')}</p>
      )}

      <div className="oc-foot">
        <span className="muted small row gap-xs"><Clock size={13} /> {timeAgo(opening.createdAt)}</span>
        {opening.placementCount > 0 ? (
          <span className="badge"><BadgeCheck size={14} /> {opening.placementCount} verified hire{opening.placementCount > 1 ? 's' : ''}</span>
        ) : opening.postedBy?.name ? (
          <span className="muted small">via {opening.postedBy.name.split(' ')[0]}</span>
        ) : null}
      </div>
      {footer}
    </article>
  );
}
