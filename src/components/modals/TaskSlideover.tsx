import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, Tag, CheckCircle, Circle, Plus, Paperclip, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TaskSlideoverProps {
  open: boolean;
  onClose: () => void;
  task?: {
    id: string;
    title: string;
    tag: string;
    tagColor: string;
    priority?: string;
    dueDate?: string;
  } | null;
}

// 1. Definisikan tipe data untuk Activity agar TypeScript tidak error
type ActivityType = "comment" | "status" | "system" | "attachment";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  type: ActivityType;
  message?: string; // Opsional
  status?: string;  // Opsional (digunakan untuk status atau nama file)
}

export default function TaskSlideover({ open, onClose, task }: TaskSlideoverProps) {
  // --- STATE UNTUK SUBTASKS ---
  const [subtaskList, setSubtaskList] = useState([
    { id: "1", text: "Review color palette contrast", done: true },
    { id: "2", text: "Update logo usage documentation", done: true },
    { id: "3", text: "Finalize typography scale", done: false },
    { id: "4", text: "Export updated asset package", done: false },
  ]);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  // --- STATE UNTUK ACTIVITY LOG ---
  // 2. Gunakan interface ActivityItem pada state
  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: "a1", user: "Sarah K.", action: "added a comment", time: "2 hours ago", message: "I've uploaded the new hex codes for the secondary palette. Please check the contrast for accessibility!", type: "comment" },
    { id: "a2", user: "Alex M.", action: "changed status to", time: "Yesterday at 4:32 PM", status: "In Progress", type: "status" },
    { id: "a3", user: "System", action: "Task was created", time: "3 days ago", type: "system" },
  ]);
  const [commentText, setCommentText] = useState("");

  // --- REFERENSI UNTUK ATTACHMENT ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset input form ketika panel ditutup atau berganti task
  useEffect(() => {
    if (!open) {
      setIsAddingSubtask(false);
      setNewSubtaskText("");
      setCommentText("");
    }
  }, [open, task]);

  // --- HANDLERS ---

  const handleToggleSubtask = (idToToggle: string) => {
    setSubtaskList((prev) =>
      prev.map((st) => (st.id === idToToggle ? { ...st, done: !st.done } : st))
    );
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      setSubtaskList([
        ...subtaskList,
        { id: Date.now().toString(), text: newSubtaskText.trim(), done: false },
      ]);
      setNewSubtaskText("");
      setIsAddingSubtask(false);
    }
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      const newComment: ActivityItem = {
        id: Date.now().toString(),
        user: "You",
        action: "added a comment",
        time: "Just now",
        message: commentText.trim(),
        type: "comment",
      };
      setActivities([newComment, ...activities]);
      setCommentText("");
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newAttachmentLog: ActivityItem = {
        id: Date.now().toString(),
        user: "You",
        action: "attached a file",
        status: file.name, // Menyimpan nama file di properti status
        time: "Just now",
        type: "attachment",
      };
      setActivities([newAttachmentLog, ...activities]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // --- KALKULASI PROGRESS BAR ---
  const completedCount = subtaskList.filter((st) => st.done).length;
  const progress = subtaskList.length > 0 ? (completedCount / subtaskList.length) * 100 : 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-card border-l border-border shadow-card-hover flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                {task?.tagColor && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${task.tagColor}`}>
                    {task?.tag}
                  </span>
                )}
                {task?.priority === "high" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-destructive/10 text-destructive uppercase">High</span>
                )}
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <h2 className="text-2xl font-bold text-foreground">{task?.title || "Task Detail"}</h2>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Tag, label: "Status", value: "In Progress", valueClass: "text-primary font-semibold" },
                  { icon: Calendar, label: "Due Date", value: task?.dueDate || "Oct 28, 2024", valueClass: "" },
                  { icon: Users, label: "Assignee", value: "Alex Morgan", valueClass: "" },
                  { icon: Tag, label: "Priority", value: task?.priority || "Medium", valueClass: task?.priority === "high" ? "text-destructive font-semibold" : "" },
                ].map((m, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <m.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                      <p className={`text-sm text-foreground ${m.valueClass}`}>{m.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Description</h3>
                  <button className="text-primary text-sm font-semibold hover:underline">Edit</button>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  The current brand guidelines are outdated following the recent Q3 visual refresh. We need to consolidate all new assets, including the revised primary color palette, the new typography scale, and updated logo usage rules.
                </p>
              </div>

              {/* Subtasks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Subtasks</h3>
                  <span className="text-sm font-medium text-muted-foreground">{completedCount}/{subtaskList.length} completed</span>
                </div>
                
                {/* Progress Bar Dinamis */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  {subtaskList.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border transition-all"
                    >
                      {st.done ? (
                        <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${st.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {st.text}
                      </span>
                    </div>
                  ))}

                  {/* Input Add Subtask Dinamis */}
                  <AnimatePresence>
                    {isAddingSubtask ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 mt-2 pt-2 overflow-hidden"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={newSubtaskText}
                          onChange={(e) => setNewSubtaskText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                          placeholder="Type subtask and press enter..."
                          className="flex-1 text-sm bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 outline-none transition-all text-foreground placeholder:text-muted-foreground"
                        />
                        <button 
                          onClick={handleAddSubtask}
                          disabled={!newSubtaskText.trim()}
                          className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-opacity"
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => {
                            setIsAddingSubtask(false);
                            setNewSubtaskText("");
                          }}
                          className="text-muted-foreground hover:text-foreground p-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingSubtask(true)}
                        className="flex items-center gap-2 px-3 py-2 text-primary text-sm font-bold hover:bg-primary/5 rounded-xl transition-colors w-full mt-2"
                      >
                        <Plus className="h-4 w-4" /> Add Subtask
                      </button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Activity Log */}
              <div className="space-y-6 pb-4">
                <h3 className="text-lg font-bold text-foreground">Activity</h3>
                <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-0 before:w-[2px] before:bg-border">
                  {/* Mapping menggunakan state 'activities' yang baru */}
                  <AnimatePresence>
                    {activities.map((log) => (
                      <motion.div 
                        key={log.id} 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative pl-10"
                      >
                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold z-10 ring-2 ring-card">
                          {log.user.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-foreground">
                            <span className="font-bold">{log.user}</span>{" "}
                            {log.action}
                            {log.status && <span className="text-primary font-bold ml-1">{log.status}</span>}
                          </p>
                          {log.message && (
                            <div className="p-3 bg-muted/50 rounded-xl rounded-tl-none border border-border text-sm text-muted-foreground">
                              {log.message}
                            </div>
                          )}
                          <p className="text-[11px] text-muted-foreground font-medium">{log.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Comment & Attachment Input (Footer) */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 bg-muted p-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-transparent focus-within:border-primary/30">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={handleCommentKeyDown}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="Write a comment..."
                />
                
                {/* Input file hidden untuk attachment */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />

                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleAttachmentClick}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleSendComment}
                    disabled={!commentText.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}