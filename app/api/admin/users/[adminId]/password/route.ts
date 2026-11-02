import { randomInt } from "crypto";
import { getAdminFromRequest } from "@/lib/adminAccess";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ adminId: string }>;
};

function generateTemporaryPassword() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length: 12 }, () => characters[randomInt(characters.length)]).join("");
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentAdmin = await getAdminFromRequest(request);

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only super admins can reset temporary passwords." },
      { status: 403 }
    );
  }

  const id = Number((await context.params).adminId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid admin ID." }, { status: 400 });
  }

  const targetAdmin = await prisma.adminUser.findUnique({ where: { id } });
  if (!targetAdmin) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  if (targetAdmin.role !== "event_admin") {
    return NextResponse.json(
      { error: "Only Event Admin passwords can be reset here." },
      { status: 400 }
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  await prisma.adminUser.update({
    where: { id },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 },
      mustChangePassword: true,
    },
  });

  return NextResponse.json({
    adminUser: { id: targetAdmin.id, email: targetAdmin.email },
    temporaryPassword,
  });
}
