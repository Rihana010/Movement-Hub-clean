import { generateInviteCode } from "@/lib/invite";
import { getAdminFromRequest } from "@/lib/adminAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
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

const adminUser = await getAdminFromRequest(request);

if (!adminUser) {
  return NextResponse.json(
    { error: "Unauthorized." },
    { status: 401 }
  );
}

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

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
        ownerUserId: supabaseUser?.id ?? null,
        isActive: true,
        createdByAdminId: adminUser.id,
        inviteCode: generateInviteCode(),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create event." },
      { status: 500 }
    );
  }
}