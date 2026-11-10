import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CircleCheck, CircleX, Github, Globe, Lock, Mail, TrendingUp, X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { clearCompanyCache } from "../lib/company";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import Logo from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN_S = 45;

interface AlertState {
  type: "success" | "error";
  title: string;
  message: string;
}

function FloatingAlert({ alert, onClose }: { alert: AlertState | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          role={alert.type === "error" ? "alert" : "status"}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "fixed left-4 right-4 top-4 z-[100] flex gap-3 rounded-xl border border-l-4 bg-card p-3.5 shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:w-[360px]",
            alert.type === "error" ? "border-destructive" : "border-success"
          )}
        >
          {alert.type === "error" ? (
            <CircleX className="h-5 w-5 shrink-0 text-destructive" strokeWidth={1.75} />
          ) : (
            <CircleCheck className="h-5 w-5 shrink-0 text-success" strokeWidth={1.75} />
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-label text-foreground">{alert.title}</p>
            <p className="text-small text-muted-foreground">{alert.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="h-6 w-6 shrink-0 rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="mx-auto h-4 w-4" strokeWidth={1.75} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden w-1/2 overflow-hidden bg-[#0b1220] text-white lg:block">
      <div aria-hidden="true" className="absolute -left-40 -top-56 h-[620px] w-[620px] rounded-full bg-primary opacity-55 blur-[140px]" />
      <div aria-hidden="true" className="absolute left-[380px] top-[420px] h-[520px] w-[520px] rounded-full bg-[#7a5cff] opacity-35 blur-[140px]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[#0b1220]/25" />

      <div className="relative flex h-full min-h-screen flex-col justify-between p-12">
        <Link to="/" aria-label="NexusFlow home" className="relative z-10 w-max rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Logo size="lg" tone="inverse" markClassName="h-7" />
        </Link>

        {/* Decorative product cards */}
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute left-[99px] top-[174px] w-[250px] rotate-[3deg] space-y-2.5 rounded-[14px] border border-white/15 bg-white/[0.08] p-[18px] shadow-xs backdrop-blur-xl">
            <p className="text-caption font-semibold text-[#b8c2d6]">Total Revenue</p>
            <p className="text-kpi text-white">$174,000</p>
            <div className="flex items-center gap-2">
              <Badge variant="success"><TrendingUp strokeWidth={2.25} /> +12.3%</Badge>
              <svg viewBox="0 0 90 26" className="h-[26px] w-[90px] text-[#45cf95]" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M1 22c10-1 14-4 22-3s12 3 20-1 12-5 20-6 14-6 26-11" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="absolute left-[358px] top-[306px] w-[270px] -rotate-[2.5deg] space-y-2.5 rounded-[14px] border border-white/15 bg-white/[0.08] p-4">
            <div className="flex gap-1.5">
              <Badge variant="info" size="sm">Backend</Badge>
              <Badge variant="destructive" size="sm">High</Badge>
            </div>
            <p className="text-sm font-semibold leading-[18px] text-white">Sync Financial entries to dashboard charts</p>
            <div className="h-1 overflow-hidden rounded-full bg-[#e9ecf1]">
              <div className="h-full w-3/5 rounded-full bg-[#5b7bff]" />
            </div>
          </div>
        </div>

        <div className="relative max-w-[624px] space-y-[18px]">
          <h2 className="text-[36px] font-bold leading-[42px] tracking-[-0.025em]">
            Scale your operations with intelligent precision.
          </h2>
          <p className="text-[15px] leading-6 text-[#b8c2d6]">
            NexusFlow transforms how engineering and product teams collaborate with realtime analytics, intelligent workflows, and seamless productivity tools.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden="true">
              {[
                ["VH", "bg-success-soft text-success"],
                ["RR", "bg-warning-soft text-warning"],
                ["BA", "bg-violet-soft text-violet"],
                ["SG", "bg-info-soft text-info"],
              ].map(([initials, tone]) => (
                <span key={initials} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-[#0b1220]", tone)}>
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-label text-white">Joined by 10,000+ teams</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, ...props }: React.ComponentProps<typeof Input> & { icon: typeof Mail }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
      <Input {...props} className="pl-9" />
    </div>
  );
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [alert, setAlert] = useState<AlertState | null>(null);
  const navigate = useNavigate();
  const { session, isAuthLoading } = useAuth();
  const { companyId, isCompanyLoading } = useCompany();

  const showAlert = (type: AlertState["type"], title: string, message: string) => {
    setAlert({ type, title, message });
  };

  useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 4000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!isAuthLoading && !isCompanyLoading && session) {
      if (companyId) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/subscription", { replace: true });
      }
    }
  }, [isAuthLoading, isCompanyLoading, navigate, session, companyId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!email || !password) {
      showAlert("error", "Missing details", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;

        clearCompanyCache();
        showAlert("success", "Welcome back!", "Redirecting to your workspace…");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim()
            }
          }
        });
        if (error) throw error;

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          showAlert("error", "Couldn't create account", "This email is already registered.");
        } else if (data.user) {
          clearCompanyCache();

          if (data.session) {
            showAlert("success", "Account created", "Redirecting…");
          } else {
            setIsSuccess(true);
            setResendIn(RESEND_COOLDOWN_S);
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      showAlert("error", isLogin ? "Couldn't sign in" : "Couldn't create account", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
      if (error) throw error;
      showAlert("success", "Email sent", "We've sent you a new confirmation link.");
      setResendIn(RESEND_COOLDOWN_S);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again in a moment.";
      showAlert("error", "Couldn't resend email", message);
    } finally {
      setIsResending(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    showAlert("error", "Sign-in unavailable", `${provider} login is not configured yet.`);
  };

  const switchMode = () => {
    setAlert(null);
    setIsLogin((value) => !value);
  };

  return (
    <div className="flex min-h-screen bg-card">
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />
      <BrandPanel />

      <div className="flex min-h-screen w-full flex-col px-5 py-6 sm:px-12 sm:py-8 lg:w-1/2">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link to="/">
              <ArrowLeft /> Back
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            {isSuccess ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="space-y-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
                  <Mail className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <div className="space-y-2">
                  <h1 className="text-[32px] font-bold leading-[42px] tracking-[-0.025em] text-foreground">Check your email</h1>
                  <p className="text-body text-muted-foreground">
                    We've sent a confirmation link to <b className="font-semibold text-foreground">{email}</b>. Please verify your account to continue.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setIsSuccess(false);
                    setIsLogin(true);
                  }}
                >
                  <ArrowLeft className="!size-[18px]" /> Back to Sign In
                </Button>
                <p className="text-small text-muted-foreground" aria-live="polite">
                  Didn't get it? Check spam, or{" "}
                  {resendIn > 0 ? (
                    <>resend in <span className="tabular">{resendIn}s</span>.</>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="font-semibold text-primary-text hover:underline disabled:opacity-60"
                    >
                      {isResending ? "sending…" : "resend the email"}
                    </button>
                  )}
                </p>
              </motion.div>
            ) : (
              <motion.div key={isLogin ? "signin" : "signup"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                <div className="mb-[22px] space-y-2">
                  <h1 className="text-[32px] font-bold leading-[42px] tracking-[-0.025em] text-foreground">
                    {isLogin ? "Welcome back" : "Create an account"}
                  </h1>
                  <p className="text-body text-muted-foreground">
                    {isLogin ? "Enter your details to access your dashboard." : "Start your 14-day free trial. No credit card required."}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-[22px]" noValidate={false}>
                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          placeholder="Nadia"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          placeholder="Putri"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <IconInput
                      icon={Mail}
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => showAlert("error", "Not available yet", "Password reset isn't set up yet. Ask your workspace owner for help.")}
                          className="text-label text-primary-text hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <IconInput
                      icon={Lock}
                      id="password"
                      type="password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      aria-describedby={isLogin ? undefined : "password-hint"}
                    />
                    {!isLogin && (
                      <p id="password-hint" className="text-caption font-normal text-muted-foreground">At least 6 characters.</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                    {isLoading
                      ? (isLogin ? "Signing in…" : "Creating account…")
                      : (
                        <>
                          {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="!size-[18px]" />
                        </>
                      )}
                  </Button>

                  {isLogin && (
                    <>
                      <div className="flex items-center gap-3 text-caption font-normal text-subtle">
                        <span className="h-px flex-1 bg-border" />
                        Or continue with
                        <span className="h-px flex-1 bg-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button type="button" size="lg" variant="secondary" onClick={() => handleSocialLogin("Google")}>
                          <Globe className="!size-[18px]" strokeWidth={1.75} /> Google
                        </Button>
                        <Button type="button" size="lg" variant="secondary" onClick={() => handleSocialLogin("GitHub")}>
                          <Github className="!size-[18px]" strokeWidth={1.75} /> GitHub
                        </Button>
                      </div>
                    </>
                  )}

                  <p className="text-center text-small text-muted-foreground">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={switchMode} className="font-semibold text-primary-text hover:underline">
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </form>
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-center text-caption font-normal text-subtle">
          By continuing you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
