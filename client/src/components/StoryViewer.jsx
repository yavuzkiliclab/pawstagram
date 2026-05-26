import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'timeago.js';
import { useSettings } from '../context/SettingsContext';
import Avatar from './Avatar';
import api from '../api/axios';

const STORY_DURATION = 5000;

export default function StoryViewer({ groups, startIndex = 0, onClose }) {
  const { language } = useSettings();
  const locale = language === 'tr' ? 'tr' : 'en';

  const [userIdx, setUserIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  const progressRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const pressTimerRef = useRef(null);
  const didMoveRef = useRef(false);

  const currentGroup = groups[userIdx];
  const currentStory = currentGroup?.stories?.[storyIdx];

  const goToNext = useCallback(() => {
    const stories = groups[userIdx]?.stories || [];
    if (storyIdx < stories.length - 1) {
      setStoryIdx(s => s + 1);
    } else if (userIdx < groups.length - 1) {
      setUserIdx(u => u + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [userIdx, storyIdx, groups, onClose]);

  const goToPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
    } else if (userIdx > 0) {
      const prevGroup = groups[userIdx - 1];
      setUserIdx(u => u - 1);
      setStoryIdx((prevGroup?.stories?.length || 1) - 1);
    }
  }, [userIdx, storyIdx, groups]);

  // rAF-based progress ticker
  useEffect(() => {
    progressRef.current = 0;
    pausedRef.current = false;
    setProgress(0);
    setPaused(false);
    lastTimeRef.current = null;

    if (currentStory) {
      api.post(`/stories/${currentStory.id}/view`).catch(() => {});
      setLikedMap(m => ({ ...m, [currentStory.id]: currentStory.is_liked }));
      api.get(`/stories/${currentStory.id}/comments`).then(r => setComments(r.data)).catch(() => {});
    }

    const tick = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      if (!pausedRef.current) {
        const delta = ts - lastTimeRef.current;
        progressRef.current = Math.min(progressRef.current + delta / STORY_DURATION, 1);
        setProgress(progressRef.current);
        if (progressRef.current >= 1) {
          goToNext();
          return;
        }
      }
      lastTimeRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [userIdx, storyIdx]);

  // Pause ref sync
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goToNext, goToPrev, onClose]);

  const handleLike = (e) => {
    e.stopPropagation();
    if (!currentStory) return;
    const id = currentStory.id;
    const wasLiked = likedMap[id];
    setLikedMap(m => ({ ...m, [id]: !wasLiked }));
    api.post(`/stories/${id}/like`).catch(() => {});
  };

  const handleCommentSubmit = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && comment.trim()) {
      api.post(`/stories/${currentStory.id}/comment`, { content: comment.trim() })
        .then(r => setComments(p => [...p, r.data]))
        .catch(() => {});
      setComment('');
    }
  };

  // Pointer events: short tap = navigate, long press = pause
  const onPointerDown = (e) => {
    if (e.target.closest('.story-actions-zone')) return;
    didMoveRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      setPaused(true);
    }, 180);
  };

  const onPointerMove = () => { didMoveRef.current = true; };

  const onPointerUp = (e) => {
    if (e.target.closest('.story-actions-zone')) return;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
      if (!didMoveRef.current) {
        const x = e.clientX;
        const third = window.innerWidth / 3;
        if (x < third) goToPrev();
        else goToNext();
      }
    } else {
      setPaused(false);
    }
  };

  const onPointerCancel = () => {
    if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
    setPaused(false);
  };

  if (!currentGroup || !currentStory) return null;
  const isLiked = likedMap[currentStory.id] ?? currentStory.is_liked;

  return (
    <div
      className="story-viewer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* Progress bars */}
      <div className="story-bars">
        {currentGroup.stories.map((s, i) => (
          <div key={s.id} className="story-bar">
            <div
              className="story-bar-fill"
              style={{
                width: i < storyIdx ? '100%'
                  : i === storyIdx ? `${progress * 100}%`
                  : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header story-actions-zone">
        <Avatar user={currentGroup} size={36} />
        <div className="story-header-info">
          <span className="story-header-name">{currentGroup.username}</span>
          <span className="story-header-time">{format(currentStory.created_at, locale)}</span>
        </div>
        <button className="story-close-btn" onClick={e => { e.stopPropagation(); onClose(); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Media */}
      <img src={currentStory.image_url} className="story-media" alt="" />

      {/* Caption */}
      {currentStory.caption && (
        <div className="story-caption">{currentStory.caption}</div>
      )}

      {/* Paused indicator */}
      {paused && <div className="story-paused-badge">⏸</div>}

      {/* Bottom actions */}
      <div className="story-actions-zone story-bottom">
        {/* Comments panel */}
        {showComments && (
          <div className="story-comments-panel" onClick={e => e.stopPropagation()}>
            <div className="story-comments-list">
              {comments.length === 0 && (
                <div className="story-comments-empty">Henüz yorum yok</div>
              )}
              {comments.map(c => (
                <div key={c.id} className="story-comment-item">
                  <span className="story-comment-user">{c.username}</span>
                  <span className="story-comment-text">{c.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="story-actions-row">
          <div className="story-reply-wrap" onClick={e => e.stopPropagation()}>
            <input
              className="story-reply-input"
              placeholder="Yanıt gönder..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={handleCommentSubmit}
              onFocus={() => setPaused(true)}
              onBlur={() => { if (!comment) setPaused(false); }}
            />
            {comment && (
              <button className="story-send-btn" onClick={handleCommentSubmit}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            )}
          </div>

          <button
            className={`story-like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? '#E11D48' : 'none'} stroke={isLiked ? '#E11D48' : 'white'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {currentStory.like_count > 0 && (
              <span className="story-like-count">{currentStory.like_count + (isLiked && !currentStory.is_liked ? 1 : !isLiked && currentStory.is_liked ? -1 : 0)}</span>
            )}
          </button>
        </div>
      </div>

      {/* User navigation dots */}
      {groups.length > 1 && (
        <div className="story-user-dots">
          {groups.map((g, i) => (
            <div
              key={g.user_id || g.id}
              className={`story-user-dot ${i === userIdx ? 'active' : ''}`}
              onClick={e => { e.stopPropagation(); setUserIdx(i); setStoryIdx(0); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
