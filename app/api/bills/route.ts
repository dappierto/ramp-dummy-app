import { getActiveAccountToken } from "@/app/lib/ramp";
// Define a Bill interface
interface Bill {
  id: string;
  sync_status: string;
  // Add other properties based on your API response
}


export async function GET() {
  const token = await getActiveAccountToken();
    try {
      // ✅ Construct the API URL with query parameters
      const url = new URL("https://demo-api.ramp.com/developer/v1/bills?sync_ready=true");
  
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
    let bills = rampResponse.data || [] as Bill[]; // Extract only the data array
    
    // Filter out items where sync_status equals BILL_AND_PAYMENT_SYNCED
    bills = bills.filter((bill: Bill) => bill.sync_status == "NOT_SYNCED");
  
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
  