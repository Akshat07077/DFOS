import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isClientAccount } from "@/lib/auth/account-type";
import { getProfile, getUser } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const profile = await getProfile();
  if (!user) redirect("/login");
  if (isClientAccount(profile)) redirect("/client");

  return <AppShell>{children}</AppShell>;
}
