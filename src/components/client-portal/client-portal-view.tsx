"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock3, FolderKanban, ListTodo, MessageSquareMore } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"overview" | "updates" | "feedback">("overview");
  const [pending, startTransition] = useTransition();
  const { handleSubmit } = useDialogForm(() => undefined, {
    successMessage: "Feedback submitted",
  });

  const activeProjects = projects.filter((p) => p.status !== "completed" && p.status !== "archived");
  const upcomingTasks = tasks.filter((t) => t.status !== "done").slice(0, 10);
  const openFeedback = feedback.filter((f) => f.status !== "done");
  const getProjectTitle = (
    value?: { id: string; title: string } | { id: string; title: string }[] | null
  ) => (Array.isArray(value) ? value[0]?.title : value?.title) ?? "General";
  const latestUpdates = useMemo(() => updates.slice(0, 12), [updates]);

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
      <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Client Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold">Project Progress & Collaboration</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track delivery, read updates, and report feedback in one place.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Projects" value={projects.length} icon={FolderKanban} />
            <StatCard label="Upcoming Tasks" value={upcomingTasks.length} icon={ListTodo} />
            <StatCard label="Open Feedback" value={openFeedback.length} icon={MessageSquareMore} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1">
        <TabButton
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <TabButton
          label="Updates"
          active={activeTab === "updates"}
          onClick={() => setActiveTab("updates")}
        />
        <TabButton
          label="Feedback & Bugs"
          active={activeTab === "feedback"}
          onClick={() => setActiveTab("feedback")}
        />
      </div>

      {activeTab === "overview" && (
        <>
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
        </>
      )}

      {activeTab === "updates" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            ) : (
              latestUpdates.map((update) => (
                <div key={update.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm leading-relaxed">{update.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getProjectTitle(update.project)} · {new Date(update.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "feedback" && (
        <div className="grid gap-4 lg:grid-cols-2">
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
                      <StatusPill status={item.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.project?.title ?? "Project"}</p>
                    <p className="mt-1 text-sm">{item.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      className="h-9 rounded-lg px-4"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] text-amber-400">
      <Clock3 className="h-3 w-3" /> {status.replace("_", " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
