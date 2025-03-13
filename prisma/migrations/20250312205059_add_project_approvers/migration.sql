-- CreateTable
CREATE TABLE "ProjectApprover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "approver_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ProjectApprover_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "Engagement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectApprover_engagement_id_user_id_approver_type_key" ON "ProjectApprover"("engagement_id", "user_id", "approver_type");
