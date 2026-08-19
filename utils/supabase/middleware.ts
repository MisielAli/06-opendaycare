import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const publicRoutes = new Set(["/login", "/activate-account"]);

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function hasStaffRole(claims: unknown) {
  if (typeof claims !== "object" || claims === null) {
    return false;
  }

  const appMetadata = Reflect.get(claims, "app_metadata");
  return (
    typeof appMetadata === "object" &&
    appMetadata !== null &&
    Reflect.get(appMetadata, "role") === "staff"
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const cookiesToSet: CookieToSet[] = [];
  const authHeaders = new Map<string, string>();
  let claims: unknown = null;

  function applyAuthState(response: NextResponse) {
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
    authHeaders.forEach((value, name) => response.headers.set(name, value));
    return response;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(updatedCookies, headers) {
        updatedCookies.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.push(...updatedCookies);
        Object.entries(headers).forEach(([name, value]) =>
          authHeaders.set(name, value),
        );

        supabaseResponse = NextResponse.next({ request });
        applyAuthState(supabaseResponse);
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getClaims();
    claims = error ? null : data?.claims;
  } catch {
    // Verification failures are handled as an unauthenticated request below.
  }

  const { pathname, search } = request.nextUrl;
  const isPublicRoute = publicRoutes.has(pathname);

  if (claims && !hasStaffRole(claims)) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Authorization remains denied even if Supabase cannot confirm sign-out.
    }

    const alreadyShowsUnauthorizedError =
      pathname === "/login" &&
      request.nextUrl.searchParams.get("error") === "unauthorized";

    if (alreadyShowsUnauthorizedError) {
      return supabaseResponse;
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "unauthorized");
    return applyAuthState(NextResponse.redirect(loginUrl));
  }

  if (!claims && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return applyAuthState(NextResponse.redirect(loginUrl));
  }

  if (claims && isPublicRoute) {
    return applyAuthState(NextResponse.redirect(new URL("/", request.url)));
  }

  return supabaseResponse;
}
