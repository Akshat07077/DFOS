/** Tables that support soft delete via deleted_at */
export const SOFT_DELETE_TABLES = [
  "clients",
  "leads",
  "projects",
  "tasks",
  "notes",
  "updates",
  "client_feedback",
] as const;

export type SoftDeleteTable = (typeof SOFT_DELETE_TABLES)[number];

export const TRASH_ENTITY_META: Record<
  SoftDeleteTable,
  { label: string; titleField: string; path: string }
> = {
  clients: { label: "Clients", titleField: "company", path: "/clients" },
  leads: { label: "Leads", titleField: "name", path: "/leads" },
  projects: { label: "Projects", titleField: "title", path: "/projects" },
  tasks: { label: "Tasks", titleField: "title", path: "/tasks" },
  notes: { label: "Notes", titleField: "title", path: "/notes" },
  updates: { label: "Updates", titleField: "message", path: "/updates" },
  client_feedback: { label: "Feedback", titleField: "title", path: "/clients" },
};

export function isSoftDeleteTable(table: string): table is SoftDeleteTable {
  return (SOFT_DELETE_TABLES as readonly string[]).includes(table);
}
