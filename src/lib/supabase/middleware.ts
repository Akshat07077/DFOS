import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { assertSupabaseEnv, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

export function createClient(request: NextRequest) {
  assertSupabaseEnv();

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, supabaseResponse };
}

export async function updateSession(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // Refreshes session if expired — required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isClientRoute = request.nextUrl.pathname.startsWith("/client");
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/leads") ||
    request.nextUrl.pathname.startsWith("/clients") ||
    request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/tasks") ||
    request.nextUrl.pathname.startsWith("/notes") ||
    request.nextUrl.pathname.startsWith("/updates") ||
    request.nextUrl.pathname.startsWith("/ai") ||
    isClientRoute;

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Keep role-specific redirects in route layouts to avoid
  // accidental middleware redirects from stale profile lookups.

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    // Send authenticated users to a stable entrypoint;
    // layout guards will forward clients to /client.
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
