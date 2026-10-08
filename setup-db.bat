@echo off
echo ============================================
echo  BANTUANWARGA - Setup Database MySQL
echo ============================================

set MYSQL=D:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe
set MYSQLADMIN=D:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqladmin.exe

echo.
echo [1/3] Membuat database bantuanwarga...
%MYSQL% -u root -e "CREATE DATABASE IF NOT EXISTS bantuanwarga CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% neq 0 (
  echo GAGAL: Tidak dapat membuat database. Pastikan MySQL/Laragon sudah berjalan.
  pause
  exit /b 1
)
echo OK - Database bantuanwarga berhasil dibuat

echo.
echo [2/3] Membuat tabel-tabel...
%MYSQL% -u root bantuanwarga < database.sql
if %errorlevel% neq 0 (
  echo GAGAL: Tidak dapat membuat tabel.
  pause
  exit /b 1
)
echo OK - Tabel users dan help_requests berhasil dibuat

echo.
echo [3/3] Menjalankan seed (2 user demo)...
node seed.mjs
if %errorlevel% neq 0 (
  echo GAGAL: Seed gagal dijalankan.
  pause
  exit /b 1
)

echo.
echo ============================================
echo  SETUP SELESAI!
echo  Jalankan aplikasi:
echo  node node_modules/next/dist/bin/next dev --webpack
echo ============================================
pause
