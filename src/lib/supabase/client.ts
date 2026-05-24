import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
