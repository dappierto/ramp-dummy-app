/*
  Warnings:

  - Added the required column `line_type` to the `BillLineItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BillLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "line_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "gl_account_id" TEXT,
    "category_id" TEXT,
    CONSTRAINT "BillLineItem_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BillLineItem" ("bill_id", "category_id", "description", "gl_account_id", "id", "quantity", "total_amount", "unit_price") SELECT "bill_id", "category_id", "description", "gl_account_id", "id", "quantity", "total_amount", "unit_price" FROM "BillLineItem";
DROP TABLE "BillLineItem";
ALTER TABLE "new_BillLineItem" RENAME TO "BillLineItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
