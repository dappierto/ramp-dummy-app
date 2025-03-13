/*
  Warnings:

  - You are about to drop the column `ramp_employee_id` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `ramp_role` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `user_email` on the `Users` table. All the data in the column will be lost.
  - Added the required column `email` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Made the column `first_name` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Users" ("created_at", "first_name", "id", "is_active", "last_name", "updated_at") SELECT "created_at", "first_name", "id", "is_active", "last_name", "updated_at" FROM "Users";
DROP TABLE "Users";
ALTER TABLE "new_Users" RENAME TO "Users";
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
