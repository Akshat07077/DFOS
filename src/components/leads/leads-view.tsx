"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, LayoutGrid, List, Pencil, Plus, UserPlus } from "lucide-react";
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

const ACTIVE_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
];
const CLOSED_STATUSES: LeadStatus[] = ["won", "lost"];

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

  const getColumnLeads = (status: LeadStatus) =>
    filterStatus === "all"
      ? leads.filter((l) => l.status === status)
      : filtered.filter((l) => l.status === status);

  return (
    <div className="animate-fade-in w-full min-w-0">
      <PageHeader title="Leads" description="Pipeline — track prospects from first contact to close">
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <div className="flex rounded-lg border border-border p-0.5">
            {([
              { mode: "pipeline" as const, icon: Columns3, label: "Board" },
              { mode: "grid" as const, icon: LayoutGrid, label: "Grid" },
              { mode: "list" as const, icon: List, label: "List" },
            ]).map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={view === mode ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-2 sm:px-3"
                onClick={() => setView(mode)}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{label}</span>
              </Button>
            ))}
          </div>
          <LeadFormDialog
            profiles={profiles}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            trigger={
              <Button size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Lead</span>
              </Button>
            }
          />
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "all")}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm sm:w-auto sm:min-w-[160px]"
        >
          <option value="all">All statuses</option>
          {LEAD_PIPELINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {activeLeads.length} active · {leads.length} total
        </span>
      </div>

      {leads.length === 0 && view !== "pipeline" ? (
        <EmptyState
          icon={UserPlus}
          title="No leads yet"
          description="Add your first prospect to start the pipeline."
          action={{ label: "New Lead", onClick: () => setDialogOpen(true) }}
        />
      ) : view === "pipeline" ? (
        <div className="space-y-6 w-full min-w-0">
          {/* Active pipeline — responsive grid, no horizontal scroll */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active pipeline
            </p>
            <div className="grid w-full grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {ACTIVE_STATUSES.map((status) => (
                <PipelineColumn
                  key={status}
                  status={status}
                  leads={getColumnLeads(status)}
                  profiles={profiles}
                  onStatusChange={moveStatus}
                />
              ))}
            </div>
          </div>

          {/* Won / Lost */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Closed
            </p>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              {CLOSED_STATUSES.map((status) => (
                <PipelineColumn
                  key={status}
                  status={status}
                  leads={getColumnLeads(status)}
                  profiles={profiles}
                  onStatusChange={moveStatus}
                />
              ))}
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No leads match filter"
          description="Try a different status or add a new lead."
          action={{ label: "New Lead", onClick: () => setDialogOpen(true) }}
        />
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1">
                <p className="font-medium truncate">{lead.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {lead.company ?? lead.email ?? "—"}
                </p>
              </Link>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <LeadStatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
                <LeadFormDialog
                  lead={lead}
                  profiles={profiles}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit lead">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lead) => (
            <Card
              key={lead.id}
              className="h-full transition-all hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1">
                    <p className="font-medium truncate hover:text-primary">{lead.name}</p>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <PriorityBadge priority={lead.priority} />
                    <LeadFormDialog
                      lead={lead}
                      profiles={profiles}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit lead">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
                <Link href={`/leads/${lead.id}`}>
                  <p className="mt-1 text-sm text-muted-foreground truncate">
                    {lead.company ?? "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <LeadStatusBadge status={lead.status} />
                    {lead.estimated_value != null && (
                      <span className="text-xs text-emerald-400">
                        ${Number(lead.estimated_value).toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineColumn({
  status,
  leads: columnLeads,
  profiles,
  onStatusChange,
}: {
  status: LeadStatus;
  leads: Lead[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
  onStatusChange: (id: string, s: LeadStatus) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center gap-2">
        <LeadStatusBadge status={status} />
        <span className="text-xs text-muted-foreground">({columnLeads.length})</span>
      </div>
      <div className="flex-1 space-y-2 rounded-lg bg-muted/30 p-2 sm:p-3 min-h-[100px] sm:min-h-[140px]">
        {columnLeads.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground/60">No leads</p>
        ) : (
          columnLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              profiles={profiles}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  profiles,
  onStatusChange,
}: {
  lead: Lead;
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
  onStatusChange: (id: string, s: LeadStatus) => void;
}) {
  const overdue = isOverdue(lead.next_follow_up);
  const currentIndex = LEAD_PIPELINE_STATUSES.indexOf(lead.status);
  const nextStatus =
    currentIndex >= 0 && currentIndex < LEAD_PIPELINE_STATUSES.length - 1
      ? LEAD_PIPELINE_STATUSES[currentIndex + 1]
      : null;

  return (
    <Card className={cn("shadow-sm", overdue && "border-amber-500/30")}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <Link href={`/leads/${lead.id}`} className="block min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight truncate">{lead.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {lead.company ?? lead.email ?? "—"}
            </p>
          </Link>
          <LeadFormDialog
            lead={lead}
            profiles={profiles}
            trigger={
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Edit lead">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={lead.priority} />
          {lead.estimated_value != null && (
            <span className="text-[10px] text-emerald-400">
              ${Number(lead.estimated_value).toLocaleString()}
            </span>
          )}
        </div>
        {lead.next_follow_up && (
          <p
            className={cn(
              "mt-1.5 text-[10px] truncate",
              overdue ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            Follow-up {formatRelativeDate(lead.next_follow_up)}
          </p>
        )}
        {nextStatus && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-full px-2 text-[10px] sm:text-xs"
            onClick={() => onStatusChange(lead.id, nextStatus)}
          >
            → {LEAD_STATUS_LABELS[nextStatus]}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
