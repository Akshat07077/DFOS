"use client";

import { useState } from "react";
import { createTask, updateTask } from "@/actions/tasks";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isControlled = onOpenChange !== undefined;

  const { pending, handleSubmit } = useDialogForm(() => setOpen(false), {
    successMessage: task ? "Task updated" : "Task created",
  });

  const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <>
      {trigger && isControlled ? trigger : trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">{trigger}</span>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((formData) =>
              task ? updateTask(task.id, formData) : createTask(formData)
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={task?.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={task?.description ?? ""} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={task?.status ?? "todo"} className={selectClass}>
                  {(["backlog", "todo", "in_progress", "review", "done"] as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select id="priority" name="priority" defaultValue={task?.priority ?? "medium"} className={selectClass}>
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
              <select id="project_id" name="project_id" defaultValue={task?.project_id ?? defaultProjectId ?? ""} className={selectClass}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned to</Label>
              <select id="assigned_to" name="assigned_to" defaultValue={task?.assigned_to ?? ""} className={selectClass}>
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
    </>
  );
}
