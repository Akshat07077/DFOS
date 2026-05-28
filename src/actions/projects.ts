"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import type { ProjectStatus, PriorityLevel } from "@/types/database";

export async function getProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_tags(tag_id, tags(id, name, color))
    `)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    ...p,
    tags: p.project_tags?.map((pt: { tags: unknown }) => pt.tags).filter(Boolean) ?? [],
  }));
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_tags(tag_id, tags(id, name, color)),
      project_links(*)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    tags: data.project_tags?.map((pt: { tags: unknown }) => pt.tags).filter(Boolean) ?? [],
    links: data.project_links ?? [],
  };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const status = (formData.get("status") as ProjectStatus) || "planning";
  const priority = (formData.get("priority") as PriorityLevel) || "medium";
  const deadline = (formData.get("deadline") as string) || null;
  const clientId = (formData.get("client_id") as string) || null;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      description,
      status,
      priority,
      deadline: deadline || null,
      client_id: clientId,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (clientId) {
    const { data: clientUsers } = await supabase
      .from("client_project_access")
      .select("client_profile_id")
      .eq("client_id", clientId);

    if (clientUsers && clientUsers.length > 0) {
      await supabase.from("client_project_access").upsert(
        clientUsers.map((row) => ({
          client_profile_id: row.client_profile_id,
          client_id: clientId,
          project_id: data.id,
          created_by: user.id,
        })),
        { onConflict: "client_profile_id,project_id" }
      );
    }
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    status: formData.get("status") as ProjectStatus,
    priority: formData.get("priority") as PriorityLevel,
    deadline: (formData.get("deadline") as string) || null,
    progress: parseInt(formData.get("progress") as string) || 0,
    client_id: (formData.get("client_id") as string) || null,
  };

  const { error } = await supabase.from("projects").update(updates).eq("id", id);

  if (error) return { error: error.message };

  const clientId = (updates.client_id as string | null) ?? null;
  if (clientId) {
    const user = await getUser();
    if (user) {
      const { data: clientUsers } = await supabase
        .from("client_project_access")
        .select("client_profile_id")
        .eq("client_id", clientId);

      if (clientUsers && clientUsers.length > 0) {
        await supabase.from("client_project_access").upsert(
          clientUsers.map((row) => ({
            client_profile_id: row.client_profile_id,
            client_id: clientId,
            project_id: id,
            created_by: user.id,
          })),
          { onConflict: "client_profile_id,project_id" }
        );
      }
    }
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { success: true };
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}
