import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Supabase mendukung 2 format nama variabel: ANON_KEY (lama) & PUBLISHABLE_KEY (baru)
const supabaseAnon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

/**
 * isLocalMock = true  → Supabase belum dikonfigurasi (fallback polling di RecentRequests)
 * isLocalMock = false → Supabase sudah terhubung (gunakan realtime subscription)
 */
export const isLocalMock =
  !supabaseUrl ||
  supabaseUrl.includes('placeholder') ||
  supabaseUrl.includes('your-project') ||
  !supabaseAnon ||
  supabaseAnon === 'placeholder';

/**
 * Supabase client — digunakan di seluruh aplikasi (client-side).
 * URL & key dibaca dari environment variables (.env.local).
 */
export const supabase = isLocalMock
  ? // Jika env belum diisi, buat dummy client agar app tidak crash
    (null as any)
  : createClient(supabaseUrl, supabaseAnon, {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true,
      },
    });
