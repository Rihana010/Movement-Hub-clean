import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims, SESSION_COOKIE } from "@/lib/session";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith("/api/admin");
  const isLoginApi = pathname === "/api/admin/login";
  const isLogoutApi = pathname === "/api/admin/logout";

  if (isLoginApi || isLogoutApi) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin") && !isAdminApi) {
    return refreshSupabaseSession(request);
  }

  const claims = await getSessionClaims(
    request.cookies.get(SESSION_COOKIE)?.value
  );
  if (claims) {
    const passwordChangeAllowed =
      pathname === "/admin/change-password" ||
      pathname === "/api/admin/change-password" ||
      pathname === "/api/admin/logout";

    if (claims.mustChangePassword && !passwordChangeAllowed) {
      if (isAdminApi) {
        return NextResponse.json(
          { error: "Password change required." },
          { status: 403 }
        );
      }

      return NextResponse.redirect(
        new URL("/admin/change-password", request.url)
      );
    }

    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/?as=admin", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/auth/:path*", "/profile"],
};
