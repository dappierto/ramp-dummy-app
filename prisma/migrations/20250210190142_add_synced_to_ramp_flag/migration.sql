-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomFieldsOptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "synced_to_ramp" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_CustomFieldsOptions" ("code", "field_id", "id", "is_active", "value") SELECT "code", "field_id", "id", "is_active", "value" FROM "CustomFieldsOptions";
DROP TABLE "CustomFieldsOptions";
ALTER TABLE "new_CustomFieldsOptions" RENAME TO "CustomFieldsOptions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
