"use client";

import { useState } from "react";
import { createUpdate, updateUpdate } from "@/actions/updates";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Project, Update } from "@/types/database";

export function UpdateFormDialog({
  update,
  projects,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  update?: Update;
  projects: Pick<Project, "id" | "title">[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isControlled = onOpenChange !== undefined;

  const { pending, handleSubmit } = useDialogForm(() => setOpen(false), {
    successMessage: update ? "Update saved" : "Update posted",
  });

  const selectClass =
    "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <>
      {trigger && isControlled
        ? trigger
        : trigger
          ? (
            <span
              onClick={() => setOpen(true)}
              className="inline-flex cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
            >
              {trigger}
            </span>
          )
          : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{update ? "Edit Update" : "Post Update"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((formData) =>
              update ? updateUpdate(update.id, formData) : createUpdate(formData)
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor={`message-${update?.id ?? "new"}`}>Message</Label>
              <Textarea
                id={`message-${update?.id ?? "new"}`}
                name="message"
                required
                rows={4}
                defaultValue={update?.message ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`project_id-${update?.id ?? "new"}`}>Project (optional)</Label>
              <select
                id={`project_id-${update?.id ?? "new"}`}
                name="project_id"
                defaultValue={update?.project_id ?? ""}
                className={selectClass}
              >
                <option value="">General</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving..." : update ? "Save changes" : "Post"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
