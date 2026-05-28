"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

export async function getUpdates(projectId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("updates")
    .select(`
      *,
      author:profiles!updates_author_id_fkey(id, full_name, email),
      project:projects(id, title)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createUpdate(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("updates")
    .insert({
      message: formData.get("message") as string,
      project_id: (formData.get("project_id") as string) || null,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  if (formData.get("project_id")) {
    revalidatePath(`/projects/${formData.get("project_id")}`);
  }
  return { data };
}

export async function updateUpdate(id: string, formData: FormData) {
  const supabase = await createClient();
  const projectId = (formData.get("project_id") as string) || null;

  const { error } = await supabase
    .from("updates")
    .update({
      message: formData.get("message") as string,
      project_id: projectId,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  return { success: true };
}

export async function deleteUpdate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("updates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { success: true };
}
