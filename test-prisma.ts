import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  console.log(await prisma.$connect()); // Ensure Prisma can connect
  console.log("✅ Prisma Client Structure:");
  console.dir(prisma, { depth: null }); // Logs the Prisma Client structure

  await prisma.$disconnect(); // Close the Prisma connection
}

test().catch((e) => {
  console.error("❌ Error running Prisma test script:", e);
  prisma.$disconnect();
  process.exit(1);
});
