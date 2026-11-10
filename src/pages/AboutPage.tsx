import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Layers, Puzzle, Rocket, Target, Users, type LucideIcon } from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import SectionHeading from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const reveal = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.22, ease: "easeOut" },
} as const;

const tones = {
  primary: { soft: "bg-primary-soft", text: "text-primary-text", accent: "bg-primary-text" },
  violet: { soft: "bg-violet-soft", text: "text-violet", accent: "bg-violet" },
  warning: { soft: "bg-warning-soft", text: "text-warning", accent: "bg-warning" },
  success: { soft: "bg-success-soft", text: "text-success", accent: "bg-success" },
  info: { soft: "bg-info-soft", text: "text-info", accent: "bg-info" },
};

type Tone = keyof typeof tones;

const founders: { name: string; role: string; title: string; nim: string; image: string; tone: Tone }[] = [
  { name: "Wahyu A. Barmawi", role: "CTO", title: "Chief Technology Officer", nim: "2802497800", image: "/team/wahyu.jpeg", tone: "primary" },
  { name: "Valerian Hutama", role: "COO", title: "Chief Operating Officer", nim: "2802493033", image: "/team/tama.png", tone: "success" },
  { name: "Rif'at Rifqi", role: "CMO", title: "Chief Marketing Officer", nim: "2802497435", image: "/team/rifat.png", tone: "warning" },
  { name: "Bayu Arroyyan", role: "CEO", title: "Chief Executive Officer", nim: "2802498091", image: "/team/bayu.png", tone: "violet" },
  { name: "Samuel Geary Lowfrint", role: "CFO", title: "Chief Financial Officer", nim: "2802496634", image: "/team/geary.png", tone: "info" },
];

const pillars: { icon: LucideIcon; tone: Tone; title: string; desc: string }[] = [
  {
    icon: Puzzle,
    tone: "warning",
    title: "The Problem",
    desc: "Small teams keep tasks in one app, the schedule in another and the numbers in a spreadsheet. Nobody sees the whole picture.",
  },
  {
    icon: Layers,
    tone: "primary",
    title: "Our Solution",
    desc: "One workspace for tasks, calendar, team roles and finances, with a dashboard that updates from the data you already enter.",
  },
  {
    icon: Target,
    tone: "success",
    title: "Who It's For",
    desc: "Teams that have outgrown spreadsheets and group chats but don't need heavy enterprise software.",
  },
];

function initialsOf(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function FounderAvatar({ founder }: { founder: (typeof founders)[number] }) {
  const [failed, setFailed] = useState(false);
  const tone = tones[founder.tone];

  return (
    <span className={cn("flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full", tone.soft)}>
      {failed ? (
        <span className={cn("text-[32px] font-semibold", tone.text)}>{initialsOf(founder.name)}</span>
      ) : (
        <img
          src={founder.image}
          alt=""
          width={88}
          height={88}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}

function StoryCard({ icon: Icon, tone, title, children, chips }: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  children: React.ReactNode;
  chips: string[];
}) {
  return (
    <motion.article {...reveal} className="relative overflow-hidden rounded-[20px] border border-border bg-card p-7 shadow-xs sm:p-9">
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-[200px] w-[200px] text-border"
        strokeWidth={0.25}
      />
      <div className="relative space-y-[18px]">
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", tones[tone].soft, tones[tone].text)}>
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h2 className="text-[24px] font-semibold leading-7 tracking-[-0.02em] text-foreground sm:text-[26px]">{title}</h2>
        <p className="text-body text-muted-foreground sm:text-[17px] sm:leading-7 [&_b]:font-semibold [&_b]:text-foreground">{children}</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Badge key={chip} variant={tone === "violet" ? "violet" : "default"}>{chip}</Badge>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <main>
        <section className="bg-[linear-gradient(180deg,#e8eeff_0%,hsl(var(--background))_100%)] px-5 pb-12 pt-12 sm:px-6 sm:pt-20">
          <SectionHeading
            as="h1"
            eyebrow="About"
            title="About NexusFlow"
            lead="NexusFlow helps small teams run their projects, people, schedules, and finances from one workspace, instead of a pile of spreadsheets and group chats."
            className="max-w-[640px]"
          />
        </section>

        <section className="px-5 sm:px-6">
          <div className="mx-auto grid max-w-[1200px] gap-6 md:grid-cols-2">
            <StoryCard icon={Rocket} tone="primary" title="Our Story" chips={["Venture Creation · Semester 5"]}>
              NexusFlow is a student startup built in the <b>Venture Creation</b> course at <b>BINUS University</b>. We're taking a
              working product and turning it into a business: finding out who needs it most, what they'd pay for it, and how to reach them.
            </StoryCard>
            <StoryCard icon={Users} tone="violet" title="Two Disciplines, One Team" chips={["Computer Science", "Information Systems"]}>
              <b>Computer Science</b> students build and run the product. <b>Information Systems</b> students shape the business side:
              process analysis, market research, and how NexusFlow fits into the way companies actually work.
            </StoryCard>
          </div>
        </section>

        <section className="px-5 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-[1200px]">
            <motion.div {...reveal}>
              <SectionHeading title="Why We're Building This" />
            </motion.div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {pillars.map((pillar) => (
                <motion.article key={pillar.title} {...reveal} className="space-y-3.5 rounded-2xl border border-border bg-card p-7 shadow-xs">
                  <span className={cn("block h-1 w-8 rounded-full", tones[pillar.tone].accent)} aria-hidden="true" />
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-[11px]", tones[pillar.tone].soft, tones[pillar.tone].text)}>
                    <pillar.icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-[19px] font-semibold leading-6 tracking-[-0.01em] text-foreground">{pillar.title}</h3>
                  <p className="text-body text-muted-foreground">{pillar.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <motion.div {...reveal}>
              <SectionHeading title="Meet The Founders" lead="Five students, one product, and a lot of user interviews." />
            </motion.div>
            <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
              {founders.map((founder) => (
                <motion.li
                  key={founder.nim}
                  {...reveal}
                  className="flex flex-col items-center gap-3.5 rounded-2xl border border-border bg-card px-4 pb-6 pt-7 text-center shadow-xs sm:px-5"
                >
                  <FounderAvatar founder={founder} />
                  <div className="space-y-1">
                    <p className="text-[15px] font-semibold leading-[22px] text-foreground sm:text-[16px]">{founder.name}</p>
                    <p className="text-label text-primary-text">
                      <abbr title={founder.title} className="no-underline">{founder.role}</abbr>
                    </p>
                  </div>
                  <span className="rounded-md border border-border bg-surface-2 px-2 py-[3px] text-micro text-muted-foreground tabular">
                    NIM: {founder.nim}
                  </span>
                </motion.li>
              ))}
            </ul>

            <p className="mt-16 flex items-center justify-center gap-2 text-small text-muted-foreground">
              Built with <Heart className="h-4 w-4 fill-destructive text-destructive" aria-label="love" /> by the NexusFlow Team
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
