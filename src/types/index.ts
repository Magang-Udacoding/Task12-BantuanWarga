export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: 'menunggu' | 'selesai';
  user_id: string;
  created_at: string;
  author_name?: string;
  volunteer_id?: string;       // user_id relawan yang membantu
  volunteer_name?: string;     // nama relawan
  volunteer_email?: string;    // email relawan
  helped_at?: string;          // waktu bantuan dikonfirmasi
}

export const CATEGORIES = [
  'Medis & Darurat',
  'Sembako',
  'Peminjaman Alat',
  'Tenaga Relawan'
];
