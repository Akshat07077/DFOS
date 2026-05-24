"use client";

import { useState } from "react";
import { Pencil, Radio, Plus } from "lucide-react";
import { UpdateFormDialog } from "@/components/updates/update-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Project, Update } from "@/types/database";

export function UpdatesFeed({
  updates,
  projects,
}: {
  updates: Update[];
  projects: Pick<Project, "id" | "title">[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Updates" description="Internal async feed for founder communication">
        <UpdateFormDialog
          projects={projects}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trigger={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Post Update
            </Button>
          }
        />
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
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-relaxed flex-1">{update.message}</p>
                  <UpdateFormDialog
                    update={update}
                    projects={projects}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Edit update"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                </div>
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
