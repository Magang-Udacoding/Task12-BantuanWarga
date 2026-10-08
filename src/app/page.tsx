import Link from 'next/link';
import RecentRequests from '@/components/RecentRequests';
import { PlusCircle, ClipboardList, Shield, HeartHandshake, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Retro Welcome Bulletin Board Banner */}
      <section className="bg-card border-2 border-border-custom p-6 sm:p-8 md:p-10 shadow-[4px_4px_0px_0px_var(--border)] text-center relative overflow-hidden">
        <div className="inline-block border-2 border-border-custom px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-text-muted mb-4 bg-bg-slate-gray">
          ✦ PAPAN MAKLUMAT RESMI WARGA ✦
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight uppercase mb-4 leading-tight">
          Saling Bantu Warga &amp; Jaga Warga
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-muted leading-relaxed mb-8">
          Platform gotong royong swadaya masyarakat. Siapa pun yang mengalami keterbatasan atau membutuhkan bantuan darurat dapat memasang maklumat di sini; siapa pun yang berkesempatan dapat langsung mengulurkan tangan sebagai relawan.
        </p>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            href="/minta-bantu"
            className="w-full sm:w-auto px-6 py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider bg-text-primary text-background border-2 border-border-custom retro-btn flex items-center justify-center gap-2"
          >
            <PlusCircle size={15} />
            <span>Ajukan Bantuan</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider bg-card text-text-primary border-2 border-border-custom retro-btn flex items-center justify-center gap-2"
          >
            <ClipboardList size={15} />
            <span>Lihat Papan Bantuan</span>
          </Link>
        </div>

        {/* Principles Strip */}
        <div className="mt-8 pt-6 border-t-2 border-border-custom grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-text-muted text-center">
          <div className="flex items-center justify-center gap-2">
            <Shield size={14} className="text-text-primary" />
            <span>100% Swadaya &amp; Terbuka</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <HeartHandshake size={14} className="text-text-primary" />
            <span>Gotong Royong Tanpa Pamrih</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ClipboardList size={14} className="text-text-primary" />
            <span>Tercatat dan Terverifikasi</span>
          </div>
        </div>
      </section>

      {/* Realtime Bulletin Board Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-border-custom pb-3 gap-2">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
              § WARTA BANTUAN MUTAKHIR — REALTIME
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
              Permohonan Terbaru di Papan
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="font-mono text-xs font-bold uppercase tracking-wider text-text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Buka Semua Permohonan</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Realtime card grid */}
        <RecentRequests />

        <div className="pt-4 text-center">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider border-2 border-border-custom bg-card text-text-primary retro-btn"
          >
            [ Telusuri Seluruh Maklumat di Papan Bantuan → ]
          </Link>
        </div>
      </section>
    </div>
  );
}
