"use server";

import { getProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

const EXPORT_TABLES = [
  "profiles",
  "tags",
  "clients",
  "leads",
  "lead_activities",
  "client_activities",
  "projects",
  "project_tags",
  "project_links",
  "tasks",
  "notes",
  "note_tags",
  "updates",
  "client_project_access",
  "client_feedback",
  "ai_memory",
] as const;

export async function exportDatabaseBackup() {
  const profile = await getProfile();
  if (profile?.user_type !== "founder") {
    return { error: "Only founders can export backups." };
  }

  const supabase = await createClient();
  const tables: Record<string, unknown[]> = {};
  const errors: string[] = [];

  for (const table of EXPORT_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      if (error.message.includes("does not exist")) continue;
      errors.push(`${table}: ${error.message}`);
      tables[table] = [];
    } else {
      tables[table] = data ?? [];
    }
  }

  const payload = {
    app: "DesignsVerse FOS",
    exported_at: new Date().toISOString(),
    version: 1,
    tables,
    row_counts: Object.fromEntries(
      Object.entries(tables).map(([name, rows]) => [name, rows.length])
    ),
    errors: errors.length > 0 ? errors : undefined,
  };

  const json = JSON.stringify(payload, null, 2);
  const filename = `fos-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return {
    success: true,
    filename,
    json,
    sizeBytes: new TextEncoder().encode(json).length,
  };
}
