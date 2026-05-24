"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, LayoutGrid, List, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { updateLeadStatus } from "@/actions/leads";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LeadStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatRelativeDate, isOverdue } from "@/lib/utils";
import type { Lead, LeadStatus, Profile } from "@/types/database";
import { LEAD_PIPELINE_STATUSES, LEAD_STATUS_LABELS } from "@/types/database";

type ViewMode = "pipeline" | "grid" | "list";

export function LeadsView({
  leads: initialLeads,
  profiles,
}: {
  leads: Lead[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [view, setView] = useState<ViewMode>("pipeline");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
  const [, startTransition] = useTransition();

  const activeLeads = leads.filter((l) => l.status !== "won" && l.status !== "lost");
  const filtered =
    filterStatus === "all" ? leads : leads.filter((l) => l.status === filterStatus);

  const moveStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    startTransition(async () => {
      const result = await updateLeadStatus(id, status);
      if (result?.error) {
        toast.error(result.error);
        setLeads(initialLeads);
      } else router.refresh();
    });
  };

  const pipelineStatuses = LEAD_PIPELINE_STATUSES.filter((s) => s !== "won" && s !== "lost");

  return (
    <div className="animate-fade-in">
      <PageHeader title="Leads" description="Pipeline — track prospects from first contact to close">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {([
              { mode: "pipeline" as const, icon: Columns3 },
              { mode: "grid" as const, icon: LayoutGrid },
              { mode: "list" as const, icon: List },
            ]).map(({ mode, icon: Icon }) => (
              <Button key={mode} variant={view === mode ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView(mode)}>
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <LeadFormDialog profiles={profiles} open={dialogOpen} onOpenChange={setDialogOpen} trigger={
            <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> New Lead</Button>
          } />
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "all")} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">All statuses</option>
          {LEAD_PIPELINE_STATUSES.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{activeLeads.length} active · {leads.length} total</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserPlus} title="No leads yet" description="Add your first prospect to start the pipeline." action={{ label: "New Lead", onClick: () => setDialogOpen(true) }} />
      ) : view === "pipeline" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStatuses.map((status) => (
            <div key={status} className="min-w-[260px] flex-shrink-0">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
                {LEAD_STATUS_LABELS[status]} ({filtered.filter((l) => l.status === status).length})
              </h3>
              <div className="space-y-2 min-h-[120px] rounded-lg bg-muted/30 p-2">
                {filtered.filter((l) => l.status === status).map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onStatusChange={moveStatus} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-accent/30 transition-colors">
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-sm text-muted-foreground">{lead.company ?? lead.email ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <LeadStatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`}>
              <Card className="h-full transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{lead.name}</p>
                    <PriorityBadge priority={lead.priority} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.company ?? "—"}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <LeadStatusBadge status={lead.status} />
                    {lead.estimated_value != null && (
                      <span className="text-xs text-emerald-400">${Number(lead.estimated_value).toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, s: LeadStatus) => void }) {
  const overdue = isOverdue(lead.next_follow_up);
  const nextStatuses = LEAD_PIPELINE_STATUSES.filter((s) => s !== lead.status && s !== "won" && s !== "lost").slice(0, 2);

  return (
    <Card className={cn("shadow-sm", overdue && "border-amber-500/30")}>
      <CardContent className="p-3">
        <Link href={`/leads/${lead.id}`} className="block">
          <p className="text-sm font-medium leading-tight">{lead.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{lead.company ?? lead.email ?? "—"}</p>
        </Link>
        <div className="mt-2 flex flex-wrap gap-1">
          <PriorityBadge priority={lead.priority} />
          {lead.estimated_value != null && (
            <span className="text-[10px] text-emerald-400">${Number(lead.estimated_value).toLocaleString()}</span>
          )}
        </div>
        {lead.next_follow_up && (
          <p className={cn("mt-1.5 text-[10px]", overdue ? "text-amber-400" : "text-muted-foreground")}>
            Follow-up {formatRelativeDate(lead.next_follow_up)}
          </p>
        )}
        <div className="mt-2 flex gap-1">
          {nextStatuses.map((s) => (
            <Button key={s} variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => onStatusChange(lead.id, s)}>
              → {LEAD_STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
