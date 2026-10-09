-- ============================================================
-- BANTUANWARGA - MySQL Database Schema
-- Jalankan file ini di MySQL client Anda:
--   mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS bantuanwarga
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bantuanwarga;

-- ============================================================
-- Tabel: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  full_name   VARCHAR(255) NOT NULL,
  role        ENUM('peminta','relawan') NOT NULL DEFAULT 'peminta',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Tabel: help_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS help_requests (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT         NOT NULL,
  category        VARCHAR(100) NOT NULL,
  location        VARCHAR(255) NOT NULL,
  status          ENUM('menunggu','selesai') NOT NULL DEFAULT 'menunggu',
  user_id         VARCHAR(36)  NOT NULL,
  author_name     VARCHAR(255) DEFAULT NULL,
  volunteer_id    VARCHAR(36)  DEFAULT NULL,
  volunteer_name  VARCHAR(255) DEFAULT NULL,
  volunteer_email VARCHAR(255) DEFAULT NULL,
  volunteer_phone VARCHAR(255) DEFAULT NULL,
  helped_at       TIMESTAMP    NULL DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_volunteer
    FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Index untuk performa query (idempoten — aman dijalankan berulang)
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DELIMITER $$
CREATE PROCEDURE add_index_if_not_exists(
  tbl VARCHAR(64), idx VARCHAR(64), cols VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = tbl
      AND index_name  = idx
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD INDEX `', idx, '` (', cols, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_index_if_not_exists('help_requests','idx_hr_status',  'status');
CALL add_index_if_not_exists('help_requests','idx_hr_user_id', 'user_id');
CALL add_index_if_not_exists('help_requests','idx_hr_category','category');
CALL add_index_if_not_exists('help_requests','idx_hr_created', 'created_at');
DROP PROCEDURE IF EXISTS add_index_if_not_exists;

-- ============================================================
-- Data Demo (password: 123456)
-- Hash dihasilkan oleh seed.mjs — lihat instruksi di bawah
-- Jalankan: node seed.mjs
-- ============================================================
-- Jangan insert manual di sini, gunakan seed.mjs agar password
-- di-hash dengan bcrypt secara benar.
