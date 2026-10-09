'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast, notify } from '@/lib/notify';
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Save,
  CheckCircle2,
  Calendar,
  Lock,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function ProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: '', // 'Laki-laki' | 'Perempuan' | ''
  });

  useEffect(() => {
    let active = true;

    async function loadUserProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error('Silakan login terlebih dahulu untuk mengakses profil Anda.', {
          title: 'SESI BERAKHIR',
        });
        router.push('/login');
        return;
      }

      if (!active) return;

      setUserId(user.id);
      setEmail(user.email || '-');
      setCreatedAt(user.created_at || '');

      // Pastikan phone dan gender kosong secara default jika belum pernah diisi
      const meta = user.user_metadata || {};
      setFormData({
        fullName: meta.full_name || meta.name || '',
        phone: meta.phone_number || meta.phone || '',
        gender: meta.gender || '',
      });

      setLoading(false);
    }

    loadUserProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Nama lengkap tidak boleh kosong.', { title: 'PERIKSA INPUT' });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName.trim(),
          phone_number: formData.phone.trim(),
          gender: formData.gender,
        },
      });

      if (error) throw error;

      toast.success('Profil warga Anda telah berhasil diperbarui.', {
        title: 'PROFIL TERSIMPAN',
      });

      // Refresh halaman agar state global navbar ikut terbarui
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan perubahan profil.', {
        title: 'KENDALA SISTEM',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 font-mono text-xs text-text-muted">
        <Loader2 className="animate-spin mb-2" size={24} />
        <span>Memuat data profil warga...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-text-muted hover:text-text-primary mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft size={13} />
        Kembali
      </button>

      {/* Retro Bulletin Card */}
      <article className="bg-card border-2 border-border-custom p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--border)] space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border-custom pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted block">
              § DATA ANGGOTA WARGA
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
              Profil Pengguna
            </h1>
          </div>
          <div className="font-mono text-[11px] px-2.5 py-1 bg-bg-slate-gray border border-border-custom w-fit">
            ● Akun Terverifikasi
          </div>
        </div>

        {/* Ringkasan Akun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-bg-slate-gray border-2 border-border-custom font-mono text-xs">
          <div className="flex items-center gap-2 text-text-muted truncate">
            <User size={13} className="flex-shrink-0" />
            <span className="truncate">
              ID: <strong>{userId.slice(0, 12)}...</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <Calendar size={13} className="flex-shrink-0" />
            <span>
              Bergabung:{' '}
              <strong>
                {createdAt
                  ? format(new Date(createdAt), 'dd MMM yyyy', { locale: localeId })
                  : '-'}
              </strong>
            </span>
          </div>
        </div>

        {/* Form Profil */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Nama User */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5">
              1. Nama Lengkap:
            </label>
            <div className="relative">
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none"
                placeholder="Masukkan nama lengkap Anda..."
              />
            </div>
            <p className="font-mono text-[11px] text-text-muted mt-1">
              Nama ini akan tampil di setiap permohonan atau aksi relawan yang Anda buat.
            </p>
          </div>

          {/* 2. Email User (Read Only) */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5 flex items-center justify-between">
              <span>2. Alamat Email:</span>
              <span className="text-[10px] text-text-muted normal-case font-normal flex items-center gap-1 font-mono">
                <Lock size={10} /> Terkunci (Akun Utama)
              </span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2.5 border-2 border-border-custom/50 bg-bg-slate-gray text-text-muted text-xs sm:text-sm rounded-none cursor-not-allowed opacity-80"
              />
            </div>
            <p className="font-mono text-[11px] text-text-muted mt-1">
              Email digunakan untuk autentikasi masuk ke BantuanWarga.
            </p>
          </div>

          {/* 3. Nomor HP / WhatsApp (Awal daftar kosong) */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5 flex items-center justify-between">
              <span>3. Nomor HP / WhatsApp:</span>
              <span className="text-[10px] text-text-muted normal-case font-normal font-mono">
                {formData.phone ? '✓ Terisi' : '(Awalnya Kosong)'}
              </span>
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none"
                placeholder="Contoh: 081234567890 (kosongkan jika belum ingin mengisi)"
              />
            </div>
            <p className="font-mono text-[11px] text-text-muted mt-1">
              Nomor ini akan otomatis membantu relawan menghubungi Anda via WhatsApp saat Anda mengajukan bantuan.
            </p>
          </div>

          {/* 4. Gender / Jenis Kelamin */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-text-primary mb-1.5">
              4. Jenis Kelamin (Gender):
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border-2 border-border-custom bg-input-bg text-text-primary text-xs sm:text-sm rounded-none focus:outline-none cursor-pointer"
            >
              <option value="">-- Belum Dipilih (Kosong) --</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            <p className="font-mono text-[11px] text-text-muted mt-1">
              Informasi gender bersifat opsional untuk melengkapi identitas warga.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t-2 border-border-custom flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-border-custom bg-card text-text-primary hover:bg-bg-slate-gray retro-btn cursor-pointer text-center"
            >
              [ Beranda ]
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-border-custom bg-text-primary text-background retro-btn flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <Save size={14} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
