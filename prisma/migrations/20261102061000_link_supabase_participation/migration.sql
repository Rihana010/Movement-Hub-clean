ALTER TABLE "Event"
ADD COLUMN "ownerUserId" UUID;

ALTER TABLE "VolunteerSignup"
ADD COLUMN "userId" UUID;

CREATE INDEX "Event_ownerUserId_idx" ON "Event"("ownerUserId");
CREATE INDEX "VolunteerSignup_userId_idx" ON "VolunteerSignup"("userId");

ALTER TABLE "Event"
ADD CONSTRAINT "Event_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "UserProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VolunteerSignup"
ADD CONSTRAINT "VolunteerSignup_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
