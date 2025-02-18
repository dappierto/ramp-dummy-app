-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ERPAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_ERPAccount" ("code", "id", "name", "type") SELECT "code", "id", "name", "type" FROM "ERPAccount";
DROP TABLE "ERPAccount";
ALTER TABLE "new_ERPAccount" RENAME TO "ERPAccount";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
