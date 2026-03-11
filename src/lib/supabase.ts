import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://url-belum-terbaca.com";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "kunci-belum-terbaca";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
});