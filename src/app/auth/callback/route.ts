import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * OAuth Callback Route — /auth/callback
 *
 * Supabase mengarahkan user ke sini setelah login Google berhasil.
 * Route ini menukar "code" dengan session yang valid, lalu redirect ke dashboard.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect ke dashboard setelah OAuth berhasil
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Jika ada error, redirect ke login dengan pesan error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Login Google gagal. Coba lagi.')}`
    );
  }

  // Tidak ada code → redirect ke login
  return NextResponse.redirect(`${origin}/login`);
}
