import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Github, Chrome, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { supabase } from "../lib/supabase";

// --- KOMPONEN POP-UP NOTIFIKASI ---
function FloatingAlert({ alert, onClose }: { alert: { type: 'success' | 'error', message: string } | null, onClose: () => void }) {
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          // Animasi meluncur dari kanan
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          // Posisi di kanan atas (top-8 right-8)
          className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border bg-white dark:bg-slate-900 ${
            alert.type === 'success' 
              ? 'border-green-200' 
              : 'border-red-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {alert.message}
          </span>
          <button onClick={onClose} className="ml-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoginPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null); 

    if (!email || !password) {
      showAlert('error', "Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        showAlert('success', "Welcome back! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000); 
        
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName
            }
          }
        });
        if (error) throw error;

        if (data.user && data.user.identities && data.user.identities.length === 0) {
           showAlert('error', "This email is already registered.");
        } else {
           setIsSuccess(true);
        }
      }
    } catch (error: any) {
      showAlert('error', error.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    showAlert('error', `${provider} login is not configured yet.`);
  };

  return (
    <div className="min-h-screen flex bg-background-light relative">
      
      {/* POP-UP MEMANGGIL KOMPONEN DI ATAS */}
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      {/* --- BAGIAN KIRI: BRANDING --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-3xl"></div>
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2 w-max cursor-pointer hover:opacity-90 transition-opacity">
          <div className="bg-white p-1.5 rounded-lg">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">NEXUSFLOW</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl font-black leading-tight mb-6">
            Scale your operations with intelligent precision.
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-blue-100 text-lg leading-relaxed mb-8">
            "NexusFlow has completely transformed how our engineering and design teams collaborate. The real-time sync is pure magic."
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-blue-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-indigo-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-violet-300"></div>
            </div>
            <div className="text-sm font-medium text-blue-100">
              Joined by 10,000+ teams
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- BAGIAN KANAN: FORM LOGIN/REGISTER --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <Link to="/" className="lg:hidden absolute top-6 left-6 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
          ← Back
        </Link>

        <div className="w-full max-w-md">
          {isSuccess ? (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-card p-8 rounded-2xl shadow-card border border-border">
               <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-foreground mb-2">Check your email</h3>
               <p className="text-muted-foreground mb-6">We've sent a confirmation link to <strong>{email}</strong>. Please verify your account to continue.</p>
               <button onClick={() => {setIsSuccess(false); setIsLogin(true);}} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors">
                 Back to Sign In
               </button>
             </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-foreground mb-2">
                  {isLogin ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-muted-foreground">
                  {isLogin ? "Enter your details to access your dashboard." : "Start your 14-day free trial. No credit card required."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    {!isLogin && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-foreground">First Name</label>
                          <input 
                            type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required={!isLogin}
                            placeholder="John" 
                            className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-foreground">Last Name</label>
                          <input 
                            type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required={!isLogin}
                            placeholder="Doe" 
                            className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                          />
                        </div>
                      </motion.div>
                    )}
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" 
                      required
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-foreground">Password</label>
                    {isLogin && (
                      <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground shadow-sm"
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }} 
                  whileTap={{ scale: 0.99 }} 
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-primary-glow flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </motion.button>
              </form>

              <div className="mt-8 mb-6 relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-background-light text-muted-foreground">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button onClick={() => handleSocialLogin('Google')} type="button" className="flex items-center justify-center gap-2 py-2.5 border border-border bg-card hover:bg-muted rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  <Chrome className="w-4 h-4" /> Google
                </button>
                <button onClick={() => handleSocialLogin('GitHub')} type="button" className="flex items-center justify-center gap-2 py-2.5 border border-border bg-card hover:bg-muted rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  <Github className="w-4 h-4" /> GitHub
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary hover:underline">
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
              
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}