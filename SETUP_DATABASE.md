# PANDUAN SETUP DATABASE MYSQL - BANTUANWARGA
# =============================================

## LANGKAH 1 — Pastikan MySQL berjalan di komputer Anda
# Windows: buka XAMPP → Start MySQL
# Atau pastikan MySQL service aktif

## LANGKAH 2 — Edit konfigurasi database di .env.local
# Buka file .env.local dan sesuaikan:
#   MYSQL_HOST=localhost
#   MYSQL_PORT=3306
#   MYSQL_USER=root
#   MYSQL_PASSWORD=(password MySQL Anda, kosongkan jika tidak ada)
#   MYSQL_DATABASE=bantuanwarga

## LANGKAH 3 — Buat database dan tabel
# Jalankan file database.sql di MySQL client:
#   mysql -u root -p < database.sql
#
# ATAU buka MySQL Workbench / phpMyAdmin → paste isi database.sql

## LANGKAH 4 — Seed 2 user demo
#   node seed.mjs
#
# Output yang diharapkan:
#   ✅ Terhubung ke MySQL
#   ✅ User "Peminta Bantuan (Demo)" (peminta@gmail.com) berhasil di-seed
#   ✅ User "Relawan Peduli (Demo)" (relawan@gmail.com) berhasil di-seed
#   🎉 Seed selesai! Password default: 123456

## LANGKAH 5 — Jalankan aplikasi
#   node node_modules/next/dist/bin/next dev --webpack

## AKUN DEMO
# ─────────────────────────────────────────────
# 👤 PEMINTA BANTUAN
#   Email    : peminta@gmail.com
#   Password : 123456
#   Bisa     : Register, Login, Buat postingan, Hapus postingan sendiri
#
# 🤝 RELAWAN
#   Email    : relawan@gmail.com
#   Password : 123456
#   Bisa     : Login, Lihat papan bantuan, Klik "Saya Ingin Membantu"
# ─────────────────────────────────────────────
