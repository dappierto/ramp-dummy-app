/*
  Warnings:

  - You are about to drop the `ProjectApprover` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProjectApprover";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "projectApprover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "approver_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projectApprover_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "Engagement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "projectApprover_engagement_id_user_id_approver_type_key" ON "projectApprover"("engagement_id", "user_id", "approver_type");
