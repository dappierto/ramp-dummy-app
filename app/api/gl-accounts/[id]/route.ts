



export async function DELETE(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;

    console.log(`🗑️ Preparing DELETE request for GL Account with Ramp ID: ${id}`);

    const response = await fetch(`https://demo-api.ramp.com/developer/v1/accounting/accounts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ramp_tok_8zUrA06MpQMeZzM2RHJrB6CgY7Ky46vJXdwavM8bHa`, // Replace with actual API key
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Ramp API Error Response:", errorText);
      return new Response(
        JSON.stringify({ message: "Failed to delete GL account", error: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ GL Account Deleted Successfully");
    return new Response(JSON.stringify({ message: "GL Account deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error processing DELETE request:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ✅ Ensure PATCH function starts **AFTER** DELETE is properly closed
export async function PATCH(req: Request, context: { params: { id: string } }) {
  try {
    // ✅ Ensure params is awaited properly
    const params = await context.params;
    const { id } = params; // Now `id` is correctly extracted

    const body = await req.json();
    console.log(`🔄 Preparing PATCH request for GL Account ${id}:`, body);

    // ✅ Ensure ramp_id is present (Use `id` from params)
    if (!id) {
      console.error("❌ Error: Ramp UUID (ramp_id) is required for PATCH requests.");
      return new Response(JSON.stringify({ message: "Ramp ID is required for updating GL accounts." }), { status: 400 });
    }

    // ✅ Construct the Payload
    const payload = {
      reactivate: body.reactivate || undefined, // Reactivation flag
    };

    console.log(`📤 Sending PATCH request to Ramp API for GL Account ${id}:`, JSON.stringify(payload, null, 2));

    const response = await fetch(`https://demo-api.ramp.com/developer/v1/accounting/accounts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ramp_tok_8zUrA06MpQMeZzM2RHJrB6CgY7Ky46vJXdwavM8bHa`, // Replace with actual API key
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Ramp API Error Response:", errorText);
      return new Response(
        JSON.stringify({ message: "Failed to update GL account", error: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("✅ GL Account Reactivated Successfully:", data);

    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("❌ Error processing PATCH request:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
