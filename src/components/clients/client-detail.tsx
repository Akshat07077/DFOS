"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, FolderKanban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteClient, addClientActivity } from "@/actions/clients";
import {
  inviteClientPortalUser,
  updateClientFeedbackStatus,
} from "@/actions/client-portal";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientStatusBadge, PriorityBadge, ProjectStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type {
  Client,
  ClientActivity,
  ClientFeedback,
  FeedbackStatus,
  Profile,
  Project,
} from "@/types/database";

export function ClientDetail({
  client,
  activities,
  projects,
  profiles,
  portalUsers,
  feedback,
}: {
  client: Client & { project_count?: number };
  activities: ClientActivity[];
  projects: Array<Pick<Project, "id" | "title" | "status" | "progress">>;
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
  portalUsers: Array<{ id: string; full_name: string | null; email: string }>;
  feedback: ClientFeedback[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        "Move this client to trash? You can restore it from Trash. Portal logins are not removed."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteClient(client.id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Client moved to trash");
        router.push("/clients");
      }
    });
  };

  const handleActivity = (formData: FormData) => {
    startTransition(async () => {
      const result = await addClientActivity(formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Activity logged");
        router.refresh();
      }
    });
  };

  const handlePortalInvite = (formData: FormData) => {
    startTransition(async () => {
      const result = await inviteClientPortalUser(formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(result.message ?? "Client portal user saved");
        router.refresh();
      }
    });
  };

  const handleFeedbackStatus = (id: string, status: FeedbackStatus) => {
    startTransition(async () => {
      const result = await updateClientFeedbackStatus(id, status);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Feedback status updated");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{client.company}</h1>
          <p className="text-muted-foreground">{client.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <ClientStatusBadge status={client.status} />
            <PriorityBadge priority={client.priority} />
          </div>
        </div>
        <ClientFormDialog client={client} profiles={profiles} trigger={<Button variant="outline" size="sm">Edit</Button>} />
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={pending}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Email", value: client.email },
          { label: "Phone", value: client.phone },
          { label: "Industry", value: client.industry },
          { label: "Contract", value: client.contract_value != null ? `$${Number(client.contract_value).toLocaleString()}` : null },
          { label: "Owner", value: client.assignee?.full_name },
          { label: "Projects", value: String(client.project_count ?? projects.length) },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium mt-0.5">{item.value ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {client.website && (
        <Button asChild variant="outline" size="sm">
          <a href={client.website.startsWith("http") ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Website
          </a>
        </Button>
      )}

      {client.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4" /> Projects
          </CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/projects?client=${client.id}`}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked projects yet</p>
          ) : (
            projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/30">
                <span className="text-sm font-medium">{p.title}</span>
                <ProjectStatusBadge status={p.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Portal Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              No projects linked yet. You can still create login credentials, but the client portal
              will stay empty until you link at least one project.
            </div>
          )}
          <form action={handlePortalInvite} className="space-y-3">
            <input type="hidden" name="client_id" value={client.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" placeholder="Client contact name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Login email</Label>
                <Input id="email" type="email" name="email" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                type="text"
                name="password"
                required
                placeholder="Set and share securely"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Access is automatically granted to all projects linked to this client. If the email
              already exists, submitting again with a password will link that account here.
            </p>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Creating..." : "Create Client Login"}
            </Button>
          </form>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Existing portal users</p>
            {portalUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No portal users yet.</p>
            ) : (
              portalUsers.map((user) => (
                <div key={user.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{user.full_name ?? "Client user"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form action={handleActivity} className="space-y-3">
            <input type="hidden" name="client_id" value={client.id} />
            <select name="activity_type" className="flex h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm">
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
            <Textarea name="message" placeholder="Account update, check-in, delivery note..." rows={2} required />
            <Button type="submit" size="sm" disabled={pending}>Log activity</Button>
          </form>
          <div className="space-y-3 border-t border-border pt-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="text-sm">
                  <p>{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.author?.full_name} · {a.activity_type} · {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Feedback / Bugs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback submitted by client yet.</p>
          ) : (
            feedback.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.project?.title ?? "Project"} · {item.author?.full_name ?? item.author?.email ?? "Client"}
                    </p>
                  </div>
                  <select
                    value={item.status}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    onChange={(e) => handleFeedbackStatus(item.id, e.target.value as FeedbackStatus)}
                  >
                    <option value="new">New</option>
                    <option value="triaged">Triaged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <p className="mt-2 text-sm">{item.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
