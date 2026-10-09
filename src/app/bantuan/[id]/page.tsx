'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { HelpRequest } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { MapPin, Calendar, User, ArrowLeft, HeartHandshake, CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast, notify } from '@/lib/notify';

function formatWhatsAppLink(phone: string, requesterName: string, title: string) {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  const msg = `Halo ${requesterName || 'Bapak/Ibu'}, saya relawan dari BantuanWarga yang bersedia membantu permohonan Anda: "${title}". Kapan kita bisa berkoordinasi lebih lanjut?`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

export default function DetailBantuanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>('Memuat...');

  useEffect(() => {
    let active = true;

    async function loadData() {
      const { data: sessionData }: any = await supabase.auth.getSession();
      if (active && sessionData?.session) {
        setCurrentUserId(sessionData.session.user.id);
      }

      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!active) return;

      if (!error && data) {
        setRequest(data);
        // author_name tersimpan langsung di kolom help_requests
        setAuthorName(
          (data as any).author_name ||
          (data as any).user_id?.slice(0, 8) + '...' ||
          'Warga Terdaftar'
        );
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  const handleHelp = async () => {
    const { data: sessionData }: any = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) {
      toast.error('Silakan login terlebih dahulu untuk membantu', { title: 'AKSES DIPERLUKAN' });
      router.push('/login');
      return;
    }

    if (session.user.id === request?.user_id) {
      toast.error('Anda tidak dapat membantu permohonan yang Anda buat sendiri.', { title: 'TIDAK DIIZINKAN' });
      return;
    }

    notify.confirm({
      title: 'KONFIRMASI TINDAKAN RELAWAN',
      message: `Apakah Anda yakin ingin menyatakan diri sebagai relawan untuk permohonan:\n"${request?.title}"?\n\nStatus akan berubah menjadi SELESAI dan Anda dapat langsung berkoordinasi via WhatsApp.`,
      confirmText: 'Ya, Saya Bantu!',
      cancelText: 'Batal',
      onConfirm: async () => {
        setUpdating(true);
        try {
          const volunteerName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Relawan';
          const volunteerEmail = session.user.email || '';
          const volunteerId = session.user.id;
          const helpedAt = new Date().toISOString();

          const { error } = await supabase
            .from('help_requests')
            .update({
              status: 'selesai',
              volunteer_id: volunteerId,
              volunteer_name: volunteerName,
              volunteer_email: volunteerEmail,
              helped_at: helpedAt,
            })
            .eq('id', id);

          if (error) throw error;

          setRequest((prev) =>
            prev ? {
              ...prev,
              status: 'selesai',
              volunteer_id: volunteerId,
              volunteer_name: volunteerName,
              volunteer_email: volunteerEmail,
              helped_at: helpedAt,
            } : null
          );
          toast.success(
            `Terima kasih, ${volunteerName}! Anda terdaftar sebagai relawan. Silakan gunakan tombol WhatsApp di bawah untuk menghubungi pemohon.`,
            { title: 'TERIMA KASIH, RELAWAN!' }
          );
        } catch (error: any) {
          toast.error(error.message || 'Gagal memperbarui status', { title: 'TERJADI KENDALA' });
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 font-mono text-xs text-text-muted">
        <span>Memuat maklumat bantuan...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-card border-2 border-border-custom text-center">
        <h2 className="font-mono font-bold text-sm text-text-primary mb-1">Maklumat Tidak Ditemukan</h2>
        <p className="font-mono text-xs text-text-muted mb-4">
          Permohonan bantuan ini mungkin telah dihapus dari papan.
        </p>
        <button
          onClick={() => router.back()}
          className="font-mono text-xs font-bold text-text-primary underline"
        >
          [ &larr; Kembali ke Papan Bantuan ]
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-text-muted hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={13} />
        Kembali ke Papan Bantuan
      </button>

      {/* Retro Bulletin Detail Card */}
      <article className="bg-card border-2 border-border-custom p-6 sm:p-8 md:p-10 shadow-[4px_4px_0px_0px_var(--border)] space-y-6">
        {/* Header Tag & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border-custom pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
            § KATEGORI: {request.category.toUpperCase()}
          </span>
          <StatusBadge status={request.status} />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary uppercase tracking-tight leading-snug">
          {request.title}
        </h1>

        {/* Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-3 bg-bg-slate-gray border-2 border-border-custom font-mono text-xs text-text-muted">
          <div className="flex items-center gap-1.5 truncate">
            <User size={13} className="flex-shrink-0" />
            <span className="truncate">Pemohon: <strong>{authorName}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{request.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="flex-shrink-0" />
            <span>
              {(() => {
                if (!request.created_at) return '-';
                const d = new Date(request.created_at);
                if (isNaN(d.getTime())) return '-';
                return format(d, 'dd MMM yyyy, HH:mm', { locale: localeId });
              })()}
            </span>
          </div>
        </div>

        {/* Description Body */}
        <div>
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Uraian Kondisi &amp; Kebutuhan:
          </h2>
          <div className="text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed">
            {request.description}
          </div>
        </div>

        {/* Action Bottom Strip */}
        <div className="pt-6 border-t-2 border-border-custom">
          {request.status === 'menunggu' ? (
            currentUserId === request.user_id ? (
              <div className="font-mono text-xs text-text-primary p-3 bg-bg-slate-gray border-2 border-border-custom">
                ℹ️ <strong>Maklumat Milik Anda:</strong> Ini adalah permohonan yang Anda pasang sendiri. Silakan tunggu tanggapan dari relawan warga.
              </div>
            ) : (
              <div className="bg-bg-slate-gray p-4 sm:p-5 border-2 border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-text-primary">
                    Bersedia Mengulurkan Tangan?
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Klik tombol di samping untuk menyatakan komitmen Anda dalam membantu permohonan warga ini.
                  </p>
                </div>
                <button
                  onClick={handleHelp}
                  disabled={updating}
                  className="w-full sm:w-auto px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider bg-text-primary text-background border-2 border-border-custom retro-btn flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
                >
                  <HeartHandshake size={15} />
                  <span>{updating ? 'Memproses...' : 'Saya Ingin Membantu'}</span>
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="font-mono text-xs font-bold text-text-primary p-3.5 bg-card border-2 border-border-custom flex items-center gap-2">
                <CheckCircle2 size={16} className="text-text-primary flex-shrink-0" />
                <span>[ STATUS SELESAI ]: Bantuan ini telah diselesaikan oleh relawan. Terima kasih atas kepedulian bersama!</span>
              </div>

              {/* WhatsApp Chat Button to Requester */}
              <div className="p-4 sm:p-5 border-2 border-border-custom bg-card space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-text-primary uppercase tracking-wide flex items-center gap-2 font-mono">
                      <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                      Hubungi Pemohon via WhatsApp
                    </h4>
                    <p className="text-xs text-text-muted max-w-md">
                      {request.author_phone
                        ? `Koordinasi langsung dengan pemohon (${authorName}) melalui WhatsApp untuk menyepakati waktu dan rincian bantuan.`
                        : `Pemohon belum mencantumkan nomor WhatsApp langsung pada formulir permohonan ini.`}
                    </p>
                    {request.author_phone && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted pt-0.5">
                        <Phone size={11} />
                        <span>Nomor Kontak: <strong>{request.author_phone}</strong></span>
                      </div>
                    )}
                  </div>

                  {request.author_phone ? (
                    <a
                      href={formatWhatsAppLink(request.author_phone, authorName, request.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-border-custom retro-btn inline-flex items-center justify-center gap-2 flex-shrink-0 transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span>Chat ke WhatsApp</span>
                    </a>
                  ) : (
                    <div className="font-mono text-[11px] text-text-muted border border-border-custom/50 px-3 py-1.5 bg-bg-slate-gray">
                      Nomor WA Tidak Tersedia
                    </div>
                  )}
                </div>
              </div>

              {/* Volunteer info card */}
              {request.volunteer_name && (
                <div className="bg-bg-slate-gray border-2 border-border-custom p-3.5 font-mono text-xs space-y-1">
                  <div className="font-bold uppercase tracking-wider text-text-muted text-[10px] mb-2">✦ IDENTITAS RELAWAN PENOLONG</div>
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-text-muted flex-shrink-0" />
                    <span><strong>{request.volunteer_name}</strong></span>
                  </div>
                  {request.volunteer_email && (
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted ml-0.5">@</span>
                      <span className="text-text-muted">{request.volunteer_email}</span>
                    </div>
                  )}
                  {request.helped_at && (
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-text-muted flex-shrink-0" />
                      <span className="text-text-muted">
                        Membantu pada: {format(
                          new Date(request.helped_at),
                          'dd MMM yyyy, HH:mm',
                          { locale: localeId }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </article>

    </div>
  );
}
