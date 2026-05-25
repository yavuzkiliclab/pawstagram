import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Post from '../components/Post';
import Avatar from '../components/Avatar';
import StoriesRow from '../components/StoriesRow';
import FilterBar from '../components/FilterBar';
import api from '../api/axios';

// "You might also like" card shown every N posts
const SUGGESTION_INTERVAL = 6;

export default function Feed() {
  const { user } = useAuth();
  const { t, petFilter: savedFilter } = useSettings();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [followed, setFollowed] = useState({});
  const [petFilter, setPetFilter] = useState(savedFilter || 'all');
  const [trendingTags, setTrendingTags] = useState([]);
  const [nearby, setNearby] = useState([]);

  useEffect(() => { fetchFeed(1, true); }, [petFilter]);
  useEffect(() => {
    fetchSuggestions();
    api.get('/posts/trending-tags').then(r => setTrendingTags(r.data.slice(0, 8))).catch(() => {});
    api.get('/users/nearby').then(r => setNearby(r.data.slice(0, 4))).catch(() => {});
  }, []);

  const fetchFeed = async (p = 1, reset = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const r = await api.get(`/posts/feed?page=${p}&pet_type=${petFilter}`);
      setPosts(prev => reset ? r.data.posts : [...prev, ...r.data.posts]);
      setHasMore(r.data.hasMore);
      setPage(p);
    } finally { setLoading(false); setLoadingMore(false); }
  };

  const fetchSuggestions = async () => {
    try { const r = await api.get('/users/suggested?limit=8'); setSuggestions(r.data); } catch {}
  };

  const handleFollow = async (username) => {
    try {
      const r = await api.post(`/users/${username}/follow`);
      setFollowed(p => ({ ...p, [username]: r.data.is_following }));
    } catch {}
  };

  const handleDelete = (id) => setPosts(p => p.filter(post => post.id !== id));

  // Interleave "you might like" cards into the post list
  const buildFeedItems = () => {
    const items = [];
    const unseen = suggestions.filter(s => !followed[s.username]);
    let suggIdx = 0;
    posts.forEach((post, i) => {
      items.push({ type: 'post', data: post });
      if ((i + 1) % SUGGESTION_INTERVAL === 0 && unseen.length > 0) {
        const batch = unseen.slice(suggIdx, suggIdx + 3);
        if (batch.length > 0) {
          items.push({ type: 'suggestion_card', data: batch });
          suggIdx = (suggIdx + 3) % unseen.length;
        }
      }
    });
    return items;
  };

  const feedItems = buildFeedItems();

  return (
    <div className="page-container">
      <div className="page-container-left" />
      <div className="feed-posts">
        <StoriesRow />
        <FilterBar value={petFilter} onChange={v => setPetFilter(v)} />

        {loading ? (
          <div className="spinner" />
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{petFilter === 'cat' ? '🐱' : petFilter === 'dog' ? '🐶' : '🐾'}</div>
            <div className="empty-text">{t('noPostsFound')}</div>
            <div className="empty-sub">{t('shareFirst')}</div>
          </div>
        ) : (
          <>
            {feedItems.map((item, idx) =>
              item.type === 'post' ? (
                <Post key={item.data.id} post={item.data} onDelete={handleDelete} />
              ) : (
                <div key={`sugg-${idx}`} className="feed-suggestion-card">
                  <div className="feed-suggestion-title">{t('youMightLike')}</div>
                  <div className="feed-suggestion-list">
                    {item.data.map(s => (
                      <div key={s.id} className="feed-suggestion-item">
                        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/${s.username}`)}>
                          <Avatar user={s} size={48} />
                        </div>
                        <div className="feed-suggestion-info">
                          <div className="feed-suggestion-username" onClick={() => navigate(`/${s.username}`)}>{s.username}</div>
                          <div className="feed-suggestion-pet">{s.pet_type === 'cat' ? '🐱' : s.pet_type === 'dog' ? '🐶' : '🐾'} {s.pet_name || s.full_name}</div>
                          {s.city && <div style={{ fontSize: 11, color: 'var(--text3)' }}>📍 {s.city}</div>}
                        </div>
                        <button
                          className={followed[s.username] ? 'btn-following' : 'btn-follow'}
                          onClick={() => handleFollow(s.username)}
                        >
                          {followed[s.username] ? t('following') : t('follow')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
            {hasMore && (
              <div className="load-more-wrap">
                <button className="btn-load-more" onClick={() => fetchFeed(page + 1)} disabled={loadingMore}>
                  {loadingMore ? t('loading') : t('loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="feed-sidebar page-container-right">
        <div className="sidebar-profile">
          <Link to={`/${user?.username}`}><Avatar user={user} size={50} /></Link>
          <div className="sidebar-info">
            <Link to={`/${user?.username}`} className="sidebar-username">{user?.username}</Link>
            <div className="sidebar-name">{user?.full_name}</div>
            {user?.pet_name && (
              <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 3 }}>
                {user.pet_type === 'cat' ? '🐱' : user.pet_type === 'dog' ? '🐶' : '🐾'} {user.pet_name}
              </div>
            )}
            {user?.city && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>📍 {user.city}</div>
            )}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="sidebar-suggestions">
            <div className="sidebar-suggestions-title">
              <span>{t('suggestedForYou')}</span>
              <Link to="/search" style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 600 }}>{t('seeAll')}</Link>
            </div>
            {suggestions.slice(0, 5).map(s => (
              <div key={s.id} className="suggestion-item">
                <Link to={`/${s.username}`}><Avatar user={s} size={38} /></Link>
                <div className="suggestion-info">
                  <Link to={`/${s.username}`} className="suggestion-username">{s.username}</Link>
                  <div className="suggestion-pet">
                    {s.pet_type === 'cat' ? '🐱' : s.pet_type === 'dog' ? '🐶' : '🐾'} {s.pet_name || s.full_name}
                    {s.city && <span style={{ marginLeft: 4 }}>· {s.city}</span>}
                  </div>
                </div>
                <button
                  className={followed[s.username] ? 'btn-following' : 'btn-follow'}
                  onClick={() => handleFollow(s.username)}
                >
                  {followed[s.username] ? t('following') : t('follow')}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Trending hashtags */}
        {trendingTags.length > 0 && (
          <div className="feed-right-section">
            <div className="feed-right-section-title">{t('trendingTags')}</div>
            <div className="feed-right-tags">
              {trendingTags.map(tag => (
                <Link key={tag.tag} to={`/explore?tag=${encodeURIComponent(tag.tag)}`} className="feed-right-tag">
                  <span className="feed-right-tag-name">#{tag.tag}</span>
                  <span className="feed-right-tag-count">{tag.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Nearby users */}
        {nearby.length > 0 && (
          <div className="feed-right-section">
            <div className="feed-right-section-title">{t('nearbyUsers')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nearby.map(u => (
                <Link key={u.id} to={`/${u.username}`} className="feed-right-nearby-item">
                  <Avatar user={u} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.pet_type === 'cat' ? '🐱' : '🐶'} {u.city}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
