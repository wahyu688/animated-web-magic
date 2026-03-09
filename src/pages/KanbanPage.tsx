import { motion } from "framer-motion";
import { Plus, MoreHorizontal, MessageSquare, Paperclip, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  priority?: "high" | "medium" | "low";
  comments?: number;
  attachments?: number;
  dueDate?: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const columns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    color: "bg-muted-foreground",
    tasks: [
      { id: "1", title: "Research competitor analysis", tag: "Research", tagColor: "bg-violet-100 text-violet-700", comments: 3 },
      { id: "2", title: "Define user personas", tag: "UX", tagColor: "bg-info/10 text-info", attachments: 2 },
    ],
  },
  {
    id: "todo",
    title: "To Do",
    color: "bg-warning",
    tasks: [
      { id: "3", title: "Design onboarding flow", tag: "Design", tagColor: "bg-primary/10 text-primary", priority: "high", comments: 5, dueDate: "Oct 28" },
      { id: "4", title: "Setup CI/CD pipeline", tag: "DevOps", tagColor: "bg-success/10 text-success", attachments: 1 },
      { id: "5", title: "Write API documentation", tag: "Docs", tagColor: "bg-warning/10 text-warning", dueDate: "Nov 01" },
    ],
  },
  {
    id: "progress",
    title: "In Progress",
    color: "bg-primary",
    tasks: [
      { id: "6", title: "Build authentication module", tag: "Dev", tagColor: "bg-success/10 text-success", priority: "high", comments: 8, dueDate: "Oct 25" },
      { id: "7", title: "Dashboard analytics charts", tag: "Dev", tagColor: "bg-success/10 text-success", attachments: 4 },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: "bg-warning",
    tasks: [
      { id: "8", title: "Website redesign mockups", tag: "Design", tagColor: "bg-primary/10 text-primary", comments: 12, attachments: 6 },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "bg-success",
    tasks: [
      { id: "9", title: "Setup project repository", tag: "DevOps", tagColor: "bg-success/10 text-success" },
      { id: "10", title: "Wireframe user flow", tag: "Design", tagColor: "bg-primary/10 text-primary" },
    ],
  },
];

export default function KanbanPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Project Board</h1>
          <p className="text-muted-foreground mt-1">Track and manage your project tasks visually.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-primary-glow"
        >
          <Plus className="h-4 w-4" /> New Task
        </motion.button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map((col, colIdx) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: colIdx * 0.08 }}
              className="w-80 flex flex-col shrink-0"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {col.tasks.length}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-3 overflow-y-auto pb-4">
                {col.tasks.map((task, taskIdx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: colIdx * 0.08 + taskIdx * 0.05 }}
                    className="task-card bg-card rounded-xl border border-border p-4 cursor-pointer shadow-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${task.tagColor}`}>
                        {task.tag}
                      </span>
                      {task.priority === "high" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-destructive/10 text-destructive uppercase">
                          High
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-3 leading-snug">{task.title}</h4>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                        A
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        {task.comments && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {task.comments}
                          </span>
                        )}
                        {task.attachments && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" /> {task.attachments}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add task button */}
                <button className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <Plus className="h-4 w-4" /> Add Task
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
