import React from 'react';

export default function StatusBadge({ status }: { status: 'menunggu' | 'selesai' }) {
  const isMenunggu = status === 'menunggu';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-colors ${
        isMenunggu
          ? 'bg-card text-text-primary border-border-custom'
          : 'bg-text-primary text-background border-border-custom'
      }`}
    >
      {isMenunggu ? '⏳ Menunggu' : '✓ Selesai'}
    </span>
  );
}
