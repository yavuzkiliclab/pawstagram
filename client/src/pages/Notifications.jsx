import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import api from '../api/axios';

export default function Notifications() {
  const navigate = useNavigate();
  const { t, language } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    api.put('/notifications/read-all').catch(() => {});
  }, []);

  const fetchNotifications = async () => {
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications(p => p.filter(n => n.id !== id));
  };

  const handleClick = (n) => {
    if (n.post_id) navigate(`/post/${n.post_id}`);
    else navigate(`/${n.sender_username}`);
  };

  const typeInfo = (type) => {
    if (type === 'like') return { icon: '❤️', cls: 'like', text: t('notifLiked') };
    if (type === 'comment') return { icon: '💬', cls: 'comment', text: t('notifCommented') };
    if (type === 'follow') return { icon: '🐾', cls: 'follow', text: t('notifFollowed') };
    return { icon: '🔔', cls: 'follow', text: t('notifAction') };
  };

  const locale = language === 'tr' ? 'tr' : 'en';

  return (
    <div className="notifications-page">
      <BackButton fallback="/" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h2 className="page-header" style={{ marginBottom: 0 }}>{t('notificationsTitle')}</h2>
        {notifications.length > 0 && (
          <button
            onClick={async () => { await Promise.all(notifications.map(n => api.delete(`/notifications/${n.id}`))); setNotifications([]); }}
            style={{ background: 'none', borderRadius: 8, border: '1px solid var(--border2)', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', padding: '6px 12px' }}
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <div className="empty-text">{t('noNotifications')}</div>
          <div className="empty-sub">{t('notifAppear')}</div>
        </div>
      ) : (
        <div>
          {notifications.map(n => {
            const { icon, cls, text } = typeInfo(n.type);
            return (
              <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => handleClick(n)}>
                <div className={`notif-icon ${cls}`}>{icon}</div>
                <Avatar user={{ username: n.sender_username, avatar_url: n.sender_avatar, full_name: n.sender_name }} size={40} />
                <div className="notif-text">
                  <strong>{n.sender_username}</strong> {text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {n.post_image && (
                    <img src={n.post_image} alt="" className="notif-post-thumb" />
                  )}
                  <div>
                    <div className="notif-time">{format(n.created_at, locale)}</div>
                    {!n.read && <div className="notif-unread-dot" style={{ margin: '4px auto 0' }} />}
                  </div>
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 16, cursor: 'pointer', padding: '2px 6px', borderRadius: 6, lineHeight: 1 }}
                  >×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
