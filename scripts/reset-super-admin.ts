// Resets the password for an existing super admin.
// The new password is read from stdin and is never printed or logged.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  const password = (await readStdin()).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    console.error("Usage: Get-Content .\\password.txt | npx tsx scripts/reset-super-admin.ts admin@example.com");
    process.exitCode = 1;
    return;
  }

  const admin = await prisma.adminUser.findFirst({
    where: { email, role: "super_admin" },
    select: { id: true },
  });

  if (!admin) {
    console.error("An existing super_admin account was not found.");
    process.exitCode = 1;
    return;
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 },
      mustChangePassword: false,
      isActive: true,
    },
  });

  console.log(`Super admin password reset for ${email}.`);
}

function readStdin() {
  return new Promise<string>((resolve, reject) => {
    let value = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      value += chunk;
    });
    process.stdin.on("end", () => resolve(value));
    process.stdin.on("error", reject);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
