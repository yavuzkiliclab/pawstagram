import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import api from '../api/axios';
import BackButton from '../components/BackButton';

export default function Search() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [petType, setPetType] = useState(searchParams.get('pet_type') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const PET_FILTERS = [
    { label: t('all'), value: 'all' },
    { label: `🐱 ${t('cat')}`, value: 'cat' },
    { label: `🐶 ${t('dog')}`, value: 'dog' },
    { label: `🐾 ${t('other')}`, value: 'other' },
  ];

  const TYPE_FILTERS = [
    { label: t('allLabel'), value: 'all' },
    { label: `👤 ${t('usersLabel')}`, value: 'users' },
    { label: `📸 ${t('postsLabel')}`, value: 'posts' },
  ];

  useEffect(() => {
    inputRef.current?.focus();
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q, type, petType, location); }
  }, []);

  useEffect(() => {
    if (!query.trim()) { setUsers([]); setPosts([]); setSearched(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, type, petType, location);
    }, 320);
    return () => clearTimeout(debounceRef.current);
  }, [query, type, petType, location]);

  const doSearch = async (q, tp, pet, loc) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setSearchParams({ q, type: tp, pet_type: pet, location: loc });
    try {
      const promises = [];
      if (tp === 'all' || tp === 'users') {
        promises.push(api.get(`/users/search?q=${encodeURIComponent(q)}&pet_type=${pet}`));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }
      if (tp === 'all' || tp === 'posts') {
        const locParam = loc ? `&location=${encodeURIComponent(loc)}` : '';
        promises.push(api.get(`/posts/search?q=${encodeURIComponent(q)}&pet_type=${pet}${locParam}`));
      } else {
        promises.push(Promise.resolve({ data: { posts: [] } }));
      }
      const [usersRes, postsRes] = await Promise.all(promises);
      setUsers(usersRes.data || []);
      setPosts(postsRes.data?.posts || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query, type, petType, location);
  };

  const total = users.length + posts.length;

  return (
    <div className="search-page">
      <BackButton fallback="/" />
      <div className="search-hero">
        <form onSubmit={handleSubmit}>
          <div className="search-input-big">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ color: 'var(--text3)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchBigPlaceholder')}
              autoComplete="off"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setUsers([]); setPosts([]); setSearched(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '2px 4px', fontSize: 18, lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
        </form>

        <div className="search-filters">
          <div className="search-filter-group">
            {TYPE_FILTERS.map(f => (
              <button key={f.value} className={`search-filter-pill ${type === f.value ? 'active' : ''}`} onClick={() => setType(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          <div className="search-filter-group">
            {PET_FILTERS.map(f => (
              <button key={f.value} className={`search-filter-pill ${petType === f.value ? 'active' : ''}`} onClick={() => setPetType(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {(type === 'all' || type === 'posts') && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text3)' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={t('filterByLocation')}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, flex: 1 }}
              />
            </div>
          </div>
        )}
      </div>

      {loading && <div className="spinner" />}

      {!loading && searched && total === 0 && (
        <div className="search-no-results">
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>{t('noResults')}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>"{query}" {t('noResultsFor')}</div>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="search-results-section">
          <div className="search-section-title">{t('usersLabel')} ({users.length})</div>
          {users.map(u => (
            <div key={u.id} className="search-user-result" onClick={() => navigate(`/${u.username}`)}>
              <Avatar user={u} size={46} />
              <div className="search-user-result-info">
                <div className="search-user-name">{u.username}</div>
                <div className="search-user-sub">
                  {u.full_name}
                  {u.pet_name && <> · {u.pet_type === 'cat' ? '🐱' : u.pet_type === 'dog' ? '🐶' : '🐾'} {u.pet_name}</>}
                </div>
              </div>
              <button
                className="btn-follow"
                onClick={e => { e.stopPropagation(); navigate(`/${u.username}`); }}
              >
                {t('profileBtn')}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="search-results-section">
          <div className="search-section-title">{t('postsLabel')} ({posts.length})</div>
          <div className="search-posts-grid">
            {posts.map(post => (
              <div key={post.id} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => navigate(`/post/${post.id}`)}>
                {post.media_type === 'video' ? (
                  <>
                    <video src={post.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    <div className="explore-video-badge">▶</div>
                  </>
                ) : (
                  <img src={post.image_url} alt={post.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                )}
                <div className="explore-overlay">
                  <div className="explore-stat">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {post.like_count}
                  </div>
                  {post.location && (
                    <div className="explore-stat" style={{ fontSize: 11 }}>
                      📍 {post.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginBottom: 8 }}>{t('advancedSearch')}</div>
          <div style={{ fontSize: 13 }}>{t('advancedSearchDesc')}</div>
        </div>
      )}
    </div>
  );
}
