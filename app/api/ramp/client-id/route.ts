// app/api/ramp/client-id/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.RAMP_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Client ID not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    clientId: process.env.RAMP_CLIENT_ID 
  });
}