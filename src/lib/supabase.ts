import { createClient } from '@supabase/supabase-js'

// Paksa gunakan IP Publik agar SSR tidak mencari ke 127.0.0.1
const supabaseUrl = 'http://31.97.48.241:8000'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTk4NDIyOSwiZXhwIjoxOTMxNTYwMjI5fQ.1111111111111111111111111111111111111111111';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);