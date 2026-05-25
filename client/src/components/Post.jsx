import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Avatar from './Avatar';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Post({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const { t, language } = useSettings();
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved_posts') || '[]').includes(initialPost.id); } catch { return false; }
  });

  const handleSave = () => {
    setSaved(prev => {
      const next = !prev;
      try {
        const list = JSON.parse(localStorage.getItem('saved_posts') || '[]');
        const updated = next ? [...new Set([...list, post.id])] : list.filter(id => id !== post.id);
        localStorage.setItem('saved_posts', JSON.stringify(updated));
      } catch {}
      return next;
    });
  };

  const petIcon = post.pet_type === 'cat' ? '🐱' : post.pet_type === 'dog' ? '🐶' : '🐾';

  const handleLike = async () => {
    const wasLiked = post.liked;
    setPost(p => ({ ...p, liked: !p.liked, like_count: p.liked ? p.like_count - 1 : p.like_count + 1 }));
    try {
      const r = await api.post(`/posts/${post.id}/like`);
      setPost(p => ({ ...p, liked: r.data.liked, like_count: r.data.like_count }));
    } catch {
      setPost(p => ({ ...p, liked: wasLiked, like_count: wasLiked ? p.like_count + 1 : p.like_count - 1 }));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${post.id}/comments`, { content: comment.trim() });
      setPost(p => ({ ...p, comment_count: p.comment_count + 1 }));
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.error || t('errorOccurred'));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirm(t('deletePostConfirm'))) return;
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success(t('postDeleted'));
      onDelete?.(post.id);
    } catch { toast.error(t('deleteFailed')); }
  };

  const locale = language === 'tr' ? 'tr' : 'en';

  return (
    <article className="post-card">
      <div className="post-header">
        <Link to={`/${post.username}`}>
          <Avatar user={{ username: post.username, full_name: post.full_name, avatar_url: post.avatar_url }} size={42} />
        </Link>
        <div className="post-user-info">
          <Link to={`/${post.username}`} className="post-username">{post.username}</Link>
          <div className="post-meta">
            <span className="post-pet-tag">{petIcon} {post.pet_name || t('myPet')}</span>
            {post.location && (
              <>
                <span style={{ color: 'var(--border2)', fontSize: 10 }}>·</span>
                <span className="post-location">
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {post.location}
                </span>
              </>
            )}
          </div>
        </div>
        <span className="post-time">{format(post.created_at, locale)}</span>
        {user?.id === post.user_id && (
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: 'var(--text3)', padding: '4px 6px', borderRadius: 8, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#FF3D9A'}
            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        )}
      </div>

      <div className="post-image-wrap" onDoubleClick={handleLike} onClick={() => {}}>
        {post.media_type === 'video' ? (
          <video
            src={post.image_url}
            className="post-video"
            controls
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => navigate(`/post/${post.id}`)}
          />
        ) : (
          <img
            src={post.image_url}
            alt={post.caption || t('myPet')}
            className="post-image"
            loading="lazy"
            onClick={() => navigate(`/post/${post.id}`)}
          />
        )}
      </div>

      <div className="post-actions">
        <button className={`action-btn ${post.liked ? 'liked' : ''}`} onClick={handleLike}>
          <svg fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{post.like_count}</span>
        </button>
        <button className="action-btn" onClick={() => navigate(`/post/${post.id}`)}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{post.comment_count}</span>
        </button>
        <button className={`action-btn post-actions-save${saved ? ' liked' : ''}`} onClick={handleSave} title={saved ? t('saved') : t('save')}>
          <svg fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      {post.caption && (
        <div className="post-caption">
          <strong>{post.username}</strong>{post.caption}
        </div>
      )}
      {post.comment_count > 0 && (
        <div className="post-comment-count" onClick={() => navigate(`/post/${post.id}`)}>
          {language === 'tr'
            ? `${post.comment_count} yorumu gör`
            : `View ${post.comment_count} comment${post.comment_count !== 1 ? 's' : ''}`}
        </div>
      )}

      <form className="post-comment-input" onSubmit={handleComment}>
        <Avatar user={user} size={28} />
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={t('addComment')}
          maxLength={300}
        />
        <button type="submit" className="post-comment-submit" disabled={!comment.trim() || submitting}>
          {t('postCommentBtn')}
        </button>
      </form>
    </article>
  );
}
