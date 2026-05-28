"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Columns3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProject } from "@/actions/projects";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { Client, Project, ProjectStatus } from "@/types/database";
import { PROJECT_STATUS_LABELS } from "@/types/database";

type ViewMode = "grid" | "list" | "kanban";

export function ProjectsView({
  projects,
  clients,
}: {
  projects: Project[];
  clients: Pick<Client, "id" | "company">[];
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const statuses = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];

  const handleDelete = (project: Project, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!confirm(`Move project "${project.title}" to trash? You can restore it from Trash.`)) return;

    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Project moved to trash");
        router.refresh();
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Projects" description="Manage agency projects and delivery">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {([
              { mode: "grid" as const, icon: LayoutGrid },
              { mode: "list" as const, icon: List },
              { mode: "kanban" as const, icon: Columns3 },
            ]).map(({ mode, icon: Icon }) => (
              <Button
                key={mode}
                variant={view === mode ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView(mode)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <ProjectFormDialog
            clients={clients}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            trigger={
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" /> New
              </Button>
            }
          />
        </div>
      </PageHeader>

      {projects.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No projects yet"
          description="Create your first project to start tracking delivery."
          action={{ label: "Create Project", onClick: () => setDialogOpen(true) }}
        />
      ) : view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {statuses.map((status) => (
            <div key={status} className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
                {PROJECT_STATUS_LABELS[status]}
              </h3>
              <div className="space-y-2 min-h-[120px]">
                {projects.filter((p) => p.status === status).map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    compact
                    pending={pending}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-accent/30"
            >
              <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
                <p className="font-medium">{project.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <ProjectStatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Delete project"
                  disabled={pending}
                  onClick={(e) => handleDelete(project, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              pending={pending}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  compact,
  pending,
  onDelete,
}: {
  project: Project;
  compact?: boolean;
  pending?: boolean;
  onDelete: (project: Project, e?: React.MouseEvent) => void;
}) {
  return (
    <Card className={cn("relative transition-all hover:border-primary/30 hover:shadow-md h-full", compact && "text-sm")}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-2 top-2 z-10 h-7 w-7 text-muted-foreground hover:text-destructive",
          compact && "h-6 w-6"
        )}
        aria-label="Delete project"
        disabled={pending}
        onClick={(e) => onDelete(project, e)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Link href={`/projects/${project.id}`}>
        <CardHeader className={compact ? "p-3 pb-0 pr-10" : "pr-10"}>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className={cn("line-clamp-1", compact ? "text-sm" : "text-base")}>
              {project.title}
            </CardTitle>
            <PriorityBadge priority={project.priority} />
          </div>
        </CardHeader>
        <CardContent className={compact ? "p-3 pt-2" : undefined}>
          <div className="flex items-center justify-between">
            <ProjectStatusBadge status={project.status} />
            {project.deadline && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeDate(project.deadline)}
              </span>
            )}
          </div>
          {!compact && project.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          )}
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
