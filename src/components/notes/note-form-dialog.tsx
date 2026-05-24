"use client";

import { useState } from "react";
import { createNote, updateNote } from "@/actions/notes";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Note } from "@/types/database";

export function NoteFormDialog({
  note,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  note?: Note;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isControlled = onOpenChange !== undefined;

  const { pending, handleSubmit } = useDialogForm(() => setOpen(false), {
    successMessage: note ? "Note updated" : "Note created",
  });

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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{note ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((formData) =>
              note ? updateNote(note.id, formData) : createNote(formData)
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor={`title-${note?.id ?? "new"}`}>Title</Label>
              <Input
                id={`title-${note?.id ?? "new"}`}
                name="title"
                required
                defaultValue={note?.title ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`content-${note?.id ?? "new"}`}>Content</Label>
              <Textarea
                id={`content-${note?.id ?? "new"}`}
                name="content"
                rows={8}
                placeholder="Write your thoughts..."
                defaultValue={note?.content ?? ""}
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving..." : note ? "Save changes" : "Create Note"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
