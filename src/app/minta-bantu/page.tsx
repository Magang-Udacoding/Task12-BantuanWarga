'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast, notify } from '@/lib/notify';
import { CATEGORIES } from '@/types';
import dynamic from 'next/dynamic';
import { PenLine, Map, ArrowLeft } from 'lucide-react';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[240px] flex items-center justify-center bg-card border-2 border-border-custom font-mono text-xs text-text-muted">
      <span>Memuat peta penunjuk lokasi...</span>
    </div>
  ),
});

export default function MintaBantuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>('');
  const [locationMode, setLocationMode] = useState<'manual' | 'map'>('manual');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    location: '',
    phone: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      // getUser() selalu verifikasi ke server Supabase (lebih reliable dari getSession)
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error('Silakan login terlebih dahulu untuk mengajukan bantuan');
        router.push('/login');
      } else {
        setUserId(user.id);
        setAuthorName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Warga Anonim'
        );
        if (user.user_metadata?.phone_number) {
          setFormData((prev) => ({
            ...prev,
            phone: user.user_metadata.phone_number,
          }));
        }
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (formData.description.length < 20) {
      toast.error('Deskripsi minimal 20 karakter agar relawan mengerti kondisi Anda.', {
        title: 'DESKRIPSI TERLALU SINGKAT',
      });
      return;
    }

    // Confirm sebelum kirim
    notify.confirm({
      title: 'PASANG PERMOHONAN BANTUAN?',
      message: `Apakah Anda yakin ingin memasang permohonan:\n"${formData.title}"\ndi papan bantuan warga?`,
      confirmText: 'Ya, Pasang Sekarang',
      cancelText: 'Periksa Dulu',
      onConfirm: async () => {
        setLoading(true);
        try {
          // Re-fetch session fresh sebelum insert agar JWT token tersedia
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            toast.error('Sesi login berakhir. Silakan login ulang.', { title: 'SESI HABIS' });
            router.push('/login');
            return;
          }

          const currentUserId = session.user.id;
          const currentAuthorName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0] ||
            'Warga Anonim';

          const { error } = await supabase.from('help_requests').insert([
            {
              title:        formData.title,
              description:  formData.description,
              category:     formData.category,
              location:     formData.location,
              status:       'menunggu',
              user_id:      currentUserId,
              author_name:  currentAuthorName,
              author_phone: formData.phone.trim() || null,
            },
          ]);

          if (error) {
            console.error('[Supabase Insert Error]', {
              code:    error.code,
              message: error.message,
              details: error.details,
              hint:    error.hint,
            });
            throw new Error(error.message || 'Gagal menyimpan ke Supabase.');
          }

          toast.success(
            'Permohonan bantuan Anda berhasil dipasang di papan! Relawan akan segera merespons.',
            { title: 'PERMOHONAN TERPASANG!' }
          );
          // Tunda navigasi agar notifikasi sempat tampil penuh 2 detik
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 2100);
        } catch (error: any) {
          toast.error(error.message || 'Gagal memasang permohonan.', { title: 'TERJADI KENDALA' });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center py-20 font-mono text-xs text-text-muted">
        <span>Memeriksa status akun warga...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-text-muted hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={13} />
        Kembali ke Papan
      </button>

      {/* Retro Form Box */}
      <div className="bg-card border-2 border-border-custom p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--border)]">
        {/* Title */}
        <div className="border-b-2 border-border-custom pb-4 mb-6">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
            § FORMULIR MAKLUMAT RESMI
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight mt-0.5">
            Ajukan Permohonan Bantuan
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Isi formulir ini agar warga dan relawan sekitar dapat segera memahami kebutuhan dan mengulurkan bantuan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Judul Bantuan */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5">
              1. Judul Kebutuhan / Bantuan:
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none"
              placeholder="Contoh: Butuh Beras Buat Makan di Kos"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5">
              2. Kategori Bantuan:
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5">
              3. Lokasi Warga (Kota / Daerah):
            </label>

            <div className="flex gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => setLocationMode('manual')}
                className={`px-3 py-1 font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer ${
                  locationMode === 'manual'
                    ? 'bg-text-primary text-background border-border-custom'
                    : 'bg-card text-text-primary border-border-custom hover:bg-bg-slate-gray'
                }`}
              >
                <span className="flex items-center gap-1">
                  <PenLine size={12} />
                  Ketik Manual
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('map')}
                className={`px-3 py-1 font-mono text-xs font-bold uppercase border-2 transition-all cursor-pointer ${
                  locationMode === 'map'
                    ? 'bg-text-primary text-background border-border-custom'
                    : 'bg-card text-text-primary border-border-custom hover:bg-bg-slate-gray'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Map size={12} />
                  Pilih dari Peta
                </span>
              </button>
            </div>

            {locationMode === 'manual' ? (
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none"
                placeholder="Contoh: Sungai Panas, Kota Batam"
              />
            ) : (
              <div className="border-2 border-border-custom p-1 bg-card">
                <MapPicker
                  value={formData.location}
                  onChange={(address) => setFormData((prev) => ({ ...prev, location: address }))}
                />
              </div>
            )}
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5 flex items-center justify-between">
              <span>4. Nomor WhatsApp / Kontak Aktif:</span>
              <span className="text-[10px] text-text-muted normal-case font-normal">(Opsional tapi disarankan)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none"
              placeholder="Contoh: 081234567890"
            />
            <p className="font-mono text-[11px] text-text-muted mt-1">
              Nomor ini akan digunakan relawan untuk menghubungi Anda via WhatsApp setelah bersedia membantu.
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5">
              5. Uraian Keterangan Lengkap (Minimal 20 Karakter):
            </label>
            <textarea
              name="description"
              required
              minLength={20}
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none resize-none"
              placeholder="Jelaskan kebutuhan Anda, kondisi mendesak, atau arahan khusus lainnya..."
            />
            <div className="font-mono text-[11px] text-text-muted text-right mt-1">
              {formData.description.length} karakter dicatat
            </div>
          </div>

          {/* Action Strip */}
          <div className="pt-4 border-t-2 border-border-custom flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-border-custom bg-card text-text-primary hover:bg-bg-slate-gray retro-btn"
            >
              [ Batal ]
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-border-custom bg-text-primary text-background retro-btn disabled:opacity-60"
            >
              {loading ? 'Memasang Maklumat...' : 'Pasang Permohonan di Papan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
