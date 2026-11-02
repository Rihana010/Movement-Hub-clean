-- Use an integer version for session revocation so database timezone settings
-- cannot invalidate newly created sessions.
ALTER TABLE "AdminUser"
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
