const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

function enrichPost(post, userId) {
  const liked = db.prepare('SELECT 1 FROM likes WHERE post_id=? AND user_id=?').get(post.id, userId);
  const like_count = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id=?').get(post.id).c;
  const comment_count = db.prepare('SELECT COUNT(*) as c FROM comments WHERE post_id=?').get(post.id).c;
  return { ...post, liked: !!liked, is_liked: !!liked, like_count, comment_count };
}

function createNotification(recipientId, senderId, type, postId = null) {
  if (recipientId === senderId) return;
  const exists = db.prepare('SELECT id FROM notifications WHERE recipient_id=? AND sender_id=? AND type=? AND post_id IS ?').get(recipientId, senderId, type, postId);
  if (!exists) db.prepare('INSERT INTO notifications (recipient_id,sender_id,type,post_id) VALUES (?,?,?,?)').run(recipientId, senderId, type, postId);
}

function buildPetWhere(petFilter, prefix = 'u') {
  if (!petFilter || petFilter === 'all') return '';
  if (petFilter === 'rodent') return ` AND ${prefix}.pet_type IN ('rabbit','hamster','guinea_pig')`;
  if (petFilter === 'other') return ` AND ${prefix}.pet_type NOT IN ('cat','dog','bird','rabbit','hamster','guinea_pig')`;
  return ` AND ${prefix}.pet_type = '${petFilter.replace(/'/g, "''")}'`;
}

// Feed
router.get('/feed', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12, offset = (page - 1) * limit;
  const petWhere = buildPetWhere(req.query.pet_type);
  const posts = db.prepare(`
    SELECT p.*, u.username, u.full_name, u.avatar_url, u.pet_type
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE (p.user_id=? OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id=?)) ${petWhere}
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(req.userId, req.userId, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM posts p JOIN users u ON p.user_id=u.id WHERE (p.user_id=? OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id=?)) ${petWhere}`).get(req.userId, req.userId).c;
  res.json({ posts: posts.map(p => enrichPost(p, req.userId)), hasMore: offset + posts.length < total, page });
});

// Explore
router.get('/explore', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 24, 24), offset = (page - 1) * limit;
  const petWhere = buildPetWhere(req.query.pet_type);
  const tag = req.query.tag ? `%#${req.query.tag}%` : null;
  const tagWhere = tag ? ` AND p.caption LIKE '${tag.replace(/'/g, "''")}'` : '';
  const countryWhere = req.query.country ? ` AND u.country = '${req.query.country.replace(/'/g, "''")}'` : '';
  const cityWhere = req.query.city ? ` AND (p.location LIKE '%${req.query.city.replace(/'/g, "''")}%' OR u.city LIKE '%${req.query.city.replace(/'/g, "''")}%')` : '';
  const where = `WHERE 1=1 ${petWhere}${tagWhere}${countryWhere}${cityWhere}`;
  const posts = db.prepare(`SELECT p.*, u.username, u.full_name, u.avatar_url, u.pet_type, u.city, u.country FROM posts p JOIN users u ON p.user_id=u.id ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM posts p JOIN users u ON p.user_id=u.id ${where}`).get().c;
  res.json({ posts: posts.map(p => enrichPost(p, req.userId)), hasMore: offset + posts.length < total, page });
});

// Trending hashtags
router.get('/trending-tags', authMiddleware, (req, res) => {
  const captions = db.prepare("SELECT caption FROM posts WHERE caption IS NOT NULL AND caption != '' ORDER BY created_at DESC LIMIT 500").all();
  const counts = {};
  for (const row of captions) {
    const matches = (row.caption || '').match(/#[\wÀ-ɏЀ-ӿ]+/g) || [];
    for (const tag of matches) {
      const t = tag.toLowerCase();
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  const tags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag: tag.slice(1), count }));
  res.json(tags);
});

// Trending
router.get('/trending', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15, offset = (page - 1) * limit;
  const petWhere = buildPetWhere(req.query.pet_type);
  const dateMap = { day: "-1 day", week: "-7 days", month: "-30 days" };
  const dateOffset = dateMap[req.query.period];
  const dateWhere = dateOffset ? `AND p.created_at >= datetime('now','${dateOffset}')` : '';
  const userId = req.userId;
  const posts = db.prepare(`
    SELECT p.*, u.username, u.full_name, u.avatar_url, u.pet_type,
      (SELECT COUNT(*) FROM likes WHERE post_id=p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id=p.id) as comment_count,
      (SELECT 1 FROM likes WHERE post_id=p.id AND user_id=${userId}) as liked
    FROM posts p JOIN users u ON p.user_id=u.id
    WHERE 1=1 ${dateWhere} ${petWhere}
    ORDER BY like_count DESC, p.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM posts p JOIN users u ON p.user_id=u.id WHERE 1=1 ${dateWhere} ${petWhere}`).get().c;
  res.json({ posts: posts.map(p => ({ ...p, liked: !!p.liked })), hasMore: offset + posts.length < total, page });
});

// Search posts
router.get('/search', authMiddleware, (req, res) => {
  const q = req.query.q || '';
  const petType = req.query.pet_type;
  const location = req.query.location || '';
  if (q.length < 1) return res.json({ posts: [] });
  const petWhere = petType && petType !== 'all' ? ` AND u.pet_type = '${petType.replace(/'/g, "''")}'` : '';
  const locWhere = location ? ` AND p.location LIKE '%${location.replace(/'/g, "''")}%'` : '';
  const posts = db.prepare(`
    SELECT p.*, u.username, u.full_name, u.avatar_url, u.pet_type
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE (p.caption LIKE ? OR p.pet_name LIKE ? OR p.location LIKE ? OR u.username LIKE ?)
    ${petWhere}${locWhere}
    ORDER BY p.created_at DESC LIMIT 30
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  res.json({ posts: posts.map(p => enrichPost(p, req.userId)) });
});

// Create post (image or video)
router.post('/', authMiddleware, upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya gerekli' });
  const { caption, pet_name, location } = req.body;
  const image_url = `/uploads/${req.file.filename}`;
  const media_type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const result = db.prepare(`INSERT INTO posts (user_id,image_url,media_type,caption,pet_name,location) VALUES (?,?,?,?,?,?)`).run(req.userId, image_url, media_type, caption || '', pet_name || '', location || '');
  const post = db.prepare(`SELECT p.*,u.username,u.full_name,u.avatar_url,u.pet_type FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id=?`).get(result.lastInsertRowid);
  res.status(201).json(enrichPost(post, req.userId));
});

// Single post
router.get('/:id', authMiddleware, (req, res) => {
  const post = db.prepare(`SELECT p.*,u.username,u.full_name,u.avatar_url,u.pet_type FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id=?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Bulunamadı' });
  const comments = db.prepare(`SELECT c.*,u.username,u.avatar_url FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? ORDER BY c.created_at ASC`).all(post.id);
  res.json({ ...enrichPost(post, req.userId), comments });
});

// Delete post
router.delete('/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Bulunamadı' });
  if (post.user_id !== req.userId) return res.status(403).json({ error: 'Yetkisiz' });
  db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  res.json({ message: 'Silindi' });
});

// Like / Unlike
router.post('/:id/like', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT id,user_id FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Bulunamadı' });
  const existing = db.prepare('SELECT id FROM likes WHERE post_id=? AND user_id=?').get(req.params.id, req.userId);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(req.params.id, req.userId);
    db.prepare("DELETE FROM notifications WHERE recipient_id=? AND sender_id=? AND type='like' AND post_id=?").run(post.user_id, req.userId, post.id);
    return res.json({ liked: false, like_count: db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id=?').get(req.params.id).c });
  }
  db.prepare('INSERT INTO likes (post_id,user_id) VALUES (?,?)').run(req.params.id, req.userId);
  createNotification(post.user_id, req.userId, 'like', post.id);
  res.json({ liked: true, like_count: db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id=?').get(req.params.id).c });
});

// Comments
router.get('/:id/comments', authMiddleware, (req, res) => {
  res.json(db.prepare(`SELECT c.*,u.username,u.avatar_url FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? ORDER BY c.created_at ASC`).all(req.params.id));
});

router.post('/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Boş olamaz' });
  const post = db.prepare('SELECT id,user_id FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Bulunamadı' });
  const result = db.prepare('INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)').run(req.params.id, req.userId, content.trim());
  createNotification(post.user_id, req.userId, 'comment', post.id);
  res.status(201).json(db.prepare(`SELECT c.*,u.username,u.avatar_url FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=?`).get(result.lastInsertRowid));
});

router.delete('/:postId/comments/:commentId', authMiddleware, (req, res) => {
  const c = db.prepare('SELECT * FROM comments WHERE id=?').get(req.params.commentId);
  if (!c) return res.status(404).json({ error: 'Bulunamadı' });
  if (c.user_id !== req.userId) return res.status(403).json({ error: 'Yetkisiz' });
  db.prepare('DELETE FROM comments WHERE id=?').run(req.params.commentId);
  res.json({ message: 'Silindi' });
});

module.exports = router;
