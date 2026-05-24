"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, FolderKanban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteClient, addClientActivity } from "@/actions/clients";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientStatusBadge, PriorityBadge, ProjectStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Client, ClientActivity, Profile, Project, ProjectStatus } from "@/types/database";

export function ClientDetail({
  client,
  activities,
  projects,
  profiles,
}: {
  client: Client & { project_count?: number };
  activities: ClientActivity[];
  projects: Array<Pick<Project, "id" | "title" | "status" | "progress">>;
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this client?")) return;
    startTransition(async () => {
      const result = await deleteClient(client.id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Client deleted");
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
    </div>
  );
}
