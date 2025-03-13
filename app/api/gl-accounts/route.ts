import { TokenManager } from "@/app/lib/tokens/tokenManager";
import { getActiveAccountToken } from '@/app/lib/ramp';
interface RampGLAccount {
  id: string;
  ramp_id: string;
  name: string;
  code?: string;
  classification: string;
  status?: string;
  is_active: boolean;
  created_at: string;
}

export async function GET() {
  const token = await getActiveAccountToken();
  try {
    const url = new URL("https://demo-api.ramp.com/developer/v1/accounting/accounts");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Replace with valid API Key
      },
    });

    if (!response.ok) {
      throw new Error(`Ramp API Error: ${response.statusText}`);
    }

    const rampResponse = await response.json();
    const glAccounts = (rampResponse.data || []).map((account: RampGLAccount) => ({
      id: account.id,
      ramp_id: account.ramp_id,
      name: account.name,
      code: account.code,
      classification: account.classification,
      is_active: account.is_active,
      created_at: account.created_at
    }));

    console.log('Mapped GL Accounts:', glAccounts); // Add logging to debug

    return new Response(JSON.stringify(glAccounts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching GL accounts:", error);

    return new Response(
      JSON.stringify({
        message: "Failed to fetch GL accounts",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
