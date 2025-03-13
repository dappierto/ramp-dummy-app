/*
  Warnings:

  - You are about to drop the column `amount_threshold` on the `ApprovalRule` table. All the data in the column will be lost.
  - You are about to drop the column `engagement_id` on the `ApprovalRule` table. All the data in the column will be lost.
  - You are about to drop the column `priority_order` on the `ApprovalRule` table. All the data in the column will be lost.
  - Added the required column `min_amount` to the `ApprovalRule` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApprovalRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "min_amount" REAL NOT NULL,
    "max_amount" REAL,
    "approver_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_ApprovalRule" ("approver_type", "created_at", "id", "updated_at") SELECT "approver_type", "created_at", "id", "updated_at" FROM "ApprovalRule";
DROP TABLE "ApprovalRule";
ALTER TABLE "new_ApprovalRule" RENAME TO "ApprovalRule";
CREATE UNIQUE INDEX "ApprovalRule_min_amount_max_amount_key" ON "ApprovalRule"("min_amount", "max_amount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
