import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types/database";
import { startOfWeek } from "date-fns";

export async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const weekStart = startOfWeek(new Date()).toISOString();
  const todayStart = new Date().toISOString().split("T")[0];
  const tomorrowEnd = new Date(Date.now() + 86400000).toISOString();

  const [
    activeProjects,
    openTasks,
    overdueTasks,
    pinnedNotes,
    updatesThisWeek,
    openLeads,
    activeClients,
    todayTasks,
    recentUpdates,
    upcomingDeadlines,
    followUpLeads,
    profiles,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["planning", "active"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .neq("status", "done"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .neq("status", "done")
      .lt("deadline", now),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_pinned", true),
    supabase
      .from("updates")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", weekStart),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["new", "contacted", "qualified", "proposal", "negotiation"]),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["active", "onboarding"]),
    supabase
      .from("tasks")
      .select(`*, project:projects(id, title)`)
      .is("deleted_at", null)
      .neq("status", "done")
      .gte("deadline", todayStart)
      .lte("deadline", tomorrowEnd)
      .order("deadline", { ascending: true })
      .limit(8),
    supabase
      .from("updates")
      .select(`
        *,
        author:profiles!updates_author_id_fkey(id, full_name, email),
        project:projects(id, title)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("tasks")
      .select(`*, project:projects(id, title)`)
      .is("deleted_at", null)
      .neq("status", "done")
      .gte("deadline", now)
      .order("deadline", { ascending: true })
      .limit(5),
    supabase
      .from("leads")
      .select("id, name, company, next_follow_up, status")
      .is("deleted_at", null)
      .in("status", ["new", "contacted", "qualified", "proposal", "negotiation"])
      .not("next_follow_up", "is", null)
      .lte("next_follow_up", tomorrowEnd)
      .order("next_follow_up", { ascending: true })
      .limit(5),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const stats: DashboardStats = {
    activeProjects: activeProjects.count ?? 0,
    openTasks: openTasks.count ?? 0,
    overdueTasks: overdueTasks.count ?? 0,
    pinnedNotes: pinnedNotes.count ?? 0,
    updatesThisWeek: updatesThisWeek.count ?? 0,
    openLeads: openLeads.count ?? 0,
    activeClients: activeClients.count ?? 0,
  };

  const { data: overdueTaskList } = await supabase
    .from("tasks")
    .select(`*, project:projects(id, title)`)
    .is("deleted_at", null)
    .neq("status", "done")
    .lt("deadline", now)
    .order("deadline", { ascending: true })
    .limit(8);

  return {
    stats,
    todayTasks: todayTasks.data ?? [],
    overdueTasks: overdueTaskList ?? [],
    recentUpdates: recentUpdates.data ?? [],
    upcomingDeadlines: upcomingDeadlines.data ?? [],
    followUpLeads: followUpLeads.data ?? [],
    profiles: profiles.data ?? [],
  };
}

export async function getProfiles() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*");
  return data ?? [];
}

export async function getTags() {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("*").order("name");
  return data ?? [];
}
