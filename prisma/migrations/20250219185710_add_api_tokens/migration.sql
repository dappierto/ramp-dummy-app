-- CreateTable
CREATE TABLE "ApiTokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiTokens_scope_key" ON "ApiTokens"("scope");

-- CreateIndex
CREATE INDEX "ApiTokens_scope_idx" ON "ApiTokens"("scope");

-- CreateIndex
CREATE INDEX "ApiTokens_expiresAt_idx" ON "ApiTokens"("expiresAt");
