import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ eventId: string }> };

async function ownerEvent(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = Number(eventId);
  if (!user) return { user: null, event: null, id };
  const event = id
    ? await prisma.event.findFirst({
        where: { id, ownerUserId: user.id },
        include: { signups: true },
      })
    : null;
  return { user, event, id };
}

export async function GET(_: Request, context: Context) {
  const { user, event, id } = await ownerEvent((await context.params).eventId);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!id || !event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json(event);
}

export async function PUT(request: Request, context: Context) {
  try {
    const { user, event, id } = await ownerEvent((await context.params).eventId);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!id || !event) return NextResponse.json({ error: "You do not have permission to edit this event." }, { status: 403 });

    const body = (await request.json()) as Record<string, unknown>;
    const latitude = body.latitude === null || body.latitude === "" ? null : Number(body.latitude);
    const longitude = body.longitude === null || body.longitude === "" ? null : Number(body.longitude);
    const valid =
      (latitude === null) === (longitude === null) &&
      (latitude === null ||
        longitude === null ||
        (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
          Number.isFinite(longitude) && longitude >= -180 && longitude <= 180));
    const isPublic = body.isPublic === true;
    if (!valid || (isPublic && (latitude === null || longitude === null))) {
      return NextResponse.json({ error: "Public events require valid latitude and longitude." }, { status: 400 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: String(body.title || "").trim(),
        date: new Date(`${String(body.date)}T12:00:00`),
        endDate: body.endDate ? new Date(`${String(body.endDate)}T12:00:00`) : null,
        startTime: String(body.startTime || "").trim(),
        endTime: String(body.endTime || "").trim(),
        location: String(body.location || "").trim(),
        description: String(body.description || "").trim(),
        volunteerCapacity: Number(body.volunteerCapacity),
        isPublic,
        latitude,
        longitude,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update owner event error:", error);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const { user, event, id } = await ownerEvent((await context.params).eventId);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!id || !event) return NextResponse.json({ error: "You do not have permission to update this event." }, { status: 403 });
  const body = (await request.json()) as { isActive?: unknown };
  const updated = await prisma.event.update({
    where: { id },
    data: { isActive: body.isActive === true },
  });
  return NextResponse.json(updated);
}
