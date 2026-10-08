# PANDUAN SETUP SUPABASE — BANTUANWARGA

## LANGKAH 1 — Buat Project Supabase
1. Buka https://supabase.com → Sign In / Sign Up
2. Klik **"New Project"**
3. Isi nama project: `bantuanwarga`
4. Pilih region terdekat (Singapore)
5. Buat database password yang kuat → **simpan password ini**
6. Tunggu project selesai dibuat (~2 menit)

---

## LANGKAH 2 — Buat Tabel help_requests + RLS

1. Di Supabase Dashboard → klik **SQL Editor** (kiri sidebar)
2. Klik **New Query**
3. Copy-paste seluruh isi file `supabase-schema.sql`
4. Klik **Run** (Ctrl+Enter)
5. Pastikan output: `Success. No rows returned`

---

## LANGKAH 3 — Aktifkan Realtime (Opsional, untuk papan beranda live)

1. Dashboard → **Database** → **Replication**
2. Cari tabel `help_requests`
3. Toggle **ON** pada kolom "Source"

---

## LANGKAH 4 — Ambil API Keys

1. Dashboard → **Project Settings** (ikon gear)
2. Klik **API**
3. Copy:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon / public** key → string panjang dimulai `eyJhbGci...`

---

## LANGKAH 5 — Isi .env.local

Buka file `.env.local` dan ganti:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## LANGKAH 6 — Aktifkan Auth Providers

### Email/Password (Sudah aktif secara default)
Dashboard → **Authentication** → **Providers** → **Email** → pastikan **Enabled**

### Google OAuth
1. Dashboard → **Authentication** → **Providers** → **Google**
2. Toggle ON
3. Isi **Client ID** dan **Client Secret** dari Google Cloud Console
   - Buka https://console.cloud.google.com
   - Buat OAuth 2.0 Client ID
   - Authorized redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`

---

## LANGKAH 7 — Jalankan Aplikasi

```bash
node node_modules/next/dist/bin/next dev --webpack
```

Buka: http://localhost:3000

---

## CHECKLIST VERIFIKASI

- [ ] Bisa Register dengan email baru
- [ ] Bisa Login dengan email/password
- [ ] Bisa Logout
- [ ] Bisa buat postingan bantuan (tersimpan di Supabase)
- [ ] Postingan muncul di Papan Bantuan
- [ ] User lain bisa klik "Saya Ingin Membantu" → status jadi SELESAI
- [ ] Di "Bantuan Saya" bisa hapus postingan sendiri
- [ ] User lain tidak bisa hapus postingan orang lain (RLS aktif)

---

## STRUKTUR FINAL

```
Next.js App
    ↓
src/lib/supabase.ts (Supabase Client)
    ↓
Supabase Auth  ←→  Supabase PostgreSQL
                        ↓
                   help_requests (RLS aktif)
```
