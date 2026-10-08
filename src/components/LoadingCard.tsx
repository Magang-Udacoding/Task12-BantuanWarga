import React from 'react';

export default function LoadingCard() {
  return (
    <div className="bg-card border-2 border-border-custom p-5 sm:p-6 animate-pulse space-y-3.5 shadow-[2px_2px_0px_0px_var(--border)]">
      <div className="flex justify-between items-center pb-2.5 border-b-2 border-border-custom">
        <div className="h-3.5 bg-bg-slate-gray w-28"></div>
        <div className="h-3.5 bg-bg-slate-gray w-16"></div>
      </div>
      <div className="h-5 bg-bg-slate-gray w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3.5 bg-bg-slate-gray w-full"></div>
        <div className="h-3.5 bg-bg-slate-gray w-4/5"></div>
      </div>
      <div className="pt-3 border-t-2 border-border-custom flex justify-between items-center">
        <div className="h-3 bg-bg-slate-gray w-1/3"></div>
        <div className="h-8 bg-bg-slate-gray w-28"></div>
      </div>
    </div>
  );
}
