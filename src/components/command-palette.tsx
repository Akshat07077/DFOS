"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  UserPlus,
  Building2,
  FolderKanban,
  CheckSquare,
  StickyNote,
  Radio,
  Sparkles,
  Download,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const pages = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/updates", label: "Updates", icon: Radio },
  { href: "/ai", label: "AI Assistant", icon: Sparkles },
  { href: "/backup", label: "Database Backup", icon: Download },
];

const quickActions = [
  { href: "/leads?new=1", label: "New Lead", icon: Plus },
  { href: "/clients?new=1", label: "New Client", icon: Plus },
  { href: "/projects?new=1", label: "New Project", icon: Plus },
  { href: "/tasks?new=1", label: "New Task", icon: Plus },
  { href: "/notes?new=1", label: "New Note", icon: Plus },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center border-b border-border px-3">
            <Command.Input
              placeholder="Search or jump to..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group heading="Navigate">
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  value={page.label}
                  onSelect={() => navigate(page.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                >
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                  {page.label}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Quick Actions">
              {quickActions.map((action) => (
                <Command.Item
                  key={action.href}
                  value={action.label}
                  onSelect={() => navigate(action.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  {action.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
