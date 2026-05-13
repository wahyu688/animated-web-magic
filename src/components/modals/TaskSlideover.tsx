import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Plus, Save, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "../../lib/activityLogger";
import { useAuth } from "@/contexts/AuthContext";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Activity {
  id: string;
  user: string;
  text: string;
  date: string;
}

interface KanbanTask {
  id: string;
  company_id?: string;
  title: string;
  tag: string;
  tag_color?: string;
  tagColor?: string;
  description?: string | null;
  subtasks?: Subtask[];
  activities?: Activity[];
  priority?: "high" | "medium" | "low" | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
}

interface TaskSlideoverProps {
  open: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  onTaskUpdated?: () => Promise<void>;
  companyId?: string | null;
}

interface MemberOption {
  user_id: string;
  name: string;
}

interface MemberRow {
  user_id: string;
  user_profiles?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | Array<{
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  }> | null;
}

export default function TaskSlideover({ open, onClose, task, onTaskUpdated, companyId }: TaskSlideoverProps) {
  // State 
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // Sinkronisasi data saat task diklik/berubah
  useEffect(() => {
    if (task) {
      // Jika di DB ada data, pakai itu. Jika tidak, kosongkan ("" atau [])
      setDescription(task.description || "");
      setSubtasks(task.subtasks || []);
      setActivities(task.activities || []);
      setIsEditingDesc(!task.description); 
      setTitle(task.title || "");
      setPriority(task.priority || "medium");
      setAssigneeId(task.assignee_id || "");
    }
  }, [task]);

  useEffect(() => {

    const fetchMembers = async () => {
      if (!companyId) return;
      const { data, error } = await supabase
        .from("company_members")
        .select(`
          user_id,
          user_profiles (first_name,last_name,email)
        `)
        .eq("company_id", companyId)
        .eq("status", "active");
      if (!error && data) {
        setMembers((data as MemberRow[]).map((member) => {
          const profile = Array.isArray(member.user_profiles)
            ? member.user_profiles[0]
            : member.user_profiles;
          const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
            || profile?.email
            || "Unnamed member";

          return {
            user_id: member.user_id,
            name,
          };
        }));
      }
    };

    fetchMembers();

  }, [companyId]);

  // Fungsi simpan ke Supabase
  const handleSaveToDB = useCallback(async (
    updatedDesc: string,
    updatedSubtasks: Subtask[],
    updatedActivities: Activity[],
    overrides?: { title?: string; priority?: string; assigneeId?: string }
  ) => {
    if (!task) return;
    if (!companyId) {
      toast({ title: "Company Error", description: "Company context belum tersedia.", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const nextAssigneeId = overrides?.assigneeId ?? assigneeId;
    const assigneeName = nextAssigneeId
      ? members.find((member) => member.user_id === nextAssigneeId)?.name ?? null
      : null;

    try {
      const query = supabase
        .from('kanban_tasks')
        .update({
          title: overrides?.title ?? title,
          priority: overrides?.priority ?? priority,
          description: updatedDesc,
          subtasks: updatedSubtasks,
          assignee_id: nextAssigneeId || null,
          assignee_name: assigneeName,
          activities: updatedActivities
        })
        .eq('company_id', companyId)
        .eq('id', task.id);

      const { error } = await query;

      if (error) throw error;

      await onTaskUpdated?.();
    } catch (err) {
      console.error("Update Kanban Task Error:", err);
      toast({ title: "Error", description: "Gagal menyimpan perubahan.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [assigneeId, companyId, members, onTaskUpdated, priority, task, title, toast]);

  // --- HANDLERS ---
  const handleSaveDesc = () => {
    setIsEditingDesc(false);
    handleSaveToDB(description, subtasks, activities);
  };

  const handleAddSubtask = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      if (!newSubtask.trim()) return;
      const updated = [...subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }];
      setSubtasks(updated);
      setNewSubtask("");
      handleSaveToDB(description, updated, activities);
    }
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st);
    setSubtasks(updated);
    handleSaveToDB(description, updated, activities);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const userName = user?.email?.split('@')[0] || "User";

    const newAct = {
      id: Date.now().toString(),
      user: userName,
      text: newComment,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
    };

    const updated = [...activities, newAct];
    setActivities(updated);
    setNewComment("");
    handleSaveToDB(description, subtasks, updated);

    // Suntikkan ke log notifikasi global
    await logActivity({
      user: "You",
      action: "commented on task",
      target: task.title,
      type: "mention",
      iconName: "MessageSquare",
      iconBg: "bg-info/10 text-info",
      companyId
    });
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const assigneeOptions = useMemo(() => members, [members]);

  return (
    <AnimatePresence>
      {open && task && (
        <>
          {/* Overlay Background */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-max uppercase tracking-wide mb-2 ${task.tag_color || task.tagColor}`}>
                  {task.tag}
                </span>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => handleSaveToDB(description, subtasks,activities)} placeholder="Task title..." className="text-xl font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 w-full"/>
              </div>
              <button onClick={onClose} className="p-2 bg-muted hover:bg-border rounded-full transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
                  Assignee
                </label>

                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const nextAssigneeId = e.target.value;
                    setAssigneeId(nextAssigneeId);
                    handleSaveToDB(description, subtasks, activities, { assigneeId: nextAssigneeId });
                  }}
                  className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESCRIPTION SECTION */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Description</h3>
                  {isEditingDesc ? (
                    <button onClick={handleSaveDesc} disabled={isSaving} className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-80">
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingDesc(true)} className="text-xs font-bold text-primary hover:underline">
                      Edit
                    </button>
                  )}
                </div>
                {isEditingDesc ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    className="w-full min-h-[120px] p-3 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                    autoFocus
                  />
                ) : (
                  <div className={`text-sm leading-relaxed ${description ? "text-muted-foreground" : "text-muted-foreground/50 italic"}`}>
                    {description || "No description provided. Click edit to add one."}
                  </div>
                )}
              </div>

              {/* SUBTASKS SECTION */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Subtasks</h3>
                  {subtasks.length > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">{completedCount}/{subtasks.length} completed</span>
                  )}
                </div>
                
                {/* Progress Bar */}
                {subtasks.length > 0 && (
                  <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(completedCount / subtasks.length) * 100}%` }} 
                    />
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                      <button onClick={() => handleToggleSubtask(st.id)} className="mt-0.5 shrink-0">
                        {st.completed ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                      </button>
                      <span className={`text-sm ${st.completed ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Input */}
                <div className="flex items-center gap-2 mt-2">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={handleAddSubtask}
                    placeholder="Add new subtask..."
                    className="flex-1 bg-transparent text-sm border-none outline-none placeholder:text-muted-foreground text-foreground"
                  />
                  {newSubtask && (
                    <button onClick={handleAddSubtask} className="text-xs font-bold text-primary px-2">Add</button>
                  )}
                </div>
              </div>

              {/* ACTIVITY SECTION */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4">Activity</h3>
                
                <div className="space-y-4 mb-6">
                  {activities.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No activities yet.</p>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {act.user[0]}
                        </div>
                        <div>
                          <p className="text-sm text-foreground"><span className="font-semibold">{act.user}</span></p>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-2.5 rounded-xl rounded-tl-none mt-1 border border-border">{act.text}</p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">{act.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="relative">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full py-3 pl-4 pr-10 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="submit" disabled={!newComment.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 disabled:opacity-50">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </form>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 
