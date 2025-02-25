// app/api/ramp/tokens/init/route.ts
import { NextResponse } from "next/server";
import { TokenManager } from "@/app/lib/tokens/tokenManager";
import { RAMP_SCOPES } from "@/app/lib/tokens/scopes";

export async function POST() {
  try {
    const tokenManager = TokenManager.getInstance();
    const results = [];
    
    for (const scope of RAMP_SCOPES) {
      try {
        const token = await tokenManager.getToken(scope);
        results.push({ 
          scope, 
          success: true,
          token: token.substring(0, 10) + '...' // Only show part of the token for security
        });
        console.log(`✅ Generated token for ${scope}`);
      } catch (error) {
        results.push({ 
          scope, 
          success: false, 
          error: error.message 
        });
        console.error(`❌ Failed to generate token for ${scope}:`, error);
      }
    }
    
    return NextResponse.json({ 
      message: "Token initialization complete",
      results 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to initialize tokens",
      details: error.message 
    }, { status: 500 });
  }
}