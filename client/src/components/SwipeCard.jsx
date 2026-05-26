import { useRef, useState, useEffect } from 'react';
import Avatar from './Avatar';

const SWIPE_THRESHOLD = 75;
const FLY_MS = 360;

const PET_EMOJI = { cat: '🐱', dog: '🐶', bird: '🦜', rabbit: '🐰', hamster: '🐹', guinea_pig: '🐾' };

const PET_GRAD = {
  cat:        'linear-gradient(145deg,#9B59B6 0%,#E8956D 100%)',
  dog:        'linear-gradient(145deg,#E8956D 0%,#F4A833 100%)',
  bird:       'linear-gradient(145deg,#3498DB 0%,#2ECC71 100%)',
  rabbit:     'linear-gradient(145deg,#E91E8C 0%,#FF9800 100%)',
  hamster:    'linear-gradient(145deg,#F39C12 0%,#E74C3C 100%)',
  guinea_pig: 'linear-gradient(145deg,#1ABC9C 0%,#3498DB 100%)',
};
const DEFAULT_GRAD = 'linear-gradient(145deg,#E8956D 0%,#F4A833 100%)';

export default function SwipeCard({ user, index, onSwipe, swipeSignal }) {
  const [dragging, setDragging]   = useState(false);
  const [dx, setDx]               = useState(0);
  const [flying, setFlying]       = useState(null); // 'left' | 'right' | null
  const startXRef = useRef(0);
  const cardRef   = useRef(null);
  const isTop     = index === 0;

  // Respond to button-triggered swipe from parent
  useEffect(() => {
    if (!swipeSignal || !isTop || flying) return;
    flyOut(swipeSignal.dir === 'like' ? 'right' : 'left');
  }, [swipeSignal?.ts]);

  const flyOut = (dir) => {
    setDragging(false);
    setFlying(dir);
    setTimeout(() => onSwipe(dir === 'right' ? 'like' : 'pass', user.id), FLY_MS);
  };

  const onDown = (e) => {
    if (!isTop || flying) return;
    setDragging(true);
    startXRef.current = e.clientX;
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onMove = (e) => {
    if (!dragging || flying) return;
    setDx(e.clientX - startXRef.current);
  };

  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    if      (dx >  SWIPE_THRESHOLD) flyOut('right');
    else if (dx < -SWIPE_THRESHOLD) flyOut('left');
    else setDx(0);
  };

  const likeOpacity = flying === 'right' ? 1 : Math.min(Math.max( dx / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = flying === 'left'  ? 1 : Math.min(Math.max(-dx / SWIPE_THRESHOLD, 0), 1);

  let transform, transition;
  if (flying === 'right') {
    transform  = 'translateX(170%) rotate(30deg)';
    transition = `transform ${FLY_MS}ms cubic-bezier(.4,.2,.2,1), opacity ${FLY_MS}ms ease`;
  } else if (flying === 'left') {
    transform  = 'translateX(-170%) rotate(-30deg)';
    transition = `transform ${FLY_MS}ms cubic-bezier(.4,.2,.2,1), opacity ${FLY_MS}ms ease`;
  } else if (isTop) {
    transform  = `translateX(${dx}px) rotate(${dx * 0.033}deg)`;
    transition = dragging ? 'none' : 'transform .28s cubic-bezier(.25,.46,.45,.94)';
  } else {
    const scale = 1 - index * 0.055;
    const ty    = index * 20;
    transform  = `scale(${scale}) translateY(${ty}px)`;
    transition = 'transform .3s cubic-bezier(.25,.46,.45,.94)';
  }

  return (
    <div
      ref={cardRef}
      className={`swipe-card${dragging ? ' dragging' : ''}`}
      style={{
        transform,
        transition,
        opacity:  flying ? 0 : 1,
        zIndex:   10 - index,
        cursor:   isTop ? (dragging ? 'grabbing' : 'grab') : 'default',
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* LIKE stamp */}
      {likeOpacity > 0.05 && (
        <div className="card-stamp card-stamp-like" style={{ opacity: likeOpacity }}>
          LIKE
        </div>
      )}
      {/* NOPE stamp */}
      {passOpacity > 0.05 && (
        <div className="card-stamp card-stamp-nope" style={{ opacity: passOpacity }}>
          NOPE
        </div>
      )}

      {/* Hero gradient */}
      <div className="swipe-hero" style={{ background: PET_GRAD[user.pet_type] || DEFAULT_GRAD }}>
        <div className="swipe-avatar-ring">
          <Avatar user={user} size={152} />
        </div>
      </div>

      {/* Info panel */}
      <div className="swipe-info">
        <div className="swipe-name-row">
          <span className="swipe-pet-name">{user.pet_name || user.username}</span>
          <span className="swipe-pet-emoji">{PET_EMOJI[user.pet_type] || '🐾'}</span>
        </div>
        <div className="swipe-owner">{user.full_name} · @{user.username}</div>
        {user.city && <div className="swipe-city">📍 {user.city}</div>}
        <div className="swipe-badges">
          {user.pet_vaccinated ? <span className="swipe-badge swipe-badge-green">✅ Aşılı</span>            : null}
          {user.pet_neutered   ? <span className="swipe-badge swipe-badge-blue">🔵 Kısırlaştırıldı</span> : null}
          {user.pet_breed      ? <span className="swipe-badge swipe-badge-neutral">{user.pet_breed}</span>  : null}
        </div>
        {user.bio && <p className="swipe-bio">{user.bio}</p>}
      </div>
    </div>
  );
}
