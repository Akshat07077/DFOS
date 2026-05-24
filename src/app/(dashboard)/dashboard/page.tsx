import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  StickyNote,
  Radio,
  Plus,
  ArrowRight,
  Calendar,
  UserPlus,
  Building2,
} from "lucide-react";
import { getDashboardData } from "@/services/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate, isOverdue, cn } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const statCards = [
    { label: "Open Leads", value: data.stats.openLeads, icon: UserPlus, href: "/leads" },
    { label: "Active Clients", value: data.stats.activeClients, icon: Building2, href: "/clients" },
    { label: "Active Projects", value: data.stats.activeProjects, icon: FolderKanban, href: "/projects" },
    { label: "Open Tasks", value: data.stats.openTasks, icon: CheckSquare, href: "/tasks" },
    { label: "Overdue", value: data.stats.overdueTasks, icon: AlertTriangle, href: "/tasks?filter=overdue", alert: data.stats.overdueTasks > 0 },
    { label: "Pinned Notes", value: data.stats.pinnedNotes, icon: StickyNote, href: "/notes" },
    { label: "Updates This Week", value: data.stats.updatesThisWeek, icon: Radio, href: "/updates" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Command Center"
        description="Your founder cockpit — today at a glance"
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/leads?new=1"><Plus className="h-4 w-4" /> Lead</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/clients?new=1"><Plus className="h-4 w-4" /> Client</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/tasks?new=1"><Plus className="h-4 w-4" /> Task</Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  stat.alert ? "bg-red-500/15 text-red-400" : "bg-primary/10 text-primary"
                )}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tasks due today</p>
            ) : (
              data.todayTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.project && (
                      <p className="text-xs text-muted-foreground">{task.project.title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-red-400">Overdue Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks?filter=overdue">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All clear — no overdue tasks</p>
            ) : (
              data.overdueTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-red-400">
                      Due {formatRelativeDate(task.deadline)}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Updates</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/updates">Feed <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No updates yet</p>
            ) : (
              data.recentUpdates.map((update) => (
                <div key={update.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm">{update.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {update.author?.full_name} · {update.project?.title ?? "General"} ·{" "}
                    {new Date(update.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lead Follow-ups</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/leads">Leads <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.followUpLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups due</p>
            ) : (
              data.followUpLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50"
                >
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.company ?? "—"}</p>
                  </div>
                  <span className="text-xs text-amber-400">
                    {formatRelativeDate(lead.next_follow_up)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming deadlines</p>
            ) : (
              data.upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    isOverdue(task.deadline) ? "border-red-500/20" : "border-border"
                  )}
                >
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(task.deadline)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
