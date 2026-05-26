const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const CANDIDATE_COLS = 'id, username, full_name, avatar_url, bio, pet_name, pet_type, pet_breed, city, country, pet_vaccinated, pet_neutered, pet_likes, pet_traits';

// GET /api/match/candidates
router.get('/candidates', authMiddleware, (req, res) => {
  const me = req.userId;
  const myProfile = db.prepare('SELECT pet_type, city FROM users WHERE id = ?').get(me);

  const candidates = db.prepare(`
    SELECT ${CANDIDATE_COLS},
      (CASE WHEN pet_type = ? THEN 3 ELSE 0 END +
       CASE WHEN city != '' AND city = ? THEN 2 ELSE 0 END) AS score
    FROM users
    WHERE id != ?
      AND id NOT IN (SELECT target_id FROM pet_swipes WHERE swiper_id = ?)
      AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
    ORDER BY score DESC, RANDOM()
    LIMIT 30
  `).all(myProfile?.pet_type || '', myProfile?.city || '', me, me, me);

  res.json(candidates);
});

// POST /api/match/swipe — { target_id, direction: 'like'|'pass' }
router.post('/swipe', authMiddleware, (req, res) => {
  const me = req.userId;
  const { target_id, direction } = req.body;
  if (!target_id || !['like', 'pass'].includes(direction)) {
    return res.status(400).json({ error: 'Geçersiz istek' });
  }

  try {
    db.prepare('INSERT OR IGNORE INTO pet_swipes (swiper_id, target_id, direction) VALUES (?, ?, ?)')
      .run(me, target_id, direction);
  } catch {
    return res.json({ match: false });
  }

  if (direction !== 'like') return res.json({ match: false });

  // Check for mutual like
  const mutual = db.prepare(
    'SELECT 1 FROM pet_swipes WHERE swiper_id = ? AND target_id = ? AND direction = ?'
  ).get(target_id, me, 'like');

  if (!mutual) return res.json({ match: false });

  // Create match record
  const userA = Math.min(me, target_id);
  const userB = Math.max(me, target_id);
  db.prepare('INSERT OR IGNORE INTO pet_matches (user_a_id, user_b_id) VALUES (?, ?)').run(userA, userB);

  // Create conversation (or get existing)
  db.prepare('INSERT OR IGNORE INTO conversations (participant_1, participant_2) VALUES (?, ?)').run(userA, userB);
  const convo = db.prepare('SELECT id FROM conversations WHERE participant_1 = ? AND participant_2 = ?').get(userA, userB);

  const matchedUser = db.prepare(`SELECT ${CANDIDATE_COLS} FROM users WHERE id = ?`).get(target_id);
  res.json({ match: true, matchData: { ...matchedUser, conversationId: convo?.id } });
});

// GET /api/match/matches
router.get('/matches', authMiddleware, (req, res) => {
  const me = req.userId;
  const matches = db.prepare(`
    SELECT
      pm.id AS match_id,
      pm.created_at AS matched_at,
      u.${CANDIDATE_COLS.split(', ').join(', u.')},
      c.id AS conversation_id
    FROM pet_matches pm
    JOIN users u ON u.id = CASE WHEN pm.user_a_id = ? THEN pm.user_b_id ELSE pm.user_a_id END
    LEFT JOIN conversations c ON (
      c.participant_1 = CASE WHEN pm.user_a_id < pm.user_b_id THEN pm.user_a_id ELSE pm.user_b_id END
      AND c.participant_2 = CASE WHEN pm.user_a_id < pm.user_b_id THEN pm.user_b_id ELSE pm.user_a_id END
    )
    WHERE pm.user_a_id = ? OR pm.user_b_id = ?
    ORDER BY pm.created_at DESC
  `).all(me, me, me);

  res.json(matches);
});

module.exports = router;
