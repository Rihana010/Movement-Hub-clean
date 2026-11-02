// Creates (or resets) a super admin.
//   npx tsx scripts/create-admin.ts you@example.com "A strong password" "Your Name"
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const [emailArg, password, fullName] = process.argv.slice(2);
  const email = (emailArg || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
    console.error(
      'Usage: npx tsx scripts/create-admin.ts you@example.com "password (8+ chars)" "Your Name"'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      passwordChangedAt: new Date(),
      sessionVersion: { increment: 1 },
      role: "super_admin",
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      email,
      fullName: fullName || "Super Admin",
      passwordHash,
      role: "super_admin",
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log(`Super admin ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
