import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1. Create an initial response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Connect to Supabase to verify the session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update cookies in the response
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Get the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Route Protection Logic
  // If NO user and tries to access dashboard...
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // ...redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user EXISTS and tries to access login...
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    // ...redirect to dashboard (prevent double login)
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// Configuration: Where this guard runs
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (svg, png, jpg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};