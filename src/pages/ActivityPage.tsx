import { motion } from "framer-motion";
import { AtSign, AlertTriangle, Upload, CheckCircle, GitBranch, ArrowDown, Check } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "mention",
    user: "Sarah Chen",
    action: 'mentioned you in',
    target: "Q3 Design Review",
    message: '"Great work on the dashboard! Can we adjust the border radius on the main card?"',
    time: "12 min ago",
    unread: true,
    icon: AtSign,
    iconBg: "bg-primary/10 text-primary",
    initials: "SC",
  },
  {
    id: 2,
    type: "warning",
    user: "",
    action: "Deployment Warning",
    target: "",
    message: 'Build #4928 completed with warnings on environment staging.',
    time: "45 min ago",
    unread: true,
    icon: AlertTriangle,
    iconBg: "bg-warning/10 text-warning",
    initials: "",
  },
  {
    id: 3,
    type: "upload",
    user: "Marcus Johnson",
    action: "added 3 new assets to",
    target: "Marketing Campaign",
    message: "",
    time: "2 hrs ago",
    unread: false,
    icon: Upload,
    iconBg: "bg-violet-100 text-violet-600",
    initials: "MJ",
    files: ["JPG", "PNG", "FIG"],
  },
  {
    id: 4,
    type: "success",
    user: "",
    action: "Database Backup Successful",
    target: "",
    message: "Weekly automated backup completed. Size: 24.5 GB.",
    time: "Yesterday 9:00 AM",
    unread: false,
    icon: CheckCircle,
    iconBg: "bg-success/10 text-success",
    initials: "",
  },
  {
    id: 5,
    type: "invite",
    user: "Elena Rodriguez",
    action: "invited you to",
    target: "Q4 Roadmap Planning",
    message: "",
    time: "Yesterday 2:30 PM",
    unread: false,
    icon: AtSign,
    iconBg: "bg-primary/10 text-primary",
    initials: "ER",
    hasAction: true,
  },
  {
    id: 6,
    type: "commit",
    user: "Alex Kim",
    action: "merged 4 commits into",
    target: "main",
    message: "8f29a1c... Fix: login redirect issue",
    time: "Yesterday 11:15 AM",
    unread: false,
    icon: GitBranch,
    iconBg: "bg-muted text-muted-foreground",
    initials: "AK",
  },
];

export default function ActivityPage() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Activity Feed</h1>
          <p className="text-sm text-muted-foreground">Updates across your projects and teams</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors">
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors">
            <Check className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6 text-sm">
        <button className="pb-3 border-b-2 border-primary text-primary font-medium">All Activity</button>
        <button className="pb-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">
          Mentions <span className="ml-1 bg-muted text-xs px-1.5 py-0.5 rounded-full">3</span>
        </button>
        <button className="pb-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">System</button>
      </div>

      {/* Feed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
      >
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</h3>
        </div>

        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="group relative flex items-start gap-4 p-4 hover:bg-muted/50 transition-all cursor-pointer border-b border-border/50 last:border-0"
          >
            {n.unread && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
            <div className="flex-shrink-0 ml-2">
              {n.initials ? (
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold ring-2 ring-card">
                  {n.initials}
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full ${n.iconBg} flex items-center justify-center ring-2 ring-card`}>
                  <n.icon className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="text-sm text-foreground font-medium">
                  {n.user && <span className="font-semibold">{n.user}</span>}{" "}
                  {n.action}{" "}
                  {n.target && <span className="text-primary hover:underline">{n.target}</span>}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{n.time}</span>
              </div>
              {n.message && (
                <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
              )}
              {n.files && (
                <div className="flex gap-2 mt-2">
                  {n.files.map((f) => (
                    <div key={f} className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {n.hasAction && (
                <div className="mt-2">
                  <button className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
                    Join Project
                  </button>
                </div>
              )}
              {n.type === "mention" && (
                <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs font-medium text-muted-foreground hover:text-primary px-2 py-1 bg-card border border-border rounded">Reply</button>
                  <button className="text-xs font-medium text-muted-foreground hover:text-primary px-2 py-1 bg-card border border-border rounded">View Ticket</button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 text-center pb-4">
        <button className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
          <ArrowDown className="h-4 w-4" /> Load older activity
        </button>
      </div>
    </div>
  );
}
