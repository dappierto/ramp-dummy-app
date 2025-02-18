export async function POST(req: Request) {
    try {
      if (req.method !== "POST") {
        return new Response(JSON.stringify({ message: "Method Not Allowed" }), { status: 405 });
      }
  
      const body = await req.json();
  
      // ✅ Dynamically set sync_type (defaults to TRANSACTION_SYNC)
      const syncData: any = {
        idempotency_key: body.idempotency_key || crypto.randomUUID(),
        sync_type: body.sync_type || "TRANSACTION_SYNC", // 👈 Now supports BILL_SYNC dynamically
      };
  
      // ✅ Only include successful_syncs if provided
      if (body.successful_syncs && body.successful_syncs.length > 0) {
        syncData.successful_syncs = body.successful_syncs;
      }
  
      // ✅ Only include failed_syncs if provided
      if (body.failed_syncs && body.failed_syncs.length > 0) {
        syncData.failed_syncs = body.failed_syncs;
      }
  
      console.log("📤 Sending Sync Payload to Ramp:", JSON.stringify(syncData, null, 2));
  
      const response = await fetch("https://demo-api.ramp.com/developer/v1/accounting/syncs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ramp_tok_1N7UxXdLhF0tEXDN1L2cvqCGDphAYu0bPppRN7ZjJm`, // Replace with valid Ramp API Key
        },
        body: JSON.stringify(syncData),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ramp Sync API Error: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      console.error("❌ Error syncing transaction to Ramp:", error);
      return new Response(
        JSON.stringify({ message: "Failed to sync transaction", error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  