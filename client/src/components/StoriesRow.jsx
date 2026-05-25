import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../api/axios';

export default function StoriesRow() {
  const { user } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/users/stories').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const getInitials = (u) => (u.full_name || u.username || '?')[0].toUpperCase();
  const gradients = [
    ['#FF3D9A','#FFB347'], ['#9B59FF','#FF3D9A'], ['#00D4FF','#9B59FF'],
    ['#FF3D9A','#FF6EC7'], ['#00E5A0','#00D4FF'],
  ];

  return (
    <div className="stories-row">
      {/* New post button */}
      <div className="story-item" onClick={() => navigate('/new')}>
        <div className="story-ring new-post-ring">
          <div className="story-inner" style={{ fontSize: 26, background: 'var(--bg3)' }}>+</div>
        </div>
        <span className="story-label" style={{ color: 'var(--pink)', fontWeight: 600 }}>{t('newPost')}</span>
      </div>

      {/* Followed users */}
      {users.map((u, i) => {
        const idx = i % gradients.length;
        const [c1, c2] = gradients[idx];
        return (
          <div key={u.id} className="story-item" onClick={() => navigate(`/${u.username}`)}>
            <div className="story-ring" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              <div className="story-inner">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt={u.username} />
                  : <span style={{ fontSize: 20, fontWeight: 800 }}>{getInitials(u)}</span>
                }
              </div>
            </div>
            <span className="story-label">{u.username}</span>
          </div>
        );
      })}
    </div>
  );
}
