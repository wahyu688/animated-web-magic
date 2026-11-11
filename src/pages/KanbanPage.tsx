import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Ellipsis, Plus, Search, SquareKanban } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import TaskSlideover from "@/components/modals/TaskSlideover";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import TaskCard, { type KanbanTask } from "@/components/kanban/TaskCard";
import PageHeader from "@/components/app/PageHeader";
import PersonAvatar from "@/components/app/PersonAvatar";
import EmptyState from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "../lib/activityLogger";
import { useCompany } from "@/hooks/use-company";
import { safeRemoveChannel, withSupabaseTimeout } from "@/lib/supabaseLifecycle";
import { useSupabaseResumeRecovery } from "@/hooks/use-supabase-resume-recovery";
import { TASK_COLUMNS, TASK_PRIORITIES, TASK_TAGS } from "@/lib/task-meta";
import { toneClasses } from "@/lib/tones";
import { cn } from "@/lib/utils";

const ALL = "all";

function toTask(row: Record<string, unknown>): KanbanTask {
  const t = row as unknown as KanbanTask;
  return {
    ...t,
    tag: t.tag ?? "",
    tag_color: t.tag_color ?? "bg-secondary text-secondary-foreground",
    priority: t.priority ?? null,
    comments: t.comments ?? 0,
    attachments: t.attachments ?? 0,
    due_date: t.due_date ?? null,
    description: t.description ?? null,
    subtasks: t.subtasks ?? [],
    activities: t.activities ?? [],
  };
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KanbanTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [tagFilter, setTagFilter] = useState(ALL);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [activeMobileColumn, setActiveMobileColumn] = useState("backlog");

  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const columnRefs = useRef<Record<string, HTMLElement | null>>({});
  const { toast } = useToast();
  const { companyId, isCompanyLoading } = useCompany();

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoading(false);
      setTasks([]);
      setSelectedTask(null);
    }
  }, [companyId, isCompanyLoading]);

  const fetchTasks = useCallback(async (showLoading = false) => {
    if (!companyId) {
      if (showLoading) setIsLoading(false);
      return;
    }
    const requestId = ++fetchRequestIdRef.current;

    try {
      if (showLoading) setIsLoading(true);

      const { data, error } = await withSupabaseTimeout(
        supabase
          .from('kanban_tasks')
          .select('*')
          .eq('company_id', companyId)
          .order('position', { ascending: true }),
        "kanban tasks"
      );

      if (error) throw error;
      if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) return;

      const formatted = (data ?? []).map(toTask);
      setTasks(formatted);
      setSelectedTask((current) => current ? formatted.find((task) => task.id === current.id) ?? current : current);
    } catch (err) {
      console.error("Fetch Kanban Error:", err);
      toast({ title: "Couldn't load the board", description: "Check your connection and refresh.", variant: "destructive" });
    } finally {
      if (isMountedRef.current && (showLoading || requestId === fetchRequestIdRef.current)) {
        setIsLoading(false);
      }
    }
  }, [companyId, toast]);

  useSupabaseResumeRecovery({
    enabled: Boolean(companyId),
    onRecover: () => fetchTasks(false),
  });

  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchTasks(true);

    const channel = supabase.channel(`kanban-tasks-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_tasks', filter: `company_id=eq.${companyId}` }, () => {
        // Changes from other tabs/devices: refetch so ordering stays consistent.
        fetchTasks();
      })
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') fetchTasks();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[kanban realtime] disconnected, relying on mutation fetch fallback until websocket recovers.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      safeRemoveChannel(channel);
    };
  }, [companyId, fetchTasks]);

  // --- Filters ---
  const assignees = useMemo(() => {
    const seen = new Map<string, string>();
    for (const task of tasks) {
      if (task.assignee_id && task.assignee_name && !seen.has(task.assignee_id)) seen.set(task.assignee_id, task.assignee_name);
    }
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const isFiltering = query.trim() !== "" || priorityFilter !== ALL || tagFilter !== ALL || assigneeFilter !== null;

  const visibleTasks = useMemo(() => {
    const term = query.trim().toLowerCase();
    return tasks.filter((task) =>
      (!term || task.title.toLowerCase().includes(term) || (task.description ?? "").toLowerCase().includes(term)) &&
      (priorityFilter === ALL || task.priority === priorityFilter) &&
      (tagFilter === ALL || task.tag === tagFilter) &&
      (assigneeFilter === null || task.assignee_id === assigneeFilter)
    );
  }, [tasks, query, priorityFilter, tagFilter, assigneeFilter]);

  const columns = TASK_COLUMNS.map((col) => ({
    ...col,
    tasks: visibleTasks.filter((task) => task.column_id === col.id),
    total: tasks.filter((task) => task.column_id === col.id).length,
  }));

  const positionAtEnd = (columnId: string, excludeId?: string) => {
    const columnTasks = tasks.filter((task) => task.column_id === columnId && task.id !== excludeId);
    return columnTasks.length ? Math.max(...columnTasks.map((task) => task.position)) + 1000 : 1000;
  };

  const logMove = async (task: KanbanTask, columnId: string) => {
    if (!companyId) return;
    await logActivity({
      user: "You",
      action: "moved a task to",
      target: TASK_COLUMNS.find((c) => c.id === columnId)?.title || "a new column",
      message: `"${task.title}"`,
      type: columnId === "done" ? "success" : "upload",
      iconName: "CheckCircle",
      iconBg: columnId === "done" ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
      companyId
    });
  };

  // --- Drag & drop (indexes refer to the visible, possibly filtered lists) ---
  const onDragEnd = async (result: DropResult) => {
    if (!companyId) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const movedTask = tasks.find((task) => task.id === draggableId);
    if (!movedTask) return;

    const destTasks = visibleTasks.filter((task) => task.column_id === destination.droppableId && task.id !== draggableId);
    let newPosition = 1000;
    if (destTasks.length === 0) {
      newPosition = positionAtEnd(destination.droppableId, draggableId);
    } else if (destination.index === 0) {
      newPosition = destTasks[0].position - 1000;
    } else if (destination.index >= destTasks.length) {
      newPosition = destTasks[destTasks.length - 1].position + 1000;
    } else {
      newPosition = (destTasks[destination.index - 1].position + destTasks[destination.index].position) / 2;
    }

    // Optimistic update
    setTasks((current) =>
      current
        .map((task) => task.id === draggableId ? { ...task, column_id: destination.droppableId, position: newPosition } : task)
        .sort((a, b) => a.position - b.position)
    );

    try {
      const { error } = await supabase
        .from('kanban_tasks')
        .update({ column_id: destination.droppableId, position: newPosition })
        .eq('company_id', companyId)
        .eq('id', draggableId);
      if (error) throw error;

      await fetchTasks();
      if (source.droppableId !== destination.droppableId) await logMove(movedTask, destination.droppableId);
    } catch (err) {
      console.error("Drag Kanban Sync Error:", err);
      toast({ title: "Couldn't move the task", description: "It's back where it was. Try again.", variant: "destructive" });
      await fetchTasks();
    }
  };

  const handleMoveFromPanel = async (task: KanbanTask, columnId: string) => {
    if (!companyId || task.column_id === columnId) return;
    const position = positionAtEnd(columnId, task.id);
    try {
      const { error } = await supabase
        .from("kanban_tasks")
        .update({ column_id: columnId, position })
        .eq("company_id", companyId)
        .eq("id", task.id);
      if (error) throw error;
      await fetchTasks();
      await logMove(task, columnId);
    } catch (err) {
      console.error("Move Kanban Task Error:", err);
      toast({ title: "Couldn't change the status", description: "Try again.", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (task: KanbanTask) => {
    if (!companyId) return;
    try {
      const { error } = await supabase
        .from("kanban_tasks")
        .delete()
        .eq("company_id", companyId)
        .eq("id", task.id);
      if (error) throw error;

      setTasks((current) => current.filter((t) => t.id !== task.id));
      setSelectedTask((current) => (current?.id === task.id ? null : current));
      toast({ title: "Task deleted", description: `"${task.title}" was removed from the board.` });

      await logActivity({
        user: "You",
        action: "deleted a task",
        target: task.title,
        type: "warning",
        iconName: "Trash2",
        iconBg: "bg-destructive/10 text-destructive",
        companyId,
      });
    } catch (err) {
      console.error("Delete Task Error:", err);
      toast({ title: "Couldn't delete the task", description: "Try again.", variant: "destructive" });
    }
  };

  const handleAddTask = async (columnId: string) => {
    if (!companyId) return;
    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from('kanban_tasks')
        .insert([{
          company_id: companyId,
          column_id: columnId,
          title: "New task",
          tag: "Draft",
          tag_color: "bg-secondary text-secondary-foreground",
          priority: null,
          comments: 0,
          attachments: 0,
          due_date: null,
          position: positionAtEnd(columnId),
          description: "",
          subtasks: [],
          activities: []
        }])
        .select('*')
        .maybeSingle();
      if (error) throw error;

      await fetchTasks();
      // Open the new task straight away so it can be named.
      if (data) setSelectedTask(toTask(data));

      const colName = TASK_COLUMNS.find(c => c.id === columnId)?.title || columnId;
      await logActivity({
        user: "You",
        action: "created a new task in",
        target: colName,
        type: "upload",
        iconName: "GitBranch",
        iconBg: "bg-warning/10 text-warning",
        companyId
      });
    } catch (err) {
      console.error("Insert Kanban Task Error:", err);
      toast({ title: "Couldn't add the task", description: "Try again.", variant: "destructive" });
      await fetchTasks();
    } finally {
      setIsCreating(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setPriorityFilter(ALL);
    setTagFilter(ALL);
    setAssigneeFilter(null);
  };

  const scrollToColumn = (id: string) => {
    setActiveMobileColumn(id);
    columnRefs.current[id]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const showSkeleton = (isCompanyLoading && !companyId) || (Boolean(companyId) && isLoading);

  return (
    <div className="flex min-h-full flex-col gap-4 px-4 pb-12 pt-6 sm:gap-6 sm:px-6 lg:px-8 lg:pt-7">
      <PageHeader
        title="Project Board"
        className="flex-row items-center justify-between sm:items-end"
        description={<span className="hidden sm:inline">Track and manage your project tasks visually.</span>}
        actions={
          <>
            <Button className="hidden sm:inline-flex" onClick={() => handleAddTask("todo")} loading={isCreating}>
              {!isCreating && <Plus />} New Task
            </Button>
            <Button size="icon" className="sm:hidden" aria-label="New task" onClick={() => handleAddTask("todo")} loading={isCreating}>
              {!isCreating && <Plus />}
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="hidden flex-wrap items-center gap-2.5 md:flex">
        <div className="relative w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter tasks…" aria-label="Filter tasks" className="h-9 pl-9 md:text-small" />
        </div>

        {assignees.length > 0 && (
          <div className="flex items-center -space-x-2" role="group" aria-label="Filter by assignee">
            {assignees.slice(0, 4).map((person) => {
              const active = assigneeFilter === person.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  aria-pressed={active}
                  title={`Show ${person.name}'s tasks`}
                  onClick={() => setAssigneeFilter(active ? null : person.id)}
                  className={cn(
                    "rounded-full ring-2 transition-transform hover:z-10 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-ring",
                    active ? "z-10 ring-primary" : "ring-background"
                  )}
                >
                  <PersonAvatar name={person.name} id={person.id} size={28} />
                </button>
              );
            })}
            {assignees.length > 4 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-track text-[11px] font-semibold text-muted-foreground ring-2 ring-background">
                +{assignees.length - 4}
              </span>
            )}
          </div>
        )}

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-auto min-w-[120px]" aria-label="Priority filter">
            <span>Priority: <SelectValue /></span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-auto min-w-[100px]" aria-label="Tag filter">
            <span>Tag: <SelectValue /></span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {TASK_TAGS.map((t) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {isFiltering && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
        )}

        <span className="ml-auto text-small text-muted-foreground tabular">
          {isFiltering ? `${visibleTasks.length} of ${tasks.length} tasks` : `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
        </span>
      </div>

      {/* Mobile column switcher */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden" role="tablist" aria-label="Columns">
        {columns.map((col) => (
          <button
            key={col.id}
            type="button"
            role="tab"
            aria-selected={activeMobileColumn === col.id}
            onClick={() => scrollToColumn(col.id)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-label transition-colors",
              activeMobileColumn === col.id ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", toneClasses[col.tone].solid)} />
            {col.title}
          </button>
        ))}
      </div>

      {showSkeleton ? (
        <div className="flex gap-3 overflow-hidden">
          {TASK_COLUMNS.map((col) => (
            <div key={col.id} className="w-[216px] shrink-0 space-y-2.5 rounded-xl border border-border bg-surface-2 p-2.5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-28 w-full rounded-[10px]" />
              <Skeleton className="h-24 w-full rounded-[10px]" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={SquareKanban}
            title="No tasks yet"
            description="Add your first task and drag it across the board as work moves along."
            action={<Button onClick={() => handleAddTask("todo")} loading={isCreating}>{!isCreating && <Plus />} New Task</Button>}
            className="py-16"
          />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="-mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:snap-none lg:-mx-8 lg:px-8">
            {columns.map((col, colIdx) => (
              <motion.section
                key={col.id}
                ref={(node) => { columnRefs.current[col.id] = node; }}
                aria-label={col.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: colIdx * 0.04, ease: "easeOut" }}
                className="flex w-[300px] shrink-0 snap-start flex-col gap-2.5 rounded-xl border border-border bg-surface-2 p-2.5 md:w-[216px] xl:w-auto xl:min-w-[216px] xl:flex-1"
              >
                <header className="flex items-center gap-2 px-1 py-0.5">
                  <span className={cn("h-2 w-2 rounded-full", toneClasses[col.tone].solid)} aria-hidden="true" />
                  <h2 className="text-label text-foreground">{col.title}</h2>
                  <span className="rounded-full bg-track px-2 text-caption font-semibold leading-5 text-muted-foreground tabular">
                    {isFiltering && col.tasks.length !== col.total ? `${col.tasks.length}/${col.total}` : col.total}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={`${col.title} options`} className="ml-auto rounded-md p-0.5 text-subtle transition-colors hover:bg-card hover:text-foreground">
                        <Ellipsis className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => handleAddTask(col.id)}>
                        <Plus strokeWidth={1.75} /> Add task here
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn("flex min-h-[8px] flex-col gap-2.5 rounded-lg transition-colors", snapshot.isDraggingOver && "bg-primary-soft/60")}
                    >
                      {col.tasks.map((task, taskIdx) => (
                        <Draggable key={task.id} draggableId={task.id} index={taskIdx}>
                          {(dragProvided, dragSnapshot) => (
                            <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                              <TaskCard
                                task={task}
                                isDragging={dragSnapshot.isDragging}
                                onOpen={() => setSelectedTask(task)}
                                onDelete={() => setDeleteTarget(task)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button
                  type="button"
                  onClick={() => handleAddTask(col.id)}
                  disabled={isCreating}
                  className="flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong text-label text-muted-foreground transition-colors hover:border-primary/50 hover:bg-card hover:text-primary disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Add Task
                </button>
              </motion.section>
            ))}
          </div>
        </DragDropContext>
      )}

      <TaskSlideover
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onTaskUpdated={fetchTasks}
        onMove={handleMoveFromPanel}
        onDelete={(task) => setDeleteTarget(task)}
        companyId={companyId}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void handleDeleteTask(deleteTarget)}
        title="Delete task?"
        itemName={deleteTarget?.title}
        description="The task, its subtasks and comments will be removed for everyone."
      />
    </div>
  );
}
