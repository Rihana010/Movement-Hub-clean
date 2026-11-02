// One place that answers "who is this admin and what may they touch?".
//
// The signed cookie proves who someone is; this file also checks the admin
// still exists and is active, so deactivating an admin cuts them off at once.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getSessionClaims,
  getSessionClaimsFromRequest,
} from "@/lib/session";

type SessionOptions = { allowMustChange?: boolean };

async function activeAdminFromClaims(
  claims: { email: string; iat: number; iatMs: number; sessionVersion: number } | null,
  options: SessionOptions = {}
) {
  if (!claims) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { email: claims.email },
  });

  if (
    !admin ||
    !admin.isActive ||
    admin.sessionVersion !== claims.sessionVersion ||
    (!options.allowMustChange && admin.mustChangePassword)
  ) {
    return null;
  }

  return admin;
}

/** Route handlers: email of the signed-in, active admin (else undefined). */
export async function getSessionEmail(request: Request) {
  const admin = await activeAdminFromClaims(await getSessionClaimsFromRequest(request), {
    allowMustChange: true,
  });
  return admin?.email;
}

/** Server components: same check, from the cookie value. */
export async function getSessionEmailFromToken(token?: string) {
  const admin = await activeAdminFromClaims(await getSessionClaims(token), {
    allowMustChange: true,
  });
  return admin?.email;
}

export async function getAdminFromRequest(request: Request) {
  return activeAdminFromClaims(await getSessionClaimsFromRequest(request));
}

export async function getAdminForPasswordChange(request: Request) {
  return activeAdminFromClaims(await getSessionClaimsFromRequest(request), {
    allowMustChange: true,
  });
}

export async function getAdminFromToken(
  token?: string,
  options: SessionOptions = {}
) {
  return activeAdminFromClaims(await getSessionClaims(token), options);
}

type Admin = { id: number; role: string };

export const isSuperAdmin = (admin: Admin) => admin.role === "super_admin";

/** Prisma filter: super admins see every event, event admins only their own. */
export function eventScope(admin: Admin): Prisma.EventWhereInput {
  if (isSuperAdmin(admin)) return {};

  return {
    OR: [
      { createdByAdminId: admin.id },
      { adminAssignments: { some: { adminId: admin.id } } },
    ],
  };
}

export async function canManageEvent(admin: Admin, eventId: number) {
  const count = await prisma.event.count({
    where: { id: eventId, ...eventScope(admin) },
  });

  return count > 0;
}
