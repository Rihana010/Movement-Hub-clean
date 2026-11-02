-- Volunteers now sign up with just a name and phone number.
ALTER TABLE "VolunteerSignup" ADD COLUMN "phone" TEXT;
ALTER TABLE "VolunteerSignup" ALTER COLUMN "locationOrDepartment" DROP NOT NULL;
