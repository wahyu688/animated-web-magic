import { createClient } from '@supabase/supabase-js'

// Cek apakah kode sedang berjalan di Server (SSR) atau di Browser
const isServer = typeof window === 'undefined';

// Jika di server (Dokploy), gunakan nama service internal Docker jika dalam 1 network
// Jika di browser, gunakan IP Publik agar user bisa akses
const supabaseUrl = isServer 
  ? 'http://supabase-rest:3000' // Ganti 'supabase-rest' sesuai nama service di compose
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);