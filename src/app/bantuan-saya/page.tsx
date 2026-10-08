'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast, notify } from '@/lib/notify';
import { HelpRequest } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import { Trash2, Eye, ArrowLeft, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function BantuanSayaPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchMyRequests = async () => {
      const { data: { session } }: any = await supabase.auth.getSession();
      if (!session) {
        toast.error('Silakan login terlebih dahulu untuk melihat bantuan Anda.', {
          title: 'AKSES DIPERLUKAN',
        });
        router.push('/login');
        return;
      }

      setUserName(session.user?.user_metadata?.full_name || session.user?.email);

      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    };

    fetchMyRequests();
  }, [router]);

  const handleDelete = (id: string) => {
    notify.confirm({
      title: 'HAPUS PERMOHONAN BANTUAN?',
      message: 'Apakah Anda yakin ingin mencabut dan menghapus maklumat bantuan ini dari papan warta warga? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus Sekarang',
      cancelText: 'Batalkan',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('help_requests')
            .delete()
            .eq('id', id);

          if (error) throw error;

          setRequests((prev) => prev.filter((req) => req.id !== id));
          toast.success('Permohonan bantuan berhasil dihapus dari papan warga.', {
            title: 'PERMOHONAN DIHAPUS',
          });
        } catch (error: any) {
          toast.error(error.message || 'Gagal menghapus data.', { title: 'GAGAL MENGHAPUS' });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 font-mono text-xs text-text-muted">
        <span>Membuka arsip permohonan Anda...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={13} />
        Kembali ke Papan Bantuan
      </button>

      {/* Header Banner */}
      <div className="bg-card border-2 border-border-custom p-5 sm:p-6 shadow-[3px_3px_0px_0px_var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
            § BUKU CATATAN AKUN WARGA
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight mt-0.5">
            Arsip Bantuan Saya
          </h1>
          <p className="font-mono text-xs text-text-muted mt-1">
            Akun Terdaftar: <strong>{userName}</strong> • {requests.length} Maklumat Terpasang
          </p>
        </div>

        <Link
          href="/minta-bantu"
          className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider bg-text-primary text-background border-2 border-border-custom retro-btn flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <PlusCircle size={14} />
          <span>+ Ajukan Bantuan</span>
        </Link>
      </div>

      {/* List / Table Content */}
      {requests.length > 0 ? (
        <div className="bg-card border-2 border-border-custom shadow-[3px_3px_0px_0px_var(--border)] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-border-custom font-mono text-xs">
              <thead className="bg-bg-slate-gray text-text-primary font-bold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left">Judul &amp; Kategori</th>
                  <th scope="col" className="px-5 py-3 text-left">Status</th>
                  <th scope="col" className="px-5 py-3 text-left">Waktu Pasang</th>
                  <th scope="col" className="px-5 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border-custom bg-card">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-bg-slate-gray/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-sm text-text-primary">{request.title}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        § {request.category} • {request.location}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-text-muted text-[11px]">
                      {(() => {
                        if (!request.created_at) return 'Baru saja';
                        const d = new Date(request.created_at);
                        if (isNaN(d.getTime())) return 'Baru saja';
                        return formatDistanceToNow(d, { addSuffix: true, locale: localeId });
                      })()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/bantuan/${request.id}`}
                          className="px-2.5 py-1 border-2 border-border-custom bg-card hover:bg-text-primary hover:text-background text-xs font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye size={12} />
                          Lihat
                        </Link>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="px-2.5 py-1 border-2 border-border-custom bg-card hover:bg-text-primary hover:text-background text-xs font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Clean & Responsive) */}
          <div className="sm:hidden divide-y-2 divide-border-custom">
            {requests.map((request) => (
              <div key={request.id} className="p-4 space-y-2.5 font-mono">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-xs text-text-primary leading-snug">
                    {request.title}
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="text-[11px] text-text-muted">
                  § {request.category} • {request.location}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-custom text-xs">
                  <span className="text-[10px] text-text-muted">
                    {(() => {
                      if (!request.created_at) return 'Baru saja';
                      const d = new Date(request.created_at);
                      if (isNaN(d.getTime())) return 'Baru saja';
                      return formatDistanceToNow(d, { addSuffix: true, locale: localeId });
                    })()}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/bantuan/${request.id}`}
                      className="px-2.5 py-1 border-2 border-border-custom font-bold text-xs"
                    >
                      Lihat
                    </Link>
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="px-2.5 py-1 border-2 border-border-custom font-bold text-xs"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState message="Anda belum pernah memasang permohonan bantuan di papan." />
      )}
    </div>
  );
}
