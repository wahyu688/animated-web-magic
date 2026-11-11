import { CircleCheck, Clock, MessageSquare, Paperclip, Trash2, TriangleAlert } from "lucide-react";
import PersonAvatar from "@/components/app/PersonAvatar";
import { Badge } from "@/components/ui/badge";
import { formatDue, tagTone } from "@/lib/task-meta";
import { cn } from "@/lib/utils";

export interface KanbanTask {
  id: string;
  company_id: string;
  column_id: string;
  title: string;
  tag: string;
  tag_color: string;
  priority: "high" | "medium" | "low" | null;
  comments: number;
  attachments: number;
  due_date: string | null;
  position: number;
  description: string | null;
  subtasks: { id: string; title: string; completed: boolean }[];
  activities: { id: string; user: string; text: string; date: string }[];
  assignee_id?: string | null;
  assignee_name?: string | null;
}

const toneBadge = {
  primary: "default",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "destructive",
  violet: "violet",
  neutral: "neutral",
} as const;

interface TaskCardProps {
  task: KanbanTask;
  isDragging?: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, isDragging, onOpen, onDelete }: TaskCardProps) {
  const done = task.subtasks.filter((s) => s.completed).length;
  const total = task.subtasks.length;
  const commentCount = Math.max(task.comments ?? 0, task.activities.length);
  const due = formatDue(task.due_date);
  const finished = task.column_id === "done";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen();
      }}
      className={cn(
        "group relative space-y-2.5 rounded-[10px] border bg-card p-3 text-left transition-[box-shadow,transform] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging
          ? "rotate-2 scale-[1.03] border-primary shadow-lg ring-1 ring-primary motion-reduce:rotate-0 motion-reduce:scale-100"
          : "border-border shadow-xs hover:shadow-md"
      )}
    >
      <div className="flex items-center gap-1.5 pr-6">
        <Badge variant={toneBadge[tagTone(task.tag, task.tag_color)]} size="sm">{task.tag || "Untagged"}</Badge>
        {task.priority === "high" && (
          <Badge variant="destructive" size="sm">
            <TriangleAlert strokeWidth={2} /> High
          </Badge>
        )}
      </div>

      <button
        type="button"
        aria-label={`Delete ${task.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-destructive opacity-0 transition-opacity hover:bg-destructive-soft focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>

      <p className="text-sm font-semibold leading-5 text-foreground">{task.title || "Untitled task"}</p>

      {total > 0 && (
        <div className="flex items-center gap-2 text-caption font-normal text-muted-foreground">
          <CircleCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="tabular">{done}/{total}</span>
          <span className="h-1 w-24 overflow-hidden rounded-full bg-track">
            <span
              className={cn("block h-full rounded-full", finished || done === total ? "bg-success" : "bg-primary")}
              style={{ width: `${(done / total) * 100}%` }}
            />
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-caption font-normal text-muted-foreground">
        {task.assignee_name ? (
          <PersonAvatar name={task.assignee_name} id={task.assignee_id} />
        ) : (
          <span className="h-[22px] w-[22px] rounded-full border border-dashed border-border-strong" title="Unassigned" />
        )}
        {commentCount > 0 && (
          <span className="flex items-center gap-1 tabular"><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />{commentCount}</span>
        )}
        {task.attachments > 0 && (
          <span className="flex items-center gap-1 tabular"><Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />{task.attachments}</span>
        )}
        {due && (
          <span className="ml-auto flex items-center gap-1 whitespace-nowrap"><Clock className="h-3.5 w-3.5" strokeWidth={1.75} />{due}</span>
        )}
      </div>
    </div>
  );
}
