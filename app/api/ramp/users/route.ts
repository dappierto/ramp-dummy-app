import { getActiveAccountToken } from "@/app/lib/ramp";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getActiveAccountToken();
    
    const response = await fetch("https://demo-api.ramp.com/developer/v1/users", {
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
    const users = jsonResponse.data || [];
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching Ramp Users:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
} 