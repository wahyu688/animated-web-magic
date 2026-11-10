import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, ArrowRight, BarChart3, Calendar, Check, DollarSign, Globe, Heart, Layers,
  Plug, ShieldCheck, SquareKanban, Sun, Target, Users, type LucideIcon,
} from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import SectionHeading from "@/components/public/SectionHeading";
import {
  ActivityIllustration, BoardIllustration, CalendarIllustration, FinancialIllustration, TeamIllustration,
} from "@/components/public/landing/ModuleIllustrations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.45, ease: "easeOut" },
} as const;

const trustedBy: { name: string; icon: LucideIcon }[] = [
  { name: "Northwind", icon: Globe },
  { name: "Lumen & Co", icon: Sun },
  { name: "Orbital", icon: Target },
  { name: "Kinfolk", icon: Heart },
  { name: "Parcel", icon: Layers },
];

const iconTones = {
  primary: "bg-primary-soft text-primary",
  violet: "bg-violet-soft text-violet",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
};

function IconTile({ icon: Icon, tone, solid = false }: { icon: LucideIcon; tone: keyof typeof iconTones; solid?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
        solid ? "bg-primary text-primary-foreground" : iconTones[tone]
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}

const modules = [
  {
    icon: SquareKanban,
    tone: "primary" as const,
    title: "Project Board",
    desc: "Five columns from Backlog to Done. Drag tasks across, add subtasks, assign owners and keep the conversation on the card.",
    short: "Five columns from Backlog to Done, with owners, subtasks and comments.",
    Illustration: BoardIllustration,
    span: "lg:col-span-7",
  },
  {
    icon: Calendar,
    tone: "violet" as const,
    title: "Calendar",
    desc: "Day, week and month views. Double-click any slot to book it, and see what's next from the dashboard.",
    short: "Day, week and month views for the whole team.",
    Illustration: CalendarIllustration,
    span: "lg:col-span-5",
  },
  {
    icon: DollarSign,
    tone: "success" as const,
    title: "Financial → Dashboard",
    desc: "Enter last month's revenue, customers and costs once. Profit, margin, churn and growth are calculated for you.",
    short: "Log the month once. KPIs and charts update themselves.",
    Illustration: FinancialIllustration,
    span: "lg:col-span-4",
  },
  {
    icon: Users,
    tone: "info" as const,
    title: "Team roles",
    desc: "Invite colleagues by email and decide who can edit, who can view and who runs the workspace.",
    short: "Invite by email and give each person the right access.",
    Illustration: TeamIllustration,
    span: "lg:col-span-4",
  },
  {
    icon: Activity,
    tone: "warning" as const,
    title: "Activity feed",
    desc: "Mentions, task moves and system events in one stream, with replies right where they happen.",
    short: "Mentions, task moves and system events in one stream.",
    Illustration: ActivityIllustration,
    span: "lg:col-span-4",
  },
];

const features = [
  {
    icon: Plug,
    title: "Seamless Integration",
    desc: "Connect your entire tech stack with our one-click native integrations and robust developer-first API.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    desc: "Gain actionable insights with real-time data visualization, AI-driven summaries, and predictive modeling.",
    featured: true,
  },
  {
    icon: ShieldCheck,
    title: "Automated Security",
    desc: "Enterprise-grade protection with automated threat detection, end-to-end encryption, and compliance monitoring.",
  },
];

const steps = [
  { title: "Pick a plan", desc: "Start a 14-day free trial on Starter or Professional, or talk to us about Enterprise." },
  { title: "Invite your team", desc: "Send invites by email and give each person a role: Admin, Editor or Viewer." },
  { title: "Run it from one place", desc: "Plan on the board, schedule on the calendar, log numbers in Financial. The dashboard updates itself." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="bg-[linear-gradient(180deg,#e8eeff_0%,hsl(var(--background))_100%)] px-5 pb-10 pt-10 sm:px-6 sm:pb-0 sm:pt-[88px]">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 text-center sm:gap-7">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-[940px] text-[40px] font-bold leading-[44px] tracking-[-0.035em] sm:text-[56px] sm:leading-[60px] lg:text-display"
            >
              Scale your operations with intelligent precision.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="max-w-[620px] text-pretty text-[16px] leading-6 text-muted-foreground sm:text-[19px] sm:leading-[30px]"
            >
              The all-in-one platform for modern teams to automate workflows, analyze performance, and drive measurable growth.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
            >
              <Button asChild size="lg">
                <Link to="/login?mode=signup">
                  Get Started Free <ArrowRight className="!size-[18px]" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#product">Learn More</a>
              </Button>
            </motion.div>

            <p className="text-small text-muted-foreground sm:hidden">14-day free trial · No credit card required</p>
            <ul className="hidden items-center gap-5 text-small text-muted-foreground sm:flex">
              {["14-day free trial", "No credit card required", "Set up in minutes"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-2 w-full rounded-[14px] border border-border bg-card p-1.5 shadow-lg sm:mt-6 sm:rounded-[20px] sm:p-2.5"
            >
              <div className="h-[230px] overflow-hidden rounded-[10px] border border-border bg-background sm:h-auto sm:max-h-[640px] sm:rounded-xl">
                <img
                  src="/landing/dashboard-preview.webp"
                  alt="NexusFlow dashboard showing revenue, active users, session length and churn, a revenue growth chart and traffic sources"
                  width={1440}
                  height={1168}
                  className="w-[640px] max-w-none sm:w-full sm:max-w-full"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[220px] rounded-b-[20px] bg-gradient-to-b from-background/0 to-background sm:block" />
            </motion.div>
          </div>
        </section>

        {/* Trusted by */}
        <section className="hidden px-6 pb-[72px] pt-6 sm:block">
          <p className="text-center text-label text-subtle">Trusted by growing teams at</p>
          <ul className="mx-auto mt-6 flex max-w-[1200px] flex-wrap items-center justify-center gap-x-[72px] gap-y-6">
            {trustedBy.map(({ name, icon: Icon }) => (
              <li key={name} className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.01em] text-subtle/80">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                {name}
              </li>
            ))}
          </ul>
        </section>

        {/* The product */}
        <section id="product" className="scroll-mt-20 border-y border-border bg-card px-5 py-14 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <motion.div {...reveal}>
              <SectionHeading
                eyebrow="The product"
                title="One workspace for the work that keeps you running"
                lead="Tasks, schedules, people and numbers live in one place, so the dashboard is always telling the truth."
              />
            </motion.div>

            <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-12">
              {modules.map((module) => (
                <motion.article
                  key={module.title}
                  {...reveal}
                  className={cn(
                    "flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-col sm:gap-[18px] sm:p-7",
                    module.span
                  )}
                >
                  <IconTile icon={module.icon} tone={module.tone} />
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-card-title text-foreground sm:text-h3">{module.title}</h3>
                    <p className="text-small text-muted-foreground sm:hidden">{module.short}</p>
                    <p className="hidden text-body text-muted-foreground sm:block">{module.desc}</p>
                  </div>
                  <div className="hidden sm:block">
                    <module.Illustration />
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Why NexusFlow */}
        <section id="features" className="scroll-mt-20 px-5 py-14 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <motion.div {...reveal}>
              <SectionHeading
                eyebrow="Why NexusFlow"
                title="Engineered for Excellence"
                lead="Discover the tools designed to propel your business forward with unmatched efficiency and enterprise-grade reliability."
              />
            </motion.div>
            <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <motion.article
                  key={feature.title}
                  {...reveal}
                  className={cn(
                    "space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-7",
                    feature.featured ? "shadow-md" : "shadow-xs"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-[10px]",
                      feature.featured ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
                    )}
                  >
                    <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-[20px] font-semibold leading-7 tracking-[-0.012em] text-foreground">{feature.title}</h3>
                  <p className="text-body text-muted-foreground">{feature.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-5 pb-14 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-[1200px]">
            <motion.div {...reveal}>
              <SectionHeading title="Up and running in an afternoon" />
            </motion.div>
            <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
              {steps.map((step, index) => (
                <motion.li
                  key={step.title}
                  {...reveal}
                  className={cn("space-y-3.5 border-t-2 pt-6", index === 0 ? "border-primary" : "border-border")}
                >
                  <p className="text-label text-primary-text tabular">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="text-[20px] font-semibold leading-7 tracking-[-0.012em] text-foreground">{step.title}</h3>
                  <p className="text-body text-muted-foreground">{step.desc}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-14 sm:px-6 sm:pb-24">
          <motion.div
            {...reveal}
            className="relative mx-auto flex max-w-[1200px] flex-col gap-8 overflow-hidden rounded-3xl bg-[linear-gradient(90deg,#0b1220_0%,#15245c_100%)] p-8 sm:p-14 lg:flex-row lg:items-center lg:justify-between lg:px-16"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-primary/50 blur-[120px]"
            />
            <div className="relative space-y-3">
              <h2 className="text-balance text-[28px] font-bold leading-[34px] tracking-[-0.025em] text-white sm:text-h2">
                Bring your team into one workspace.
              </h2>
              <p className="text-body text-white/75 sm:text-body-lg">
                Start free for 14 days. Your data stays isolated to your company from the first login.
              </p>
            </div>
            <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-[#0b1220] hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-[#0b1220]">
                <Link to="/login?mode=signup">
                  Get Started Free <ArrowRight className="!size-[18px]" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="border border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white focus-visible:ring-white focus-visible:ring-offset-[#0b1220]"
              >
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <PublicFooter variant="full" />
    </div>
  );
}
