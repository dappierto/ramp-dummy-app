import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const erpAccounts = await prisma.eRPAccount.findMany();

    return new Response(JSON.stringify(erpAccounts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error fetching ERP Accounts:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch ERP Accounts" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
