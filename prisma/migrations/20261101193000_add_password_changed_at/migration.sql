-- Track password changes so existing signed sessions can be invalidated.
ALTER TABLE "AdminUser"
ADD COLUMN "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
