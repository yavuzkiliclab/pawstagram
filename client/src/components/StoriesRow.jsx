import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import Avatar from './Avatar';

export default function StoriesRow({ groups = [], onOpenViewer }) {
  const { t } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="stories-row">
      {/* New story / post button */}
      <div className="story-item" onClick={() => navigate('/new')}>
        <div className="story-ring story-ring-new">
          <div className="story-inner story-inner-new">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
        </div>
        <span className="story-label" style={{ color: 'var(--pink)', fontWeight: 600 }}>{t('newPost')}</span>
      </div>

      {groups.map((group, i) => (
        <div
          key={group.user_id || group.id}
          className="story-item"
          onClick={() => onOpenViewer(i)}
        >
          <div className={`story-ring ${group.has_unseen ? 'story-ring-unseen' : 'story-ring-seen'}`}>
            <div className="story-inner">
              <Avatar user={group} size={56} />
            </div>
          </div>
          <span className="story-label">{group.username}</span>
        </div>
      ))}
    </div>
  );
}
