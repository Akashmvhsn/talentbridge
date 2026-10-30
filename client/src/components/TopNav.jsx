import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUi } from '../context/UiContext.jsx';
import { Wordmark } from './Brand.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Avatar from './Avatar.jsx';
import { NAV_ITEMS } from './BottomNav.jsx';

// Desktop navigation; phones use BottomNav instead
export default function TopNav() {
  const { user } = useAuth();
  const { saved } = useUi();
  const savedCount = Object.keys(saved).length;
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" aria-label="TalentBridge home"><Wordmark /></Link>
        <nav className="topnav-links">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `toplink${isActive ? ' active' : ''}`}>
              <Icon size={17} /> {label}
              {to === '/saved' && savedCount > 0 && <span className="count">{savedCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="row gap-sm">
          <ThemeToggle />
          <Link to="/profile" className="nav-avatar" aria-label="Your profile">
            <Avatar name={user.name} size={38} />
          </Link>
        </div>
      </div>
    </header>
  );
}
