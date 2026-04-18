import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookmarkIcon, SearchIcon, LayersIcon, LogOutIcon, UserIcon, CalendarClockIcon } from 'lucide-react';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function MainLayout() {
  const { savedVideos, user, logout } = useContext(AppContext);
  const location = useLocation();
  
  return (
    <div className="layout-container">
      <nav className="top-nav">
        <div className="logo">
          <LayersIcon className="icon-glow" /> <span>TrendCatcher</span>
        </div>
        <div className="nav-links">
          {user && <span style={{display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginRight: '0.5rem'}}><UserIcon size={16}/> Olá, {user.name.split(' ')[0]}</span>}
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
             <SearchIcon size={18} /> Busca IA
          </Link>
          <Link to="/saved" className={`nav-link has-badge ${location.pathname === '/saved' ? 'active' : ''}`}>
             <BookmarkIcon size={18} /> Meus Salvos
             {savedVideos.length > 0 && <span className="badge">{savedVideos.length}</span>}
          </Link>
          <Link to="/schedule" className={`nav-link ${location.pathname === '/schedule' ? 'active' : ''}`}>
             <CalendarClockIcon size={18} /> Calendário
          </Link>
          {user && (
              <button onClick={logout} className="nav-link" style={{background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', color: '#ff4d6d'}}>
                 <LogOutIcon size={18} /> Sair
              </button>
          )}
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
