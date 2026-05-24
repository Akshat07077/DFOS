"use client";

import { useState } from "react";
import { Radio, Plus } from "lucide-react";
import { createUpdate } from "@/actions/updates";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project, Update } from "@/types/database";

export function UpdatesFeed({
  updates,
  projects,
}: {
  updates: Update[];
  projects: Pick<Project, "id" | "title">[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { pending, handleSubmit } = useDialogForm(() => setDialogOpen(false), {
    successMessage: "Update posted",
  });

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Updates" description="Internal async feed for founder communication">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Post Update
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post Update</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((formData) => createUpdate(formData))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_id">Project (optional)</Label>
                <select
                  id="project_id"
                  name="project_id"
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
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
                {pending ? "Posting..." : "Post"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {updates.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No updates yet"
          description="Share progress, decisions, and blockers async."
        />
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id}>
              <CardContent className="pt-5">
                <p className="text-sm leading-relaxed">{update.message}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {update.author?.full_name ?? "Founder"}
                  </span>
                  <span>·</span>
                  <span>{update.project?.title ?? "General"}</span>
                  <span>·</span>
                  <span>{new Date(update.created_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
