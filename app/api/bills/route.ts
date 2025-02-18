export async function GET() {
    try {
      // ✅ Construct the API URL with query parameters
      const url = new URL("https://demo-api.ramp.com/developer/v1/bills?sync_ready=true");
  
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ramp_tok_57IUJKZR19L3gWOFJESUCJuH3R1FYefSrXaJhZTCek`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Ramp API Error: ${response.statusText}`);
      }
  
      const rampResponse = await response.json();
      const bills = rampResponse.data || []; // Extract only the data array
  
      return new Response(JSON.stringify(bills), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching Ramp bills:", error);
  
      return new Response(
        JSON.stringify({
          message: "Failed to fetch bills",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
  