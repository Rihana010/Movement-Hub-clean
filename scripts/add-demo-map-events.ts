import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type DemoEvent = {
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  volunteerCapacity: number;
  inviteCode: string;
  latitude: number;
  longitude: number;
};

const demoEvents: DemoEvent[] = [
  {
    title: "[Demo] River Thames Cleanup",
    date: new Date("2027-03-20T12:00:00"),
    startTime: "9:00 AM",
    endTime: "12:00 PM",
    location: "South Bank, London",
    description: "Demo map event for testing public event discovery.",
    volunteerCapacity: 20,
    inviteCode: "demo-london-river-2027",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    title: "[Demo] Central Park Food Drive",
    date: new Date("2027-04-10T12:00:00"),
    startTime: "10:00 AM",
    endTime: "1:00 PM",
    location: "Central Park, New York",
    description: "Demo map event for testing public event discovery.",
    volunteerCapacity: 24,
    inviteCode: "demo-newyork-food-2027",
    latitude: 40.7829,
    longitude: -73.9654,
  },
  {
    title: "[Demo] Mumbai Waterfront Cleanup",
    date: new Date("2027-04-24T12:00:00"),
    startTime: "7:30 AM",
    endTime: "10:30 AM",
    location: "Marine Drive, Mumbai",
    description: "Demo map event for testing public event discovery.",
    volunteerCapacity: 30,
    inviteCode: "demo-mumbai-coast-2027",
    latitude: 18.9432,
    longitude: 72.8236,
  },
  {
    title: "[Demo] Berlin Community Learning Day",
    date: new Date("2027-05-08T12:00:00"),
    startTime: "11:00 AM",
    endTime: "2:00 PM",
    location: "Alexanderplatz, Berlin",
    description: "Demo map event for testing public event discovery.",
    volunteerCapacity: 16,
    inviteCode: "demo-berlin-learn-2027",
    latitude: 52.5219,
    longitude: 13.4132,
  },
];

function getArgument(name: string) {
  const prefix = `${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function describeTarget(connectionString: string) {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    database: url.pathname.replace(/^\/+/, "") || "default",
    label: `${url.hostname}/${url.pathname.replace(/^\/+/, "") || "default"}`,
  };
}

function printUsage() {
  console.log(
    [
      "Dry run:",
      "  npx tsx scripts/add-demo-map-events.ts --dry-run --owner-email=admin@example.com",
      "",
      "Write mode (never run against production without review):",
      "  npx tsx scripts/add-demo-map-events.ts --confirm-demo-seed --target=HOST/DATABASE --owner-email=admin@example.com",
    ].join("\n")
  );
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required; target database is unclear.");
  }

  const target = describeTarget(connectionString);
  const ownerEmail = getArgument("--owner-email");
  const isWrite = hasFlag("--confirm-demo-seed");
  const isDryRun = hasFlag("--dry-run") || !isWrite;

  if (!ownerEmail) {
    printUsage();
    throw new Error("Provide --owner-email for an existing active admin owner.");
  }

  if (isWrite && !hasFlag("--confirm-demo-seed")) {
    throw new Error("Write mode requires --confirm-demo-seed.");
  }

  if (isWrite) {
    const confirmedTarget = getArgument("--target");
    if (!confirmedTarget || confirmedTarget !== target.label) {
      throw new Error(
        `Write mode requires --target=${target.label}. No writes were made.`
      );
    }
  }

  console.log(`Target database: ${target.database}`);
  console.log(`Target host: ${target.host}`);
  console.log(`Mode: ${isDryRun ? "DRY RUN (no writes)" : "WRITE"}`);

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const owner = await prisma.adminUser.findFirst({
      where: { email: ownerEmail, isActive: true },
      select: { id: true, email: true },
    });

    if (!owner) {
      throw new Error("The requested owner email is not an active admin. No writes were made.");
    }

    const existing = await prisma.event.findMany({
      where: { inviteCode: { in: demoEvents.map((event) => event.inviteCode) } },
      select: { inviteCode: true, title: true },
    });
    const existingCodes = new Set(existing.map((event) => event.inviteCode));
    const pending = demoEvents.filter((event) => !existingCodes.has(event.inviteCode));

    console.log(`Owner: ${owner.email}`);
    for (const event of demoEvents) {
      console.log(
        `${existingCodes.has(event.inviteCode) ? "EXISTS" : "INSERT"}: ${event.title} (${event.inviteCode})`
      );
    }

    if (isDryRun) {
      console.log(`Would insert ${pending.length} demo event(s).`);
      return;
    }

    if (pending.length > 0) {
      await prisma.event.createMany({
        data: pending.map((event) => ({
          ...event,
          isPublic: true,
          isActive: true,
          createdByAdminId: owner.id,
        })),
      });
    }
    console.log(`Inserted ${pending.length} demo event(s); existing events were unchanged.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Demo map event script failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
