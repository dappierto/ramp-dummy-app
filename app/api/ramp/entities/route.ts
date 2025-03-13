import { NextRequest, NextResponse } from "next/server";
import { TokenManager } from "@/app/lib/tokens/tokenManager";

const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/entities"; // Ramp Entities API

export async function GET() {
  try {
    // Get token
    const token = await TokenManager.getInstance().getToken('entities:read');
    if (!token) {
      throw new Error("Failed to get authentication token");
    }

    // Fetch All Ramp Entities
    const response = await fetch(RAMP_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Ramp API Fetch Error:", errorText);
      return NextResponse.json({ error: "Failed to fetch entities from Ramp", details: errorText }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result.data || [], { status: 200 });

  } catch (error) {
    console.error("❌ Error fetching Ramp entities:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 