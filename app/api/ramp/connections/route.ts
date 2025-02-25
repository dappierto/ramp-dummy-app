// app/api/ramp/connections/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET() {
  try {
    const connections = await prisma.rampConnection.findMany({
      select: {
        id: true,
        businessName: true,
        businessId: true,
        scopes: true,
        tokenExpires: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}