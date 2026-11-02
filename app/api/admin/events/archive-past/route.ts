import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventScope, getAdminFromRequest } from "@/lib/adminAccess";

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const today = new Date();

  const startOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const result = await prisma.event.updateMany({
    where: {
      isActive: true,
      ...eventScope(admin),
      OR: [
        {
          endDate: {
            lt: startOfCurrentMonth,
          },
        },
        {
          endDate: null,
          date: {
            lt: startOfCurrentMonth,
          },
        },
      ],
    },
    data: {
      isActive: false,
    },
  });

  return NextResponse.json({
    success: true,
    archivedCount: result.count,
  });
}