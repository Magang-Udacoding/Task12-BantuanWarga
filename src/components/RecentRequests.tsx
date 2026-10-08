'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase, isLocalMock } from '@/lib/supabase';
import HelpCard from '@/components/HelpCard';
import LoadingCard from '@/components/LoadingCard';
import { HelpRequest } from '@/types';

const POLL_INTERVAL_MS = 4000; // refresh every 4 seconds in mock mode

export default function RecentRequests() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchRecent();

    if (isLocalMock) {
      // Mock mode: poll localStorage every few seconds to detect new entries
      const interval = setInterval(fetchRecent, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    } else {
      // Real Supabase: subscribe to INSERT/UPDATE/DELETE on help_requests table
      const channel = supabase
        .channel('home-recent-requests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'help_requests' },
          () => {
            fetchRecent();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchRecent]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-card border-2 border-dashed border-border-custom p-10 text-center font-mono text-xs text-text-muted">
        Belum ada maklumat bantuan yang terpasang di papan saat ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
      {requests.map((request: HelpRequest) => (
        <HelpCard key={request.id} request={request} />
      ))}
    </div>
  );
}
