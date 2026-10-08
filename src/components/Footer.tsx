import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-2 border-border-custom bg-card mt-auto transition-colors">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between text-xs font-mono">
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 justify-center sm:justify-start">
            <span className="font-bold text-sm tracking-tight text-text-primary uppercase">BantuanWarga</span>
            <span className="text-text-muted hidden sm:inline">|</span>
            <Link href="/" className="hover:underline text-text-primary">Beranda</Link>
            <span className="text-text-muted">|</span>
            <Link href="/dashboard" className="hover:underline text-text-primary">Papan Bantuan</Link>
            <span className="text-text-muted">|</span>
            <Link href="/minta-bantu" className="hover:underline text-text-primary">Ajukan Bantuan</Link>
          </div>
          <div className="text-[10px] sm:text-xs text-text-muted text-center sm:text-right leading-relaxed">
            BantuanWarga &copy; {new Date().getFullYear()} &bull; Dikelola oleh Hilmi Muhammad Faiz
          </div>
        </div>
      </div>
    </footer>
  );
}
