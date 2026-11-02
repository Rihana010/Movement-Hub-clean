import "dotenv/config";
import { Pool } from "pg";

type AdminUserRow = {
  id: number;
  email: string;
  fullName: string | null;
  passwordHash: string;
  passwordChangedAt: Date;
  sessionVersion: number;
  mustChangePassword: boolean;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type EventRow = {
  id: number;
  title: string;
  date: Date;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  volunteerCapacity: number;
  isActive: boolean;
  inviteCode: string;
  createdAt: Date;
  createdByAdminId: number | null;
};

type AssignmentRow = {
  id: number;
  eventId: number;
  adminId: number;
  createdAt: Date;
};

type SignupRow = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  locationOrDepartment: string | null;
  status: string;
  selectedDates: string[];
  createdAt: Date;
  eventId: number;
};

function requiredEnvironment(name: "DATABASE_URL" | "TARGET_SUPABASE_URL") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set before copying data.`);
  }

  return value;
}

async function main() {
  const local = new Pool({
    connectionString: requiredEnvironment("DATABASE_URL"),
  });
  const target = new Pool({
    connectionString: requiredEnvironment("TARGET_SUPABASE_URL"),
  });

  const targetClient = await target.connect();

  try {
    // The local connection is used only for SELECT queries. This script never
    // deletes or updates local records.
    const [admins, events, assignments, signups] = await Promise.all([
      local.query<AdminUserRow>(`
        SELECT
          "id", "email", "fullName", "passwordHash", "passwordChangedAt",
          "sessionVersion", "mustChangePassword", "role", "isActive",
          "createdAt", "updatedAt"
        FROM "AdminUser"
        ORDER BY "id"
      `),
      local.query<EventRow>(`
        SELECT
          "id", "title", "date", "endDate", "startTime", "endTime",
          "location", "description", "volunteerCapacity", "isActive",
          "inviteCode", "createdAt", "createdByAdminId"
        FROM "Event"
        ORDER BY "id"
      `),
      local.query<AssignmentRow>(`
        SELECT "id", "eventId", "adminId", "createdAt"
        FROM "EventAdminAssignment"
        ORDER BY "id"
      `),
      local.query<SignupRow>(`
        SELECT
          "id", "fullName", "email", "phone", "locationOrDepartment",
          "status", "selectedDates", "createdAt", "eventId"
        FROM "VolunteerSignup"
        ORDER BY "id"
      `),
    ]);

    await targetClient.query("BEGIN");

    for (const row of admins.rows) {
      await targetClient.query(
        `INSERT INTO "AdminUser"
          ("id", "email", "fullName", "passwordHash", "passwordChangedAt",
           "sessionVersion", "mustChangePassword", "role", "isActive",
           "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT ("id") DO NOTHING`,
        [
          row.id,
          row.email,
          row.fullName,
          row.passwordHash,
          row.passwordChangedAt,
          row.sessionVersion,
          row.mustChangePassword,
          row.role,
          row.isActive,
          row.createdAt,
          row.updatedAt,
        ]
      );
    }

    for (const row of events.rows) {
      await targetClient.query(
        `INSERT INTO "Event"
          ("id", "title", "date", "endDate", "startTime", "endTime",
           "location", "description", "volunteerCapacity", "isActive",
           "inviteCode", "createdAt", "createdByAdminId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT ("id") DO NOTHING`,
        [
          row.id,
          row.title,
          row.date,
          row.endDate,
          row.startTime,
          row.endTime,
          row.location,
          row.description,
          row.volunteerCapacity,
          row.isActive,
          row.inviteCode,
          row.createdAt,
          row.createdByAdminId,
        ]
      );
    }

    for (const row of assignments.rows) {
      await targetClient.query(
        `INSERT INTO "EventAdminAssignment"
          ("id", "eventId", "adminId", "createdAt")
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ("id") DO NOTHING`,
        [row.id, row.eventId, row.adminId, row.createdAt]
      );
    }

    for (const row of signups.rows) {
      await targetClient.query(
        `INSERT INTO "VolunteerSignup"
          ("id", "fullName", "email", "phone", "locationOrDepartment",
           "status", "selectedDates", "createdAt", "eventId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT ("id") DO NOTHING`,
        [
          row.id,
          row.fullName,
          row.email,
          row.phone,
          row.locationOrDepartment,
          row.status,
          row.selectedDates,
          row.createdAt,
          row.eventId,
        ]
      );
    }

    for (const table of [
      "AdminUser",
      "Event",
      "EventAdminAssignment",
      "VolunteerSignup",
    ]) {
      await targetClient.query(
        `SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE((SELECT max("id") FROM "${table}"), 1)
        )`
      );
    }

    await targetClient.query("COMMIT");
    console.log(
      `Copied ${admins.rowCount ?? 0} admins, ${events.rowCount ?? 0} events, ` +
        `${assignments.rowCount ?? 0} assignments, and ${signups.rowCount ?? 0} signups.`
    );
  } catch (error) {
    await targetClient.query("ROLLBACK");
    throw error;
  } finally {
    targetClient.release();
    await Promise.all([local.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error("Failed to copy local data to Supabase:", error);
  process.exitCode = 1;
});
