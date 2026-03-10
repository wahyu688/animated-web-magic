import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase'; // Sesuaikan lokasi file supabase.ts yang baru Anda buat

export default function App() {
  // Kita tambahkan tipe data <string> khusus untuk TypeScript
  const [status, setStatus] = useState<string>('Sedang mengecek koneksi ke server...');

  useEffect(() => {
    async function checkConnection() {
      try {
        // Melakukan ping ringan ke server untuk mengecek sesi
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setStatus('✅ Berhasil terhubung ke Supabase self-hosted!');
        console.log('Koneksi sukses. Data sesi:', data);
      } catch (err: any) {
        setStatus('❌ Gagal terhubung ke Supabase.');
        console.error('Error koneksi:', err.message);
      }
    }

    checkConnection();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Dashboard Xenith App</h1>
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Status Koneksi Database:</h2>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: status.includes('✅') ? 'green' : 'red' }}>
          {status}
        </p>
      </div>
    </div>
  );
}