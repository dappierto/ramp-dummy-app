// app/api/ramp/oauth/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RAMP_TOKEN_URL = "https://demo-api.ramp.com/developer/v1/token";
const RAMP_BUSINESS_URL = "https://demo-api.ramp.com/developer/v1/business";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirect_uri, grant_type, business_id } = body;
    
    console.log('Token request received:', { grant_type, business_id, has_code: !!code });
    
    if (!process.env.RAMP_CLIENT_ID || !process.env.RAMP_CLIENT_SECRET) {
      throw new Error('Missing Ramp credentials in environment variables');
    }

    const credentials = Buffer.from(
      `${process.env.RAMP_CLIENT_ID}:${process.env.RAMP_CLIENT_SECRET}`
    ).toString('base64');

    let tokenParams;
    
    // Handle different grant types
    if (grant_type === 'refresh_token') {
      // Refresh token flow
      if (!business_id) {
        return NextResponse.json({ error: 'Business ID is required for token refresh' }, { status: 400 });
      }
      
      // Get the refresh token from database
      const connection = await prisma.rampConnection.findFirst({
        where: { businessId: business_id }
      });
      
      if (!connection) {
        return NextResponse.json({ 
          error: 'Connection not found' 
        }, { status: 404 });
      }
      
      if (!connection.refreshToken) {
        return NextResponse.json({ 
          error: 'No refresh token available for this connection' 
        }, { status: 400 });
      }
      
      tokenParams = {
        'grant_type': 'refresh_token',
        'refresh_token': connection.refreshToken
      };
      
      console.log('Refreshing token for business:', business_id);
      
    } else {
      // Authorization code flow (default)
      if (!code || !redirect_uri) {
        return NextResponse.json({ 
          error: 'Code and redirect_uri are required for authorization code flow' 
        }, { status: 400 });
      }
      
      tokenParams = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri
      };
      
      console.log('Exchanging authorization code');
    }

    // Make the token request
    const tokenResponse = await fetch(RAMP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(tokenParams)
    });

    const responseText = await tokenResponse.text();
    console.log('Token response:', {
      status: tokenResponse.status,
      body: responseText
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ 
        error: `Token request failed with status ${tokenResponse.status}`,
        details: responseText
      }, { status: tokenResponse.status });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse token response as JSON:', e);
      return NextResponse.json({ 
        error: 'Invalid JSON response from token endpoint',
        raw_response: responseText
      }, { status: 500 });
    }

    if (!tokenData || !tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return NextResponse.json({ 
        error: 'No access token in response',
        response_data: tokenData
      }, { status: 500 });
    }

    // For refresh token flow, we don't need to fetch business info again
    let businessInfo = null;
    let connectionId = business_id;
    
    if (grant_type !== 'refresh_token') {
      // Get business info for new connections
      console.log('Fetching business info...');
      const businessResponse = await fetch(RAMP_BUSINESS_URL, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      const businessResponseText = await businessResponse.text();
      console.log('Business response:', {
        status: businessResponse.status,
        body: businessResponseText
      });

      try {
        businessInfo = businessResponseText ? JSON.parse(businessResponseText) : null;
        
        // Safely extract connection ID from token
        const tokenParts = tokenData.access_token.split('_');
        connectionId = tokenParts.length > 1 ? tokenParts.pop() : 'unknown';
        console.log('Extracted connection ID:', connectionId);
      } catch (e) {
        console.warn('Failed to parse business info:', e);
        connectionId = 'unknown-' + Date.now();
      }
    }

    // Calculate token expiry time
    const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour
    const expiryDate = new Date(Date.now() + (expiresIn * 1000));

    // Store or update the connection
    if (grant_type === 'refresh_token') {
      // Update existing connection
      await prisma.rampConnection.update({
        where: { businessId: business_id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || undefined, // Only update if provided
          tokenExpires: expiryDate,
          scopes: tokenData.scope || undefined, // Only update if provided
          updatedAt: new Date()
        }
      });
      
      console.log('Updated token for business:', business_id);
    } else {
      // Create or update connection for new auth flow
      await prisma.rampConnection.upsert({
        where: { 
          businessId: connectionId
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || '',
          tokenExpires: expiryDate,
          scopes: tokenData.scope,
          updatedAt: new Date()
        },
        create: {
          businessId: connectionId,
          businessName: businessInfo?.business_name_legal || 'Connected Account',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || '',
          tokenExpires: expiryDate,
          scopes: tokenData.scope
        }
      });
      
      console.log('Created/updated connection for business:', connectionId);
    }

    return NextResponse.json({
      success: true,
      token_type: tokenData.token_type,
      expires_in: expiresIn,
      expires_at: expiryDate.toISOString(),
      business: businessInfo
    });

  } catch (error) {
    console.error('Token operation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Token operation failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}