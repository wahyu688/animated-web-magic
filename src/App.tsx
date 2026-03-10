import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Zap } from "lucide-react"; // Tanpa AlertCircle agar aman
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase"; // ⚠️ PASTIKAN PATH INI BENAR ⚠️

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      console.log("Login sukses!", data);
      navigate("/"); 
      
    } catch (error: any) {
      setErrorMsg(error.message || "Gagal melakukan login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="relative bg-card rounded-3xl shadow-card-hover border border-border p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary" />

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mx-auto h-12 w-12 gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-primary-glow"
            >
              <Zap className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">Enter your details to access your workspace.</p>
          </div>

          {/* Kotak Error Sederhana & Aman */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="block w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-sm font-medium text-muted-foreground">Password</label>
                <a href="#" className="text-xs font-medium text-primary hover:opacity-80 transition-opacity">Forgot Password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-primary-glow transition-opacity ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
            >
              {loading ? "Signing In..." : "Sign In"}
            </motion.button>
          </form>

          {/* ... SISA KODE KE BAWAH (Divider, Tombol Social, dsb) SAMA PERSIS SEPERTI SEBELUMNYA ... */}
        </div>
      </motion.div>
    </div>
  );
}