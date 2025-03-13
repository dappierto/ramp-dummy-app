/*
  Warnings:

  - You are about to drop the `projectApprovalRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "projectApprovalRule";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "EngagementApprovalRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_id" TEXT NOT NULL,
    "min_amount" REAL NOT NULL,
    "max_amount" REAL,
    "approver_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "EngagementApprovalRule_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "Engagement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EngagementApprovalRule_engagement_id_min_amount_max_amount_key" ON "EngagementApprovalRule"("engagement_id", "min_amount", "max_amount");
