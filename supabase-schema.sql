-- ============================================================
-- BANTUANWARGA — Supabase SQL Setup (LENGKAP & IDEMPOTEN)
-- Salin semua isi file ini → paste di:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. Buat Tabel ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.help_requests (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT          NOT NULL,
  description     TEXT          NOT NULL,
  category        TEXT          NOT NULL,
  location        TEXT          NOT NULL,
  status          TEXT          DEFAULT 'menunggu' NOT NULL,
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name     TEXT,
  author_phone    TEXT,
  volunteer_id    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  volunteer_name  TEXT,
  volunteer_email TEXT,
  volunteer_phone TEXT,
  helped_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);

-- Migrasi jika tabel sudah pernah dibuat sebelumnya:
ALTER TABLE public.help_requests ADD COLUMN IF NOT EXISTS author_phone TEXT;
ALTER TABLE public.help_requests ADD COLUMN IF NOT EXISTS volunteer_phone TEXT;

-- ── 2. Aktifkan RLS ────────────────────────────────────────
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- ── 3. Hapus policy lama (agar idempoten) ─────────────────
DROP POLICY IF EXISTS "public_select"   ON public.help_requests;
DROP POLICY IF EXISTS "auth_insert_own" ON public.help_requests;
DROP POLICY IF EXISTS "auth_update"     ON public.help_requests;
DROP POLICY IF EXISTS "owner_delete"    ON public.help_requests;

-- ── 4. Buat Policy ────────────────────────────────────────

-- SELECT: siapa pun bisa lihat (termasuk tamu tanpa login)
CREATE POLICY "public_select"
  ON public.help_requests FOR SELECT
  USING (true);

-- INSERT: hanya user login, user_id WAJIB milik sendiri
CREATE POLICY "auth_insert_own"
  ON public.help_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: user login boleh update (untuk fitur "Saya Ingin Membantu")
CREATE POLICY "auth_update"
  ON public.help_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- DELETE: hanya pemilik postingan
CREATE POLICY "owner_delete"
  ON public.help_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── 5. Index performa ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hr_status     ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_user_id    ON public.help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_category   ON public.help_requests(category);
CREATE INDEX IF NOT EXISTS idx_hr_created_at ON public.help_requests(created_at DESC);

-- ── 6. Dummy Data (jalankan SETELAH ada minimal 1 user login) ──
-- Script ini otomatis menggunakan user pertama yang terdaftar
-- sebagai author semua dummy data.
DO $body$
DECLARE
  demo_uid   UUID;
BEGIN
  -- Ambil user pertama yang terdaftar di Supabase Auth
  SELECT id INTO demo_uid FROM auth.users ORDER BY created_at LIMIT 1;

  IF demo_uid IS NULL THEN
    RAISE NOTICE 'Tidak ada user terdaftar. Silakan register/login dulu, lalu jalankan ulang bagian DO block ini.';
    RETURN;
  END IF;

  -- Hapus dummy lama agar tidak duplikat
  DELETE FROM public.help_requests
  WHERE author_name IN ('Demo Warga', 'Demo Relawan', 'Warga Demo');

  -- Insert 4 dummy data
  INSERT INTO public.help_requests
    (title, description, category, location, status, user_id, author_name, created_at)
  VALUES
    (
      'Butuh Donor Darah O+',
      'Ibu saya dirawat di RS Awal Bros Batam dan sangat membutuhkan donor darah golongan O+. Kondisi sangat mendesak. Hubungi 0812-xxxx-xxxx.',
      'Medis & Darurat',
      'Batam, Kepulauan Riau',
      'menunggu',
      demo_uid,
      'Demo Warga',
      NOW() - INTERVAL '2 hours'
    ),
    (
      'Butuh Kursi Roda',
      'Nenek saya baru saja keluar dari rumah sakit dan memerlukan kursi roda untuk mobilitas di rumah. Jika ada yang tidak terpakai, sangat bersyukur bila bisa dipinjamkan.',
      'Medis & Darurat',
      'Pekanbaru, Riau',
      'menunggu',
      demo_uid,
      'Demo Warga',
      NOW() - INTERVAL '5 hours'
    ),
    (
      'Butuh Tenaga Angkut Barang',
      'Saya memerlukan 2-3 orang tenaga untuk membantu memindahkan perabot rumah tangga ke alamat baru. Imbalan disepakati bersama.',
      'Tenaga Relawan',
      'Padang, Sumatera Barat',
      'selesai',
      demo_uid,
      'Demo Warga',
      NOW() - INTERVAL '1 day'
    ),
    (
      'Bantuan Paket Sembako',
      'Keluarga kami terdampak bencana banjir dan sangat membutuhkan bantuan paket sembako (beras, minyak, dll) untuk kebutuhan seminggu ke depan.',
      'Sembako',
      'Medan, Sumatera Utara',
      'menunggu',
      demo_uid,
      'Demo Warga',
      NOW() - INTERVAL '3 hours'
    );

  -- Update yang sudah selesai dengan data relawan demo
  UPDATE public.help_requests
  SET
    volunteer_id    = demo_uid,
    volunteer_name  = 'Demo Relawan',
    volunteer_email = (SELECT email FROM auth.users WHERE id = demo_uid),
    helped_at       = NOW() - INTERVAL '12 hours'
  WHERE title = 'Butuh Tenaga Angkut Barang'
    AND status = 'selesai';

  RAISE NOTICE 'Dummy data berhasil dimasukkan! Total 4 data permohonan.';
END $body$;

-- ── 7. Verifikasi ──────────────────────────────────────────
SELECT id, title, category, location, status, author_name
FROM public.help_requests
ORDER BY created_at DESC;
