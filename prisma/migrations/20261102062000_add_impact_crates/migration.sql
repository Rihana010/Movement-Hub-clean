CREATE TABLE "ImpactCrate" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "reward" TEXT,
    "openedAt" TIMESTAMP(3),

    CONSTRAINT "ImpactCrate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImpactCrate_userId_sourceType_sourceId_key"
ON "ImpactCrate"("userId", "sourceType", "sourceId");

CREATE INDEX "ImpactCrate_userId_idx" ON "ImpactCrate"("userId");

ALTER TABLE "ImpactCrate"
ADD CONSTRAINT "ImpactCrate_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
