"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProject, updateProject } from "@/actions/projects";
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
import type { Project, ProjectStatus, PriorityLevel } from "@/types/database";

export function ProjectFormDialog({
  project,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  project?: Project;
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
      const result = project
        ? await updateProject(project.id, formData)
        : await createProject(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(project ? "Project updated" : "Project created");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={project?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={project?.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={project?.status ?? "planning"}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {(["planning", "active", "on_hold", "completed", "archived"] as ProjectStatus[]).map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue={project?.priority ?? "medium"}
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
              defaultValue={project?.deadline ? new Date(project.deadline).toISOString().slice(0, 16) : ""}
            />
          </div>
          {project && (
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input id="progress" name="progress" type="number" min={0} max={100} defaultValue={project.progress} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : project ? "Update" : "Create Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
