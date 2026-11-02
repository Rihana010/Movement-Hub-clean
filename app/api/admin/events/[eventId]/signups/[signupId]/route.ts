import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent, getAdminFromRequest } from "@/lib/adminAccess";

type RouteContext = {
  params: Promise<{ eventId: string; signupId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { eventId, signupId } = await context.params;
  const eventNumber = Number(eventId);
  const signupNumber = Number(signupId);

  if (!eventNumber || !signupNumber) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const admin = await getAdminFromRequest(request);

  if (!admin || !(await canManageEvent(admin, eventNumber))) {
    return NextResponse.json(
      { error: "You do not have permission to change this event." },
      { status: 403 }
    );
  }

  // The eventId in the URL must match, so one event's admin can't remove
  // volunteers from another event by guessing signup ids.
  const result = await prisma.volunteerSignup.deleteMany({
    where: { id: signupNumber, eventId: eventNumber },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Volunteer not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
