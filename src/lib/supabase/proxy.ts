import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homePathFor, isUserRole } from "@/lib/roles";

// Refreshes the Supabase session and sends each user to the area of their role.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Keep getClaims() right after creating the client, or sessions may drop randomly.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/login";

  // Redirects while keeping any refreshed auth cookies.
  const redirectTo = (target: string) => {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!claims) {
    return isLoginPage ? response : redirectTo("/login");
  }

  const role = claims.app_metadata?.role;
  if (!isUserRole(role)) {
    return isLoginPage ? response : redirectTo("/login");
  }

  const home = homePathFor(role);
  if (isLoginPage || path === "/") return redirectTo(home);
  if (path.startsWith("/agencia") && role !== "agency") return redirectTo(home);
  if (path.startsWith("/cliente") && role !== "client") return redirectTo(home);

  return response;
}
