import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getProfile, getUser } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const profile = await getProfile();
  if (!user) redirect("/login");
  if (profile?.user_type === "client") redirect("/client");

  return <AppShell>{children}</AppShell>;
}
