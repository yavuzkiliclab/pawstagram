import { useState } from 'react';
import Avatar from './Avatar';

const CONFETTI_COLORS = ['#E8956D','#F4A833','#9b59b6','#3498db','#2ecc71','#e74c3c','#f39c12','#1abc9c'];

function makeConfetti() {
  return Array.from({ length: 56 }, (_, i) => ({
    id: i,
    color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:     `${(i / 56) * 100 + (Math.random() - 0.5) * 6}%`,
    delay:    `${(Math.random() * 0.7).toFixed(2)}s`,
    duration: `${(0.85 + Math.random() * 0.8).toFixed(2)}s`,
    width:    `${5 + Math.floor(Math.random() * 7)}px`,
    height:   `${8 + Math.floor(Math.random() * 7)}px`,
    rot:      `${Math.floor(Math.random() * 720)}deg`,
  }));
}

export default function MatchOverlay({ matchData, currentUser, onMessage, onContinue }) {
  const [confetti] = useState(makeConfetti);

  return (
    <div className="match-overlay" onClick={onContinue}>
      {confetti.map(c => (
        <div
          key={c.id}
          className="confetti-piece"
          style={{
            left:              c.left,
            backgroundColor:   c.color,
            width:             c.width,
            height:            c.height,
            animationDelay:    c.delay,
            animationDuration: c.duration,
            '--rot':           c.rot,
          }}
        />
      ))}

      <div className="match-overlay-card" onClick={e => e.stopPropagation()}>
        <div className="match-overlay-title">It's a Match! 🐾</div>
        <div className="match-overlay-subtitle">
          {matchData.pet_name
            ? `${matchData.pet_name} ile eşleştin!`
            : `@${matchData.username} ile eşleştin!`}
        </div>

        <div className="match-overlay-avatars">
          <div className="match-overlay-avatar">
            {currentUser && <Avatar user={currentUser} size={88} />}
          </div>
          <span className="match-heart">💛</span>
          <div className="match-overlay-avatar">
            <Avatar user={matchData} size={88} />
          </div>
        </div>

        <div className="match-overlay-actions">
          <button className="match-msg-btn" onClick={onMessage}>
            💬 Mesaj Gönder
          </button>
          <button className="match-continue-btn" onClick={onContinue}>
            Devam Et →
          </button>
        </div>
      </div>
    </div>
  );
}
