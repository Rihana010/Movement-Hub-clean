import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Every calendar day of the event, as yyyy-mm-dd. A volunteer signs up for the
// whole event, so the server fills this in instead of asking them.
function eventDays(start: Date, end: Date | null) {
  const days: string[] = [];
  const last = (end ?? start).toISOString().slice(0, 10);
  const cursor = new Date(`${start.toISOString().slice(0, 10)}T12:00:00Z`);

  while (cursor.toISOString().slice(0, 10) <= last && days.length < 366) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inviteCode = String(body.inviteCode || "").trim();
    const fullName = String(body.fullName || "").trim().slice(0, 120);

    // Keep a leading "+", drop spaces, dashes and brackets.
    const phone = String(body.phone || "")
      .trim()
      .replace(/(?!^\+)[^\d]/g, "");
    const phoneDigits = phone.replace(/\D/g, "");

    if (!inviteCode || !fullName) {
      return NextResponse.json(
        { error: "Enter your name and phone number." },
        { status: 400 }
      );
    }

    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json(
        { error: "Enter a valid phone number, for example +91 98765 43210." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    await prisma.$transaction(async (tx) => {
      const found = await tx.event.findUnique({
        where: { inviteCode },
        select: { id: true },
      });

      if (!found) {
        throw new Error("EVENT_NOT_AVAILABLE");
      }

      // Lock this event row so two people taking the last spot at the same
      // moment can't both get in.
      const locked = await tx.$queryRaw<
        { isActive: boolean; volunteerCapacity: number }[]
      >`
        SELECT "isActive", "volunteerCapacity"
        FROM "Event"
        WHERE id = ${found.id}
        FOR UPDATE
      `;

      if (!locked[0] || !locked[0].isActive) {
        throw new Error("EVENT_NOT_AVAILABLE");
      }

      const event = await tx.event.findUniqueOrThrow({
        where: { id: found.id },
        include: { signups: { select: { phone: true, userId: true } } },
      });

      if (event.signups.length >= locked[0].volunteerCapacity) {
        throw new Error("EVENT_FULL");
      }

      const alreadySignedUp = event.signups.some(
        (existing) => existing.phone?.replace(/\D/g, "") === phoneDigits
      );

      if (alreadySignedUp) {
        throw new Error("DUPLICATE_SIGNUP");
      }

      if (
        supabaseUser &&
        event.signups.some((existing) => existing.userId === supabaseUser.id)
      ) {
        throw new Error("DUPLICATE_USER_SIGNUP");
      }

      await tx.volunteerSignup.create({
        data: {
          eventId: event.id,
          fullName,
          phone,
          selectedDates: eventDays(event.date, event.endDate),
          status: "confirmed",
          userId: supabaseUser?.id ?? null,
        },
      });
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "EVENT_NOT_AVAILABLE":
          return NextResponse.json(
            { error: "This event is not available." },
            { status: 404 }
          );
        case "EVENT_FULL":
          return NextResponse.json(
            { error: "Every spot for this event is taken." },
            { status: 409 }
          );
        case "DUPLICATE_SIGNUP":
          return NextResponse.json(
            { error: "This phone number is already signed up for this event." },
            { status: 409 }
          );
        case "DUPLICATE_USER_SIGNUP":
          return NextResponse.json(
            { error: "This account is already signed up for this event." },
            { status: 409 }
          );
      }
    }

    console.error("Failed to create volunteer signup:", error);

    return NextResponse.json(
      { error: "Couldn't save your sign-up. Try again." },
      { status: 500 }
    );
  }
}
