import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {Plus, MoreHorizontal, MessageSquare, Paperclip, Clock, Loader2, Trash2} from "lucide-react";
import TaskSlideover from "@/components/modals/TaskSlideover"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "../lib/activityLogger";
import { useCompany } from "@/hooks/use-company";

// --- INTERFACES ---
interface Task {
  id: string;
  company_id: string;
  column_id: string;
  title: string;
  tag: string;
  tag_color: string;
  tagColor: string; // Di DB namanya tag_color
  priority: "high" | "medium" | "low" | null;
  comments: number;
  attachments: number;
  due_date: string | null;
  dueDate?: string | null; // Di DB namanya due_date
  position: number;
  description: string | null;
  subtasks: Subtask[];
  activities: Activity[];
  created_at: string;
  updated_at: string;
  assignee_id?: string | null;
  assignee_name?: string | null;
}

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

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

// Kolom dasar (Hanya struktur, datanya ditarik dari DB)
const baseColumns = [
  { id: "backlog", title: "Backlog", color: "bg-muted-foreground" },
  { id: "todo", title: "To Do", color: "bg-warning" },
  { id: "progress", title: "In Progress", color: "bg-primary" },
  { id: "review", title: "Review", color: "bg-warning" },
  { id: "done", title: "Done", color: "bg-success" },
];

export default function KanbanPage() {
  const [columnsData, setColumnsData] = useState<Column[]>(
    baseColumns.map(col => ({ ...col, tasks: [] }))
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const { toast } = useToast();
  const { companyId, isCompanyLoading, companyError } = useCompany();

  useEffect(() => {
    if (!isCompanyLoading && !companyId) {
      setIsLoading(false);
      setColumnsData(baseColumns.map(col => ({ ...col, tasks: [] })));
      setSelectedTask(null);
    }
  }, [companyId, isCompanyLoading]);

  const fetchTasks = useCallback(async (showLoading = false) => {
    if (!companyId) return;
    const requestId = ++fetchRequestIdRef.current;

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const { data, error } = await supabase
        .from('kanban_tasks')
        .select('*')
        .eq('company_id', companyId)
        .order('position', { ascending: true });

      if (error) throw error;
      if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) return;

      if (data) {
        // Format penamaan kolom DB ke UI React
        const formattedTasks: Task[] = data.map(t => ({
          ...t,
          tag_color: t.tag_color ?? "bg-secondary text-secondary-foreground",
          tagColor: t.tag_color ?? "bg-secondary text-secondary-foreground",
          priority: t.priority ?? null,
          comments: t.comments ?? 0,
          attachments: t.attachments ?? 0,
          due_date: t.due_date ?? null,
          dueDate: t.due_date,
          description: t.description ?? null,
          subtasks: t.subtasks ?? [],
          activities: t.activities ?? [],
        }));

        // Kelompokkan task ke masing-masing kolom
        const populatedColumns = baseColumns.map(col => ({
          ...col,
          tasks: formattedTasks.filter(t => t.column_id === col.id)
        }));
        
        setColumnsData(populatedColumns);
        setSelectedTask(currentTask => {
          if (!currentTask) return currentTask;
          return formattedTasks.find(task => task.id === currentTask.id) ?? currentTask;
        });
      }
    } catch (err) {
      console.error("Fetch Kanban Error:", err);
      toast({
        title: "Fetch Error",
        description: "Gagal memuat data Kanban dari Supabase.",
        variant: "destructive"
      });
    } finally {
      if (isMountedRef.current && requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [companyId, toast]);

  // --- FETCH DATA & REAL-TIME LISTENER ---
  useEffect(() => {
    isMountedRef.current = true;
    if (!companyId) return;
    fetchTasks(true);

    const channel = supabase.channel(`kanban-tasks-realtime:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_tasks', filter: `company_id=eq.${companyId}` }, (payload) => {
        console.info("[kanban realtime] change received:", payload.eventType, payload);
        // Jika ada perubahan dari tab/device lain, fetch ulang agar urutan tetap konsisten.
        fetchTasks();
      })
      .subscribe((status, error) => {
        console.info("[kanban realtime] status:", status, error ?? "");

        if (status === 'SUBSCRIBED') {
          fetchTasks();
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn("[kanban realtime] disconnected, relying on mutation fetch fallback until websocket recovers.", { status, error });
        }
      });

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchTasks]);

  // --- HANDLER DRAG & DROP (Menyimpan ke Database) ---
  const onDragEnd = async (result: DropResult) => {
    if (!companyId) {
      toast({ title: "Company Error", description: "Company context belum tersedia.", variant: "destructive" });
      return;
    }

    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Kloning state untuk Optimistic UI Update
    const newCols = columnsData.map(col => ({ ...col, tasks: [...col.tasks] }));
    const sourceColIndex = newCols.findIndex(c => c.id === source.droppableId);
    const destColIndex = newCols.findIndex(c => c.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceTasks = newCols[sourceColIndex].tasks;

    // Angkat task
    const [movedTask] = sourceTasks.splice(source.index, 1);
    if (!movedTask) return;

    const destTasks = source.droppableId === destination.droppableId
      ? sourceTasks
      : newCols[destColIndex].tasks;
    
    // --- MENGHITUNG POSISI BARU ---
    let newPosition = 1000;
    if (destTasks.length === 0) {
      newPosition = 1000;
    } else if (destination.index === 0) {
      newPosition = destTasks[0].position - 1000;
    } else if (destination.index === destTasks.length) {
      newPosition = destTasks[destTasks.length - 1].position + 1000;
    } else {
      const prevPos = destTasks[destination.index - 1].position;
      const nextPos = destTasks[destination.index].position;
      newPosition = (prevPos + nextPos) / 2; 
    }

    movedTask.position = newPosition;
    movedTask.column_id = destination.droppableId;
    
    // Masukkan task ke tujuan
    destTasks.splice(destination.index, 0, movedTask);

    // Update UI Lokal
    newCols[sourceColIndex].tasks = sourceTasks;
    if (source.droppableId !== destination.droppableId) {
      newCols[destColIndex].tasks = destTasks;
    }
    setColumnsData(newCols);

    try {
      // Update Database di belakang layar
      const { error } = await supabase
        .from('kanban_tasks')
        .update({ column_id: destination.droppableId, position: newPosition })
        .eq('company_id', companyId)
        .eq('id', draggableId);

      if (error) throw error;

      await fetchTasks();

      // NOTIFIKASI
      if (source.droppableId !== destination.droppableId) {
        const destColName = baseColumns.find(c => c.id === destination.droppableId)?.title || "a new column";
        await logActivity({
          user: "You",
          action: `moved a task to`,
          target: destColName,
          message: `"${movedTask.title}"`,
          type: destination.droppableId === "done" ? "success" : "upload", // Hijau jika masuk Done
          iconName: "CheckCircle",
          iconBg: destination.droppableId === "done" ? "bg-success/10 text-success" : "bg-primary/10 text-primary",
          companyId
        });
      }
    } catch (err) {
      console.error("Drag Kanban Sync Error:", err);
      toast({ title: "Sync Error", description: "Gagal menyimpan posisi ke server.", variant: "destructive" });
      await fetchTasks(); // Kembalikan ke posisi awal jika gagal
    }
  };

  const handleDeleteTask = async (taskId: string) => {

    if (!companyId) {
      toast({
        title: "Company Error",
        description: "Company context belum tersedia.",
        variant: "destructive",
      });

      return;
    }

    try {

      const { error } = await supabase
        .from("kanban_tasks")
        .delete()
        .eq("company_id", companyId)
        .eq("id", taskId);

      if (error) throw error;

      setColumnsData((prev) =>
        prev.map((column) => ({
          ...column,
          tasks: column.tasks.filter(
            (task) => task.id !== taskId
          ),
        }))
      );

      toast({
        title: "Task Deleted",
        description: "Task berhasil dihapus.",
      });

      await logActivity({
        user: "You",
        action: "deleted a task",
        target: taskId,
        type: "warning",
        iconName: "Trash2",
        iconBg: "bg-destructive/10 text-destructive",
        companyId,
      });

    } catch (err) {

      console.error("Delete Task Error:", err);

      toast({
        title: "Delete Failed",
        description: "Gagal menghapus task.",
        variant: "destructive",
      });
    }
  };

  // --- HANDLER ADD NEW TASK (Simpan ke DB) ---
  const handleAddTask = async (columnId: string) => {
    if (!companyId) {
      toast({ title: "Company Error", description: "Company context belum tersedia.", variant: "destructive" });
      return;
    }

    const colIndex = columnsData.findIndex(c => c.id === columnId);
    const targetColTasks = columnsData[colIndex].tasks;
    
    // Taruh di paling bawah
    const newPos = targetColTasks.length > 0 
      ? targetColTasks[targetColTasks.length - 1].position + 1000 
      : 1000;

    const newTaskDB = {
    company_id: companyId,
    column_id: columnId,
    title: "New Draft Task",
    tag: "Draft",
    tag_color: "bg-secondary text-secondary-foreground",
    priority: null,
    comments: 0,
    attachments: 0,
    due_date: null,
    position: newPos,
    description: "",
    subtasks: [],
    activities: []
  };

    try {
      const { error } = await supabase
        .from('kanban_tasks')
        .insert([newTaskDB])
        .select('*')
        .maybeSingle();
      
      if (error) throw error;

      await fetchTasks();
      toast({ title: "Tugas Ditambahkan", description: "Tugas baru tersimpan ke database!" });
    } catch (err) {
      console.error("Insert Kanban Task Error:", err);
      toast({ title: "Error", description: "Gagal menambah tugas baru.", variant: "destructive" });
      await fetchTasks();
      return;
    }
      
    // NOTIFIKASI TASK BARU
    const colName = baseColumns.find(c => c.id === columnId)?.title || columnId;
    await logActivity({
      user: "You",
      action: "created a new task in",
      target: colName,
      type: "upload",
      iconName: "GitBranch", 
      iconBg: "bg-warning/10 text-warning",
      companyId
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Loading Overlay */}
      {(isCompanyLoading || (Boolean(companyId) && isLoading)) && (
        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {companyError && (
        <div className="m-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Gagal memuat company context. Silakan refresh atau login ulang.
        </div>
      )}

      {!isCompanyLoading && !companyId && !companyError && (
        <div className="m-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Company context belum tersedia. Hubungi admin workspace Anda.
        </div>
      )}

      {/* Header */}
      <div className="p-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Project Board</h1>
          <p className="text-muted-foreground mt-1">Track and manage your project tasks visually.</p>
        </div>
        <motion.button
          onClick={() => handleAddTask("todo")} 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-primary-glow"
        >
          <Plus className="h-4 w-4" /> New Task
        </motion.button>
      </div>

      {/* Board dengan DragDropContext */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {columnsData.map((col, colIdx) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: colIdx * 0.08 }}
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

                {/* Tasks List (Droppable) */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 space-y-3 overflow-y-auto pb-4 transition-colors rounded-xl ${snapshot.isDraggingOver ? "bg-muted/50" : ""}`}
                    >
                      {col.tasks.map((task, taskIdx) => (
                        <Draggable key={task.id} draggableId={task.id} index={taskIdx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <div
                                onClick={() => setSelectedTask(task)}
                                className={`task-card bg-card rounded-xl border border-border p-4 cursor-pointer transition-shadow ${
                                  snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/50 rotate-2 scale-105" : "shadow-card hover:shadow-card-hover"
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">

                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${task.tagColor}`}>{task.tag}</span>

                                  <div className="flex items-center gap-2">

                                    {task.priority === "high" && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-destructive/10 text-destructive uppercase">
                                        High
                                      </span>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTask(task.id);
                                      }}
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                  </div>

                                </div>
                                <h4 className="text-sm font-medium text-foreground mb-3 leading-snug">{task.title}</h4>
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold uppercase">
                                    {task.assignee_name
                                      ? task.assignee_name[0]
                                      : "A"}
                                  </div>
                                  <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                    {task.comments > 0 && (
                                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {task.comments}</span>
                                    )}
                                    {task.attachments > 0 && (
                                      <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> {task.attachments}</span>
                                    )}
                                    {task.dueDate && (
                                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.dueDate}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      <button 
                        onClick={() => handleAddTask(col.id)}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 text-sm font-medium mt-3"
                      >
                        <Plus className="h-4 w-4" /> Add Task
                      </button>
                    </div>
                  )}
                </Droppable>
              </motion.div>
            ))}
          </div>
        </DragDropContext>
      </div>

      <TaskSlideover
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onTaskUpdated={fetchTasks}
        companyId={companyId}
      />
    </div>
  );
}
