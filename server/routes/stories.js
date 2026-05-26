const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

function enrichStory(story, userId) {
  const is_liked = !!db.prepare('SELECT 1 FROM story_likes WHERE story_id=? AND user_id=?').get(story.id, userId);
  const like_count = db.prepare('SELECT COUNT(*) as c FROM story_likes WHERE story_id=?').get(story.id).c;
  const view_count = db.prepare('SELECT COUNT(*) as c FROM story_views WHERE story_id=?').get(story.id).c;
  const is_viewed = !!db.prepare('SELECT 1 FROM story_views WHERE story_id=? AND viewer_id=?').get(story.id, userId);
  return { ...story, is_liked, like_count, view_count, is_viewed };
}

// Feed: own stories + followed users' active stories
router.get('/feed', authMiddleware, (req, res) => {
  const me = req.userId;
  const now = new Date().toISOString();

  // Users to show: self + followed, who have active stories
  const userRows = db.prepare(`
    SELECT DISTINCT u.id, u.username, u.full_name, u.avatar_url
    FROM users u
    WHERE u.id = ?
      AND EXISTS (SELECT 1 FROM stories s WHERE s.user_id = u.id AND s.expires_at > ?)
    UNION
    SELECT u.id, u.username, u.full_name, u.avatar_url
    FROM follows f JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
      AND EXISTS (SELECT 1 FROM stories s WHERE s.user_id = u.id AND s.expires_at > ?)
    ORDER BY u.id
  `).all(me, now, me, now);

  const groups = userRows.map(u => {
    const stories = db.prepare(
      `SELECT * FROM stories WHERE user_id=? AND expires_at > ? ORDER BY created_at ASC`
    ).all(u.id, now).map(s => enrichStory(s, me));

    const has_unseen = stories.some(s => !s.is_viewed);
    return { ...u, has_unseen, stories };
  });

  // Sort: unseen first, then seen
  groups.sort((a, b) => (b.has_unseen ? 1 : 0) - (a.has_unseen ? 1 : 0));

  res.json(groups);
});

// Create story
router.post('/', authMiddleware, upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Medya gerekli' });
  const { caption = '' } = req.body;
  const image_url = `/uploads/${req.file.filename}`;
  const r = db.prepare(
    `INSERT INTO stories (user_id, image_url, caption) VALUES (?, ?, ?)`
  ).run(req.userId, image_url, caption);
  const story = db.prepare('SELECT * FROM stories WHERE id=?').get(r.lastInsertRowid);
  res.json(enrichStory(story, req.userId));
});

// Delete own story
router.delete('/:id', authMiddleware, (req, res) => {
  const story = db.prepare('SELECT * FROM stories WHERE id=?').get(req.params.id);
  if (!story) return res.status(404).json({ error: 'Bulunamadı' });
  if (story.user_id !== req.userId) return res.status(403).json({ error: 'Yetkisiz' });
  db.prepare('DELETE FROM stories WHERE id=?').run(story.id);
  res.json({ ok: true });
});

// Mark viewed
router.post('/:id/view', authMiddleware, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO story_views (story_id, viewer_id) VALUES (?,?)').run(req.params.id, req.userId);
  res.json({ ok: true });
});

// Toggle like
router.post('/:id/like', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT 1 FROM story_likes WHERE story_id=? AND user_id=?').get(req.params.id, req.userId);
  if (existing) {
    db.prepare('DELETE FROM story_likes WHERE story_id=? AND user_id=?').run(req.params.id, req.userId);
  } else {
    db.prepare('INSERT OR IGNORE INTO story_likes (story_id, user_id) VALUES (?,?)').run(req.params.id, req.userId);
  }
  const like_count = db.prepare('SELECT COUNT(*) as c FROM story_likes WHERE story_id=?').get(req.params.id).c;
  res.json({ liked: !existing, like_count });
});

// Post comment
router.post('/:id/comment', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Boş yorum' });
  const r = db.prepare(
    'INSERT INTO story_comments (story_id, user_id, content) VALUES (?,?,?)'
  ).run(req.params.id, req.userId, content.trim());
  const comment = db.prepare(`
    SELECT sc.*, u.username, u.avatar_url FROM story_comments sc
    JOIN users u ON sc.user_id = u.id WHERE sc.id=?
  `).get(r.lastInsertRowid);
  res.json(comment);
});

// Get comments for a story
router.get('/:id/comments', authMiddleware, (req, res) => {
  const comments = db.prepare(`
    SELECT sc.*, u.username, u.avatar_url FROM story_comments sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.story_id=? ORDER BY sc.created_at ASC LIMIT 50
  `).all(req.params.id);
  res.json(comments);
});

module.exports = router;
