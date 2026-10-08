/**
 * seed.mjs — Seed database dengan 2 user demo
 * Jalankan sekali: node seed.mjs
 *
 * Pastikan .env.local sudah terisi dengan konfigurasi MySQL Anda.
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

// Baca env dari .env.local
const envLines = readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
}

const connection = await mysql.createConnection({
  host:     env.MYSQL_HOST     || 'localhost',
  port:     parseInt(env.MYSQL_PORT || '3306'),
  user:     env.MYSQL_USER     || 'root',
  password: env.MYSQL_PASSWORD || '',
  database: env.MYSQL_DATABASE || 'bantuanwarga',
});

console.log('✅ Terhubung ke MySQL');

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = '123456';
const hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

const users = [
  {
    id:        'user-peminta-demo',
    email:     'peminta@gmail.com',
    full_name: 'Peminta Bantuan (Demo)',
    role:      'peminta',
  },
  {
    id:        'user-relawan-demo',
    email:     'relawan@gmail.com',
    full_name: 'Relawan Peduli (Demo)',
    role:      'relawan',
  },
];

for (const u of users) {
  try {
    await connection.execute(
      `INSERT INTO users (id, email, password, full_name, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role)`,
      [u.id, u.email, hash, u.full_name, u.role]
    );
    console.log(`✅ User "${u.full_name}" (${u.email}) berhasil di-seed`);
  } catch (err) {
    console.error(`❌ Gagal seed user ${u.email}:`, err.message);
  }
}

await connection.end();
console.log('\n🎉 Seed selesai! Password default: 123456');
console.log('   Login: peminta@gmail.com / 123456');
console.log('   Login: relawan@gmail.com / 123456');
