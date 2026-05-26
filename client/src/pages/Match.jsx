import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import SwipeCard from '../components/SwipeCard';
import MatchOverlay from '../components/MatchOverlay';
import Avatar from '../components/Avatar';
import '../styles/Match.css';

// SVG icons — no emoji in buttons
const IconX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6"  y1="6" x2="18" y2="18"/>
  </svg>
);

const IconHeart = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function Match() {
  const { t } = useSettings();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [tab, setTab]             = useState('swipe');
  const [candidates, setCandidates] = useState([]);
  const [matches, setMatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [matchResult, setMatchResult] = useState(null);
  const [busy, setBusy]           = useState(false);

  // Signal to top SwipeCard to play its fly-out animation
  const [swipeSignal, setSwipeSignal] = useState(null); // { dir, ts }

  useEffect(() => {
    fetchCandidates();
    fetchMatches();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const r = await api.get('/match/candidates');
      setCandidates(r.data);
    } catch {}
    setLoading(false);
  };

  const fetchMatches = async () => {
    try {
      const r = await api.get('/match/matches');
      setMatches(r.data);
    } catch {}
  };

  // Called by SwipeCard after its fly-out animation completes (350ms delay)
  // userId is the card that was swiped — safe even with async timing
  const handleSwipe = useCallback(async (direction, userId) => {
    setSwipeSignal(null);
    const target = candidates.find(c => c.id === userId);
    if (!target) return;

    setBusy(true);
    setCandidates(prev => prev.filter(c => c.id !== userId));

    try {
      const r = await api.post('/match/swipe', { target_id: target.id, direction });
      if (r.data.match) {
        setMatchResult(r.data.matchData);
        setMatches(prev => [r.data.matchData, ...prev]);
      }
    } catch {}
    setBusy(false);
  }, [candidates]);

  // Button click → tell the card to animate, then handleSwipe fires
  const triggerSwipe = (direction) => {
    if (busy || candidates.length === 0) return;
    setSwipeSignal({ dir: direction, ts: Date.now() });
  };

  const handleMatchMessage = () => {
    const username = matchResult?.username;
    setMatchResult(null);
    if (username) navigate(`/messages/${username}`);
  };

  return (
    <div className="match-page">
      {matchResult && (
        <MatchOverlay
          matchData={matchResult}
          currentUser={user}
          onMessage={handleMatchMessage}
          onContinue={() => setMatchResult(null)}
        />
      )}

      {/* Tab switch */}
      <div className="match-tabs">
        <button
          className={`match-tab${tab === 'swipe' ? ' active' : ''}`}
          onClick={() => setTab('swipe')}
        >
          💛 {t('matchTab')}
        </button>
        <button
          className={`match-tab${tab === 'matches' ? ' active' : ''}`}
          onClick={() => setTab('matches')}
        >
          🐾 {t('matchesTab')}
          {matches.length > 0 && <span className="match-count">{matches.length}</span>}
        </button>
      </div>

      {/* ── Swipe tab ── */}
      {tab === 'swipe' && (
        <>
          {loading ? (
            <div className="match-skeleton-wrap">
              <div className="match-skeleton" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="match-empty">
              <div className="match-empty-icon">🐾</div>
              <p className="match-empty-text">{t('noMoreCandidates')}</p>
              <button className="match-refresh-btn" onClick={fetchCandidates}>
                {t('refreshCandidates')}
              </button>
            </div>
          ) : (
            <>
              <div className="match-stack">
                {candidates.slice(0, 3).map((u, i) => (
                  <SwipeCard
                    key={u.id}
                    user={u}
                    index={i}
                    onSwipe={handleSwipe}
                    swipeSignal={i === 0 ? swipeSignal : null}
                  />
                ))}
              </div>

              <div className="swipe-actions">
                <button
                  className="swipe-btn swipe-btn-pass"
                  onClick={() => triggerSwipe('pass')}
                  title={t('matchPass')}
                  disabled={busy}
                >
                  <IconX />
                </button>
                <button
                  className="swipe-btn swipe-btn-like"
                  onClick={() => triggerSwipe('like')}
                  title={t('matchLike')}
                  disabled={busy}
                >
                  <IconHeart />
                </button>
              </div>

              <div className="swipe-hint">{t('swipeHint')}</div>
            </>
          )}
        </>
      )}

      {/* ── Matches tab ── */}
      {tab === 'matches' && (
        <>
          {matches.length === 0 ? (
            <div className="match-empty">
              <div className="match-empty-icon">💛</div>
              <p className="match-empty-text">{t('noMatchesYet')}</p>
            </div>
          ) : (
            <>
              <div className="matches-section-header">
                {matches.length} {t('matchesTab')}
              </div>
              <div className="matches-grid">
                {matches.map(m => (
                  <div
                    key={m.match_id || m.id}
                    className="match-card"
                    onClick={() => navigate(`/messages/${m.username}`)}
                  >
                    <Avatar user={m} size={68} />
                    <div className="match-card-pet">{m.pet_name || m.username}</div>
                    <div className="match-card-owner">@{m.username}</div>
                    <button
                      className="match-card-msg"
                      onClick={e => { e.stopPropagation(); navigate(`/messages/${m.username}`); }}
                    >
                      💬 Mesaj
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
