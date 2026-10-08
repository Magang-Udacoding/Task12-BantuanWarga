import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { HelpRequest } from '@/types';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface HelpCardProps {
  request: HelpRequest;
}

export default function HelpCard({ request }: HelpCardProps) {
  const authorName = (request as any).author_name || 'Warga Terdaftar';

  return (
    <article className="bg-card border-2 border-border-custom p-4 sm:p-5 md:p-6 flex flex-col h-full shadow-[3px_3px_0px_0px_var(--border)] transition-transform hover:-translate-y-0.5">
      {/* Top Notice Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b-2 border-border-custom">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
          § {request.category}
        </span>
        <StatusBadge status={request.status} />
      </div>

      {/* Title */}
      <h3 className="font-black text-base sm:text-lg text-text-primary mb-1 leading-snug">
        <Link href={`/bantuan/${request.id}`} className="hover:underline">
          {request.title}
        </Link>
      </h3>

      {/* Author attribution */}
      <div className="font-mono text-[11px] text-text-muted mb-2">
        Pemohon: <span className="font-semibold text-text-primary">{authorName}</span>
      </div>

      {/* Body Notice */}
      <p className="text-text-primary text-xs sm:text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
        {request.description}
      </p>

      {/* Metadata & Action Footer */}
      <div className="pt-3 mt-auto border-t-2 border-border-custom space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-text-muted gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{request.location}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={12} />
            <span>
              {(() => {
                if (!request.created_at) return 'Baru saja';
                const d = new Date(request.created_at);
                if (isNaN(d.getTime())) return 'Baru saja';
                return formatDistanceToNow(d, { addSuffix: true, locale: localeId });
              })()}
            </span>
          </div>
        </div>

        <Link
          href={`/bantuan/${request.id}`}
          className="w-full py-2.5 px-4 font-bold uppercase tracking-wider bg-card text-text-primary border-2 border-border-custom hover:bg-text-primary hover:text-background transition-colors flex items-center justify-center gap-2 retro-btn text-xs"
        >
          <span>Buka Rincian &amp; Bantu</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}
