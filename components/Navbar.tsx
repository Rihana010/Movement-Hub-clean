import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionEmailFromToken } from "@/lib/adminAccess";
import { SESSION_COOKIE } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NavbarClient } from "@/components/NavbarClient";

export async function Navbar() {
  const cookieStore = await cookies();
  const legacyEmail = await getSessionEmailFromToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );
  const legacyAdmin = legacyEmail
    ? await prisma.adminUser.findUnique({
        where: { email: legacyEmail },
        select: { fullName: true, email: true, role: true },
      })
    : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const name =
    legacyAdmin?.fullName ||
    supabaseUser?.user_metadata?.full_name ||
    supabaseUser?.user_metadata?.name ||
    legacyAdmin?.email ||
    supabaseUser?.email;
  return (
    <NavbarClient
      name={name ?? null}
      email={legacyAdmin?.email ?? supabaseUser?.email ?? null}
      role={legacyAdmin?.role === "super_admin" || legacyAdmin?.role === "event_admin"
        ? legacyAdmin.role
        : null}
      signedIn={Boolean(legacyAdmin || supabaseUser)}
    />
  );
}
