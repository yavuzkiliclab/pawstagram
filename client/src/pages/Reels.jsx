import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';

export default function Reels() {
  const { t } = useSettings();
  const [posts, setPosts] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const fetchingRef = useRef(false);
  const startYRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => { fetchPosts(1); }, []);

  const fetchPosts = async (p = 1) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const r = await api.get(`/posts/explore?page=${p}&limit=10`);
      if (p === 1) {
        setPosts(r.data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(r.data.posts || [])]);
      }
      setHasMore(r.data.hasMore ?? false);
      setPage(p);
    } catch {}
    setLoading(false);
    fetchingRef.current = false;
  };

  const goTo = useCallback((newIdx) => {
    if (newIdx < 0 || newIdx >= posts.length) return;
    setIndex(newIdx);
    // Load more when near end
    if (newIdx >= posts.length - 3 && hasMore) {
      fetchPosts(page + 1);
    }
  }, [posts.length, hasMore, page]);

  // Keyboard navigation
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  goTo(index - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goTo, index]);

  // Wheel navigation
  const wheelRef = useRef(false);
  const handleWheel = (e) => {
    e.preventDefault();
    if (wheelRef.current) return;
    wheelRef.current = true;
    goTo(e.deltaY > 0 ? index + 1 : index - 1);
    setTimeout(() => { wheelRef.current = false; }, 600);
  };

  // Touch / pointer drag
  const onPointerDown = (e) => {
    if (e.target.closest('.reel-actions')) return;
    startYRef.current = e.clientY;
    setDragging(true);
    setDragY(0);
    containerRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    setDragY(e.clientY - startYRef.current);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    if (dragY < -60) goTo(index + 1);
    else if (dragY > 60) goTo(index - 1);
    setDragging(false);
    setDragY(0);
  };

  const handleLike = async (postId) => {
    try {
      const r = await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, is_liked: r.data.liked, like_count: r.data.like_count } : p
      ));
    } catch {}
  };

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!posts.length) return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🐾</div>
      <div>Henüz içerik yok</div>
      <BackButton fallback="/" style={{ color: '#E8956D' }} />
    </div>
  );

  const post = posts[index];

  return (
    <div
      ref={containerRef}
      className="reels-page"
      onWheel={handleWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Back button */}
      <div className="reels-back">
        <BackButton fallback="/" />
      </div>

      {/* Progress dots */}
      <div className="reels-dots">
        {posts.slice(Math.max(0, index - 4), index + 5).map((_, i) => {
          const realIdx = Math.max(0, index - 4) + i;
          return (
            <div
              key={realIdx}
              className={`reel-dot ${realIdx === index ? 'active' : ''}`}
              onClick={() => goTo(realIdx)}
            />
          );
        })}
      </div>

      {/* Card stack: prev, current, next */}
      {[-1, 0, 1].map(offset => {
        const i = index + offset;
        if (i < 0 || i >= posts.length) return null;
        const p = posts[i];
        const isActive = offset === 0;
        const ty = offset * 100 + (isActive && dragging ? (dragY / window.innerHeight) * 80 : 0);

        return (
          <div
            key={p.id}
            className="reel-slide"
            style={{
              transform: `translateY(${ty}%)`,
              transition: dragging && isActive ? 'none' : 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
              opacity: isActive ? 1 : Math.max(0, 1 - Math.abs(offset) * 0.4),
              zIndex: isActive ? 2 : 1,
            }}
          >
            <ReelCard post={p} isActive={isActive} onLike={handleLike} />
          </div>
        );
      })}

      {/* Arrow navigation */}
      {index > 0 && (
        <button className="reel-nav-btn reel-nav-up" onClick={() => goTo(index - 1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      )}
      {index < posts.length - 1 && (
        <button className="reel-nav-btn reel-nav-down" onClick={() => goTo(index + 1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      )}
    </div>
  );
}

function ReelCard({ post, isActive, onLike }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const liked = post.is_liked || post.liked;
  const petEmoji = { cat: '🐱', dog: '🐶', bird: '🦜', rabbit: '🐰', hamster: '🐹', fish: '🐠' }[post.pet_type] || '🐾';

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) videoRef.current.play().catch(() => {});
    else { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, [isActive]);

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link kopyalandı!');
  };

  return (
    <div className="reel-card">
      {post.media_type === 'video' ? (
        <video ref={videoRef} src={post.image_url} className="reel-media" loop muted playsInline />
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
        {post.location && <div className="reel-pet" style={{ marginTop: 4 }}>📍 {post.location}</div>}
      </div>

      <div className="reel-actions">
        <button className={`reel-action-btn ${liked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
          <svg fill={liked ? '#E11D48' : 'white'} viewBox="0 0 24 24" width="26" height="26">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="reel-action-count">{post.like_count || 0}</span>
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
        </button>
        <div className="reel-action-btn" style={{ cursor: 'pointer' }} onClick={() => navigate(`/${post.username}`)}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid white', overflow: 'hidden', background: '#333' }}>
            {post.avatar_url
              ? <img src={post.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #D4627E, #E8A838)' }}>{post.username?.[0]?.toUpperCase()}</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
