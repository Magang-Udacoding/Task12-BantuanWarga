import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar - BantuanWarga',
  description: 'Buat akun BantuanWarga dan bergabunglah dalam gerakan tolong-menolong sesama warga.',
};

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-10 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background min-h-[calc(100vh-140px)]">
      <Suspense fallback={
        <div className="w-full max-w-md bg-card p-8 border-2 border-border-custom text-center font-mono text-xs text-text-muted">
          Memuat form...
        </div>
      }>
        <AuthForm type="register" />
      </Suspense>
    </div>
  );
}
