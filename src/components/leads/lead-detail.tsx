"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { convertLeadToClient, deleteLead, addLeadActivity } from "@/actions/leads";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatRelativeDate } from "@/lib/utils";
import type { Lead, LeadActivity, Profile } from "@/types/database";
import { LEAD_SOURCE_LABELS } from "@/types/database";

export function LeadDetail({
  lead,
  activities,
  profiles,
}: {
  lead: Lead;
  activities: LeadActivity[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertLeadToClient(lead.id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Lead converted to client");
        router.push(`/clients/${result.data?.id}`);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this lead?")) return;
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Lead deleted");
        router.push("/leads");
      }
    });
  };

  const handleActivity = (formData: FormData) => {
    startTransition(async () => {
      const result = await addLeadActivity(formData);
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
          <Link href="/leads"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate">{lead.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
            <span className="text-sm text-muted-foreground">{LEAD_SOURCE_LABELS[lead.source]}</span>
          </div>
        </div>
        <LeadFormDialog lead={lead} profiles={profiles} trigger={<Button variant="outline" size="sm">Edit</Button>} />
        {!lead.converted_client_id && lead.status !== "lost" && (
          <Button size="sm" onClick={handleConvert} disabled={pending}>
            <UserCheck className="h-4 w-4" /> Convert to Client
          </Button>
        )}
        {lead.converted_client_id && lead.client && (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/clients/${lead.converted_client_id}`}>
              <Building2 className="h-4 w-4" /> View Client
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={pending}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Company", value: lead.company },
          { label: "Email", value: lead.email },
          { label: "Phone", value: lead.phone },
          { label: "Est. value", value: lead.estimated_value != null ? `$${Number(lead.estimated_value).toLocaleString()}` : null },
          { label: "Follow-up", value: lead.next_follow_up ? formatRelativeDate(lead.next_follow_up) : null },
          { label: "Assignee", value: lead.assignee?.full_name },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium mt-0.5">{item.value ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {lead.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form action={handleActivity} className="space-y-3">
            <input type="hidden" name="lead_id" value={lead.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select name="activity_type" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
            </div>
            <Textarea name="message" placeholder="Log a call, email, or note..." rows={2} required />
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
