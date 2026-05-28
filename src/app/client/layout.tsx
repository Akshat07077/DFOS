import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/actions/auth";
import { isClientAccount } from "@/lib/auth/account-type";
import { getProfile, getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const profile = await getProfile();

  if (!user) redirect("/login");
  if (!isClientAccount(profile)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <Link href="/client" className="text-sm font-semibold">
              DesignsVerse Client Portal
            </Link>
            <p className="text-xs text-muted-foreground">Track progress and share feedback</p>
          </div>
          <form action={signOut}>
            <Button type="submit" size="sm" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
