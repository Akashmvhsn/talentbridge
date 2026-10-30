import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import TopNav from './components/TopNav.jsx';
import BottomNav from './components/BottomNav.jsx';
import Login from './pages/Login.jsx';
import Explore from './pages/Explore.jsx';
import MyOpenings from './pages/MyOpenings.jsx';
import Saved from './pages/Saved.jsx';
import Profile from './pages/Profile.jsx';
import { Logo } from './components/Brand.jsx';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="splash">
        <Logo size={56} />
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <>
      <TopNav />
      <main className="page">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // after sign-in, return to the page (e.g. a shared ?job= link) that sent us to /login
  const from = location.state?.from;
  const back = from ? `${from.pathname}${from.search}` : '/';
  return (
    <Routes>
      <Route path="/login" element={!loading && user ? <Navigate to={back} replace /> : <Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Explore />} />
        <Route path="/my-posts" element={<MyOpenings />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
