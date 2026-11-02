import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      isPublic: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      inviteCode: true,
      title: true,
      date: true,
      startTime: true,
      endTime: true,
      location: true,
      volunteerCapacity: true,
      latitude: true,
      longitude: true,
      signups: { select: { id: true } },
    },
  });

  return NextResponse.json(
    events.map((event) => ({
      id: String(event.id),
      title: event.title,
      date: event.date.toISOString(),
      time: `${event.startTime} to ${event.endTime}`,
      location: event.location,
      spotsOpen: Math.max(event.volunteerCapacity - event.signups.length, 0),
      coordinates: [event.latitude, event.longitude] as [number, number],
      href: `/join/${event.inviteCode}`,
    }))
  );
}
