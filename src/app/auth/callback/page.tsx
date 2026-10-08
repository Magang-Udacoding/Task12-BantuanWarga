'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from '@/lib/notify';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Memverifikasi identitas Anda...');

  useEffect(() => {
    let isHandled = false;

    async function processAuth() {
      try {
        const error = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');

        if (error || errorDesc) {
          throw new Error(errorDesc || error || 'Gagal masuk dengan Google.');
        }

        const code = searchParams.get('code');

        if (code) {
          // Tukar authorization code dengan session di sisi client (browser memiliki PKCE code_verifier di localStorage)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('[Auth Callback] exchangeCodeForSession notice:', exchangeError);
          }
        }

        // Cek apakah session sudah tersedia di localStorage
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && !isHandled) {
          isHandled = true;
          setStatus('Autentikasi berhasil! Mengalihkan ke halaman beranda...');
          toast.success('Selamat datang! Anda berhasil masuk dengan Google.', {
            title: 'LOGIN BERHASIL!',
          });
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          return;
        }

        // Listener jika pertukaran kode sedang diproses asinkron oleh supabase-js
        const { data: { subscription } }: any = supabase.auth.onAuthStateChange((_event: any, session: any) => {
          if (session?.user && !isHandled) {
            isHandled = true;
            subscription.unsubscribe();
            setStatus('Autentikasi berhasil! Mengalihkan ke halaman beranda...');
            toast.success('Selamat datang! Anda berhasil masuk dengan Google.', {
              title: 'LOGIN BERHASIL!',
            });
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          }
        });

        // Timeout fallback jika tidak ada sesi yang terbentuk setelah 4 detik
        setTimeout(async () => {
          if (!isHandled) {
            const { data: { session: finalCheck } } = await supabase.auth.getSession();
            if (finalCheck?.user) {
              isHandled = true;
              window.location.href = '/';
            } else {
              isHandled = true;
              toast.error('Sesi autentikasi tidak ditemukan. Silakan coba masuk kembali.', {
                title: 'LOGIN GAGAL',
              });
              router.replace('/login?error=' + encodeURIComponent('Gagal menyelesaikan proses login Google. Coba lagi.'));
            }
          }
        }, 4000);

      } catch (err: any) {
        if (!isHandled) {
          isHandled = true;
          console.error('[OAuth Callback Error]', err);
          toast.error(err.message || 'Gagal menyelesaikan autentikasi Google.', {
            title: 'LOGIN GAGAL',
          });
          setTimeout(() => {
            router.replace('/login?error=' + encodeURIComponent(err.message || 'Gagal login dengan Google'));
          }, 1800);
        }
      }
    }

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-md bg-card p-6 sm:p-8 border-2 border-border-custom shadow-[4px_4px_0px_0px_var(--border)] text-center space-y-4">
      <div className="inline-block border-2 border-border-custom px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted bg-bg-slate-gray">
        ✦ SISTEM OTENTIKASI WARGA ✦
      </div>
      <div className="flex justify-center my-4">
        <Loader2 size={36} className="animate-spin text-text-primary" />
      </div>
      <h2 className="text-lg sm:text-xl font-black text-text-primary uppercase tracking-tight">
        {status}
      </h2>
      <p className="font-mono text-xs text-text-muted leading-relaxed">
        Sedang memverifikasi data akun Google Anda. Anda akan otomatis dialihkan ke halaman beranda.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-10 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background min-h-[calc(100vh-140px)]">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-card p-8 border-2 border-border-custom text-center font-mono text-xs text-text-muted">
            Memuat otentikasi...
          </div>
        }
      >
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
