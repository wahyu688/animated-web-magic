import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Database, Users, Code2, Heart, ArrowLeft } from "lucide-react";

const teamMembers = [
  { name: "Wahyu", role: "Database / Fullstack Developer", NIM: "2802497800" },
  { name: "Anggota 2", role: "Frontend Developer", NIM: "28xxxxxxxx" },
  { name: "Anggota 3", role: "UI/UX Designer", NIM: "28xxxxxxxx" },
  { name: "Anggota 4", role: "System Analyst", NIM: "28xxxxxxxx" },
  { name: "Anggota 5", role: "Quality Assurance", NIM: "28xxxxxxxx" },
];

export default function AboutPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 lg:p-16">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Tombol Back */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-card hover:bg-muted px-4 py-2.5 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </motion.div>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-6">About The Project</h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            NexusFlow is a comprehensive B2B SaaS platform built as a final project evaluation. Combining modern aesthetics with enterprise-grade architecture.
          </p>
        </motion.div>

        {/* Main Story Card */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* Academic Context */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
              <GraduationCap className="w-56 h-56 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Academic Purpose</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                This application was developed to fulfill the <strong>Alternative Objective Learning (AOL)</strong> requirement for the <strong>Software Engineering</strong> course at <strong>BINUS University</strong>.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary text-sm font-bold tracking-wide">
                Semester 4
              </div>
            </div>
          </motion.div>

          {/* Specialization Context */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
              <Database className="w-56 h-56 text-info" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center mb-6 shadow-inner">
                <Database className="w-7 h-7 text-info" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Computer Science</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                Built by a team of Computer Science students specializing in <strong>Database Systems</strong>. This reflects in our choice to implement a robust Multi-Tenant PostgreSQL architecture with Row Level Security (RLS).
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs md:text-sm font-bold tracking-wide border border-info/20">
                  <Code2 className="w-4 h-4" /> React + Tailwind
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs md:text-sm font-bold tracking-wide border border-success/20">
                  <Database className="w-4 h-4" /> Supabase (PostgreSQL)
                </span>
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* The Team Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
          <div className="flex items-center justify-center gap-4 mb-10">
            <Users className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Meet The Team</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 rounded-2xl bg-muted/30 border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col items-center text-center gap-4"
              >
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white font-black text-3xl shrink-0 shadow-lg ring-4 ring-background">
                  {member.name.charAt(0)}
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
            Built with <Heart className="w-5 h-5 text-destructive fill-destructive animate-pulse" /> by the Database Streaming Team
          </p>
        </motion.div>
      </div>
    </div>
  );
}