import { createClient } from '@supabase/supabase-js'

// Ganti URL dengan IP VPS Anda dan PORT 8000
const supabaseUrl = 'http://31.97.48.241:8000/' 

// Gunakan ANON_KEY yang Anda masukkan di Dokploy tadi
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTk4NDIyOSwiZXhwIjoxOTMxNTYwMjI5fQ.1111111111111111111111111111111111111111111'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)