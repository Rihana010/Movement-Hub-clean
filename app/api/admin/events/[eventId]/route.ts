import { canManageEvent, getAdminFromRequest } from "@/lib/adminAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

async function canManage(request: Request, eventId: number) {
  const admin = await getAdminFromRequest(request);
  return admin ? canManageEvent(admin, eventId) : false;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const id = Number(eventId);

  if (!id) {
    return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
  }

  if (!(await canManage(request, id))) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      adminAssignments: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const id = Number(eventId);

    if (!id) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    const hasPermission = await canManage(request, id);

if (!hasPermission) {
  return NextResponse.json(
    { error: "You do not have permission to edit this event." },
    { status: 403 }
  );
}

    const body = await request.json();

    const title = String(body.title || "").trim();
    const date = String(body.date || "").trim();
    const endDate = String(body.endDate || "").trim();
    const startTime = String(body.startTime || "").trim();
    const endTime = String(body.endTime || "").trim();
    const location = String(body.location || "").trim();
    const description = String(body.description || "").trim();
    const volunteerCapacity = Number(body.volunteerCapacity);
    const isPublic = body.isPublic === true;
    const latitude = body.latitude === null || body.latitude === undefined || body.latitude === ""
      ? null
      : Number(body.latitude);
    const longitude = body.longitude === null || body.longitude === undefined || body.longitude === ""
      ? null
      : Number(body.longitude);

    if (
      !title ||
      !date ||
      !startTime ||
      !endTime ||
      !location ||
      !description ||
      !volunteerCapacity
    ) {
      return NextResponse.json(
        { error: "Missing required event fields." },
        { status: 400 }
      );
    }

    if (
      (latitude === null) !== (longitude === null) ||
      (latitude !== null &&
        longitude !== null &&
        (!Number.isFinite(latitude) ||
          latitude < -90 ||
          latitude > 90 ||
          !Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180))
    ) {
      return NextResponse.json(
        { error: "Latitude and longitude must both be valid coordinates." },
        { status: 400 }
      );
    }

    if (isPublic && (latitude === null || longitude === null)) {
      return NextResponse.json(
        { error: "Public events require valid latitude and longitude." },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        date: new Date(`${date}T12:00:00`),
        endDate: endDate ? new Date(`${endDate}T12:00:00`) : null,
        startTime,
        endTime,
        location,
        description,
        volunteerCapacity,
        isPublic,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Failed to update event:", error);

    return NextResponse.json(
      { error: "Failed to update event." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const id = Number(eventId);

    if (!id) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    const hasPermission = await canManage(request, id);

if (!hasPermission) {
  return NextResponse.json(
    { error: "You do not have permission to update this event." },
    { status: 403 }
  );
}

    const body = await request.json();
    const isActive = Boolean(body.isActive);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        isActive,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Failed to update event status:", error);

    return NextResponse.json(
      { error: "Failed to update event status." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const id = Number(eventId);

    if (!id) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    if (!(await canManage(request, id))) {
      return NextResponse.json(
        { error: "You do not have permission to delete this event." },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.volunteerSignup.deleteMany({ where: { eventId: id } }),
      prisma.eventAdminAssignment.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event:", error);

    return NextResponse.json(
      { error: "Failed to delete event." },
      { status: 500 }
    );
  }
}
