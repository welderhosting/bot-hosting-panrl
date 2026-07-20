import db, { dbHelper } from '../database.js';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🛡️  Creating panel user account...');
  
  const args = process.argv.slice(2);
  let username = '';
  let password = '';
  let role: 'admin' | 'user' = 'admin';

  if (args.length >= 2) {
    username = args[0].trim();
    password = args[1].trim();
    if (args[2] && (args[2] === 'admin' || args[2] === 'user')) {
      role = args[2] as 'admin' | 'user';
    }
  } else {
    // Generate secure default credentials if not supplied as parameters
    username = 'admin';
    // Generate a secure default password
    password = crypto.randomBytes(6).toString('hex');
    console.log('⚠️  No username/password specified as CLI arguments. Generating secure defaults...');
  }

  if (username.length < 3) {
    console.error('❌ Error: Username must be at least 3 characters.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters.');
    process.exit(1);
  }

  try {
    const existing = dbHelper.getUserByUsername(username);
    if (existing) {
      console.log(`⚠️  User "${username}" already exists. Updating password instead...`);
      const hashed = hashPassword(password);
      db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE username = ?').run(hashed, role, username);
    } else {
      const hashed = hashPassword(password);
      dbHelper.createUser(username, hashed, role);
    }

    console.log('\n=============================================');
    console.log('✅ USER CREATION / UPDATE SUCCESSFUL!');
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🎖️  Role:     ${role}`);
    console.log('=============================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to write user to SQLite database:', error);
    process.exit(1);
  }
}

main();
