import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleCheck, Circle, Pencil, Plus, SendHorizontal, Trash2, TriangleAlert, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "../../lib/activityLogger";
import { useAuth } from "@/contexts/AuthContext";
import PersonAvatar from "@/components/app/PersonAvatar";
import type { KanbanTask } from "@/components/kanban/TaskCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_COLUMNS, TASK_PRIORITIES, TASK_TAGS, formatDue, tagTone } from "@/lib/task-meta";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/utils";

type Subtask = KanbanTask["subtasks"][number];
type Activity = KanbanTask["activities"][number];

interface TaskSlideoverProps {
  open: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  onTaskUpdated?: () => Promise<void>;
  /** Moves the task to another column (handled by the board so positions stay consistent). */
  onMove?: (task: KanbanTask, columnId: string) => Promise<void>;
  onDelete?: (task: KanbanTask) => void;
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

interface Overrides {
  title?: string;
  priority?: string | null;
  assigneeId?: string;
  dueDate?: string | null;
  tag?: string;
  tagColor?: string;
}

const UNASSIGNED = "__unassigned";
const NO_PRIORITY = "__none";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toneBadge = {
  primary: "default", info: "info", success: "success", warning: "warning",
  danger: "destructive", violet: "violet", neutral: "neutral",
} as const;

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[108px_minmax(0,1fr)] items-center gap-3 min-h-9">
      <span className="text-small text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function TaskSlideover({ open, onClose, task, onTaskUpdated, onMove, onDelete, companyId }: TaskSlideoverProps) {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [tagColor, setTagColor] = useState("");

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // Sync local state whenever a different task (or a refreshed copy) comes in.
  useEffect(() => {
    if (task) {
      setDescription(task.description || "");
      setSubtasks(task.subtasks || []);
      setActivities(task.activities || []);
      setIsEditingDesc(!task.description);
      setTitle(task.title || "");
      setPriority(task.priority ?? null);
      setAssigneeId(task.assignee_id || "");
      setDueDate(task.due_date ?? null);
      setTag(task.tag || "");
      setTagColor(task.tag_color || "");
    }
  }, [task]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
          return { user_id: member.user_id, name };
        }));
      }
    };
    fetchMembers();
  }, [companyId]);

  const handleSaveToDB = useCallback(async (
    updatedDesc: string,
    updatedSubtasks: Subtask[],
    updatedActivities: Activity[],
    overrides?: Overrides
  ) => {
    if (!task) return;
    if (!companyId) {
      toast({ title: "Workspace unavailable", description: "Refresh the page and try again.", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const nextAssigneeId = overrides?.assigneeId ?? assigneeId;
    const assigneeName = nextAssigneeId
      ? members.find((member) => member.user_id === nextAssigneeId)?.name ?? null
      : null;

    try {
      const { error } = await supabase
        .from('kanban_tasks')
        .update({
          title: overrides?.title ?? title,
          priority: overrides && "priority" in overrides ? overrides.priority : priority,
          description: updatedDesc,
          subtasks: updatedSubtasks,
          assignee_id: nextAssigneeId || null,
          assignee_name: assigneeName,
          activities: updatedActivities,
          due_date: overrides && "dueDate" in overrides ? overrides.dueDate : dueDate,
          tag: overrides?.tag ?? tag,
          tag_color: overrides?.tagColor ?? tagColor,
        })
        .eq('company_id', companyId)
        .eq('id', task.id);

      if (error) throw error;
      await onTaskUpdated?.();
    } catch (err) {
      console.error("Update Kanban Task Error:", err);
      toast({ title: "Couldn't save the task", description: "Your last change wasn't saved. Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [assigneeId, companyId, dueDate, members, onTaskUpdated, priority, tag, tagColor, task, title, toast]);

  const save = (overrides?: Overrides) => handleSaveToDB(description, subtasks, activities, overrides);

  const handleSaveDesc = () => {
    setIsEditingDesc(false);
    void save();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const updated = [...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }];
    setSubtasks(updated);
    setNewSubtask("");
    void handleSaveToDB(description, updated, activities);
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st);
    setSubtasks(updated);
    void handleSaveToDB(description, updated, activities);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    const meta = user?.user_metadata ?? {};
    const userName = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || user?.email?.split('@')[0] || "User";

    const newAct = {
      id: Date.now().toString(),
      user: userName,
      text: newComment.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    };

    const updated = [...activities, newAct];
    setActivities(updated);
    setNewComment("");
    void handleSaveToDB(description, subtasks, updated);

    await logActivity({
      user: "You",
      action: "commented on task",
      target: task.title,
      type: "mention",
      iconName: "MessageSquare",
      iconBg: "bg-info/10 text-info",
      companyId: companyId ?? undefined
    });
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const column = TASK_COLUMNS.find((col) => col.id === task?.column_id);
  const currentTone = tagTone(tag, tagColor);

  return (
    <AnimatePresence>
      {open && task && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#0b1220]/40"
            aria-hidden="true"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Task: ${title || "Untitled task"}`}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-border bg-card shadow-lg"
          >
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
              <Badge variant={toneBadge[currentTone]}>{tag || "Untagged"}</Badge>
              {priority === "high" && (
                <Badge variant="destructive"><TriangleAlert strokeWidth={2} /> High</Badge>
              )}
              <div className="flex-1" />
              {onDelete && (
                <Button variant="ghost" size="icon-sm" aria-label="Delete task" onClick={() => onDelete(task)}>
                  <Trash2 strokeWidth={1.75} />
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
                <X strokeWidth={1.75} />
              </Button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-8 pt-5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== task.title && void save({ title })}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                placeholder="Task title"
                aria-label="Task title"
                className="-mx-2 w-[calc(100%+16px)] rounded-lg border border-transparent bg-transparent px-2 py-1 text-[24px] font-semibold leading-8 tracking-[-0.015em] text-foreground outline-none transition-[border-color,box-shadow] hover:border-border focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              />

              {/* Meta */}
              <div className="space-y-2.5 border-b border-border pb-6">
                <MetaRow label="Status">
                  <Select
                    value={task.column_id}
                    onValueChange={(next) => onMove && void onMove(task, next)}
                  >
                    <SelectTrigger className="h-8 w-auto gap-2 border-transparent bg-transparent px-0 shadow-none hover:bg-surface-2 hover:px-2 focus:px-2">
                      <Badge variant={column ? toneBadge[column.tone] : "neutral"}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", column ? toneClasses[column.tone].solid : "bg-subtle")} />
                        {column?.title ?? task.column_id}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_COLUMNS.map((col) => <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </MetaRow>

                <MetaRow label="Assignee">
                  <Select
                    value={assigneeId || UNASSIGNED}
                    onValueChange={(next) => {
                      const value = next === UNASSIGNED ? "" : next;
                      setAssigneeId(value);
                      void save({ assigneeId: value });
                    }}
                  >
                    <SelectTrigger className="max-w-[240px]">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          <span className="flex items-center gap-2">
                            <PersonAvatar name={member.name} id={member.user_id} size={20} />
                            {member.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MetaRow>

                <MetaRow label="Due date">
                  <Input
                    type="date"
                    value={dueDate && ISO_DATE.test(dueDate) ? dueDate : ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setDueDate(value);
                      void save({ dueDate: value });
                    }}
                    aria-label="Due date"
                    className="h-9 max-w-[240px] text-small md:text-small"
                  />
                  {dueDate && !ISO_DATE.test(dueDate) && (
                    <p className="mt-1 text-caption font-normal text-muted-foreground">Currently “{formatDue(dueDate)}”</p>
                  )}
                </MetaRow>

                <MetaRow label="Priority">
                  <Select
                    value={priority ?? NO_PRIORITY}
                    onValueChange={(next) => {
                      const value = next === NO_PRIORITY ? null : next;
                      setPriority(value);
                      void save({ priority: value });
                    }}
                  >
                    <SelectTrigger className="max-w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PRIORITY}>No priority</SelectItem>
                      {TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </MetaRow>

                <MetaRow label="Tag">
                  <Select
                    // "" (not undefined) keeps the Select controlled and shows the placeholder for unknown tags.
                    value={TASK_TAGS.some((t) => t.name === tag) ? tag : ""}
                    onValueChange={(next) => {
                      const option = TASK_TAGS.find((t) => t.name === next);
                      if (!option) return;
                      setTag(option.name);
                      setTagColor(option.tagColor);
                      void save({ tag: option.name, tagColor: option.tagColor });
                    }}
                  >
                    <SelectTrigger className="max-w-[240px]"><SelectValue placeholder={tag || "Choose a tag"} /></SelectTrigger>
                    <SelectContent>
                      {TASK_TAGS.map((t) => (
                        <SelectItem key={t.name} value={t.name}>
                          <span className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", toneClasses[t.tone].solid)} />
                            {t.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MetaRow>
              </div>

              {/* Description */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-card-title text-foreground">Description</h3>
                  {isEditingDesc ? (
                    <Button variant="ghost" size="sm" onClick={handleSaveDesc} loading={isSaving}>Save</Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(true)}>
                      <Pencil strokeWidth={1.75} /> Edit
                    </Button>
                  )}
                </div>
                {isEditingDesc ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description…"
                    className="min-h-[120px] w-full resize-y rounded-lg border border-input bg-card p-3 text-small text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                    autoFocus
                  />
                ) : (
                  <p className={cn("whitespace-pre-line text-small leading-[21px]", description ? "text-muted-foreground" : "text-subtle")}>
                    {description || "No description yet."}
                  </p>
                )}
              </section>

              {/* Subtasks */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-card-title text-foreground">Subtasks</h3>
                  {subtasks.length > 0 && (
                    <span className="text-caption font-normal text-muted-foreground tabular">{completedCount}/{subtasks.length} completed</span>
                  )}
                </div>
                {subtasks.length > 0 && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-track">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={false}
                      animate={{ width: `${(completedCount / subtasks.length) * 100}%` }}
                    />
                  </div>
                )}
                <ul className="space-y-0.5">
                  {subtasks.map((st) => (
                    <li key={st.id}>
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(st.id)}
                        aria-pressed={st.completed}
                        className="flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left text-small transition-colors hover:bg-surface-2"
                      >
                        {st.completed
                          ? <CircleCheck className="h-[18px] w-[18px] shrink-0 text-success" strokeWidth={1.75} />
                          : <Circle className="h-[18px] w-[18px] shrink-0 text-subtle" strokeWidth={1.75} />}
                        <span className={st.completed ? "text-muted-foreground line-through" : "text-foreground"}>{st.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="relative">
                  <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                    placeholder="Add new subtask…"
                    aria-label="New subtask"
                    className="pl-9"
                  />
                </div>
              </section>

              {/* Activity */}
              <section className="space-y-4">
                <h3 className="text-card-title text-foreground">Activity</h3>
                {activities.length === 0 ? (
                  <p className="text-small text-subtle">No comments yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {activities.map((act) => (
                      <li key={act.id} className="flex gap-3">
                        <PersonAvatar name={act.user} size={28} />
                        <div className="min-w-0">
                          <p className="text-label text-foreground">
                            {act.user} <span className="ml-1 text-caption font-normal text-subtle">{act.date}</span>
                          </p>
                          <p className="text-small text-foreground">{act.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment…"
                    aria-label="Comment"
                  />
                  <Button type="submit" size="icon" disabled={!newComment.trim()} aria-label="Send comment">
                    <SendHorizontal strokeWidth={1.75} />
                  </Button>
                </form>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
