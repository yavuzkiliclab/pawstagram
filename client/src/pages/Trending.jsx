import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import FilterBar from '../components/FilterBar';
import BackButton from '../components/BackButton';
import api from '../api/axios';

export default function Trending() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [petFilter, setPetFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PERIODS = [
    { value: 'day', labelKey: 'period24h' },
    { value: 'week', labelKey: 'periodWeek' },
    { value: 'month', labelKey: 'periodMonth' },
    { value: 'all', labelKey: 'periodAll' },
  ];

  useEffect(() => { fetchTrending(1, true); }, [period, petFilter]);

  const fetchTrending = async (p = 1, reset = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const r = await api.get(`/posts/trending?period=${period}&pet_type=${petFilter}&page=${p}`);
      setPosts(prev => reset ? r.data.posts : [...prev, ...r.data.posts]);
      setHasMore(r.data.hasMore);
      setPage(p);
    } finally { setLoading(false); setLoadingMore(false); }
  };

  const rankStyle = (i) => {
    if (i === 0) return 'gold';
    if (i === 1) return 'silver';
    if (i === 2) return 'bronze';
    return '';
  };

  const rankLabel = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="page-container">
      <div className="page-container-left" />
      <div className="trending-page page-container-span">
      <BackButton fallback="/" />
      <h2 className="page-header">{t('trendingTitle')}</h2>

      <div className="trending-header">
        {PERIODS.map(p => (
          <button key={p.value} className={`period-pill ${period === p.value ? 'active' : ''}`} onClick={() => setPeriod(p.value)}>
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      <FilterBar value={petFilter} onChange={setPetFilter} />

      {loading ? (
        <div className="spinner" />
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <div className="empty-text">{t('noPostsThisPeriod')}</div>
          <div className="empty-sub">{t('tryLongerPeriod')}</div>
        </div>
      ) : (
        <>
          <div className="trending-grid">
            {posts.map((post, i) => (
              <div key={post.id} className="trending-item" onClick={() => navigate(`/post/${post.id}`)}>
                {post.media_type === 'video' ? (
                  <video src={post.image_url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={post.image_url} alt="" loading="lazy" />
                )}
                <div className={`trending-rank ${rankStyle(i)}`}>{rankLabel(i)}</div>
                <div className="trending-overlay">
                  <div className="trending-likes">
                    <svg fill="white" viewBox="0 0 24 24" width="15" height="15"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {post.like_count}
                  </div>
                  <div className="trending-username">@{post.username}</div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button className="btn-load-more" onClick={() => fetchTrending(page + 1)} disabled={loadingMore}>
                {loadingMore ? t('loading') : t('loadMoreBtn')}
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
