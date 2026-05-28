"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Trash2,
  LogOut,
  Command,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/updates", label: "Updates", icon: Radio },
  { href: "/ai", label: "AI", icon: Sparkles },
  { href: "/backup", label: "Backup", icon: Download },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

export function Sidebar({
  onCommandPalette,
  onNavigate,
  showClose,
  className,
}: {
  onCommandPalette?: () => void;
  onNavigate?: () => void;
  showClose?: boolean;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-60 flex-col border-r border-border bg-card/95 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm shrink-0">
          DV
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none truncate">DesignsVerse</p>
          <p className="text-[10px] text-muted-foreground">Founder OS</p>
        </div>
        {showClose && onNavigate && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onNavigate}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto space-y-0.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => {
            onCommandPalette?.();
            onNavigate?.();
          }}
        >
          <Command className="h-4 w-4 shrink-0" />
          Command
          <kbd className="ml-auto hidden sm:inline rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
        </Button>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
