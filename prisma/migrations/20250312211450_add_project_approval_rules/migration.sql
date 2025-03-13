-- CreateTable
CREATE TABLE "projectApprovalRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_id" TEXT NOT NULL,
    "min_amount" REAL NOT NULL,
    "max_amount" REAL,
    "approver_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projectApprovalRule_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "Engagement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "projectApprovalRule_engagement_id_min_amount_max_amount_key" ON "projectApprovalRule"("engagement_id", "min_amount", "max_amount");
