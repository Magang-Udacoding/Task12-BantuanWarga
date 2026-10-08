'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { notifyStore, NotificationPayload } from '@/lib/notify';
import { CheckCircle2, AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

const TYPE_CONFIG = {
  success: {
    badge: 'BERHASIL',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200',
    iconClass: 'text-emerald-500',
    bar: 'bg-emerald-500',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800',
    defaultBtn: 'Tutup & Mengerti',
    iconType: 'success',
  },
  error: {
    badge: 'PERINGATAN',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950 dark:text-rose-200',
    iconClass: 'text-rose-500',
    bar: 'bg-rose-500',
    btnClass: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-800',
    defaultBtn: 'Tutup & Perbaiki',
    iconType: 'error',
  },
  info: {
    badge: 'INFORMASI',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-950 dark:text-sky-200',
    iconClass: 'text-sky-500',
    bar: 'bg-sky-500',
    btnClass: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-800',
    defaultBtn: 'Baik, Mengerti',
    iconType: 'info',
  },
  confirm: {
    badge: 'KONFIRMASI',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200',
    iconClass: 'text-amber-500',
    bar: 'bg-amber-500',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-800',
    defaultBtn: 'Ya, Lanjutkan',
    iconType: 'confirm',
  },
} as const;

export default function NotificationModal() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [show, setShow] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);     // auto-dismiss countdown
  const clearAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);  // 220ms clear-after-exit anim

  const dismiss = useCallback(() => {
    // Batalkan auto-dismiss timer agar tidak mengganggu notifikasi berikutnya
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setShow(false);
    // Track timer ini agar bisa dibatalkan jika notifikasi baru masuk dalam 220ms
    clearAnimTimer.current = setTimeout(() => setNotification(null), 220);
  }, []);

  useEffect(() => {
    return notifyStore.subscribe((payload) => {
      // Cancel both timers so a pending dismiss can't wipe out the incoming notification
      if (dismissTimer.current)  clearTimeout(dismissTimer.current);
      if (clearAnimTimer.current) clearTimeout(clearAnimTimer.current);
      if (payload) {
        setNotification(payload);
        setShow(true);
      } else {
        dismiss();
      }
    });
  }, [dismiss]);

  useEffect(() => {
    if (!notification?.duration || notification.duration <= 0) return;
    dismissTimer.current = setTimeout(dismiss, notification.duration);
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, [notification, dismiss]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        if (notification?.type === 'confirm') notification.onCancel?.();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, notification, dismiss]);

  if (!notification) return null;

  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.info;
  const isConfirm = notification.type === 'confirm';
  const handleConfirm = () => { notification.onConfirm?.(); dismiss(); };
  const handleCancel  = () => { notification.onCancel?.();  dismiss(); };

  const renderIcon = () => {
    const size = 40;
    const cls = cfg.iconClass;
    if (cfg.iconType === 'success') return <CheckCircle2 size={size} className={cls} />;
    if (cfg.iconType === 'error')   return <AlertTriangle size={size} className={cls} />;
    if (cfg.iconType === 'confirm') return <HelpCircle size={size} className={cls} />;
    return <Info size={size} className={cls} />;
  };

  return (
    <>
      <div
        role="presentation"
        aria-hidden="true"
        onClick={!isConfirm ? dismiss : undefined}
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        style={{ animation: show ? 'notifBdIn 0.2s ease forwards' : 'notifBdOut 0.2s ease forwards' }}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-title"
          className="pointer-events-auto bg-card border-2 border-border-custom w-full max-w-sm sm:max-w-md relative overflow-hidden"
          style={{
            boxShadow: '6px 6px 0 0 var(--border)',
            animation: show ? 'notifPanelIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'notifPanelOut 0.2s ease forwards',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={"h-1.5 w-full " + cfg.bar} />
          {/* X button — only for success & error (auto-dismiss types) */}
          {(notification.type === 'success' || notification.type === 'error') && (
            <button
              onClick={dismiss}
              className={"absolute top-3 right-3 w-7 h-7 flex items-center justify-center border-2 border-current rounded-sm transition-opacity hover:opacity-70 cursor-pointer " + cfg.iconClass}
              aria-label="Tutup notifikasi"
              title="Tutup"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
          <div className="px-6 pb-7 pt-5 sm:px-8 sm:pb-8 text-center">
            <div
              className="w-16 h-16 border-2 border-border-custom bg-bg-slate-gray flex items-center justify-center mx-auto mb-4"
              style={{ boxShadow: '3px 3px 0 0 var(--border)' }}
            >
              {renderIcon()}
            </div>
            <span className={"inline-block border px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest mb-3 " + cfg.badgeClass}>
              {cfg.badge}
            </span>
            {notification.title && (
              <h3 id="notif-title" className="text-base sm:text-lg font-black text-text-primary uppercase tracking-tight mb-2 leading-snug">
                {notification.title}
              </h3>
            )}
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6 font-mono">
              {notification.message}
            </p>
            {/* Bottom action button */}
            {isConfirm ? (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleCancel}
                  type="button"
                  className="flex-1 py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider bg-card text-text-primary border-2 border-border-custom retro-btn cursor-pointer"
                >
                  {notification.cancelText ?? 'Batalkan'}
                </button>
                <button
                  onClick={handleConfirm}
                  type="button"
                  className={"flex-1 py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider border-2 retro-btn cursor-pointer " + cfg.btnClass}
                >
                  {notification.confirmText ?? 'Ya, Lanjutkan'}
                </button>
              </div>
            ) : notification.type === 'info' ? (
              /* Info: no auto-dismiss, show a close button */
              <button
                onClick={dismiss}
                type="button"
                className={"w-full py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider border-2 retro-btn cursor-pointer " + cfg.btnClass}
              >
                {cfg.defaultBtn}
              </button>
            ) : (
              /* Success / Error: auto-dismiss, show faint hint text instead of full button */
              <p className="font-mono text-[11px] text-text-muted">
                Menutup otomatis dalam 3 detik...
              </p>
            )}
          </div>
          {notification.duration && notification.duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border-custom/20 overflow-hidden">
              <div
                className={"h-full " + cfg.bar}
                style={{ animation: `notifShrink ${notification.duration}ms linear forwards` }}
              />
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes notifBdIn    { from{opacity:0} to{opacity:1} }
        @keyframes notifBdOut   { from{opacity:1} to{opacity:0} }
        @keyframes notifPanelIn { from{opacity:0;transform:scale(0.82) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes notifPanelOut{ from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.9) translateY(12px)} }
        @keyframes notifShrink  { from{width:100%} to{width:0%} }
      `}</style>
    </>
  );
}
