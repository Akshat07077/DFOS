"use client";

import { useState } from "react";
import { createProject, updateProject } from "@/actions/projects";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Client, Project, ProjectStatus, PriorityLevel } from "@/types/database";

export function ProjectFormDialog({
  project,
  clients,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  project?: Project;
  clients: Pick<Client, "id" | "company">[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isControlled = onOpenChange !== undefined;

  const { pending, handleSubmit } = useDialogForm(() => setOpen(false), {
    successMessage: project ? "Project updated" : "Project created",
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
            <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((formData) =>
              project ? updateProject(project.id, formData) : createProject(formData)
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={project?.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={project?.description ?? ""} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={project?.status ?? "planning"} className={selectClass}>
                  {(["planning", "active", "on_hold", "completed", "archived"] as ProjectStatus[]).map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select id="priority" name="priority" defaultValue={project?.priority ?? "medium"} className={selectClass}>
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
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={project?.client_id ?? ""}
                className={selectClass}
              >
                <option value="">No linked client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company}
                  </option>
                ))}
              </select>
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
    </>
  );
}
