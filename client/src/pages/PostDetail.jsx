import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, language } = useSettings();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/posts/${id}`);
      setPost(r.data);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const r = await api.post(`/posts/${id}/like`);
      setPost(p => ({ ...p, liked: r.data.liked, like_count: r.data.like_count }));
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/posts/${id}/comments`, { content: comment.trim() });
      setPost(p => ({ ...p, comments: [...(p.comments || []), r.data], comment_count: p.comment_count + 1 }));
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.error || t('commentFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      setPost(p => ({ ...p, comments: p.comments.filter(c => c.id !== commentId), comment_count: p.comment_count - 1 }));
    } catch {
      toast.error(t('commentDeleteFailed'));
    }
  };

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!post) return null;

  const petIcon = post.pet_type === 'cat' ? '🐱' : post.pet_type === 'dog' ? '🐶' : '🐾';
  const locale = language === 'tr' ? 'tr' : 'en';

  return (
    <div className="post-detail-page">
      <BackButton fallback="/" />

      <div className="post-detail-card">
        {post.media_type === 'video' ? (
          <video src={post.image_url} className="post-detail-video" controls loop playsInline />
        ) : (
          <img src={post.image_url} alt={post.caption || ''} className="post-detail-image" />
        )}

        <div className="post-detail-right">
          <div className="post-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <Link to={`/${post.username}`}>
              <Avatar user={{ username: post.username, full_name: post.full_name, avatar_url: post.avatar_url }} size={40} />
            </Link>
            <div className="post-user-info">
              <Link to={`/${post.username}`} className="post-username">{post.username}</Link>
              <div className="post-pet-tag">{petIcon} {post.pet_name || t('myPet')}</div>
            </div>
          </div>

          <div className="post-detail-comments">
            {post.caption && (
              <div className="comment-item">
                <Link to={`/${post.username}`}>
                  <Avatar user={{ username: post.username, full_name: post.full_name, avatar_url: post.avatar_url }} size={32} />
                </Link>
                <div className="comment-body">
                  <div className="comment-text"><strong>{post.username}</strong>{post.caption}</div>
                  <div className="comment-time">{format(post.created_at, locale)}</div>
                </div>
              </div>
            )}

            {(post.comments || []).map(c => (
              <div key={c.id} className="comment-item">
                <Link to={`/${c.username}`}>
                  <Avatar user={{ username: c.username, avatar_url: c.avatar_url }} size={32} />
                </Link>
                <div className="comment-body" style={{ flex: 1 }}>
                  <div className="comment-text"><strong>{c.username}</strong>{c.content}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="comment-time">{format(c.created_at, locale)}</div>
                    {user?.id === c.user_id && (
                      <button onClick={() => handleDeleteComment(c.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>
                        {language === 'tr' ? 'Sil' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(post.comments || []).length === 0 && !post.caption && (
              <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                {language === 'tr' ? 'İlk yorumu sen yap! 🐾' : 'Be the first to comment! 🐾'}
              </div>
            )}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <div className="post-actions" style={{ padding: 0, marginBottom: 8 }}>
              <button className={`action-btn ${post.liked ? 'liked' : ''}`} onClick={handleLike}>
                <svg fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>
                  {post.like_count} {language === 'tr' ? 'beğeni' : post.like_count === 1 ? 'like' : 'likes'}
                </span>
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>{format(post.created_at, locale)}</div>
            <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('addComment')}
                maxLength={300}
                style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              />
              <button type="submit" disabled={!comment.trim() || submitting}
                style={{ padding: '8px 14px', background: 'linear-gradient(135deg, var(--pink), var(--gold))', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, opacity: !comment.trim() || submitting ? 0.5 : 1, cursor: !comment.trim() || submitting ? 'not-allowed' : 'pointer' }}>
                {t('postCommentBtn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
