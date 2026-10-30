import { NavLink } from 'react-router-dom';
import { Compass, Briefcase, Bookmark, User } from 'lucide-react';
import { useUi } from '../context/UiContext.jsx';

export const NAV_ITEMS = [
  { to: '/', label: 'Explore', icon: Compass, end: true },
  { to: '/my-posts', label: 'My posts', icon: Briefcase },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
];

// Floating pill nav for phones
export default function BottomNav() {
  const { saved } = useUi();
  const savedCount = Object.keys(saved).length;
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">
            <Icon size={20} />
            {to === '/saved' && savedCount > 0 && <span className="dot">{savedCount}</span>}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
