import React from 'react';
import { ClipboardList } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "Belum ada maklumat bantuan yang terpasang di papan." }: EmptyStateProps) {
  return (
    <div className="bg-card border-2 border-dashed border-border-custom p-8 sm:p-12 text-center my-4">
      <div className="w-12 h-12 border-2 border-border-custom bg-bg-slate-gray flex items-center justify-center mx-auto mb-3 text-text-primary">
        <ClipboardList size={22} />
      </div>
      <h3 className="font-mono font-bold text-sm text-text-primary mb-1 uppercase">Papan Kosong</h3>
      <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">{message}</p>
    </div>
  );
}
