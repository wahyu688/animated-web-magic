import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity as ActivityIcon, AlertTriangle, ArrowRight, AtSign, Check, CheckCircle, Filter, GitBranch, MessageSquare,
  RefreshCw, Reply, SendHorizontal, Trash2, Upload, UserPlus, Users, Zap, type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { useCompany } from "@/hooks/use-company";
import { useAuth } from "@/contexts/AuthContext";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { announceNotificationsChanged, categoryOf, dayGroup, destinationOf, relativeTime } from "@/lib/activity";
import { toneClasses, toneFromClass } from "@/lib/tones";
import PageHeader from "@/components/app/PageHeader";
import PersonAvatar from "@/components/app/PersonAvatar";
import EmptyState from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 30;

const IconMap: Record<string, LucideIcon> = {
  AtSign, AlertTriangle, Upload, CheckCircle, GitBranch, MessageSquare, Trash2, Zap, UserPlus, Users,
};

interface NotificationReply {
  text: string;
  time: string;
  author?: string;
  createdAt?: string;
}

interface NotificationItem {
  id: string;
  type: string;
  user: string;
  action: string;
  target: string;
  message: string;
  createdAt: string;
  legacyTime: string;
  unread: boolean;
  iconName: string;
  iconBg: string;
  hasAction: boolean;
  replies: NotificationReply[];
}

type Tab = "All Activity" | "Mentions" | "System";

interface EmailPrefs {
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_notifications: boolean;
}

function ActorBadge({ item }: { item: NotificationItem }) {
  if (item.user && item.user !== "System") {
    return <PersonAvatar name={item.user} size={36} />;
  }
  const Icon = IconMap[item.iconName] ?? Zap;
  const tone = toneClasses[toneFromClass(item.iconBg, "primary")];
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone.soft, tone.text)}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
  );
}

export default function ActivityPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId, isCompanyLoading } = useCompany();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const [activeTab, setActiveTab] = useState<Tab>("All Activity");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [prefs, setPrefs] = useState<EmailPrefs | null>(null);

  const meta = user?.user_metadata ?? {};
  const myName = [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim() || user?.email?.split("@")[0] || "You";
  const displayName = (name: string) => (name === myName ? "You" : name);

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoading(false);
      setNotifications([]);
    }
  }, [companyId, isCompanyLoading]);

  const fetchNotifications = useCallback(async (showLoading = false, pageCount = pages) => {
    if (!companyId) {
      if (showLoading) setIsLoading(false);
      return;
    }
    const requestId = ++fetchRequestIdRef.current;

    try {
      if (showLoading) setIsLoading(true);
      const limit = PAGE_SIZE * pageCount;
      const { data, error } = await withSupabaseTimeout(
        supabase
          .from('notifications')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .range(0, limit),
        "activity notifications"
      );
      if (error) throw error;
      if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) return;

      const rows = data ?? [];
      // One extra row is requested to know whether an older page exists.
      setHasMore(rows.length > limit);
      setNotifications(rows.slice(0, limit).map((n) => ({
        id: n.id,
        type: n.type ?? "success",
        user: n.user_name ?? "System",
        action: n.action ?? "",
        target: n.target ?? "",
        message: n.message ?? "",
        createdAt: n.created_at,
        legacyTime: n.time ?? "",
        unread: Boolean(n.unread),
        iconName: n.icon_name ?? "CheckCircle",
        iconBg: n.icon_bg ?? "",
        hasAction: Boolean(n.has_action),
        replies: Array.isArray(n.replies) ? n.replies : [],
      })));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({ title: "Couldn't load activity", description: "Check your connection and refresh.", variant: "destructive" });
    } finally {
      if (isMountedRef.current && (showLoading || requestId === fetchRequestIdRef.current)) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [companyId, pages, toast]);

  // The realtime channel reads the latest fetcher through a ref so loading older pages doesn't resubscribe.
  const fetchRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchRef.current(false),
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchRef.current(true);

    const channel = supabase.channel(`activity-notifications-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `company_id=eq.${companyId}` }, () => fetchRef.current())
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') fetchRef.current();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[activity realtime] disconnected; mutation fetch fallback remains active.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId]);

  // Email preferences (same user_settings row the Settings page edits).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    supabase
      .from("user_settings")
      .select("email_notifications, push_notifications, marketing_notifications")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setPrefs({
          email_notifications: data?.email_notifications ?? true,
          push_notifications: data?.push_notifications ?? true,
          marketing_notifications: data?.marketing_notifications ?? false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const updatePref = async (key: keyof EmailPrefs, value: boolean) => {
    if (!user?.id || !prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...prefs, [key]: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) {
      setPrefs(previous);
      toast({ title: "Couldn't save your preference", description: "Try again.", variant: "destructive" });
    }
  };

  // --- Derived ---
  const filtered = useMemo(() => notifications.filter((n) => {
    if (unreadOnly && !n.unread) return false;
    if (activeTab === "Mentions") return categoryOf(n.type) === "mention";
    if (activeTab === "System") return categoryOf(n.type) !== "mention";
    return true;
  }), [notifications, activeTab, unreadOnly]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: NotificationItem[] }[] = [];
    for (const item of filtered) {
      const label = dayGroup(item.createdAt);
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(item);
      else groups.push({ label, items: [item] });
    }
    return groups;
  }, [filtered]);

  const weekStats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = notifications.filter((n) => new Date(n.createdAt).getTime() >= weekAgo);
    return [
      { label: "Unread", value: notifications.filter((n) => n.unread).length, dot: "bg-primary" },
      { label: "Mentions", value: recent.filter((n) => categoryOf(n.type) === "mention").length, dot: "bg-violet" },
      { label: "Task updates", value: recent.filter((n) => categoryOf(n.type) === "task").length, dot: "bg-info" },
      { label: "System events", value: recent.filter((n) => categoryOf(n.type) === "system").length, dot: "bg-subtle" },
    ];
  }, [notifications]);

  const unreadMentions = notifications.filter((n) => categoryOf(n.type) === "mention" && n.unread).length;

  // --- Handlers ---
  const markRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target?.unread || !companyId) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    const { error } = await supabase.from('notifications').update({ unread: false }).eq('company_id', companyId).eq('id', id);
    if (error) toast({ title: "Couldn't update the notification", description: "Try again.", variant: "destructive" });
    announceNotificationsChanged();
  };

  const handleMarkAllRead = async () => {
    if (!companyId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    const { error } = await supabase.from('notifications').update({ unread: false }).eq('company_id', companyId).eq('unread', true);
    announceNotificationsChanged();
    if (error) {
      toast({ title: "Couldn't mark everything as read", description: "Try again.", variant: "destructive" });
      await fetchNotifications();
      return;
    }
    toast({ title: "All caught up", description: "Every notification is marked as read." });
  };

  const handleLoadMore = () => {
    const next = pages + 1;
    setPages(next);
    setIsLoadingMore(true);
    void fetchNotifications(false, next);
  };

  const handleSendReply = async (item: NotificationItem) => {
    if (!replyText.trim() || !companyId) return;
    const reply: NotificationReply = {
      text: replyText.trim(),
      time: "Just now",
      author: myName,
      createdAt: new Date().toISOString(),
    };
    const updatedReplies = [...item.replies, reply];
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, replies: updatedReplies, unread: false } : n)));
    setReplyingTo(null);
    setReplyText("");

    const { error } = await supabase
      .from('notifications')
      .update({ replies: updatedReplies, unread: false })
      .eq('company_id', companyId)
      .eq('id', item.id);
    announceNotificationsChanged();
    if (error) {
      toast({ title: "Couldn't send your reply", description: "Try again.", variant: "destructive" });
      await fetchNotifications();
    }
  };

  const tabs: Tab[] = ["All Activity", "Mentions", "System"];
  const showSkeleton = (isCompanyLoading && !companyId) || (Boolean(companyId) && isLoading);

  return (
    <div className="space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-7">
      <PageHeader
        title="Activity Feed"
        description="Updates across your projects and teams."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Filter strokeWidth={1.75} /> Filter
                  {unreadOnly && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Filter active" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-caption text-muted-foreground">Show</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={unreadOnly} onCheckedChange={(checked) => setUnreadOnly(Boolean(checked))}>
                  Unread only
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" onClick={handleMarkAllRead} disabled={!notifications.some((n) => n.unread)}>
              <Check /> Mark all read
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          {/* Tabs */}
          <div role="tablist" aria-label="Activity type" className="flex gap-6 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 pb-3 text-small transition-colors",
                  activeTab === tab ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
                {tab === "Mentions" && unreadMentions > 0 && (
                  <span className="rounded-full bg-track px-1.5 text-micro font-semibold leading-5 text-muted-foreground tabular">{unreadMentions}</span>
                )}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {showSkeleton ? (
              <div className="space-y-5 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : grouped.length === 0 ? (
              <EmptyState
                icon={ActivityIcon}
                title="No activities found"
                description={unreadOnly ? "You're all caught up." : "Nothing in this category yet. Check back after your team gets moving."}
                className="py-14"
              />
            ) : (
              grouped.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h2 className="border-b border-border bg-surface-2 px-5 py-2 text-caption font-semibold text-muted-foreground">{group.label}</h2>
                  <ul>
                    {group.items.map((item, index) => {
                      const destination = destinationOf(item.action, item.type);
                      const isMention = item.type === "mention";
                      const timeLabel = item.createdAt ? relativeTime(item.createdAt) : item.legacyTime;
                      return (
                        <motion.li
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.2), ease: "easeOut" }}
                          onClick={() => void markRead(item.id)}
                          className={cn(
                            "relative flex gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:pl-9",
                            item.unread && "bg-primary-soft/60"
                          )}
                        >
                          {item.unread && <span className="absolute left-4 top-[30px] hidden h-2 w-2 rounded-full bg-primary sm:block" aria-label="Unread" />}
                          <ActorBadge item={item} />

                          <div className="min-w-0 flex-1 space-y-2.5">
                            <div className="flex items-start gap-3">
                              <p className="min-w-0 flex-1 text-small text-muted-foreground">
                                {item.user !== "System" && <b className="font-semibold text-foreground">{displayName(item.user)} </b>}
                                {item.action}
                                {item.target && <b className="font-semibold text-foreground"> {item.target}</b>}
                              </p>
                              <time dateTime={item.createdAt} className="shrink-0 text-caption font-normal text-subtle tabular">{timeLabel}</time>
                            </div>

                            {item.message && (
                              <p className={cn(
                                "text-small text-foreground",
                                isMention ? "rounded-lg border border-border bg-card px-4 py-2.5" : "border-l-2 border-border pl-3"
                              )}>
                                {item.message}
                              </p>
                            )}

                            {item.replies.length > 0 && (
                              <ul className="space-y-2">
                                {item.replies.map((reply, i) => {
                                  const authorName = reply.author ?? myName;
                                  const author = displayName(authorName);
                                  return (
                                    <li key={i} className="flex gap-2.5">
                                      <PersonAvatar name={authorName} size={22} />
                                      <div className="min-w-0">
                                        <p className="text-caption font-semibold text-foreground">
                                          {author}
                                          <span className="font-normal text-subtle"> · {reply.createdAt ? relativeTime(reply.createdAt) : reply.time}</span>
                                        </p>
                                        <p className="text-small text-foreground">{reply.text}</p>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}

                            {replyingTo === item.id && (
                              <form
                                className="flex gap-2"
                                onClick={(e) => e.stopPropagation()}
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  void handleSendReply(item);
                                }}
                              >
                                <Input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply…" aria-label="Reply" />
                                <Button type="submit" size="icon" disabled={!replyText.trim()} aria-label="Send reply">
                                  <SendHorizontal strokeWidth={1.75} />
                                </Button>
                              </form>
                            )}

                            {(isMention || destination) && (
                              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                {isMention && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setReplyingTo(replyingTo === item.id ? null : item.id);
                                      setReplyText("");
                                    }}
                                  >
                                    <Reply strokeWidth={1.75} /> {replyingTo === item.id ? "Cancel" : "Reply"}
                                  </Button>
                                )}
                                {destination && (
                                  <Button
                                    variant={item.hasAction && !isMention ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(!isMention && !item.hasAction && "-ml-3")}
                                    onClick={() => {
                                      void markRead(item.id);
                                      navigate(destination.path);
                                    }}
                                  >
                                    {destination.label} <ArrowRight />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}

            {!showSkeleton && hasMore && (
              <div className="border-t border-border p-3 text-center">
                <Button variant="ghost" onClick={handleLoadMore} loading={isLoadingMore}>
                  {!isLoadingMore && <RefreshCw strokeWidth={1.75} />} Load older activity
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Side cards */}
        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-3.5 text-card-title text-foreground">This week</h2>
            <dl className="space-y-3">
              {weekStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5 text-small">
                  <span className={cn("h-2 w-2 rounded-full", stat.dot)} aria-hidden="true" />
                  <dt className="flex-1 text-foreground">{stat.label}</dt>
                  <dd className="font-semibold text-foreground tabular">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-3.5 text-card-title text-foreground">Email me about</h2>
            {prefs ? (
              <div className="space-y-3">
                {([
                  ["email_notifications", "Activity & mentions"],
                  ["push_notifications", "Browser notifications"],
                  ["marketing_notifications", "Product news"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 text-small text-foreground">
                    {label}
                    <Switch checked={prefs[key]} onCheckedChange={(value) => void updatePref(key, value)} />
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            )}
            <Button asChild variant="ghost" size="sm" className="-ml-3 mt-3">
              <Link to="/settings?tab=notifications">Notification settings <ArrowRight /></Link>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
