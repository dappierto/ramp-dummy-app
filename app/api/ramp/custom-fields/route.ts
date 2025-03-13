import { getActiveAccountToken } from "@/app/lib/ramp";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    console.log("Fetching Ramp Custom Fields...");
    
    const token = await getActiveAccountToken();
    
    const response = await fetch("https://demo-api.ramp.com/developer/v1/accounting/fields", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Ramp API Error:", response.status, response.statusText);
      return NextResponse.json({ error: `${response.status} ${response.statusText}` }, { status: response.status });
    }

    const jsonResponse = await response.json();
    console.log("Ramp API Raw Response:", jsonResponse);

    // Check if the response has a data property
    const fields = jsonResponse.data || jsonResponse;
    
    return NextResponse.json(fields, { status: 200 });
  } catch (error) {
    console.error("Error fetching Ramp Custom Fields:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
