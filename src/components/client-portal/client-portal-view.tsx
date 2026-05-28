"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createClientFeedback } from "@/actions/client-portal";
import { useDialogForm } from "@/hooks/use-dialog-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientFeedback } from "@/types/database";

type PortalProject = {
  id: string;
  title: string;
  status: string;
  progress: number;
  deadline: string | null;
  updated_at: string;
};

type PortalTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string | null;
  project?: { id: string; title: string } | { id: string; title: string }[] | null;
};

type PortalUpdate = {
  id: string;
  message: string;
  created_at: string;
  project?: { id: string; title: string } | { id: string; title: string }[] | null;
};

export function ClientPortalView({
  projects,
  tasks,
  updates,
  feedback,
}: {
  projects: PortalProject[];
  tasks: PortalTask[];
  updates: PortalUpdate[];
  feedback: ClientFeedback[];
}) {
  const [pending, startTransition] = useTransition();
  const { handleSubmit } = useDialogForm(() => undefined, {
    successMessage: "Feedback submitted",
  });

  const activeProjects = projects.filter((p) => p.status !== "completed" && p.status !== "archived");
  const upcomingTasks = tasks.filter((t) => t.status !== "done").slice(0, 10);
  const getProjectTitle = (
    value?: { id: string; title: string } | { id: string; title: string }[] | null
  ) => (Array.isArray(value) ? value[0]?.title : value?.title) ?? "General";

  const onFeedbackSubmit = handleSubmit(async (formData) => {
    const result = await createClientFeedback(formData);
    if (result?.error) {
      toast.error(result.error);
      return result;
    }
    return result;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Active Work" value={activeProjects.length} />
        <StatCard label="Open Feedback" value={feedback.filter((f) => f.status !== "done").length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects assigned yet.</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{project.title}</p>
                  <span className="text-xs text-muted-foreground">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming tasks yet.</p>
            ) : (
              upcomingTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getProjectTitle(task.project)} · {task.status.replace("_", " ")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            ) : (
              updates.slice(0, 8).map((update) => (
                <div key={update.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm">{update.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getProjectTitle(update.project)} · {new Date(update.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Feedback / Bug</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onFeedbackSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="project_id">Project</Label>
                <select
                  id="project_id"
                  name="project_id"
                  required
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="medium"
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Details</Label>
              <Textarea id="description" name="description" required rows={4} />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Feedback Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="text-xs capitalize text-muted-foreground">
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.project?.title ?? "Project"}</p>
                <p className="mt-1 text-sm">{item.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
