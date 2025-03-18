import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    // Generate a random state value for security
    const state = randomBytes(16).toString('hex');

    // Store the state in a cookie for validation during callback
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });

    // Construct the OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.RAMP_CLIENT_ID!,
      redirect_uri: `${process.env.APP_URL}/connect/callback`,
      response_type: 'code',
      scope: 'read:transactions write:transactions',
      state,
    });

    const authUrl = `${process.env.RAMP_AUTH_URL}/authorize?${params}`;

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
} 