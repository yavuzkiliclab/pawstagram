const { execSync } = require('child_process');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'db', 'petcircle.db');

let count = 0;
try {
  const tempDb = new Database(dbPath);
  count = tempDb.prepare('SELECT COUNT(*) as c FROM users').get().c;
  tempDb.close();
} catch {
  // DB doesn't exist yet — seed will create it
}

if (count < 10) {
  console.log('🌱 Empty database — running demo seed...');
  execSync('node seed-demo.js', { cwd: __dirname, stdio: 'inherit' });
  console.log('✅ Database seeded');
} else {
  console.log(`✅ Database ready (${count} users)`);
}
