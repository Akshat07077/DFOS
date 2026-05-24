export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done";

export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export type FounderRole = "founder_a" | "founder_b" | "both";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: FounderRole;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: PriorityLevel;
  deadline: string | null;
  progress: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  task_count?: number;
}

export interface ProjectLink {
  id: string;
  project_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  deadline: string | null;
  assigned_to: string | null;
  project_id: string | null;
  blockers: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Pick<Project, "id" | "title"> | null;
  assignee?: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Update {
  id: string;
  message: string;
  project_id: string | null;
  author_id: string;
  created_at: string;
  author?: Pick<Profile, "id" | "full_name" | "email"> | null;
  project?: Pick<Project, "id" | "title"> | null;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type LeadSource =
  | "website"
  | "referral"
  | "linkedin"
  | "cold_outreach"
  | "ads"
  | "event"
  | "other";

export type ClientStatus = "onboarding" | "active" | "paused" | "churned";

export type ActivityType = "note" | "call" | "email" | "meeting" | "status_change";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: PriorityLevel;
  estimated_value: number | null;
  notes: string | null;
  next_follow_up: string | null;
  assigned_to: string | null;
  converted_client_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: Pick<Profile, "id" | "full_name" | "email"> | null;
  client?: Pick<Client, "id" | "name" | "company"> | null;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string;
  website: string | null;
  industry: string | null;
  status: ClientStatus;
  priority: PriorityLevel;
  contract_value: number | null;
  notes: string | null;
  lead_id: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: Pick<Profile, "id" | "full_name" | "email"> | null;
  project_count?: number;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  message: string;
  activity_type: ActivityType;
  author_id: string;
  created_at: string;
  author?: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  message: string;
  activity_type: ActivityType;
  author_id: string;
  created_at: string;
  author?: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface DashboardStats {
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  pinnedNotes: number;
  updatesThisWeek: number;
  openLeads: number;
  activeClients: number;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: "bg-zinc-500/15 text-zinc-400",
  medium: "bg-blue-500/15 text-blue-400",
  high: "bg-amber-500/15 text-amber-400",
  urgent: "bg-red-500/15 text-red-400",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-violet-500/15 text-violet-400",
  active: "bg-emerald-500/15 text-emerald-400",
  on_hold: "bg-amber-500/15 text-amber-400",
  completed: "bg-blue-500/15 text-blue-400",
  archived: "bg-zinc-500/15 text-zinc-400",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-sky-500/15 text-sky-400",
  contacted: "bg-blue-500/15 text-blue-400",
  qualified: "bg-violet-500/15 text-violet-400",
  proposal: "bg-amber-500/15 text-amber-400",
  negotiation: "bg-orange-500/15 text-orange-400",
  won: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-zinc-500/15 text-zinc-400",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website",
  referral: "Referral",
  linkedin: "LinkedIn",
  cold_outreach: "Cold Outreach",
  ads: "Ads",
  event: "Event",
  other: "Other",
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  churned: "Churned",
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  onboarding: "bg-violet-500/15 text-violet-400",
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-amber-500/15 text-amber-400",
  churned: "bg-zinc-500/15 text-zinc-400",
};

export const LEAD_PIPELINE_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];
