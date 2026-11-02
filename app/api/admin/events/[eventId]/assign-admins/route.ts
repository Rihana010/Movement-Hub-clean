import { getAdminFromRequest } from "@/lib/adminAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

async function getCurrentAdmin(request: Request) {
  return getAdminFromRequest(request);
}

export async function PUT(request: Request, context: RouteContext) {
  const currentAdmin = await getCurrentAdmin(request);

  if (!currentAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentAdmin.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only super admins can assign admins to events." },
      { status: 403 }
    );
  }

  const { eventId } = await context.params;
  const id = Number(eventId);

  if (!id) {
    return NextResponse.json(
      { error: "Invalid event ID." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const adminIds: number[] = Array.isArray(body.adminIds)
    ? body.adminIds.map(Number).filter(Boolean)
    : [];

  const validAdmins = await prisma.adminUser.findMany({
    where: {
      id: { in: adminIds },
      role: "event_admin",
      isActive: true,
    },
    select: { id: true },
  });

  if (validAdmins.length !== new Set(adminIds).size) {
    return NextResponse.json(
      { error: "Assignments must target active Event Admin accounts." },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventAdminAssignment.deleteMany({ where: { eventId: id } });

    if (adminIds.length > 0) {
      await tx.eventAdminAssignment.createMany({
        data: adminIds.map((adminId: number) => ({ eventId: id, adminId })),
        skipDuplicates: true,
      });
    }
  });

  return NextResponse.json({ success: true });
}