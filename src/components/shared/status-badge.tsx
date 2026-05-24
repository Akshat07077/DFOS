import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CLIENT_STATUS_COLORS,
  CLIENT_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type ClientStatus,
  type LeadStatus,
  type PriorityLevel,
  type ProjectStatus,
  type TaskStatus,
} from "@/types/database";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={cn("border-0", PROJECT_STATUS_COLORS[status])}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className="text-xs">
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return (
    <Badge className={cn("border-0", PRIORITY_COLORS[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge className={cn("border-0", LEAD_STATUS_COLORS[status])}>
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge className={cn("border-0", CLIENT_STATUS_COLORS[status])}>
      {CLIENT_STATUS_LABELS[status]}
    </Badge>
  );
}
