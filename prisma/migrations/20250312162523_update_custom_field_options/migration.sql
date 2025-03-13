/*
  Warnings:

  - You are about to drop the column `code` on the `CustomFieldsOptions` table. All the data in the column will be lost.
  - You are about to drop the column `ramp_field_id` on the `CustomFieldsOptions` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomFieldsOptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ramp_field_option_id" TEXT
);
INSERT INTO "new_CustomFieldsOptions" ("field_id", "id", "is_active", "value") SELECT "field_id", "id", "is_active", "value" FROM "CustomFieldsOptions";
DROP TABLE "CustomFieldsOptions";
ALTER TABLE "new_CustomFieldsOptions" RENAME TO "CustomFieldsOptions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
