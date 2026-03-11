import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign, AlertTriangle, Upload, CheckCircle, GitBranch, ArrowDown, Check, Send, X, Calendar, Users, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activityLogger";

// --- PETA IKON ---
const IconMap: Record<string, any> = {
  AtSign, AlertTriangle, Upload, CheckCircle, GitBranch
};

// --- KOMPONEN MODAL TICKET ---
function TicketSlideover({ open, onClose, ticketData }: { open: boolean, onClose: () => void, ticketData: any }) {
  if (!ticketData) return null;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-card-hover flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-primary/10 text-primary">TICKET-{ticketData.id.slice(0,4).toUpperCase()}</span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <h2 className="text-2xl font-bold text-foreground">{ticketData.target || ticketData.action}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"><Tag className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Status</p><p className="text-sm font-semibold text-warning">In Review</p></div></div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"><Users className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Assignee</p><p className="text-sm text-foreground">{ticketData.user || "System"}</p></div></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">Original Message</h3>
                <div className="p-4 rounded-xl bg-muted border border-border text-sm text-foreground italic">
                  {ticketData.message || "No additional message provided."}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ActivityPage() {
  const { toast } = useToast();
  
  // --- DATABASE STATES ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<"All Activity" | "Mentions" | "System">("All Activity");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [viewingTicket, setViewingTicket] = useState<any | null>(null);

  // --- FETCH & REAL-TIME SUPABASE ---
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      
      if (error) console.error("Error fetching notifications:", error);
      else if (data) {
        // Map DB response to UI expected format
        const formatted = data.map(n => ({
          id: n.id, type: n.type, user: n.user_name, action: n.action, target: n.target,
          message: n.message, time: n.time, unread: n.unread, icon: IconMap[n.icon_name] || CheckCircle,
          iconBg: n.icon_bg, initials: n.initials, hasAction: n.has_action,
          files: n.files || [], replies: n.replies || []
        }));
        setNotifications(formatted);
      }
      setIsLoading(false);
    };

    fetchNotifications();

    const channel = supabase.channel('activity-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((current) => {
          if (payload.eventType === 'INSERT') {
            const newN = payload.new;
            const formatted = {
              id: newN.id, type: newN.type, user: newN.user_name, action: newN.action, target: newN.target,
              message: newN.message, time: newN.time, unread: newN.unread, icon: IconMap[newN.icon_name] || CheckCircle,
              iconBg: newN.icon_bg, initials: newN.initials, hasAction: newN.has_action,
              files: newN.files || [], replies: newN.replies || []
            };
            return [formatted, ...current];
          }
          if (payload.eventType === 'DELETE') return current.filter(n => n.id !== payload.old.id);
          if (payload.eventType === 'UPDATE') {
            const upN = payload.new;
            const formatted = {
              id: upN.id, type: upN.type, user: upN.user_name, action: upN.action, target: upN.target,
              message: upN.message, time: upN.time, unread: upN.unread, icon: IconMap[upN.icon_name] || CheckCircle,
              iconBg: upN.icon_bg, initials: upN.initials, hasAction: upN.has_action,
              files: upN.files || [], replies: upN.replies || []
            };
            return current.map(n => n.id === upN.id ? formatted : n);
          }
          return current;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- LOGIKA FILTERING ---
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "Mentions") return n.type === "mention" || n.type === "invite";
      if (activeTab === "System") return n.type === "warning" || n.type === "success" || n.type === "commit";
      return true; 
    });
  }, [notifications, activeTab]);

  const unreadMentionsCount = notifications.filter((n) => (n.type === "mention" || n.type === "invite") && n.unread).length;

  // --- HANDLERS (TERSAMBUNG KE DATABASE) ---
  const handleMarkAllRead = async () => {
    // Update lokal dulu (Optimistic UI)
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast({ title: "All marked as read", description: "Your activity feed is all caught up." });
    
    // Kirim ke server
    await supabase.from('notifications').update({ unread: false }).eq('unread', true);
  };

  const handleItemClick = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (target && target.unread) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
      await supabase.from('notifications').update({ unread: false }).eq('id', id);
    }
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulasi load older data
    setTimeout(() => {
      setIsLoadingMore(false);
      setHasLoadedMore(true);
      toast({ title: "End of feed", description: "No older activities found in the database." });
    }, 1000);
  };

  // Handler Reply (Simpan ke kolom JSONB replies di DB)
  const handleOpenReply = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setReplyingTo(replyingTo === id ? null : id);
    setReplyText("");
  };

  const handleSendReply = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!replyText.trim()) return;

    const targetNotif = notifications.find(n => n.id === id);
    if (!targetNotif) return;

    const newReply = { text: replyText, time: "Just now" };
    const updatedReplies = [...(targetNotif.replies || []), newReply];

    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, replies: updatedReplies } : n));
    setReplyingTo(null);
    setReplyText("");
    
    // Simpan ke database
    const { error } = await supabase.from('notifications').update({ replies: updatedReplies }).eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Gagal mengirim balasan.", variant: "destructive" });
    } else {
      toast({ title: "Reply sent", description: "Your comment has been posted successfully." });
    }
  };

  const handleViewTicket = (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    setViewingTicket(notification);
    handleItemClick(notification.id); // Otomatis mark as read
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto relative">
      
      {isLoading && (
        <div className="absolute top-10 right-10 z-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

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
          <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors">
            <Check className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6 text-sm relative overflow-x-auto whitespace-nowrap">
        {(["All Activity", "Mentions", "System"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 font-medium transition-colors relative ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {tab === "Mentions" && unreadMentionsCount > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {unreadMentionsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <motion.div layout className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {activeTab === "All Activity" ? "Recent" : activeTab}
          </h3>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 && !isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center text-muted-foreground text-sm">
              No activities found for this category.
            </motion.div>
          ) : (
            filteredNotifications.map((n, i) => (
              <motion.div
                key={n.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => handleItemClick(n.id)}
                className={`group relative flex items-start gap-4 p-4 hover:bg-muted/50 transition-all cursor-pointer border-b border-border/50 last:border-0 ${n.unread ? "bg-primary/5 hover:bg-primary/10" : ""}`}
              >
                {n.unread && <motion.div layoutId={`dot-${n.id}`} className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                
                <div className="flex-shrink-0 ml-2">
                  {n.initials ? (
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold ring-2 ring-card">{n.initials}</div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${n.iconBg} flex items-center justify-center ring-2 ring-card`}>
                      {n.icon && <n.icon className="h-5 w-5" />}
                    </div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-sm font-medium ${n.unread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      {n.user && <span className="font-bold text-foreground">{n.user}</span>} {n.action} {n.target && <span className="text-primary hover:underline cursor-pointer">{n.target}</span>}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 shrink-0">{n.time}</span>
                  </div>
                  {n.message && <p className={`text-sm mt-1 line-clamp-2 ${n.unread ? "text-foreground" : "text-muted-foreground"}`}>{n.message}</p>}
                  
                  {/* Tampilkan Balasan yang Sudah Dikirim */}
                  {n.replies && n.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-primary/20 pl-3 ml-1">
                      {n.replies.map((reply: any, idx: number) => (
                        <div key={idx}>
                          <p className="text-xs font-semibold text-foreground">You <span className="font-normal text-muted-foreground ml-2">{reply.time}</span></p>
                          <p className="text-sm text-muted-foreground">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form Reply Inline */}
                  <AnimatePresence>
                    {replyingTo === n.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex gap-2 items-center overflow-hidden">
                        <input
                          type="text" autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSendReply(e as any, n.id); }}
                          placeholder="Type your reply..."
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors text-foreground"
                        />
                        <button onClick={(e) => handleSendReply(e, n.id)} disabled={!replyText.trim()} className="p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  {n.hasAction && (
                    <div className="mt-3"><button onClick={(e) => { e.stopPropagation(); toast({ title: "Joined Project", description: "You are now a member of " + n.target }) }} className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors">Join Project</button></div>
                  )}
                  {n.type === "mention" && (
                    <div className={`mt-3 flex gap-2 transition-opacity ${n.unread || replyingTo === n.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button onClick={(e) => handleOpenReply(e, n.id)} className={`text-xs font-medium px-3 py-1.5 border border-border rounded-lg transition-colors ${replyingTo === n.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-primary hover:border-primary/50 bg-card"}`}>
                        {replyingTo === n.id ? "Cancel" : "Reply"}
                      </button>
                      <button onClick={(e) => handleViewTicket(e, n)} className="text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 px-3 py-1.5 bg-card border border-border rounded-lg transition-colors">
                        View Ticket
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Load More Button */}
      {!hasLoadedMore && notifications.length > 0 && (
        <div className="mt-8 text-center pb-4">
          <button onClick={handleLoadMore} disabled={isLoadingMore} className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50">
            {isLoadingMore ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <ArrowDown className="h-4 w-4" />}
            {isLoadingMore ? "Loading..." : "Load older activity"}
          </button>
        </div>
      )}

      {/* Ticket Slideover Modal */}
      <TicketSlideover open={!!viewingTicket} onClose={() => setViewingTicket(null)} ticketData={viewingTicket} />
    </div>
  );
}