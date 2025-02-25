import { TokenManager } from "@/app/lib/tokens/tokenManager";
const token = await TokenManager.getInstance().getToken('accounting:read');

export async function GET(req: Request) {
  try {
    console.log("Fetching Ramp Custom Fields...");
    
    const response = await fetch("https://demo-api.ramp.com/developer/v1/accounting/fields", {
      headers: {
        Authorization: `Bearer ${token}`, // Replace with actual API key
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Ramp API Error:", response.status, response.statusText);
      return new Response(JSON.stringify({ error: "Failed to fetch from Ramp API" }), { status: 500 });
    }

    const jsonResponse = await response.json();
    console.log("Ramp API Raw Response:", jsonResponse);

    return new Response(JSON.stringify(jsonResponse.data), { status: 200 }); // Extract `data`
  } catch (error) {
    console.error("Error fetching Ramp Custom Fields:", error);
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}
