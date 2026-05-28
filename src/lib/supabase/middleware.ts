import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isClientAccount } from "@/lib/auth/account-type";
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

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  // Must NOT use startsWith("/client") — that wrongly matches "/clients"
  const isClientPortalRoute =
    pathname === "/client" || pathname.startsWith("/client/");
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/leads") ||
    request.nextUrl.pathname.startsWith("/clients") ||
    request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/tasks") ||
    request.nextUrl.pathname.startsWith("/notes") ||
    request.nextUrl.pathname.startsWith("/updates") ||
    request.nextUrl.pathname.startsWith("/ai") ||
    request.nextUrl.pathname.startsWith("/backup") ||
    isClientPortalRoute;

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, portal_client_id")
      .eq("id", user.id)
      .single();

    const clientAccount = isClientAccount(profile);

    const isFounderPath =
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/leads") ||
      request.nextUrl.pathname.startsWith("/clients") ||
      request.nextUrl.pathname.startsWith("/projects") ||
      request.nextUrl.pathname.startsWith("/tasks") ||
      request.nextUrl.pathname.startsWith("/notes") ||
      request.nextUrl.pathname.startsWith("/updates") ||
      request.nextUrl.pathname.startsWith("/ai") ||
      request.nextUrl.pathname.startsWith("/backup");

    if (clientAccount && isFounderPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }

    if (!clientAccount && isClientPortalRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = clientAccount ? "/client" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
