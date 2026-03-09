import { createClient } from '@supabase/supabase-js'

const isServer = typeof window === 'undefined';

// Gunakan nama service 'rest' (port internal 3000) jika di server
// Gunakan IP Publik (port 8000) jika di browser
const supabaseUrl = isServer 
  ? 'http://supabase-rest:3000' 
  : 'http://31.97.48.241:8000';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTk4NDIyOSwiZXhwIjoxOTMxNTYwMjI5fQ.1111111111111111111111111111111111111111111'; // Paste langsung di sini

export const supabase = createClient(supabaseUrl, supabaseAnonKey);