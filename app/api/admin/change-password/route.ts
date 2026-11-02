import { getAdminForPasswordChange } from "@/lib/adminAccess";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST(request: Request) {
  const adminUser = await getAdminForPasswordChange(request);

  if (!adminUser) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  const passwordIsValid =
    newPassword.length >= 8 &&
    /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];']/g.test(newPassword);

    if (!passwordIsValid) {
    return NextResponse.json(
        {
        error:
            "Password must be at least 8 characters and contain at least one special character.",
        },
        { status: 400 }
    );
    }

  const currentPasswordIsValid = await bcrypt.compare(
    currentPassword,
    adminUser.passwordHash
  );

  if (!currentPasswordIsValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 }
    );
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await prisma.adminUser.update({
    where: { email: adminUser.email },
    data: {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 },
      mustChangePassword: false,
    },
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(adminUser.email, false, adminUser.sessionVersion + 1),
    {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE_SECONDS,
    }
  );

  return response;
}