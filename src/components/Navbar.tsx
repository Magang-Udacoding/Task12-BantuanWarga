'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Sun, Moon, Menu, X, PlusCircle, ClipboardList, Home, FolderKanban } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast, notify } from '@/lib/notify';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<string>('light');

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      setUser(res?.data?.session?.user || null);
    });

    const { data: { subscription } }: any = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    notify.confirm({
      title: 'KELUAR DARI AKUN?',
      message: 'Apakah Anda yakin ingin keluar dari akun BantuanWarga? Anda perlu login kembali untuk mengajukan bantuan.',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          await supabase.auth.signOut();
          toast.success('Anda berhasil keluar dari akun. Sampai jumpa kembali!', {
            title: 'BERHASIL KELUAR',
          });
          // Tunda navigasi agar notifikasi sempat tampil 2 detik
          setTimeout(() => router.push('/'), 2100);
        } catch {
          toast.error('Gagal keluar dari akun. Coba lagi.', { title: 'GAGAL KELUAR' });
        }
      },
    });
  };

  const navLinks = [
    { name: 'Beranda', href: '/', icon: Home },
    { name: 'Papan Bantuan', href: '/dashboard', icon: ClipboardList },
    { name: 'Ajukan Bantuan', href: '/minta-bantu', icon: PlusCircle },
    ...(user ? [{ name: 'Bantuan Saya', href: '/bantuan-saya', icon: FolderKanban }] : []),
  ];

  return (
    <header className="bg-card border-b-2 border-border-custom sticky top-0 z-40 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
        {/* Single row: logo | nav | actions */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">

          {/* Logo */}
          <Link href="/" className="flex flex-col group flex-shrink-0 leading-tight">
            <span className="font-mono text-[8px] sm:text-[10px] tracking-widest uppercase text-text-muted hidden xs:block">
              Papan Solidaritas
            </span>
            <span className="text-lg sm:text-2xl font-black tracking-tight text-text-primary uppercase group-hover:underline">
              BantuanWarga
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-1.5 lg:gap-2 flex-1 justify-center">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`h-9 px-2.5 lg:px-3.5 text-[11px] lg:text-xs font-bold uppercase tracking-wide border-2 border-border-custom transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-text-primary text-background shadow-[2px_2px_0px_0px_var(--border)]'
                      : 'bg-card text-text-primary hover:bg-bg-slate-gray'
                  }`}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right: theme + user */}
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center border-2 border-border-custom bg-card text-text-primary hover:bg-bg-slate-gray transition-colors cursor-pointer"
              title="Ganti Mode"
              aria-label="Ganti tema"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {user ? (
              <div className="h-9 flex items-center border-2 border-border-custom bg-card px-2 gap-2">
                <User size={13} className="text-text-muted flex-shrink-0" />
                <span className="text-[11px] font-bold text-text-primary max-w-[90px] lg:max-w-[140px] truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="h-6 px-2 text-[10px] font-bold uppercase border-2 border-border-custom bg-text-primary text-background hover:opacity-80 whitespace-nowrap cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="h-9 px-3 text-[11px] font-bold uppercase tracking-wide border-2 border-border-custom bg-text-primary text-background hover:opacity-80 transition-opacity flex items-center justify-center whitespace-nowrap cursor-pointer shadow-[2px_2px_0px_0px_var(--border)]"
              >
                Masuk / Daftar
              </Link>
            )}
          </div>

          {/* Mobile Right: theme + hamburger */}
          <div className="flex items-center md:hidden gap-1.5">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center border-2 border-border-custom bg-card text-text-primary"
              aria-label="Toggle tema"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="h-9 w-9 flex items-center justify-center border-2 border-border-custom bg-card text-text-primary hover:bg-bg-slate-gray"
              aria-label="Menu navigasi"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t-2 border-border-custom bg-card">
          <nav className="px-3 pt-3 pb-2 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 h-11 text-xs font-bold uppercase tracking-wider border-2 ${
                    isActive
                      ? 'bg-text-primary text-background border-border-custom'
                      : 'border-border-custom text-text-primary hover:bg-bg-slate-gray'
                  }`}
                >
                  <Icon size={15} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-3 pt-1 border-t-2 border-border-custom/40 space-y-1.5">
            {user ? (
              <>
                <div className="text-[11px] text-text-muted px-1 py-1 font-mono">
                  Akun: <strong>{user.user_metadata?.full_name || user.email}</strong>
                </div>
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="w-full text-center px-3 h-11 text-xs font-bold uppercase tracking-wider border-2 border-border-custom bg-card text-text-primary hover:bg-bg-slate-gray cursor-pointer"
                >
                  Keluar dari Akun
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full h-11 text-xs font-bold uppercase tracking-wider border-2 border-border-custom bg-text-primary text-background"
              >
                Masuk / Daftar Akun
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
