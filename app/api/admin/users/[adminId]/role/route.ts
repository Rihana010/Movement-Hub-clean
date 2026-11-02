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
      { error: "Only super admins can update admin roles." },
      { status: 403 }
    );
  }

  const { adminId } = await context.params;
  const id = Number(adminId);

  if (!id) {
    return NextResponse.json(
      { error: "Invalid admin ID." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const role = String(body.role || "");

  if (!["event_admin", "super_admin"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role." },
      { status: 400 }
    );
  }

  const targetAdmin = await prisma.adminUser.findUnique({
    where: { id },
  });

  if (!targetAdmin) {
    return NextResponse.json(
      { error: "Admin user not found." },
      { status: 404 }
    );
  }

  if (
    targetAdmin.id === currentAdmin.id &&
    targetAdmin.role === "super_admin" &&
    role !== "super_admin"
  ) {
    const superAdminCount = await prisma.adminUser.count({
      where: {
        role: "super_admin",
        isActive: true,
      },
    });

    if (superAdminCount <= 1) {
      return NextResponse.json(
        {
          error:
            "You cannot remove your own Super Admin role while you are the only active Super Admin.",
        },
        { status: 400 }
      );
    }
  }

  const updatedAdmin = await prisma.$transaction(
    async (tx) => {
      const currentTarget = await tx.adminUser.findUnique({ where: { id } });

      if (!currentTarget) {
        throw new Error("ADMIN_NOT_FOUND");
      }

      if (
        currentTarget.role === "super_admin" &&
        role !== "super_admin" &&
        currentTarget.isActive
      ) {
        const superAdminCount = await tx.adminUser.count({
          where: { role: "super_admin", isActive: true },
        });

        if (superAdminCount <= 1) {
          throw new Error("LAST_SUPER_ADMIN");
        }
      }

      return tx.adminUser.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
        },
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
      { error: "You cannot remove the last active Super Admin." },
      { status: 400 }
    );
  }

  return NextResponse.json(updatedAdmin);
}