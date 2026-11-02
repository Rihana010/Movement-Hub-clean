import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageEvent, getAdminFromRequest } from "@/lib/adminAccess";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

function escapeCsvValue(value: string | null | undefined) {
  let safeValue = value ?? "";
  // A name like "=HYPERLINK(...)" would run as a formula when opened in Excel.
  if (/^([=@\t\r]|[+\-](?!\d))/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const id = Number(eventId);

  if (!id) {
    return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
  }

  const admin = await getAdminFromRequest(request);

  if (!admin || !(await canManageEvent(admin, id))) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      signups: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const rows = [
    ["Name", "Phone", "Volunteer Dates", "Status", "Signup Date"],
    ...event.signups.map((signup) => [
      signup.fullName,
      signup.phone || "",
      (signup.selectedDates || []).join("; "),
      signup.status,
      signup.createdAt.toISOString().slice(0, 10),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");

  const fileName = `${event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-volunteers.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}