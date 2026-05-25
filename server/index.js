const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const notifRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, cb) => {
    // No origin = server-to-server or curl
    if (!origin) return cb(null, true);
    // Local dev
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    // Production: frontend is served from same Express server (same-origin),
    // but some browsers still send Origin header — allow it
    if (process.env.NODE_ENV === 'production') return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);

// Serve built React app in production (must come after API routes)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  // SPA fallback — non-API routes serve index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Sunucu hatası' });
});

app.listen(PORT, () => {
  console.log(`🐾 Pawstagram server → http://localhost:${PORT}`);

  // Seed demo data in background if DB is empty — doesn't block startup
  try {
    const db = require('./db/database');
    const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    if (count < 10) {
      console.log('🌱 Seeding demo data in background...');
      const child = spawn(process.execPath, [path.join(__dirname, 'seed-demo.js')], {
        cwd: __dirname,
        stdio: 'inherit',
      });
      child.on('close', code =>
        code === 0 ? console.log('✅ Demo seed complete') : console.error(`⚠️ Seed exited: ${code}`)
      );
    } else {
      console.log(`✅ Database ready (${count} users)`);
    }
  } catch (e) {
    console.error('⚠️ Seed check failed:', e.message);
  }
});
