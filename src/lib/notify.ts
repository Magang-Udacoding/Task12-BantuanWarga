'use client';

export type NotificationType = 'success' | 'error' | 'info' | 'confirm';

export interface NotificationPayload {
  id?: string;
  type: NotificationType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  duration?: number;
}

type Listener = (payload: NotificationPayload | null) => void;
const listeners: Set<Listener> = new Set();

export const notifyStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  show(payload: NotificationPayload) {
    listeners.forEach((fn) => fn(payload));
  },
  close() {
    listeners.forEach((fn) => fn(null));
  },
};

export const notify = {
  success: (message: string, title = 'AKSI BERHASIL', duration = 2000) => {
    notifyStore.show({
      type: 'success',
      title,
      message,
      duration,
    });
  },
  error: (message: string, title = 'PERHATIAN / KENDALA', duration = 2000) => {
    notifyStore.show({
      type: 'error',
      title,
      message,
      duration,
    });
  },
  info: (message: string, title = 'INFORMASI WARGA', duration = 2000) => {
    notifyStore.show({
      type: 'info',
      title,
      message,
      duration,
    });
  },
  confirm: ({
    title = 'KONFIRMASI TINDAKAN',
    message,
    confirmText = 'YA, LANJUTKAN',
    cancelText = 'BATALKAN',
    onConfirm,
    onCancel,
  }: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    notifyStore.show({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      duration: 0,
    });
  },
  close: () => notifyStore.close(),
};

// Drop-in replacement for toast to automatically redirect all action toasts to the center popup
export const toast = {
  success: (message: string, opts?: { title?: string; duration?: number }) =>
    notify.success(message, opts?.title || 'AKSI BERHASIL', opts?.duration),
  error: (message: string, opts?: { title?: string; duration?: number }) =>
    notify.error(message, opts?.title || 'PERHATIAN / KENDALA', opts?.duration),
  info: (message: string, opts?: { title?: string; duration?: number }) =>
    notify.info(message, opts?.title || 'INFORMASI WARGA', opts?.duration),
  custom: (message: string, opts?: { title?: string; duration?: number }) =>
    notify.info(message, opts?.title, opts?.duration),
};

export default toast;
