import { createClient } from '@supabase/supabase-js'

// Tambahkan nilai cadangan (fallback) agar tidak meledak saat build gagal membaca .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://url-belum-terbaca.com";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "kunci-belum-terbaca";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);