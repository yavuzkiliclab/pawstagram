import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';

export default function Reels() {
  const { t } = useSettings();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { fetchPosts(1); }, []);

  const fetchPosts = async (p = 1) => {
    try {
      // Fetch multiple pet types and shuffle for variety
      if (p === 1) {
        const types = ['cat', 'dog', 'bird', 'rodent', 'other'];
        const results = await Promise.all(
          types.map(t => api.get(`/posts/explore?page=1&pet_type=${t}&limit=12`).then(r => r.data.posts).catch(() => []))
        );
        const all = results.flat();
        // Shuffle: interleave types
        const shuffled = [];
        const maxLen = Math.max(...results.map(a => a.length));
        for (let i = 0; i < maxLen; i++) {
          results.forEach(arr => { if (arr[i]) shuffled.push(arr[i]); });
        }
        // deduplicate
        const seen = new Set();
        const unique = shuffled.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
        setPosts(unique);
        setHasMore(unique.length >= 20);
      } else {
        const r = await api.get(`/posts/explore?page=${p}&pet_type=all`);
        setPosts(prev => [...prev, ...r.data.posts]);
        setHasMore(r.data.hasMore);
      }
      setPage(p);
    } finally { setLoading(false); }
  };

  const handleLike = async (postId, liked) => {
    try {
      const r = await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, is_liked: r.data.liked, like_count: r.data.like_count } : p
      ));
    } catch {}
  };

  if (loading) return <div style={{ background: '#000', height: 'calc(100vh - var(--navbar-h))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  return (
    <>
    <div style={{ position: 'fixed', top: 'calc(var(--navbar-h) + 12px)', left: 'calc(var(--sidebar-w) + 16px)', zIndex: 300 }}>
      <BackButton fallback="/" />
    </div>
    <div className="reels-container">
      {posts.map((post, i) => (
        <ReelItem
          key={post.id}
          post={post}
          onLike={handleLike}
          onNearEnd={i === posts.length - 3 && hasMore ? () => fetchPosts(page + 1) : null}
        />
      ))}
    </div>
    </>
  );
}

function ReelItem({ post, onLike, onNearEnd }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (onNearEnd) onNearEnd();
          if (videoRef.current) videoRef.current.play().catch(() => {});
        } else {
          setVisible(false);
          if (videoRef.current) videoRef.current.pause();
        }
      },
      { threshold: 0.6 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onNearEnd]);

  const handleLike = () => {
    const wasLiked = liked;
    setLiked(l => !l);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    onLike(post.id, wasLiked);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Link kopyalandı!');
    }
  };

  const petEmoji = post.pet_type === 'cat' ? '🐱' : post.pet_type === 'dog' ? '🐶' : post.pet_type === 'bird' ? '🦜' : post.pet_type === 'rabbit' ? '🐰' : post.pet_type === 'hamster' ? '🐹' : post.pet_type === 'fish' ? '🐠' : '🐾';

  return (
    <div className={`reel-item${visible ? ' reel-visible' : ''}`} ref={ref}>
      <div className="reel-card">
        {post.media_type === 'video' ? (
          <video
            ref={videoRef}
            src={post.image_url}
            className="reel-media"
            loop muted playsInline
          />
        ) : (
          <img src={post.image_url} className="reel-media" alt="" />
        )}

        <div className="reel-overlay" />

        <div className="reel-bottom">
          <div className="reel-user" onClick={() => navigate(`/${post.username}`)}>
            <Avatar user={{ username: post.username, avatar_url: post.avatar_url }} size={36} />
            <span className="reel-username">@{post.username}</span>
            <span className="reel-pet">{petEmoji} {post.pet_type}</span>
          </div>
          {post.caption && <div className="reel-caption">{post.caption}</div>}
          {post.location && (
            <div className="reel-pet" style={{ marginTop: 4 }}>📍 {post.location}</div>
          )}
        </div>

        <div className="reel-actions">
          <button className={`reel-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
            <svg fill={liked ? '#E11D48' : 'white'} viewBox="0 0 24 24" width="26" height="26">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="reel-action-count">{likeCount}</span>
          </button>
          <button className="reel-action-btn" onClick={() => navigate(`/post/${post.id}`)}>
            <svg fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" width="26" height="26">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="reel-action-count">{post.comment_count || 0}</span>
          </button>
          <button className="reel-action-btn" onClick={handleShare}>
            <svg fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" width="26" height="26">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span className="reel-action-count">{t('send')}</span>
          </button>
          <div className="reel-action-btn" style={{ cursor: 'default' }} onClick={() => navigate(`/${post.username}`)}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid white', overflow: 'hidden', background: '#333' }}>
              {post.avatar_url
                ? <img src={post.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #D4627E, #E8A838)' }}>{post.username?.[0]?.toUpperCase()}</div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
