import { getActiveAccountToken } from "@/app/lib/ramp";
const token = await getActiveAccountToken();

export async function GET() {
  try {
    // ✅ Construct the API URL with query parameters
    const url = new URL("https://demo-api.ramp.com/developer/v1/cashbacks?sync_ready=true");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Ramp API Error: ${response.statusText}`);
    }

    const rampResponse = await response.json();
    const cashbacks = rampResponse.data || []; // Extract only the data array

    return new Response(JSON.stringify(cashbacks), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching Ramp cashbacks:", error);

    return new Response(
      JSON.stringify({
        message: "Failed to fetch cashbacks",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
