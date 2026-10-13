import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { clearCompanyCache } from "@/lib/company";
import InvitationPopup from "@/components/invitations/InvitationPopup";
import { Rocket, Briefcase, Users, Code2, Heart, Puzzle, Layers, Target } from "lucide-react";

const teamMembers = [
  {
    name: "Wahyu A. Barmawi",
    role: "Chief Technology Officer",
    NIM: "2802497800",
    image: "/team/wahyu.jpeg"
  },
  {
    name: "Valerian Hutama",
    role: "Chief Operating Officer",
    NIM: "2802493033",
    image: "/team/tama.png"
  },
  {
    name: "Rif’at Rifqi",
    role: "Chief Marketing Officer",
    NIM: "2802497435",
    image: "/team/rifat.png"
  },
  {
    name: "Bayu Arroyyan",
    role: "Chief Executive Officer",
    NIM: "2802498091",
    image: "/team/bayu.png"
  },
  {
    name: "Samuel Geary Lowfrint",
    role: "Chief Financial Officer",
    NIM: "2802496634",
    image: "/team/geary.png"
  },
];

const pillars = [
  {
    icon: Puzzle,
    tone: "warning",
    title: "The Problem",
    desc: "Small teams track tasks in one app, schedules in another, and money in a spreadsheet. Information gets lost between tools, and nobody has a clear view of how the business is doing.",
  },
  {
    icon: Layers,
    tone: "primary",
    title: "Our Solution",
    desc: "One workspace for tasks, calendar, team roles, finances, and analytics, with each company's data kept separate and secure.",
  },
  {
    icon: Target,
    tone: "success",
    title: "Who It's For",
    desc: "Small and growing businesses that have outgrown spreadsheets and group chats, but don't need heavyweight enterprise software.",
  },
] as const;

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
} as const;

export default function AboutPage() {
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  const { companyId } = useCompany();
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadInvites = async () => {
      if (!user?.email) {
        if (isMounted) setPendingInvitesCount(0);
        return;
      }
      const normalizedEmail = user.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from("invitations")
        .select("id", { count: "exact" })
        .eq("email", normalizedEmail)
        .eq("status", "pending");

      if (!isMounted) return;
      if (error) {
        console.error("Load pending invites error:", error);
        setPendingInvitesCount(0);
        return;
      }
      setPendingInvitesCount(data?.length ?? 0);
    };

    void loadInvites();
    return () => {
      isMounted = false;
    };
  }, [user?.email, inviteRefreshKey]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearCompanyCache();
      await refreshAuth();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pt-32">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* --- NAVBAR --- */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 border-b border-[#0f2ab3]/5"
          style={{
            background: "rgba(252,252,253,0.8)",
            backdropFilter: "blur(12px)",
          }}>
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

            <Link to="/" className="flex items-center gap-3">

              <img
                src="/nextflowIcon-Cd3kiR7z.ico"
                alt="NexusFlow Logo"
                className="w-11 h-11 object-contain"
              />

              <span className="text-xl font-black tracking-tight text-[#376CDD]">
                NEXUSFLOW
              </span>

            </Link>

            <div className="hidden md:flex items-center gap-10">
              <Link
                to="/"
                className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors"
              >
                Home
              </Link>

              <Link
                to="/pricing"
                className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors"
              >
                Pricing
              </Link>

              <Link
                to="/about"
                className="text-sm font-bold text-[#376CDD]"
              >
                About
              </Link>
            </div>

            {!user ? (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors">
                  Login
                </Link>
                <Link
                  to="/login"
                  className="text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 bg-[#376CDD]"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {companyId && (
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {pendingInvitesCount > 0 && (
                  <button
                    onClick={() => setIsInviteOpen(true)}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    {pendingInvitesCount} invite{pendingInvitesCount > 1 ? "s" : ""}
                  </button>
                )}
                <button onClick={handleLogout} className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors">
                  Logout
                </button>
              </div>
            )}

          </div>
        </nav>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-6">About NexusFlow</h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            NexusFlow helps small teams run their projects, people, schedules, and finances from one workspace, instead of a pile of spreadsheets and group chats.
          </p>
        </motion.div>

        {/* Main Story Card */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* Our Story */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
              <Rocket className="w-56 h-56 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                <Rocket className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                NexusFlow is a student startup built in the <strong>Venture Creation</strong> course at <strong>BINUS University</strong>. We're taking a working product and turning it into a business: finding out who needs it most, what they'd pay for it, and how to reach them.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary text-sm font-bold tracking-wide">
                Venture Creation · Semester 5
              </div>
            </div>
          </motion.div>

          {/* Cross-functional Team */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
              <Users className="w-56 h-56 text-info" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center mb-6 shadow-inner">
                <Users className="w-7 h-7 text-info" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Two Disciplines, One Team</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                <strong>Computer Science</strong> students build and run the product. <strong>Information Systems</strong> students shape the business side: process analysis, market research, and how NexusFlow fits into the way companies actually work.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs md:text-sm font-bold tracking-wide border border-info/20">
                  <Code2 className="w-4 h-4" /> Computer Science
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs md:text-sm font-bold tracking-wide border border-success/20">
                  <Briefcase className="w-4 h-4" /> Information Systems
                </span>
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* Why We're Building This */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">Why We're Building This</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map(({ icon: Icon, tone, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${toneClasses[tone]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* The Team Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
          <div className="flex items-center justify-center gap-4 mb-10">
            <Users className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Meet The Founders</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 rounded-2xl bg-muted/30 border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col items-center text-center gap-4"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg ring-4 ring-background border border-border shrink-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">{member.name}</h3>
                  <p className="text-sm text-primary font-bold mb-2">{member.role}</p>
                  <div className="inline-block px-3 py-1 bg-background border border-border rounded-lg text-xs text-muted-foreground font-mono">
                    NIM: {member.NIM}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer / Love Note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center pt-10 pb-6 border-t border-border mt-16">
          <p className="text-sm md:text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
            Built with <Heart className="w-5 h-5 text-destructive fill-destructive animate-pulse" /> by the NexusFlow Team
          </p>
        </motion.div>
      </div>

      <InvitationPopup
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onResolved={() => setInviteRefreshKey((k) => k + 1)}
      />
    </div>
  );
}