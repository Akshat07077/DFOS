"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateTaskStatus, deleteTask } from "@/actions/tasks";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeDate, isOverdue } from "@/lib/utils";
import type { Profile, Project, Task, TaskStatus, PriorityLevel } from "@/types/database";
import { TASK_STATUS_LABELS } from "@/types/database";

const STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

export function TasksBoard({
  tasks: initialTasks,
  projects,
  profiles,
}: {
  tasks: Task[];
  projects: Pick<Project, "id" | "title">[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | "all">("all");
  const [filterFounder, setFilterFounder] = useState<string>("all");
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const filtered = tasks.filter((t) => {
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterFounder !== "all" && t.assigned_to !== filterFounder) return false;
    return true;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    let newStatus = over.id as TaskStatus;

    if (!STATUSES.includes(newStatus)) {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) newStatus = overTask.status;
      else return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      const result = await updateTaskStatus(taskId, newStatus);
      if (result?.error) {
        toast.error(result.error);
        setTasks(initialTasks);
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTask(id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Task deleted");
        setTasks((prev) => prev.filter((t) => t.id !== id));
        router.refresh();
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Tasks" description="Drag to update status · filter by founder or priority">
        <TaskFormDialog
          projects={projects}
          profiles={profiles}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trigger={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> New Task
            </Button>
          }
        />
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as PriorityLevel | "all")}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">All priorities</option>
          {(["low", "medium", "high", "urgent"] as PriorityLevel[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterFounder}
          onChange={(e) => setFilterFounder(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">All founders</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No tasks"
          description="Create tasks or adjust filters."
          action={{ label: "New Task", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={filtered.filter((t) => t.status === status)}
                projects={projects}
                profiles={profiles}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <TaskCard task={tasks.find((t) => t.id === activeId)!} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  projects,
  profiles,
  onDelete,
}: {
  status: TaskStatus;
  tasks: Task[];
  projects: Pick<Project, "id" | "title">[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[220px] flex-shrink-0 rounded-lg transition-colors",
        isOver && "bg-primary/5"
      )}
    >
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
        {TASK_STATUS_LABELS[status]} ({tasks.length})
      </h3>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px] rounded-lg bg-muted/30 p-2">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              projects={projects}
              profiles={profiles}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTask({
  task,
  projects,
  profiles,
  onDelete,
}: {
  task: Task;
  projects: Pick<Project, "id" | "title">[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        projects={projects}
        profiles={profiles}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
}

function TaskCard({
  task,
  projects,
  profiles,
  onDelete,
  isDragging,
}: {
  task: Task;
  projects?: Pick<Project, "id" | "title">[];
  profiles?: Pick<Profile, "id" | "full_name" | "email">[];
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}) {
  const overdue = isOverdue(task.deadline) && task.status !== "done";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing",
        overdue && "border-red-500/40 bg-red-500/5",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{task.title}</p>
        <div className="flex shrink-0 gap-0.5">
          {projects && profiles && (
            <TaskFormDialog
              task={task}
              projects={projects}
              profiles={profiles}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Edit task"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              }
            />
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      {task.project && (
        <p className="mt-1 text-xs text-muted-foreground">{task.project.title}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.deadline && (
          <span className={cn("text-[10px]", overdue ? "text-red-400" : "text-muted-foreground")}>
            {formatRelativeDate(task.deadline)}
          </span>
        )}
      </div>
      {task.blockers && (
        <p className="mt-2 text-xs text-amber-400/80 line-clamp-1">⚠ {task.blockers}</p>
      )}
    </div>
  );
}
