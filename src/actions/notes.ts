"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

export async function getNotes(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(id, name, color))
    `)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((n) => ({
    ...n,
    tags: n.note_tags?.map((nt: { tags: unknown }) => nt.tags).filter(Boolean) ?? [],
  }));
}

export async function getNote(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(id, name, color))
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    tags: data.note_tags?.map((nt: { tags: unknown }) => nt.tags).filter(Boolean) ?? [],
  };
}

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      title: formData.get("title") as string,
      content: (formData.get("content") as string) || "",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateNote(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .update({
      title: formData.get("title") as string,
      content: (formData.get("content") as string) || "",
      summary: (formData.get("summary") as string) || null,
      is_pinned: formData.get("is_pinned") === "true",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function togglePinNote(id: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ is_pinned: isPinned })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/notes");
  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { success: true };
}
