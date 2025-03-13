
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { getActiveAccountToken } from '@/app/lib/ramp';


export async function POST(req: Request) {
  const token = await getActiveAccountToken();
  try {
    const body = await req.json();

    if (!body.gl_accounts || !Array.isArray(body.gl_accounts) || body.gl_accounts.length === 0) {
      return new Response(JSON.stringify({ message: "No GL accounts to sync" }), { status: 400 });
    }

    const response = await fetch("https://demo-api.ramp.com/developer/v1/accounting/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Replace with valid API Key
      },
      body: JSON.stringify({ gl_accounts: body.gl_accounts }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ramp Sync API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Ramp API Response:', data);

    // Update erpaccount table with ramp_id
    for (const account of data.gl_accounts) {
      await prisma.eRPAccount.update({
        where: { id: account.id },
        data: { ramp_id: account.ramp_id },
      });
    }

    return new Response(JSON.stringify({ message: "GL accounts synced successfully", data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Error syncing GL accounts to Ramp:", errorMessage);
    return new Response(
      JSON.stringify({ message: "Failed to sync GL accounts", error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}