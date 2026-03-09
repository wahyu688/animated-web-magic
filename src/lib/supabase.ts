import { createClient } from '@supabase/supabase-js'

// Variabel ini HARUS diawali NEXT_PUBLIC_ agar bisa dibaca di browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase Environment Variables!");
}

export const supabase = createClient(supabaseUrl || 'http://31.97.48.241:8000', supabaseAnonKey || '');