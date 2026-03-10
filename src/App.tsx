import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  // 1. Fungsi Mengambil Data (READ)
  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      setLoading(false);
    }
  }

  // 2. Fungsi Menambah Data (CREATE)
  async function addTask() {
    if (!newTask) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{ title: newTask }]);
      
      if (error) throw error;
      
      setNewTask(''); // Kosongkan input
      fetchTasks();   // Refresh daftar
    } catch (error) {
      alert('Gagal menambah data!');
      console.error(error);
    }
  }

  // 3. Fungsi Menghapus Data (DELETE)
  async function deleteTask(id: number) {
    try {
      // Tampilkan konfirmasi agar tidak tidak sengaja terhapus
      const confirmDelete = window.confirm("Yakin ingin menghapus tugas ini?");
      if (!confirmDelete) return;

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id); // Perintah: Hapus data yang kolom 'id'-nya sama dengan id yang diklik
      
      if (error) throw error;
      
      fetchTasks(); // Refresh daftar setelah berhasil dihapus
    } catch (error) {
      alert('Gagal menghapus data!');
      console.error(error);
    }
  }

  // 4. Fungsi Mengubah Status (UPDATE)
  async function toggleTask(id: number, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !currentStatus }) // Balikkan statusnya: dari false jadi true, atau sebaliknya
        .eq('id', id);

      if (error) throw error;
      
      fetchTasks(); // Refresh daftar UI setelah diupdate
    } catch (error) {
      alert('Gagal mengupdate status tugas!');
      console.error(error);
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px' }}>
      <h1>My Animated Tasks 🚀</h1>
      
      {/* Input Form */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Tulis tugas baru..."
          style={{ padding: '8px', width: '70%' }}
        />
        <button onClick={addTask} style={{ padding: '8px 15px', marginLeft: '10px' }}>
          Add Task
        </button>
      </div>
      

      <hr />

      {loading ? (
        <p>Menghubungkan ke VPS {import.meta.env.VITE_SUPABASE_URL}...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {/* Gunakan AnimatePresence agar saat hapus data ada animasi hilangnya juga */}
      <AnimatePresence>
        {tasks.map((task, index) => (
          <motion.li 
            key={task.id}
            // Animasi Masuk
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            // Animasi Keluar saat dihapus
            exit={{ opacity: 0, x: -50 }}
            // Jeda antar item agar muncul satu per satu
            transition={{ duration: 0.3, delay: index * 0.1 }}
            style={{ 
              padding: '15px', 
              borderBottom: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'white',
              borderRadius: '8px',
              marginBottom: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <input 
                type="checkbox" 
                checked={task.is_completed}
                onChange={() => toggleTask(task.id, task.is_completed)}
                style={{ marginRight: '15px', transform: 'scale(1.2)', cursor: 'pointer' }}
              />
              <span style={{ 
                textDecoration: task.is_completed ? 'line-through' : 'none',
                color: task.is_completed ? '#aaa' : '#333',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}>
                {task.title}
              </span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => deleteTask(task.id)} 
              style={{ 
                padding: '5px 12px', 
                backgroundColor: '#ff4d4f', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
            >
              Hapus
            </motion.button>
          </motion.li>
        ))}
      </AnimatePresence>
          {tasks.length === 0 && <p>Tabel masih kosong. Coba tambah tugas di atas!</p>}
        </ul>
      )}

      
    </div>
  )
}

export default App