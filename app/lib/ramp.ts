// app/lib/ramp.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function setActiveAccountId(businessId: string) {
  await prisma.activeAccount.upsert({
    where: { id: 'active' }, // Use a constant ID since we only need one record
    update: { businessId },
    create: { id: 'active', businessId }
  });
}

export async function getActiveAccountToken() {
  const activeAccount = await prisma.activeAccount.findUnique({
    where: { id: 'active' }
  });

  if (!activeAccount) {
    throw new Error('No active account selected');
  }

  const connection = await prisma.rampConnection.findUnique({
    where: { businessId: activeAccount.businessId }
  });

  if (!connection) {
    throw new Error('Active account not found');
  }

  return connection.accessToken;
}