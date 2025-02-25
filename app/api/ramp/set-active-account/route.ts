// app/api/ramp/set-active-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { setActiveAccountId } from "@/app/lib/ramp";

export async function POST(request: NextRequest) {
  try {
    const { businessId } = await request.json();
    await setActiveAccountId(businessId);
    
    return NextResponse.json({ 
      success: true, 
      activeAccountId: businessId 
    });
  } catch (error) {
    console.error('Error setting active account:', error);
    return NextResponse.json({ 
      error: 'Failed to set active account' 
    }, { status: 500 });
  }
}