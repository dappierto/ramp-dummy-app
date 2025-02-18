import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const entities = await prisma.entities.findMany();
    return NextResponse.json(entities, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching entities:", error);
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
  }
}
