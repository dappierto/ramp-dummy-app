import { TokenManager } from "@/app/lib/tokens/tokenManager";

export async function GET() {
  try {
    const url = new URL("https://demo-api.ramp.com/developer/v1/accounting/accounts");
    const token = await TokenManager.getInstance().getToken('accounting:read');

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
    const glAccounts = rampResponse.data || []; // Extract only the data array

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
