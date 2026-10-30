import { useRef, useState } from 'react';
import { FileUp, Loader2, Sparkles, X } from 'lucide-react';
import Sheet from './Sheet.jsx';
import { api } from '../api/client.js';
import { useUi } from '../context/UiContext.jsx';

const MODES = ['Remote', 'Hybrid', 'On-site'];
const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const splitSkills = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

// `initial` present -> edit mode, otherwise create mode
export default function OpeningFormSheet({ initial, onClose, onSaved }) {
  const { toast } = useUi();
  const [form, setForm] = useState({
    title: initial?.title || '',
    company: initial?.company || '',
    location: initial?.location || '',
    workMode: initial?.workMode || 'Remote',
    employmentType: initial?.employmentType || 'Full-time',
    description: initial?.description || '',
    requirements: (initial?.requirements || []).join(', '),
    companySpecificRequirements: initial?.companySpecificRequirements || '',
    applicationLink: initial?.applicationLink || '',
    contactEmail: initial?.contactEmail || '',
    contactPhone: initial?.contactPhone || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [parsing, setParsing] = useState(false);
  const [note, setNote] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pick = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Upload a JD -> server extracts fields -> merge into the form (user reviews before saving)
  const parseFile = async (file) => {
    if (!file) return;
    setError('');
    setNote('');
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { fields } = await api.upload('/openings/parse-jd', fd);
      setForm((f) => {
        const next = { ...f };
        Object.entries(fields).forEach(([k, v]) => {
          const val = Array.isArray(v) ? v.join(', ') : v;
          if (val) next[k] = val; // only overwrite when the JD actually had a value
        });
        return next;
      });
      setNote(`Filled what we found in ${file.name}. Review and complete the rest before saving.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file
    parseFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    parseFile(e.dataTransfer.files[0]);
  };

  const removeSkill = (skill) => pick('requirements', splitSkills(form.requirements).filter((s) => s !== skill).join(', '));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (initial) await api.put(`/openings/${initial._id}`, form);
      else await api.post('/openings', form);
      toast(initial ? 'Opening updated' : 'Opening published 🎉');
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const skills = splitSkills(form.requirements);

  return (
    <Sheet
      title={initial ? 'Edit opening' : 'Share an opening'}
      subtitle={initial ? 'Keep details accurate for candidates' : 'Help someone make a confident move'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form">
        {!initial && (
          <div
            className={`dropzone${dragging ? ' drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !parsing && fileRef.current.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={onFile} hidden />
            <div className="dz-icon">{parsing ? <Loader2 size={22} className="spin" /> : <FileUp size={22} />}</div>
            <div>
              <strong>{parsing ? 'Reading your JD…' : 'Auto-fill from a job description'}</strong>
              <p className="muted small">Drop a PDF, DOCX or TXT here, or click to browse</p>
            </div>
          </div>
        )}
        {note && <p className="note"><Sparkles size={15} /> {note}</p>}

        <fieldset>
          <legend>The role</legend>
          <label htmlFor="f-title">Role title</label>
          <input id="f-title" value={form.title} onChange={set('title')} placeholder="e.g. Senior Product Designer" required />

          <div className="grid-2">
            <div>
              <label htmlFor="f-company">Company</label>
              <input id="f-company" value={form.company} onChange={set('company')} placeholder="Company hiring" required />
            </div>
            <div>
              <label htmlFor="f-location">Location</label>
              <input id="f-location" value={form.location} onChange={set('location')} placeholder="City, country or timezone" required />
            </div>
          </div>

          <label>Work mode</label>
          <div className="segmented">
            {MODES.map((m) => (
              <button type="button" key={m} className={form.workMode === m ? 'on' : ''} onClick={() => pick('workMode', m)}>{m}</button>
            ))}
          </div>

          <label>Employment type</label>
          <div className="segmented four">
            {TYPES.map((t) => (
              <button type="button" key={t} className={form.employmentType === t ? 'on' : ''} onClick={() => pick('employmentType', t)}>{t}</button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Details</legend>
          <label htmlFor="f-desc">Description</label>
          <textarea id="f-desc" value={form.description} onChange={set('description')} placeholder="What will this person work on? What's the team like?" />

          <label htmlFor="f-req">Requirements</label>
          <input id="f-req" value={form.requirements} onChange={set('requirements')} placeholder="Comma-separated, e.g. React, 3+ years, SQL" />
          {skills.length > 0 && (
            <div className="skill-chips">
              {skills.map((s) => (
                <span key={s} className="chip">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} aria-label={`Remove ${s}`}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}

          <label htmlFor="f-csr">Company-specific requirements</label>
          <textarea id="f-csr" value={form.companySpecificRequirements} onChange={set('companySpecificRequirements')} placeholder="Anything unique your company needs?" />
        </fieldset>

        <fieldset>
          <legend>How to reach you</legend>
          <label htmlFor="f-link">Application link</label>
          <input id="f-link" type="url" value={form.applicationLink} onChange={set('applicationLink')} placeholder="https://..." />
          <div className="grid-2">
            <div>
              <label htmlFor="f-email">Contact email</label>
              <input id="f-email" type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="you@company.com" required />
            </div>
            <div>
              <label htmlFor="f-phone">Phone <span className="muted">(optional)</span></label>
              <input id="f-phone" value={form.contactPhone} onChange={set('contactPhone')} placeholder="Hidden until revealed" />
            </div>
          </div>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <div className="row gap actions sticky-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Publish opening'}</button>
        </div>
      </form>
    </Sheet>
  );
}
