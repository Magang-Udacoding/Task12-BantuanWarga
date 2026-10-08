'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import HelpCard from '@/components/HelpCard';
import CategoryFilter from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';
import LoadingCard from '@/components/LoadingCard';
import EmptyState from '@/components/EmptyState';
import { HelpRequest } from '@/types';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      let query = supabase
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'Semua') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    };

    const timer = setTimeout(() => {
      fetchRequests();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-card border-2 border-border-custom p-5 sm:p-6 shadow-[3px_3px_0px_0px_var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
            § KATALOG BANTUAN AKTIF
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight mt-0.5">
            Papan Bantuan Warga
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Daftar lengkap seluruh permohonan uluran tangan sesama warga masyarakat yang membutuhkan respon.
          </p>
        </div>

        <Link
          href="/minta-bantu"
          className="px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider bg-text-primary text-background border-2 border-border-custom retro-btn flex items-center justify-center gap-2 flex-shrink-0"
        >
          <PlusCircle size={14} />
          <span>+ Ajukan Bantuan</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border-2 border-border-custom p-3 sm:p-5 shadow-[3px_3px_0px_0px_var(--border)] space-y-3">
        <div className="flex flex-col gap-3">
          {/* Category filter wraps on mobile */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          {/* Search always full-width on mobile, fixed width on md+ */}
          <div className="w-full md:w-72 ml-auto">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Counter Strip */}
        <div className="flex items-center justify-between font-mono text-[10px] sm:text-xs text-text-muted pt-2 border-t-2 border-border-custom">
          <span>Kategori: <strong>{selectedCategory.toUpperCase()}</strong></span>
          <span>Ditemukan: <strong>{requests.length}</strong> Permohonan</span>
        </div>
      </div>

      {/* Card Grid Content (Spacious 2 Columns) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {requests.map((request) => (
            <HelpCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <EmptyState message="Tiada permohonan bantuan yang cocok dengan filter atau kata kunci pencarian Anda." />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-16 text-center font-mono text-xs text-text-muted">
        Memuat papan bantuan...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
