import { getAdminFromRequest } from "@/lib/adminAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    adminId: string;
  }>;
};

async function getCurrentAdmin(request: Request) {
  return getAdminFromRequest(request);
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentAdmin = await getCurrentAdmin(request);

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only super admins can update admin status." },
      { status: 403 }
    );
  }

  const { adminId } = await context.params;
  const id = Number(adminId);

  if (!id) {
    return NextResponse.json({ error: "Invalid admin ID." }, { status: 400 });
  }

  const body = await request.json();
  const isActive = Boolean(body.isActive);

  if (currentAdmin.id === id && !isActive) {
    return NextResponse.json(
      { error: "You cannot deactivate your own admin account." },
      { status: 400 }
    );
  }

  const updatedAdmin = await prisma.$transaction(
    async (tx) => {
      const targetAdmin = await tx.adminUser.findUnique({ where: { id } });

      if (!targetAdmin) throw new Error("ADMIN_NOT_FOUND");

      if (
        targetAdmin.isActive &&
        !isActive &&
        targetAdmin.role === "super_admin"
      ) {
        const superAdminCount = await tx.adminUser.count({
          where: { role: "super_admin", isActive: true },
        });

        if (superAdminCount <= 1) throw new Error("LAST_SUPER_ADMIN");
      }

      return tx.adminUser.update({
        where: { id },
        data: { isActive },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  ).catch((error: unknown) => {
    if (error instanceof Error && error.message === "LAST_SUPER_ADMIN") {
      return null;
    }
    throw error;
  });

  if (!updatedAdmin) {
    return NextResponse.json(
      { error: "You cannot deactivate the last active Super Admin." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, admin: updatedAdmin });
}