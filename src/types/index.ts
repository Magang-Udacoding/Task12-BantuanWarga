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
  author_phone?: string;       // nomor whatsapp/telepon pemohon
  volunteer_id?: string;       // user_id relawan yang membantu
  volunteer_name?: string;     // nama relawan
  volunteer_email?: string;    // email relawan
  volunteer_phone?: string;    // nomor whatsapp relawan
  helped_at?: string;          // waktu bantuan dikonfirmasi
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  gender?: 'Laki-laki' | 'Perempuan' | '';
  created_at?: string;
}

export const CATEGORIES = [
  'Medis & Darurat',
  'Sembako',
  'Peminjaman Alat',
  'Tenaga Relawan'
];

