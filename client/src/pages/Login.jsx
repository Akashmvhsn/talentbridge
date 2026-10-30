import { useState } from 'react';
import { BadgeCheck, Eye, EyeOff, Mail, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Wordmark } from '../components/Brand.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const FEATURES = [
  { icon: Users, title: 'Shared by real employees', text: 'Every opening comes from someone who works on the team.' },
  { icon: Mail, title: 'Talk to a human', text: 'Email the referrer directly — no black-hole applications.' },
  { icon: BadgeCheck, title: 'Verified placements', text: 'See which listers have actually helped people get hired.' },
];

const DEMO = { email: 'asha@northstarlabs.com', password: 'Password123' };

export default function Login() {
  const { login, register } = useAuth();
  const [signup, setSignup] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', role: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => (signup ? register(form) : login(form.email, form.password)));
  };

  const tryDemo = () => {
    setSignup(false);
    setForm((f) => ({ ...f, ...DEMO }));
    run(() => login(DEMO.email, DEMO.password));
  };

  const switchTo = (s) => { setSignup(s); setError(''); };

  return (
    <div className="auth-split">
      <aside className="auth-brand">
        <div className="auth-brand-inner">
          <Wordmark />
          <div>
            <p className="eyebrow light"><Sparkles size={14} /> Referral-first job board</p>
            <h1>Trusted roles start with people.</h1>
            <p className="lead">Find openings shared by real employees — not anonymous listings — and reach the person who knows the team.</p>
          </div>
          <ul className="feature-list">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="feature-icon"><Icon size={18} /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="auth-foot"><ShieldCheck size={15} /> Phone numbers stay hidden until you choose to reveal them.</p>
        </div>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </aside>

      <section className="auth-panel">
        <div className="auth-top">
          <span className="mobile-only"><Wordmark /></span>
          <ThemeToggle />
        </div>

        <div className="auth-form-wrap">
          <h2 className="auth-title">{signup ? 'Create your profile' : 'Welcome back'}</h2>
          <p className="muted">{signup ? 'Share openings and help people land great roles.' : 'Sign in to explore openings from your network.'}</p>

          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={!signup} className={!signup ? 'on' : ''} onClick={() => switchTo(false)}>Sign in</button>
            <button role="tab" aria-selected={signup} className={signup ? 'on' : ''} onClick={() => switchTo(true)}>Create profile</button>
            <span className="tab-ink" style={{ transform: `translateX(${signup ? 100 : 0}%)` }} />
          </div>

          <form onSubmit={submit} className="form">
            {signup && (
              <>
                <label htmlFor="a-name">Full name</label>
                <input id="a-name" value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" required />
                <div className="grid-2">
                  <div>
                    <label htmlFor="a-company">Company</label>
                    <input id="a-company" value={form.company} onChange={set('company')} placeholder="Where you work" autoComplete="organization" />
                  </div>
                  <div>
                    <label htmlFor="a-role">Role</label>
                    <input id="a-role" value={form.role} onChange={set('role')} placeholder="Your job title" autoComplete="organization-title" />
                  </div>
                </div>
              </>
            )}
            <label htmlFor="a-email">Email</label>
            <input id="a-email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" autoComplete="email" required />
            <label htmlFor="a-pw">Password</label>
            <div className="pw-field">
              <input
                id="a-pw"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                minLength={8}
                autoComplete={signup ? 'new-password' : 'current-password'}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="error">{error}</p>}
            <button className="btn full lg" disabled={busy}>
              {busy ? 'Please wait…' : signup ? 'Create profile' : 'Sign in'}
            </button>
          </form>

          <div className="or"><span>or</span></div>
          <button type="button" className="btn secondary full" onClick={tryDemo} disabled={busy}>
            <Sparkles size={16} /> Explore with the demo account
          </button>
          <button className="btn ghost full" disabled title="Coming soon">Continue with Google · soon</button>
        </div>
      </section>
    </div>
  );
}
