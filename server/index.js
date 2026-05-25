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
    if (!origin) return cb(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    if (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Sunucu hatası' });
});

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

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
