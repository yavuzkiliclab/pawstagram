import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import api from '../api/axios';
import BackButton from '../components/BackButton';

export default function Stats() {
  const navigate = useNavigate();
  const { t, language } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!data) return null;

  const maxCount = Math.max(...(data.postsPerDay.map(d => d.count)), 1);
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  return (
    <div className="page-container">
      <div className="page-container-left" />
      <div className="stats-page page-container-span">
      <BackButton fallback="/" />
      <h2 className="page-header">{t('statsTitle')}</h2>

      <div className="stats-grid">
        <StatCard label={t('statsUsers')} value={data.users} icon="👥" color="var(--pink)" locale={locale} />
        <StatCard label={t('statsPosts')} value={data.posts} icon="📷" color="var(--blue)" locale={locale} />
        <StatCard label={t('statsLikes')} value={data.likes} icon="❤️" color="#E11D48" locale={locale} />
        <StatCard label={t('statsComments')} value={data.comments} icon="💬" color="var(--purple)" locale={locale} />
        <StatCard label={t('statsFollows')} value={data.follows} icon="👣" color="var(--green)" locale={locale} />
        <StatCard label={t('statsMessages')} value={data.messages} icon="✉️" color="var(--gold)" locale={locale} />
      </div>

      {data.postsPerDay.length > 0 && (
        <div className="stats-card">
          <div className="stats-card-title">{t('activityTitle')}</div>
          <div className="stats-chart">
            {data.postsPerDay.map(d => (
              <div key={d.day} className="stats-bar-wrap" title={`${d.day}: ${d.count}`}>
                <div
                  className="stats-bar"
                  style={{ height: `${Math.max(4, (d.count / maxCount) * 100)}%` }}
                />
                <div className="stats-bar-label">{d.day.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stats-two-col">
        <div className="stats-card">
          <div className="stats-card-title">{t('topFollowedTitle')}</div>
          {data.topUsers.map((u, i) => (
            <div key={u.id} className="stats-user-row" onClick={() => navigate(`/${u.username}`)}>
              <div className="stats-rank">#{i + 1}</div>
              <Avatar user={u} size={36} />
              <div className="stats-user-info">
                <div className="stats-user-name">{u.username}</div>
                <div className="stats-user-sub">
                  {u.follower_count} {t('followers')} · {u.post_count} {t('posts')}
                  {u.pet_type === 'cat' ? ' · 🐱' : u.pet_type === 'dog' ? ' · 🐶' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="stats-card">
          <div className="stats-card-title">🆕 {language === 'tr' ? 'Son Katılanlar' : 'Recently Joined'}</div>
          {data.recentUsers.map(u => (
            <div key={u.id} className="stats-user-row" onClick={() => navigate(`/${u.username}`)}>
              <Avatar user={u} size={36} />
              <div className="stats-user-info">
                <div className="stats-user-name">{u.username}</div>
                <div className="stats-user-sub">
                  {u.pet_type === 'cat' ? '🐱' : u.pet_type === 'dog' ? '🐶' : '🐾'} ·{' '}
                  {new Date(u.created_at).toLocaleDateString(locale)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.topPosts.length > 0 && (
        <div className="stats-card">
          <div className="stats-card-title">🔥 {language === 'tr' ? 'En Çok Beğenilen Gönderiler' : 'Most Liked Posts'}</div>
          <div className="stats-posts-grid">
            {data.topPosts.map((post, i) => (
              <div key={post.id} className="stats-post-item" onClick={() => navigate(`/post/${post.id}`)}>
                {post.media_type === 'video' ? (
                  <video src={post.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline preload="metadata" />
                ) : (
                  <img src={post.image_url} alt="" />
                )}
                <div className="stats-post-overlay">
                  <div className="stats-post-likes">❤️ {post.like_count}</div>
                  <div className="stats-post-user">@{post.username}</div>
                </div>
                <div className="stats-post-rank">#{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, locale }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ color }}>{icon}</div>
      <div className="stat-card-value">{value?.toLocaleString(locale)}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
