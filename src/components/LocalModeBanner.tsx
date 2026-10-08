'use client';

import React, { useEffect, useState } from 'react';
import { isLocalMock } from '@/lib/supabase';
import { Database, UserCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LocalModeBanner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!mounted || !isLocalMock) return null;

  const quickLogin = async (email: string, name: string, id: string) => {
    try {
      const user = {
        id,
        email,
        user_metadata: { full_name: name },
      };
      const session = {
        user,
        access_token: 'mock-local-token',
      };
      localStorage.setItem('wargabantu_session', JSON.stringify(session));
      toast.success(`Masuk sebagai: ${name}`);
      window.location.reload();
    } catch {
      toast.error('Gagal login cepat');
    }
  };

  const resetData = () => {
    if (confirm('Kembalikan data permohonan ke data awal di localhost?')) {
      localStorage.removeItem('wargabantu_requests');
      localStorage.removeItem('wargabantu_session');
      toast.success('Database localhost berhasil di-reset!');
      window.location.reload();
    }
  };

  return (
    <aside aria-label="Informasi Database Lokal" className="bg-card border-b-2 border-border-custom text-text-primary px-4 py-2 text-xs font-mono transition-colors">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-text-primary flex-shrink-0" />
          <span>
            <strong>[ DATABASE LOCALHOST AKTIF ]</strong> BantuanWarga berjalan secara lokal di peramban.
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-text-muted hidden sm:inline">Uji Akun:</span>
          <button
            onClick={() => quickLogin('hendra@padang.id', 'Pak Hendra (Pemohon)', 'user-warga-1')}
            className="px-2.5 py-1 border border-border-custom bg-card hover:bg-text-primary hover:text-background font-bold transition-colors flex items-center gap-1"
            title="Masuk sebagai akun pembuat bantuan"
          >
            <UserCheck size={12} />
            Pemohon
          </button>
          <button
            onClick={() => quickLogin('relawan@peduli.id', 'Rian Relawan (Penolong)', 'user-relawan-2')}
            className="px-2.5 py-1 border border-border-custom bg-text-primary text-background hover:opacity-90 font-bold transition-colors flex items-center gap-1"
            title="Masuk sebagai akun relawan untuk tombol bantu"
          >
            <UserCheck size={12} />
            Relawan
          </button>
          <button
            onClick={resetData}
            className="px-2 py-1 border border-dashed border-border-custom hover:bg-bg-slate-gray rounded-none text-text-muted flex items-center gap-1"
            title="Reset database localhost ke data contoh awal"
          >
            <RefreshCw size={11} />
            Reset Data
          </button>
        </div>
      </div>
    </aside>
  );
}
