/*
  Warnings:

  - Added the required column `ramp_entity_id` to the `Bills` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "invoice_currency" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "ramp_entity_id" TEXT NOT NULL,
    "vendor_contact_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "due_date" DATETIME NOT NULL,
    "issue_date" DATETIME NOT NULL
);
INSERT INTO "new_Bills" ("due_date", "id", "invoice_currency", "invoice_number", "issue_date", "payment_method", "vendor_contact_id", "vendor_id") SELECT "due_date", "id", "invoice_currency", "invoice_number", "issue_date", "payment_method", "vendor_contact_id", "vendor_id" FROM "Bills";
DROP TABLE "Bills";
ALTER TABLE "new_Bills" RENAME TO "Bills";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
