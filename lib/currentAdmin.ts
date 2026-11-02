import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminFromToken } from "@/lib/adminAccess";
import { SESSION_COOKIE } from "@/lib/session";

/** For admin pages: the signed-in admin, or a redirect to the sign-in gateway. */
export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const admin = await getAdminFromToken(token);

  if (!admin) {
    const pendingAdmin = await getAdminFromToken(token, {
      allowMustChange: true,
    });
    redirect(pendingAdmin?.mustChangePassword ? "/admin/change-password" : "/?as=admin");
  }

  return admin;
}
