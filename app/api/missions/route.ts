import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInviteCode } from "@/lib/invite";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function coordinates(body: Record<string, unknown>) {
  const latitude =
    body.latitude === null || body.latitude === undefined || body.latitude === ""
      ? null
      : Number(body.latitude);
  const longitude =
    body.longitude === null || body.longitude === undefined || body.longitude === ""
      ? null
      : Number(body.longitude);

  const valid =
    (latitude === null) === (longitude === null) &&
    (latitude === null ||
      longitude === null ||
    (Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180));

  return { latitude, longitude, valid };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { ownerUserId: user.id },
    include: { signups: { select: { id: true } } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title || "").trim();
    const date = String(body.date || "").trim();
    const endDate = String(body.endDate || "").trim();
    const startTime = String(body.startTime || "").trim();
    const endTime = String(body.endTime || "").trim();
    const location = String(body.location || "").trim();
    const description = String(body.description || "").trim();
    const volunteerCapacity = Number(body.volunteerCapacity);
    const isPublic = body.isPublic === true;
    const { latitude, longitude, valid } = coordinates(body);

    if (!title || !date || !startTime || !endTime || !location || !description || !volunteerCapacity) {
      return NextResponse.json({ error: "Missing required event fields." }, { status: 400 });
    }
    if (!valid) {
      return NextResponse.json({ error: "Latitude and longitude must both be valid coordinates." }, { status: 400 });
    }
    if (isPublic && (latitude === null || longitude === null)) {
      return NextResponse.json({ error: "Public events require valid latitude and longitude." }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
    if (!profile) {
      return NextResponse.json({ error: "Complete Google sign-in before creating an event." }, { status: 403 });
    }

    const event = await prisma.event.create({
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
        ownerUserId: user.id,
        inviteCode: generateInviteCode(),
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create owner event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create event." },
      { status: 500 }
    );
  }
}
