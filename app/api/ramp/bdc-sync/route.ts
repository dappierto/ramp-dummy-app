// app/api/ramp/bdc-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getActiveAccountToken } from '@/app/lib/ramp';

const RAMP_API_URL = 'https://demo-api.ramp.com/developer/v1/vendors';

export async function POST(request: NextRequest) {
  try {
    const token = await getActiveAccountToken();
    
    // Log token info for debugging (only partial for security)
    if (token) {
      console.log(`Token available: ${token.substring(0, 10)}...`);
    } else {
      console.log('No token available');
    }
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No active Ramp account token found' 
      }, { status: 401 });
    }
    
    const vendorData = await request.json();
    
    // Validate required fields
    if (!vendorData.name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }
    
    if (!vendorData.vendor_owner_id) {
      return NextResponse.json({ error: 'Vendor owner ID is required' }, { status: 400 });
    }
    
    console.log('Making request to Ramp API with payload:', JSON.stringify(vendorData));
    
    // Make the request to Ramp API
    const response = await fetch(RAMP_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(vendorData)
    });
    
    console.log(`Ramp API response status: ${response.status}`);
    
    // Get response as text first to avoid JSON parse errors
    const responseText = await response.text();
    console.log(`Ramp API response text: ${responseText}`);
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // If we can't parse as JSON, return the text
      return NextResponse.json({
        error: 'Failed to parse Ramp API response',
        response: responseText,
        status: response.status
      }, { status: 500 });
    }
    
    // Check if response was successful
    if (!response.ok) {
      return NextResponse.json({
        error: 'Error from Ramp API',
        details: result,
        status: response.status
      }, { status: response.status });
    }
    
    // Return success response
    return NextResponse.json({
      message: 'Vendor created successfully',
      vendor: result
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating vendor in Ramp:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create vendor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}