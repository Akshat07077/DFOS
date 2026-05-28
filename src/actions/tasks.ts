"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import type { TaskStatus, PriorityLevel } from "@/types/database";

export async function getTasks(filters?: {
  projectId?: string;
  assignedTo?: string;
  priority?: PriorityLevel;
  status?: TaskStatus;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(`
      *,
      project:projects(id, title),
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email)
    `)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTodayTasks() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("tasks")
    .select(`*, project:projects(id, title)`)
    .is("deleted_at", null)
    .neq("status", "done")
    .lte("deadline", today.toISOString())
    .order("deadline", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOverdueTasks() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .select(`*, project:projects(id, title)`)
    .is("deleted_at", null)
    .neq("status", "done")
    .lt("deadline", now)
    .order("deadline", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as TaskStatus) || "todo",
      priority: (formData.get("priority") as PriorityLevel) || "medium",
      deadline: (formData.get("deadline") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      project_id: (formData.get("project_id") as string) || null,
      blockers: (formData.get("blockers") as string) || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (formData.get("project_id")) {
    revalidatePath(`/projects/${formData.get("project_id")}`);
  }
  return { data };
}

export async function updateTask(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    status: formData.get("status") as TaskStatus,
    priority: formData.get("priority") as PriorityLevel,
    deadline: (formData.get("deadline") as string) || null,
    assigned_to: (formData.get("assigned_to") as string) || null,
    project_id: (formData.get("project_id") as string) || null,
    blockers: (formData.get("blockers") as string) || null,
  };

  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { success: true };
}
