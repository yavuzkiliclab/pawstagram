const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'petcircle.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT NULL,
    pet_name TEXT DEFAULT '',
    pet_type TEXT DEFAULT 'other',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    caption TEXT DEFAULT '',
    pet_name TEXT DEFAULT '',
    location TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    post_id INTEGER DEFAULT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_1 INTEGER NOT NULL,
    participant_2 INTEGER NOT NULL,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_1, participant_2),
    FOREIGN KEY (participant_1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_2) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migrations
const migrations = [
  "ALTER TABLE posts ADD COLUMN location TEXT DEFAULT ''",
  "ALTER TABLE posts ADD COLUMN media_type TEXT DEFAULT 'image'",
  "ALTER TABLE users ADD COLUMN city TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN country TEXT DEFAULT 'TR'",
  "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'tr'",
  "ALTER TABLE users ADD COLUMN pet_filter TEXT DEFAULT 'all'",
  "ALTER TABLE users ADD COLUMN pet_breed TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_birthdate TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_gender TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_color TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_weight TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_neutered INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN pet_vaccinated INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN pet_blood_type TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_skills TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_likes TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_dislikes TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_favorite_food TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_traits TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_lineage TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN pet_awards TEXT DEFAULT ''",
];
for (const sql of migrations) {
  try { db.exec(sql); } catch {}
}

// Seed demo users
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('demo1234', 10);
  const demoUsers = [
    { username: 'whisker_mom', email: 'whisker@demo.com', full_name: 'Zeynep Arslan', bio: 'Kedi annesiyim 🐱 | İstanbul', pet_name: 'Pamuk', pet_type: 'cat' },
    { username: 'golden_dad', email: 'golden@demo.com', full_name: 'Murat Demir', bio: 'Golden sahibi mutlu baba 🐶 | Ankara', pet_name: 'Max', pet_type: 'dog' },
    { username: 'paw_lover', email: 'paw@demo.com', full_name: 'Elif Kaya', bio: 'İki kedi, bir köpek = tam mutluluk', pet_name: 'Boncuk', pet_type: 'cat' },
    { username: 'furry_tales', email: 'furry@demo.com', full_name: 'Ahmet Yılmaz', bio: 'Sokak kedilerini besleyen gönüllü 🏙️', pet_name: 'Karamel', pet_type: 'cat' },
    { username: 'doggo_diary', email: 'doggo@demo.com', full_name: 'Selin Öztürk', bio: 'Her gün yeni macera 🐾 | İzmir', pet_name: 'Lila', pet_type: 'dog' },
  ];
  const ins = db.prepare(`INSERT INTO users (username,email,password_hash,full_name,bio,pet_name,pet_type) VALUES (@username,@email,@password_hash,@full_name,@bio,@pet_name,@pet_type)`);
  for (const u of demoUsers) ins.run({ ...u, password_hash: hash });
}

module.exports = db;
