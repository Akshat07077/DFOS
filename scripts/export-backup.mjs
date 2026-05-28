/**
 * CLI backup export (uses service role — all tables).
 * Add SUPABASE_SERVICE_ROLE_KEY to .env.local, then:
 *   node scripts/export-backup.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = [
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
];

if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const tables = {};

for (const table of TABLES) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.warn(`Skip ${table}:`, error.message);
    tables[table] = [];
  } else {
    tables[table] = data ?? [];
    console.log(`✓ ${table}: ${tables[table].length} rows`);
  }
}

const out = {
  app: "DesignsVerse FOS",
  exported_at: new Date().toISOString(),
  version: 1,
  tables,
};

const filename = `fos-backup-${new Date().toISOString().slice(0, 10)}.json`;
const outPath = resolve(root, filename);
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`\nSaved: ${outPath}`);
