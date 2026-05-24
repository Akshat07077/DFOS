"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTask, updateTask } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Profile, Project, Task, TaskStatus, PriorityLevel } from "@/types/database";

export function TaskFormDialog({
  task,
  projects,
  profiles,
  defaultProjectId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  task?: Task;
  projects: Pick<Project, "id" | "title">[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
  defaultProjectId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = task
        ? await updateTask(task.id, formData)
        : await createTask(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(task ? "Task updated" : "Task created");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={task?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={task?.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={task?.status ?? "todo"}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {(["backlog", "todo", "in_progress", "review", "done"] as TaskStatus[]).map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue={task?.priority ?? "medium"}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {(["low", "medium", "high", "urgent"] as PriorityLevel[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              name="deadline"
              type="datetime-local"
              defaultValue={task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project_id">Project</Label>
            <select
              id="project_id"
              name="project_id"
              defaultValue={task?.project_id ?? defaultProjectId ?? ""}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned to</Label>
            <select
              id="assigned_to"
              name="assigned_to"
              defaultValue={task?.assigned_to ?? ""}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="blockers">Blockers</Label>
            <Textarea id="blockers" name="blockers" defaultValue={task?.blockers ?? ""} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : task ? "Update" : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
