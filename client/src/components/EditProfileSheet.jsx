import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUi } from '../context/UiContext.jsx';

export default function EditProfileSheet({ onClose }) {
  const { user, setUser } = useAuth();
  const { toast } = useUi();
  const [form, setForm] = useState({
    name: user.name || '',
    company: user.company || '',
    role: user.role || '',
    phone: user.phone || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const d = await api.put('/users/me', form);
      setUser(d.user);
      toast('Profile updated');
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Sheet title="Edit profile" subtitle="This is what candidates see on your openings" onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label htmlFor="p-name">Full name</label>
        <input id="p-name" value={form.name} onChange={set('name')} required />
        <div className="grid-2">
          <div>
            <label htmlFor="p-company">Company</label>
            <input id="p-company" value={form.company} onChange={set('company')} />
          </div>
          <div>
            <label htmlFor="p-role">Role</label>
            <input id="p-role" value={form.role} onChange={set('role')} />
          </div>
        </div>
        <label htmlFor="p-phone">Phone</label>
        <input id="p-phone" value={form.phone} onChange={set('phone')} />
        {error && <p className="error">{error}</p>}
        <div className="row gap actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </form>
    </Sheet>
  );
}
