'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { HelpRequest } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  MapPin,
  Calendar,
  User,
  ArrowLeft,
  HeartHandshake,
  CheckCircle2,
  MessageCircle,
  Phone,
  Mail,
  Edit3,
  X,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast, notify } from '@/lib/notify';

function cleanPhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

function formatWhatsAppToRequester(phone: string, requesterName: string, volunteerName: string, title: string) {
  const clean = cleanPhone(phone);
  const msg = `Halo ${requesterName || 'Bapak/Ibu'}, saya relawan (${volunteerName || 'dari BantuanWarga'}) yang bersedia membantu permohonan Anda: "${title}". Kapan kita bisa berkoordinasi lebih lanjut?`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

function formatWhatsAppToVolunteer(phone: string, volunteerName: string, requesterName: string, title: string) {
  const clean = cleanPhone(phone);
  const msg = `Halo ${volunteerName || 'Kakak Relawan'}, saya pemohon (${requesterName || 'dari BantuanWarga'}) untuk permohonan bantuan: "${title}". Terima kasih banyak telah bersedia membantu. Kapan kita bisa berkoordinasi lebih lanjut?`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

export default function DetailBantuanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserMeta, setCurrentUserMeta] = useState<any>(null);
  const [authorName, setAuthorName] = useState<string>('Memuat...');

  // Modal State untuk Pendaftaran Relawan
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [volunteerPhoneInput, setVolunteerPhoneInput] = useState('');

  // Modal State untuk Edit/Tambah Nomor WhatsApp
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneModalType, setPhoneModalType] = useState<'volunteer' | 'author'>('volunteer');
  const [phoneModalValue, setPhoneModalValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const { data: sessionData }: any = await supabase.auth.getSession();
      if (active && sessionData?.session) {
        setCurrentUserId(sessionData.session.user.id);
        setCurrentUserMeta(sessionData.session.user.user_metadata || {});
      }

      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!active) return;

      if (!error && data) {
        setRequest(data);
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

  // Klik tombol "Saya Ingin Membantu"
  const handleOpenHelpModal = async () => {
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

    // Ambil default nomor HP dari metadata profil relawan jika ada
    const userPhone = session.user.user_metadata?.phone_number || session.user.user_metadata?.phone || '';
    setVolunteerPhoneInput(userPhone);
    setShowHelpModal(true);
  };

  // Konfirmasi aksi relawan dan simpan data
  const handleConfirmHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { data: sessionData }: any = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) throw new Error('Sesi telah berakhir, silakan login kembali.');

      const volunteerName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Relawan';
      const volunteerEmail = session.user.email || '';
      const volunteerId = session.user.id;
      const volunteerPhone = volunteerPhoneInput.trim();
      const helpedAt = new Date().toISOString();

      // Coba update dengan kolom volunteer_phone
      let updateRes = await supabase
        .from('help_requests')
        .update({
          status: 'selesai',
          volunteer_id: volunteerId,
          volunteer_name: volunteerName,
          volunteer_email: volunteerEmail,
          volunteer_phone: volunteerPhone || null,
          helped_at: helpedAt,
        })
        .eq('id', id);

      // Fallback jika tabel help_requests di remote database belum memiliki kolom volunteer_phone
      if (updateRes.error && updateRes.error.message?.toLowerCase().includes('volunteer_phone')) {
        updateRes = await supabase
          .from('help_requests')
          .update({
            status: 'selesai',
            volunteer_id: volunteerId,
            volunteer_name: volunteerName,
            volunteer_email: volunteerEmail,
            helped_at: helpedAt,
          })
          .eq('id', id);
      }

      if (updateRes.error) throw updateRes.error;

      // Update phone number di metadata profil akun jika relawan mengisi dan belum ada di profil
      if (volunteerPhone && !session.user.user_metadata?.phone_number) {
        supabase.auth.updateUser({
          data: { phone_number: volunteerPhone }
        }).catch(() => {});
      }

      setRequest((prev) =>
        prev ? {
          ...prev,
          status: 'selesai',
          volunteer_id: volunteerId,
          volunteer_name: volunteerName,
          volunteer_email: volunteerEmail,
          volunteer_phone: volunteerPhone || undefined,
          helped_at: helpedAt,
        } : null
      );

      setShowHelpModal(false);

      toast.success(
        `Terima kasih, ${volunteerName}! Anda resmi terdaftar sebagai relawan. Anda dan pemohon kini dapat langsung saling berkoordinasi via WhatsApp.`,
        { title: 'TERIMA KASIH, RELAWAN!' }
      );
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui status bantuan', { title: 'TERJADI KENDALA' });
    } finally {
      setUpdating(false);
    }
  };

  // Simpan/Perbarui nomor telepon WhatsApp untuk relawan atau pemohon
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneModalValue.trim()) {
      toast.error('Harap masukkan nomor WhatsApp yang valid', { title: 'PERIKSA NOMOR' });
      return;
    }

    setSavingPhone(true);
    const newPhone = phoneModalValue.trim();

    try {
      if (phoneModalType === 'volunteer') {
        let { error } = await supabase
          .from('help_requests')
          .update({ volunteer_phone: newPhone })
          .eq('id', id);

        if (error) throw error;

        setRequest((prev) => (prev ? { ...prev, volunteer_phone: newPhone } : null));

        // Simpan ke auth user metadata agar tersimpan permanen di profil
        supabase.auth.updateUser({
          data: { phone_number: newPhone }
        }).catch(() => {});

        toast.success('Nomor WhatsApp relawan berhasil disimpan.', { title: 'BERHASIL DISIMPAN' });
      } else {
        let { error } = await supabase
          .from('help_requests')
          .update({ author_phone: newPhone })
          .eq('id', id);

        if (error) throw error;

        setRequest((prev) => (prev ? { ...prev, author_phone: newPhone } : null));

        toast.success('Nomor WhatsApp pemohon berhasil disimpan.', { title: 'BERHASIL DISIMPAN' });
      }

      setShowPhoneModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan nomor WhatsApp', { title: 'KENDALA SISTEM' });
    } finally {
      setSavingPhone(false);
    }
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

  // Cek relasi pengguna yang sedang aktif
  const isAuthor = Boolean(currentUserId && currentUserId === request.user_id);
  const isVolunteer = Boolean(currentUserId && currentUserId === request.volunteer_id);

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
            isAuthor ? (
              <div className="font-mono text-xs text-text-primary p-3 bg-bg-slate-gray border-2 border-border-custom flex items-center justify-between gap-3">
                <div>
                  ℹ️ <strong>Maklumat Milik Anda:</strong> Ini adalah permohonan yang Anda pasang sendiri. Silakan tunggu tanggapan dari relawan warga.
                </div>
                {!request.author_phone && (
                  <button
                    onClick={() => {
                      setPhoneModalType('author');
                      setPhoneModalValue('');
                      setShowPhoneModal(true);
                    }}
                    className="font-mono text-[11px] font-bold text-text-primary underline flex items-center gap-1 flex-shrink-0"
                  >
                    <Edit3 size={12} />
                    Pasang No. WA Anda
                  </button>
                )}
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
                  onClick={handleOpenHelpModal}
                  disabled={updating}
                  className="w-full sm:w-auto px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider bg-text-primary text-background border-2 border-border-custom retro-btn flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
                >
                  <HeartHandshake size={15} />
                  <span>{updating ? 'Memproses...' : 'Saya Ingin Membantu'}</span>
                </button>
              </div>
            )
          ) : (
            /* STATUS SELESAI */
            <div className="space-y-4">
              <div className="font-mono text-xs font-bold text-text-primary p-3.5 bg-card border-2 border-border-custom flex items-center gap-2">
                <CheckCircle2 size={16} className="text-text-primary flex-shrink-0" />
                <span>[ STATUS SELESAI ]: Bantuan ini telah diselesaikan oleh relawan. Terima kasih atas kepedulian bersama!</span>
              </div>

              {/* KONDISI 1: JIKA PEMBUKA HALAMAN ADALAH PEMOHON -> HUBUNGI RELAWAN */}
              {isAuthor ? (
                <div className="p-5 sm:p-6 border-2 border-border-custom bg-card shadow-[3px_3px_0px_0px_var(--border)] space-y-4">
                  {/* Top Bar: Title & Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-border-custom pb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <h4 className="font-bold text-xs sm:text-sm text-text-primary uppercase tracking-wide font-mono">
                        Hubungi Relawan via WhatsApp
                      </h4>
                    </div>
                    <span className="font-mono text-[10px] px-2.5 py-0.5 border border-border-custom bg-bg-slate-gray text-text-muted font-bold whitespace-nowrap self-start sm:self-auto">
                      ✦ KOLABORASI PEMOHON
                    </span>
                  </div>

                  {/* Body: Deskripsi & Nomor Kontak */}
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                      {request.volunteer_phone
                        ? `Koordinasi langsung dengan relawan (${request.volunteer_name || 'Relawan'}) melalui WhatsApp untuk menyepakati waktu dan rincian bantuan.`
                        : `Relawan (${request.volunteer_name || 'Relawan'}) belum mencantumkan nomor WhatsApp langsung pada bantuan ini.`}
                    </p>

                    {request.volunteer_phone ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-slate-gray border border-border-custom font-mono text-xs text-text-primary">
                        <Phone size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>Nomor Kontak Relawan: <strong className="font-bold">{request.volunteer_phone}</strong></span>
                      </div>
                    ) : request.volunteer_email ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-slate-gray border border-border-custom font-mono text-xs text-text-primary">
                        <Mail size={13} className="text-text-muted flex-shrink-0" />
                        <span>Email Relawan: <strong className="font-bold">{request.volunteer_email}</strong></span>
                      </div>
                    ) : null}
                  </div>

                  {/* Footer: Tombol Aksi */}
                  <div className="pt-3 border-t border-border-custom/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-text-muted">
                      * Percakapan langsung via aplikasi WhatsApp
                    </div>

                    {request.volunteer_phone ? (
                      <a
                        href={formatWhatsAppToVolunteer(
                          request.volunteer_phone,
                          request.volunteer_name || 'Relawan',
                          authorName,
                          request.title
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-border-custom retro-btn inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                      >
                        <MessageCircle size={15} />
                        <span>Chat ke WhatsApp Relawan</span>
                      </a>
                    ) : request.volunteer_email ? (
                      <a
                        href={`mailto:${request.volunteer_email}?subject=${encodeURIComponent(`Koordinasi Bantuan: ${request.title}`)}`}
                        className="w-full sm:w-auto px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider bg-text-primary text-background border-2 border-border-custom retro-btn inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                      >
                        <Mail size={15} />
                        <span>Kirim Email ke Relawan</span>
                      </a>
                    ) : (
                      <div className="font-mono text-[11px] text-text-muted border border-border-custom/50 px-3 py-1.5 bg-bg-slate-gray">
                        Nomor WA Relawan Tidak Tersedia
                      </div>
                    )}
                  </div>
                </div>
              ) : isVolunteer ? (
                /* KONDISI 2: JIKA PEMBUKA HALAMAN ADALAH RELAWAN -> HUBUNGI PEMOHON */
                <div className="space-y-3">
                  <div className="p-5 sm:p-6 border-2 border-border-custom bg-card shadow-[3px_3px_0px_0px_var(--border)] space-y-4">
                    {/* Top Bar: Title & Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-border-custom pb-3">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <h4 className="font-bold text-xs sm:text-sm text-text-primary uppercase tracking-wide font-mono">
                          Hubungi Pemohon via WhatsApp
                        </h4>
                      </div>
                      <span className="font-mono text-[10px] px-2.5 py-0.5 border border-border-custom bg-bg-slate-gray text-text-muted font-bold whitespace-nowrap self-start sm:self-auto">
                        ✦ KOLABORASI RELAWAN
                      </span>
                    </div>

                    {/* Body: Deskripsi & Kontak */}
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                        {request.author_phone
                          ? `Koordinasi langsung dengan pemohon (${authorName}) melalui WhatsApp untuk menyepakati waktu dan rincian bantuan.`
                          : `Pemohon belum mencantumkan nomor WhatsApp langsung pada formulir permohonan ini.`}
                      </p>

                      {request.author_phone && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-slate-gray border border-border-custom font-mono text-xs text-text-primary">
                          <Phone size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span>Nomor Kontak Pemohon: <strong className="font-bold">{request.author_phone}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Footer: Tombol Aksi */}
                    <div className="pt-3 border-t border-border-custom/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] font-mono text-text-muted">
                        * Percakapan langsung via aplikasi WhatsApp
                      </div>

                      {request.author_phone ? (
                        <a
                          href={formatWhatsAppToRequester(
                            request.author_phone,
                            authorName,
                            request.volunteer_name || 'Relawan',
                            request.title
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-border-custom retro-btn inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                        >
                          <MessageCircle size={15} />
                          <span>Chat ke WhatsApp Pemohon</span>
                        </a>
                      ) : (
                        <div className="font-mono text-[11px] text-text-muted border border-border-custom/50 px-3 py-1.5 bg-bg-slate-gray">
                          Nomor WA Pemohon Tidak Tersedia
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pengingat untuk relawan jika nomor WA-nya sendiri belum tercatat di sistem */}
                  {!request.volunteer_phone && (
                    <div className="p-3.5 bg-bg-slate-gray border-2 border-border-custom font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-text-muted">
                        <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
                        <span>Nomor WhatsApp Anda belum tercatat pada bantuan ini. Pasang nomor agar pemohon juga dapat menghubungi Anda balik.</span>
                      </div>
                      <button
                        onClick={() => {
                          setPhoneModalType('volunteer');
                          setPhoneModalValue(currentUserMeta?.phone_number || currentUserMeta?.phone || '');
                          setShowPhoneModal(true);
                        }}
                        className="font-bold underline text-text-primary hover:text-emerald-600 transition-colors flex-shrink-0 whitespace-nowrap"
                      >
                        [+ Pasang No. WhatsApp Relawan]
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* KONDISI 3: PENGUNJUNG UMUM / WARGA LAINNYA */
                <div className="p-5 sm:p-6 border-2 border-border-custom bg-card shadow-[3px_3px_0px_0px_var(--border)] space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-border-custom pb-3">
                    <h4 className="font-bold text-xs sm:text-sm text-text-primary uppercase tracking-wide font-mono flex items-center gap-2">
                      <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                      Saluran Koordinasi Bantuan (WhatsApp)
                    </h4>
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-border-custom bg-bg-slate-gray text-text-muted font-bold whitespace-nowrap">
                      UMUM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Kontak Pemohon */}
                    <div className="p-3.5 bg-bg-slate-gray border-2 border-border-custom flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-mono text-xs font-bold text-text-primary">
                          👤 PEMOHON: {authorName}
                        </div>
                        <p className="font-mono text-[11px] text-text-muted">
                          {request.author_phone ? `No. Kontak: ${request.author_phone}` : 'Nomor kontak belum dicantumkan'}
                        </p>
                      </div>
                      {request.author_phone && (
                        <a
                          href={formatWhatsAppToRequester(
                            request.author_phone,
                            authorName,
                            request.volunteer_name || 'Relawan',
                            request.title
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 font-mono text-[11px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white border border-border-custom retro-btn inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <MessageCircle size={13} />
                          <span>Hubungi Pemohon</span>
                        </a>
                      )}
                    </div>

                    {/* Kontak Relawan */}
                    <div className="p-3.5 bg-bg-slate-gray border-2 border-border-custom flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-mono text-xs font-bold text-text-primary">
                          🤝 RELAWAN: {request.volunteer_name || 'Relawan Warga'}
                        </div>
                        <p className="font-mono text-[11px] text-text-muted">
                          {request.volunteer_phone ? `No. Kontak: ${request.volunteer_phone}` : 'Nomor kontak belum dicantumkan'}
                        </p>
                      </div>
                      {request.volunteer_phone && (
                        <a
                          href={formatWhatsAppToVolunteer(
                            request.volunteer_phone,
                            request.volunteer_name || 'Relawan',
                            authorName,
                            request.title
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 font-mono text-[11px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white border border-border-custom retro-btn inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <MessageCircle size={13} />
                          <span>Hubungi Relawan</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Volunteer Info Card */}
              {request.volunteer_name && (
                <div className="bg-bg-slate-gray border-2 border-border-custom p-3.5 font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold uppercase tracking-wider text-text-muted text-[10px]">
                      ✦ IDENTITAS RELAWAN PENOLONG
                    </div>
                    {isVolunteer && (
                      <button
                        onClick={() => {
                          setPhoneModalType('volunteer');
                          setPhoneModalValue(request.volunteer_phone || currentUserMeta?.phone_number || '');
                          setShowPhoneModal(true);
                        }}
                        className="text-[10px] font-bold text-text-primary underline hover:text-emerald-600 transition-colors flex items-center gap-1"
                      >
                        <Edit3 size={10} />
                        {request.volunteer_phone ? 'Ubah No. WA Relawan' : '+ Pasang No. WA Relawan'}
                      </button>
                    )}
                  </div>

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

                  {request.volunteer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-text-primary font-bold">{request.volunteer_phone}</span>
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

      {/* MODAL 1: FORM PENDAFTARAN RELAWAN DENGAN INPUT WHATSAPP */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border-custom max-w-md w-full p-6 shadow-[6px_6px_0px_0px_var(--border)] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b-2 border-border-custom pb-3">
              <h3 className="font-mono font-bold text-sm text-text-primary uppercase flex items-center gap-2">
                <HeartHandshake size={16} />
                Konfirmasi Menjadi Relawan
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-text-muted hover:text-text-primary font-mono text-xs"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-bg-slate-gray border border-border-custom space-y-1">
                <div className="text-text-muted text-[11px]">BANTUAN YANG AKAN DITOLONG:</div>
                <div className="font-bold text-text-primary text-sm uppercase">{request.title}</div>
                <div className="text-text-muted text-[11px] pt-1">
                  Pemohon: <strong>{authorName}</strong> • Lokasi: <strong>{request.location}</strong>
                </div>
              </div>

              <form onSubmit={handleConfirmHelp} className="space-y-4 pt-1">
                <div>
                  <label className="block font-bold text-text-primary mb-1 text-[11px] uppercase tracking-wide">
                    Nomor WhatsApp Anda (Relawan):
                  </label>
                  <input
                    type="tel"
                    value={volunteerPhoneInput}
                    onChange={(e) => setVolunteerPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-card border-2 border-border-custom font-mono text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-custom"
                  />
                  <p className="text-[10px] text-text-muted mt-1 leading-normal">
                    * Nomor ini akan diberikan kepada pemohon ({authorName}) agar pemohon dapat menghubungi Anda langsung via WhatsApp untuk koordinasi.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t-2 border-border-custom">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    disabled={updating}
                    className="px-4 py-2 font-mono text-xs font-bold uppercase bg-bg-slate-gray border-2 border-border-custom hover:bg-border-custom/20 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 font-mono text-xs font-bold uppercase bg-text-primary text-background border-2 border-border-custom retro-btn inline-flex items-center gap-1.5"
                  >
                    <HeartHandshake size={14} />
                    <span>{updating ? 'Menyimpan...' : 'Ya, Saya Bantu Sekarang!'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UBAH/TAMBAH NOMOR WHATSAPP LANGSUNG */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border-custom max-w-sm w-full p-6 shadow-[6px_6px_0px_0px_var(--border)] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b-2 border-border-custom pb-3">
              <h3 className="font-mono font-bold text-xs uppercase text-text-primary flex items-center gap-2">
                <Phone size={14} />
                {phoneModalType === 'volunteer' ? 'Nomor WhatsApp Relawan' : 'Nomor WhatsApp Pemohon'}
              </h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-text-primary mb-1 text-[11px] uppercase">
                  Masukkan Nomor WhatsApp:
                </label>
                <input
                  type="tel"
                  autoFocus
                  value={phoneModalValue}
                  onChange={(e) => setPhoneModalValue(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-card border-2 border-border-custom font-mono text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t-2 border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  disabled={savingPhone}
                  className="px-3 py-1.5 font-mono text-xs font-bold uppercase bg-bg-slate-gray border-2 border-border-custom"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPhone}
                  className="px-4 py-1.5 font-mono text-xs font-bold uppercase bg-text-primary text-background border-2 border-border-custom retro-btn"
                >
                  {savingPhone ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
