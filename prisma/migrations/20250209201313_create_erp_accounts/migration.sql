/*
  Warnings:

  - You are about to drop the `GLAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GLAccount";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ERPAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL
);
