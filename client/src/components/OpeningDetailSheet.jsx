import { useEffect, useState } from 'react';
import {
  BadgeCheck, Bookmark, Briefcase, Building2, Check, Clock, ExternalLink, Eye, Link2, Mail, MapPin, Pencil, Phone, Sparkles, Trash2,
} from 'lucide-react';
import Sheet from './Sheet.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../api/client.js';
import { useUi } from '../context/UiContext.jsx';
import { timeAgo } from '../lib/format.js';

export default function OpeningDetailSheet({ id, onClose, onEdit, onChanged }) {
  const { isSaved, toggleSaved, toast } = useUi();
  const [o, setO] = useState(null);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    api.get(`/openings/${id}`).then((d) => setO(d.opening)).catch((e) => setError(e.message));
  }, [id]);

  const signal = (type) => api.post(`/openings/${id}/signal`, { type }).catch(() => {});

  const revealPhone = async () => {
    try {
      const d = await api.post(`/openings/${id}/reveal-phone`);
      setPhone(d.phone);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const confirmPlacement = async () => {
    try {
      const d = await api.post(`/openings/${id}/placements`);
      setO((x) => ({ ...x, hasPlaced: true, placementCount: d.placementCount }));
      toast('Placement confirmed — thank you!');
      onChanged?.();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this opening? This cannot be undone.')) return;
    try {
      await api.del(`/openings/${id}`);
      toast('Opening deleted', 'info');
      onChanged?.();
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/?job=${id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${o.title} at ${o.company}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied to clipboard');
      }
    } catch {
      /* user dismissed share dialog */
    }
  };

  const actions = o && (
    <>
      <button className="icon-btn" onClick={share} aria-label="Share opening" title="Share"><Link2 size={17} /></button>
      {!o.isOwner && (
        <button
          className={`icon-btn${isSaved(o._id) ? ' saved' : ''}`}
          onClick={() => toggleSaved(o)}
          aria-label={isSaved(o._id) ? 'Remove from saved' : 'Save opening'}
          title="Save"
        >
          <Bookmark size={17} />
        </button>
      )}
    </>
  );

  return (
    <Sheet title="Role details" onClose={onClose} actions={actions}>
      {!o && !error && (
        <div className="detail-loading">
          <span className="sk sk-hero" />
          <span className="sk sk-line w80" />
          <span className="sk sk-line w60" />
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {o && (
        <>
          <div className="hero">
            <div className="row gap">
              <Avatar name={o.company} size={56} square />
              <div>
                <h3>{o.title}</h3>
                <p>{o.company}</p>
              </div>
            </div>
            <div className="chips">
              <span><Briefcase size={13} /> {o.employmentType}</span>
              <span><Building2 size={13} /> {o.workMode}</span>
              <span><MapPin size={13} /> {o.location}</span>
              <span><Clock size={13} /> {timeAgo(o.createdAt)}</span>
            </div>
            {o.placementCount > 0 && (
              <p className="hero-trust"><BadgeCheck size={15} /> {o.placementCount} people were hired through this referral</p>
            )}
          </div>

          {o.description && (
            <section>
              <h4>About the role</h4>
              <p className="body">{o.description}</p>
            </section>
          )}

          {o.requirements.length > 0 && (
            <section>
              <h4>What you’ll bring</h4>
              <ul className="checks">
                {o.requirements.map((r) => (
                  <li key={r}><span className="check"><Check size={13} /></span> {r}</li>
                ))}
              </ul>
            </section>
          )}

          {o.companySpecificRequirements && (
            <section>
              <h4>Company-specific requirements</h4>
              <p className="body callout">{o.companySpecificRequirements}</p>
            </section>
          )}

          <section className="contact-card">
            <div className="row gap">
              <Avatar name={o.postedBy?.name} size={46} />
              <div className="grow">
                <p className="eyebrow-sm">Shared by</p>
                <h4 className="flush">{o.postedBy?.name}</h4>
                <p className="muted small">{[o.postedBy?.role, o.postedBy?.company].filter(Boolean).join(' · ')}</p>
              </div>
            </div>

            <div className="contact-actions">
              <a
                className="btn"
                href={`mailto:${o.contactEmail}?subject=${encodeURIComponent(`Interested in ${o.title} at ${o.company}`)}`}
                onClick={() => signal('email')}
              >
                <Mail size={16} /> Email {o.postedBy?.name?.split(' ')[0]}
              </a>
              {o.applicationLink && (
                <a
                  className="btn secondary"
                  href={o.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => signal('apply')}
                >
                  <ExternalLink size={16} /> Apply
                </a>
              )}
            </div>
            {o.hasPhone && !o.isOwner && !phone && (
              <button className="btn ghost full" onClick={revealPhone}><Eye size={16} /> Reveal phone number</button>
            )}
            {phone && <a className="btn ghost full" href={`tel:${phone}`}><Phone size={16} /> {phone}</a>}
            {!o.hasPhone && <p className="muted small center-text mt">No phone shared — reach out by email</p>}
          </section>

          {o.isOwner ? (
            <section className="divider">
              <div className="row gap">
                <button className="btn secondary" onClick={() => onEdit(o)}><Pencil size={16} /> Edit opening</button>
                <button className="btn danger" onClick={remove}><Trash2 size={16} /> Delete</button>
              </div>
            </section>
          ) : (
            <section className="divider placement">
              <div className="placement-icon"><Sparkles size={20} /></div>
              <div className="grow">
                <h4 className="flush">Did you get this job?</h4>
                <p className="muted small">Confirming a placement helps the community spot trusted listers.</p>
              </div>
              <button className="btn secondary" onClick={confirmPlacement} disabled={o.hasPlaced}>
                {o.hasPlaced ? <><Check size={16} /> Confirmed</> : 'Confirm'}
              </button>
            </section>
          )}
        </>
      )}
    </Sheet>
  );
}
