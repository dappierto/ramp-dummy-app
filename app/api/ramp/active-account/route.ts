// app/api/ramp/active-account/route.ts
import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const activeAccount = await prisma.activeAccount.findUnique({
      where: { id: 'active' }
    });

    if (!activeAccount) {
      return NextResponse.json({ businessId: null });
    }

    const connection = await prisma.rampConnection.findUnique({
      where: { businessId: activeAccount.businessId }
    });

    if (!connection) {
      return NextResponse.json({ businessId: null });
    }

    return NextResponse.json({
      businessId: activeAccount.businessId,
      businessName: connection.businessName,
      accessToken: connection.accessToken
    });
  } catch (error) {
    console.error('Failed to get active account:', error);
    return NextResponse.json({ error: 'Failed to get active account' }, { status: 500 });
  }
}