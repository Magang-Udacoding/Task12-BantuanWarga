'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/lib/notify';
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'register';
}

/** Icon Google SVG (tidak butuh package tambahan) */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.000 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.316 0-9.828-3.417-11.42-8.203l-6.534 5.032C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = type === 'login';

  // Jika user sudah login, arahkan langsung ke halaman beranda (/)
  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      if (res?.data?.session?.user) {
        router.replace('/');
      }
    });

    const { data: { subscription } }: any = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        router.replace('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  // Tampilkan error dari URL (misal: redirect balik dari OAuth callback gagal)
  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      toast.error(decodeURIComponent(errorMsg), {
        title: 'LOGIN GAGAL',
      });
    }
  }, [searchParams]);

  // ─── Email/Password Submit ───────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast.success('Selamat datang kembali! Anda berhasil masuk ke akun BantuanWarga.', {
          title: 'LOGIN BERHASIL!',
        });
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2100);
      } else {
        if (password.length < 6) throw new Error('Kata sandi minimal 6 karakter');

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;

        toast.success('Akun Anda berhasil dibuat! Silakan masuk untuk menggunakan BantuanWarga.', {
          title: 'PENDAFTARAN BERHASIL!',
        });
        setTimeout(() => router.push('/login'), 2100);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan. Periksa kembali email dan kata sandi Anda.', {
        title: isLogin ? 'LOGIN GAGAL' : 'PENDAFTARAN GAGAL',
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Google OAuth ────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // Browser akan diarahkan ke Google — loading state tetap aktif
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghubungkan ke Google. Coba lagi.', {
        title: 'GOOGLE LOGIN GAGAL',
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card p-6 sm:p-8 border-2 border-border-custom shadow-[4px_4px_0px_0px_var(--border)] mx-auto">
      {/* Header */}
      <div className="text-center pb-4 mb-6 border-b-2 border-border-custom">
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted block mb-1">
          § BUKU INDUK IDENTITAS WARGA
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
          {isLogin ? 'Masuk ke BantuanWarga' : 'Daftar Akun BantuanWarga'}
        </h2>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          {isLogin
            ? 'Gunakan akun Anda untuk mengajukan atau merespons permohonan.'
            : 'Bergabunglah bersama masyarakat dalam gerakan tolong-menolong.'}
        </p>
      </div>

      {/* ── Tombol Google OAuth ── */}
      <div className="mb-5">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider bg-card text-text-primary border-2 border-border-custom retro-btn disabled:opacity-50 flex items-center justify-center gap-2.5"
        >
          {googleLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading
            ? 'Menghubungkan ke Google...'
            : isLogin
              ? 'Masuk dengan Google'
              : 'Daftar dengan Google'}
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-[2px] bg-border-custom" />
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest whitespace-nowrap">
          atau dengan email
        </span>
        <div className="flex-1 h-[2px] bg-border-custom" />
      </div>

      {/* ── Form Email/Password ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider font-bold text-text-primary mb-1">
              Nama Lengkap:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <UserIcon size={14} />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border-2 border-border-custom bg-input-bg text-text-primary font-mono text-xs sm:text-sm rounded-none focus:outline-none"
                placeholder="Nama Lengkap Anda"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block font-mono text-xs uppercase tracking-wider font-bold text-text-primary mb-1">
            Alamat Email:
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Mail size={14} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border-2 border-border-custom bg-input-bg text-text-primary font-mono text-xs sm:text-sm rounded-none focus:outline-none"
              placeholder="nama@domain.com"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-wider font-bold text-text-primary mb-1">
            Kata Sandi:
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Lock size={14} />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border-2 border-border-custom bg-input-bg text-text-primary font-mono text-xs sm:text-sm rounded-none focus:outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider bg-text-primary text-background border-2 border-border-custom retro-btn disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Memproses...' : isLogin ? 'Masuk ke Akun' : 'Daftarkan Akun'}
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-4 text-center font-mono text-xs text-text-muted">
        {isLogin ? (
          <p>
            Belum punya akun?{' '}
            <a href="/register" className="font-bold text-text-primary underline">
              Daftar di sini &rarr;
            </a>
          </p>
        ) : (
          <p>
            Sudah punya akun?{' '}
            <a href="/login" className="font-bold text-text-primary underline">
              Masuk di sini &rarr;
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
