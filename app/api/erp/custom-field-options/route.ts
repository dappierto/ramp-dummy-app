import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const fieldId = req.nextUrl.searchParams.get("field_id");
    if (!fieldId) {
      return NextResponse.json({ error: "Missing field_id parameter" }, { status: 400 });
    }

    const fieldOptions = await prisma.customFieldsOptions.findMany({
      where: { field_id: fieldId },
    });

    return NextResponse.json(fieldOptions, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching Custom Field Options:", error);
    return NextResponse.json({ error: "Failed to fetch Custom Field Options" }, { status: 500 });
  }
}
