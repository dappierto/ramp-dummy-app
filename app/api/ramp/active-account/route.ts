// app/api/ramp/active-account/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const activeAccount = await prisma.activeAccount.findUnique({
      where: { id: 'active' }
    });

    if (!activeAccount) {
      return NextResponse.json({ business: null });
    }

    const connection = await prisma.rampConnection.findUnique({
      where: { businessId: activeAccount.businessId }
    });

    if (!connection) {
      return NextResponse.json({ business: null });
    }

    return NextResponse.json({
      business: {
        businessName: connection.businessName,
        businessId: connection.businessId
      }
    });
  } catch (error) {
    console.error('Error getting active business:', error);
    return NextResponse.json({ 
      error: 'Failed to get active business' 
    }, { status: 500 });
  }
}