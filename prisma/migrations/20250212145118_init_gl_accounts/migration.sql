-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "ramp_vendor_contact_id" TEXT;

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "ramp_employee_id" TEXT,
    "ramp_role" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);
