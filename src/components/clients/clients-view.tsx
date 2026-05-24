"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, LayoutGrid, List, Pencil, Plus } from "lucide-react";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClientStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Client, ClientStatus, Profile } from "@/types/database";
import { CLIENT_STATUS_LABELS } from "@/types/database";

type ViewMode = "grid" | "list";

export function ClientsView({
  clients,
  profiles,
}: {
  clients: Client[];
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const [view, setView] = useState<ViewMode>("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ClientStatus | "all">("all");

  const filtered =
    filterStatus === "all" ? clients : clients.filter((c) => c.status === filterStatus);

  const activeCount = clients.filter((c) => c.status === "active" || c.status === "onboarding").length;
  const totalValue = clients.reduce((sum, c) => sum + (Number(c.contract_value) || 0), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Clients" description="Active accounts — relationships, value, and delivery">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <ClientFormDialog profiles={profiles} open={dialogOpen} onOpenChange={setDialogOpen} trigger={
            <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> New Client</Button>
          } />
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ClientStatus | "all")} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">All statuses</option>
          {(Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]).map((s) => (
            <option key={s} value={s}>{CLIENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {activeCount} active · {clients.length} total · ${totalValue.toLocaleString()} pipeline value
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No clients yet" description="Add clients manually or convert leads from the Leads pipeline." action={{ label: "New Client", onClick: () => setDialogOpen(true) }} />
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:bg-accent/30"
            >
              <Link href={`/clients/${client.id}`} className="min-w-0 flex-1">
                <p className="font-medium">{client.company}</p>
                <p className="text-sm text-muted-foreground">
                  {client.name} · {client.email ?? "—"}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <ClientStatusBadge status={client.status} />
                {client.contract_value != null && (
                  <span className="text-sm text-emerald-400">
                    ${Number(client.contract_value).toLocaleString()}
                  </span>
                )}
                <ClientFormDialog
                  client={client}
                  profiles={profiles}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit client">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Card
              key={client.id}
              className="h-full transition-all hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/clients/${client.id}`} className="min-w-0 flex-1">
                    <p className="font-medium hover:text-primary">{client.company}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{client.name}</p>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <PriorityBadge priority={client.priority} />
                    <ClientFormDialog
                      client={client}
                      profiles={profiles}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit client">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
                <Link href={`/clients/${client.id}`}>
                  <div className="mt-3 flex items-center justify-between">
                    <ClientStatusBadge status={client.status} />
                    {client.contract_value != null && (
                      <span className="text-xs text-emerald-400">
                        ${Number(client.contract_value).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {client.industry && (
                    <p className="mt-2 text-xs text-muted-foreground">{client.industry}</p>
                  )}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
