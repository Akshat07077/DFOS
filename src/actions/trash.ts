"use server";

import { revalidatePath } from "next/cache";
import {
  SOFT_DELETE_TABLES,
  TRASH_ENTITY_META,
  isSoftDeleteTable,
  type SoftDeleteTable,
} from "@/lib/db/soft-delete";
import { getProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export type TrashItem = {
  id: string;
  table: SoftDeleteTable;
  label: string;
  title: string;
  deleted_at: string;
  subtitle?: string;
};

function assertFounder(profile: Awaited<ReturnType<typeof getProfile>>) {
  if (profile?.user_type !== "founder") {
    throw new Error("Only founders can manage trash");
  }
}

export async function getTrashItems(): Promise<TrashItem[]> {
  assertFounder(await getProfile());
  const supabase = await createClient();
  const items: TrashItem[] = [];

  for (const table of SOFT_DELETE_TABLES) {
    const meta = TRASH_ENTITY_META[table];
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      if (error.message.includes("does not exist")) continue;
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      const record = row as Record<string, unknown>;
      const title = String(record[meta.titleField] ?? "Untitled").slice(0, 120);
      let subtitle: string | undefined;
      if (table === "clients" && record.name) subtitle = String(record.name);
      if (table === "updates" && record.project_id) subtitle = "Project update";
      items.push({
        id: String(record.id),
        table,
        label: meta.label,
        title,
        deleted_at: String(record.deleted_at),
        subtitle,
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
  );
}

export async function restoreTrashItem(table: string, id: string) {
  assertFounder(await getProfile());
  if (!isSoftDeleteTable(table)) {
    return { error: "Invalid item type" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) return { error: error.message };

  const meta = TRASH_ENTITY_META[table];
  revalidatePath(meta.path);
  revalidatePath("/trash");
  revalidatePath("/dashboard");
  revalidatePath("/client");
  return { success: true };
}

export async function restoreAllTrash() {
  assertFounder(await getProfile());
  const supabase = await createClient();
  let restored = 0;

  for (const table of SOFT_DELETE_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .not("deleted_at", "is", null)
      .select("id");

    if (!error && data) restored += data.length;
  }

  revalidatePath("/", "layout");
  return { success: true, count: restored };
}
