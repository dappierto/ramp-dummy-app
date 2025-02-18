export async function GET() {
  try {
    // ✅ Construct the API URL with query parameters
    const url = new URL("https://demo-api.ramp.com/developer/v1/transfers?has_no_sync_commits=true");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ramp_tok_ItmARUEPXiYfQ1l7r1Nvm8roTqWl7L2OsAiSr2NnYP`,
      },
    });

    if (!response.ok) {
      throw new Error(`Ramp API Error: ${response.statusText}`);
    }

    const rampResponse = await response.json();
    const transfers = rampResponse.data || []; // Extract only the data array

    return new Response(JSON.stringify(transfers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching Ramp transfers:", error);

    return new Response(
      JSON.stringify({
        message: "Failed to fetch transfers",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
