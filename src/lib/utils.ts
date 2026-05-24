import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(date: string | Date | null) {
  if (!date) return "No deadline";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function isOverdue(date: string | Date | null) {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return d < new Date() && d.toDateString() !== new Date().toDateString();
}
