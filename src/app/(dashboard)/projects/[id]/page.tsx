import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { getProject } from "@/actions/projects";
import { getTasks } from "@/actions/tasks";
import { getUpdates } from "@/actions/updates";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectStatusBadge, PriorityBadge, TaskStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const [tasks, updates] = await Promise.all([
    getTasks({ projectId: id }),
    getUpdates(id),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
            {project.deadline && (
              <span className="text-sm text-muted-foreground">
                Due {formatRelativeDate(project.deadline)}
              </span>
            )}
          </div>
        </div>
        <ProjectFormDialog
          project={project}
          trigger={<Button variant="outline" size="sm">Edit</Button>}
        />
      </div>

      {project.description && (
        <p className="text-muted-foreground max-w-3xl">{project.description}</p>
      )}

      <div className="h-2 rounded-full bg-muted overflow-hidden max-w-md">
        <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tasks</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/tasks?project=${id}&new=1`}><Plus className="h-3 w-3" /> Add</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <TaskStatusBadge status={task.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No updates yet</p>
            ) : (
              updates.map((update) => (
                <div key={update.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm">{update.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {update.author?.full_name} · {new Date(update.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {project.links?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Links</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {project.links.map((link: { id: string; title: string; url: string }) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                {link.title}
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
