import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Avatar from './Avatar';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme, t } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        api.get('/notifications/unread-count'),
        api.get('/messages/unread'),
      ]);
      setUnreadNotif(notifRes.data.count);
      setUnreadMsg(msgRes.data.count);
    } catch {}
  };

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(r.data); setShowResults(true);
      } catch {}
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (location.pathname === '/notifications') setUnreadNotif(0);
    if (location.pathname.startsWith('/messages')) setUnreadMsg(0);
  }, [location.pathname]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}&type=all&pet_type=all`);
      setQuery('');
    }
  };

  const p = location.pathname;

  return (
    <>
      {/* ── Top navbar: logo + search only ── */}
      <nav className="navbar">
        <Link to="/" className="navbar-logo">◉ PetCircle</Link>

        <div className="navbar-search-wrap" style={{ position: 'relative', flex: 1, maxWidth: 380 }} ref={searchRef}>
          <div className="navbar-search">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ color: 'var(--text3)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('searchPlaceholder')}
              onFocus={() => results.length > 0 && setShowResults(true)}
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="search-results">
              {results.slice(0, 5).map(u => (
                <div key={u.id} className="search-result-item" onClick={() => { navigate(`/${u.username}`); setQuery(''); setShowResults(false); }}>
                  <Avatar user={u} size={36} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.full_name} · {petIcon(u.pet_type)} {u.pet_name}</div>
                  </div>
                </div>
              ))}
              <div
                className="search-result-item"
                style={{ borderTop: '1px solid var(--border2)', color: 'var(--pink)', fontSize: 13, fontWeight: 600, justifyContent: 'center' }}
                onClick={() => { navigate(`/search?q=${encodeURIComponent(query)}&type=all&pet_type=all`); setQuery(''); setShowResults(false); }}
              >
                {t('searchAll')}
              </div>
            </div>
          )}
        </div>

        {/* Mobile-only: notification badge in top bar */}
        <div className="navbar-mobile-icons">
          <Link to="/notifications" style={{ position: 'relative', display: 'flex' }}>
            <button className="nav-btn">
              <svg fill={p === '/notifications' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="22" height="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadNotif > 0 && <span className="notif-badge">{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Desktop left sidebar ── */}
      <nav className="desktop-sidebar">
        <div className="sidebar-nav">
          <SidebarItem to="/" active={p === '/'} label={t('home')}>
            <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={p === '/' ? 'currentColor' : 'none'}/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </SidebarItem>
          <SidebarItem to="/explore" active={p === '/explore'} label={t('explore')}>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </SidebarItem>
          <SidebarItem to="/reels" active={p === '/reels'} label={t('reels')}>
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill={p === '/reels' ? 'currentColor' : 'none'}/></svg>
          </SidebarItem>
          <SidebarItem to="/match" active={p === '/match'} label={t('match')}>
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={p === '/match' ? 'currentColor' : 'none'}/></svg>
          </SidebarItem>
          <SidebarItem to="/messages" active={p.startsWith('/messages')} label={t('messages')} badge={unreadMsg}>
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={p.startsWith('/messages') ? 'currentColor' : 'none'}/></svg>
          </SidebarItem>
          <SidebarItem to="/notifications" active={p === '/notifications'} label={t('notifications')} badge={unreadNotif}>
            <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={p === '/notifications' ? 'currentColor' : 'none'}/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </SidebarItem>

          <Link to="/new" className="sidebar-new-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>{t('newPost')}</span>
          </Link>

          <div className="sidebar-divider" />

          <SidebarItem to="/trending" active={p === '/trending'} label={t('trending')}>
            <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </SidebarItem>
          <SidebarItem to="/stats" active={p === '/stats'} label={t('stats')}>
            <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
          </SidebarItem>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-divider" style={{ margin: '0 12px 6px' }} />
          <Link to={`/${user?.username}`} className={`sidebar-item${p === `/${user?.username}` ? ' active' : ''}`}>
            <Avatar user={user} size={24} />
            <span>{t('profile')}</span>
          </Link>
          <button className="sidebar-item sidebar-theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>
          <button className="sidebar-item sidebar-logout" onClick={logout}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>{t('logout')}</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="mobile-tab-bar">
        <MobileTab to="/" active={p === '/'}>
          <svg fill={p === '/' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </MobileTab>
        <MobileTab to="/explore" active={p === '/explore'}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </MobileTab>
        <MobileTab to="/new" active={p === '/new'} center>
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </MobileTab>
        <MobileTab to="/match" active={p === '/match'}>
          <svg fill={p === '/match' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </MobileTab>
        <MobileTab to="/reels" active={p === '/reels'}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </MobileTab>
        <MobileTab to={`/${user?.username}`} active={p === `/${user?.username}`}>
          {p === `/${user?.username}` ? (
            <Avatar user={user} size={28} />
          ) : (
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          )}
        </MobileTab>
      </nav>
    </>
  );
}

function SidebarItem({ to, active, label, badge, children }) {
  return (
    <Link to={to} className={`sidebar-item${active ? ' active' : ''}`}>
      {children}
      <span>{label}</span>
      {badge > 0 && <span className="sidebar-badge">{badge > 9 ? '9+' : badge}</span>}
    </Link>
  );
}

function MobileTab({ to, active, center, children }) {
  return (
    <Link to={to} className={`mobile-tab${active ? ' active' : ''}${center ? ' mobile-tab-center' : ''}`}>
      {children}
    </Link>
  );
}

function petIcon(type) {
  return type === 'cat' ? '🐱' : type === 'dog' ? '🐶' : '🐾';
}
