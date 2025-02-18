import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const customFields = await prisma.vendor.findMany();
    return NextResponse.json(customFields, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching ERP Custom Fields:", error);
    return NextResponse.json({ error: "Failed to fetch ERP Custom Fields" }, { status: 500 });
  }
}
