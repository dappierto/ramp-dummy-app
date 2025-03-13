import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const fieldId = req.nextUrl.searchParams.get("field_id");
    if (!fieldId) {
      return NextResponse.json({ error: "Missing field_id parameter" }, { status: 400 });
    }

    // Verify the field exists and is of type SINGLE_CHOICE
    const field = await prisma.customFields.findUnique({
      where: { id: fieldId }
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    if (field.input_type !== 'SINGLE_CHOICE') {
      return NextResponse.json({ 
        error: "Only SINGLE_CHOICE fields can have options" 
      }, { status: 400 });
    }

    const fieldOptions = await prisma.customFieldsOptions.findMany({
      where: { field_id: fieldId },
      orderBy: { value: 'asc' }
    });

    return NextResponse.json(fieldOptions, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching Custom Field Options:", error);
    return NextResponse.json({ 
      error: "Failed to fetch Custom Field Options",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { field_id, options } = body;

    if (!field_id || !options || !Array.isArray(options)) {
      return NextResponse.json({ 
        error: "Invalid request body. Required: field_id and options array" 
      }, { status: 400 });
    }

    // Verify the field exists and is of type SINGLE_CHOICE
    const field = await prisma.customFields.findUnique({
      where: { id: field_id }
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    if (field.input_type !== 'SINGLE_CHOICE') {
      return NextResponse.json({ 
        error: "Only SINGLE_CHOICE fields can have options" 
      }, { status: 400 });
    }

    // Get existing options for this field
    const existingOptions = await prisma.customFieldsOptions.findMany({
      where: { field_id }
    });

    // Delete unsynced options that are not in the new options list
    await prisma.customFieldsOptions.deleteMany({
      where: { 
        field_id,
        ramp_field_option_id: null,
        value: {
          notIn: options.map(opt => opt.value)
        }
      }
    });

    // Filter out options that already exist with the same value
    const newOptions = options.filter(opt => 
      !existingOptions.some(existing => 
        existing.value === opt.value
      )
    );

    if (newOptions.length > 0) {
      // Create only the new options
      await prisma.customFieldsOptions.createMany({
        data: newOptions.map(opt => ({
          field_id,
          value: opt.value,
          is_active: true
        }))
      });
    }

    // Fetch and return all options for this field
    const updatedOptions = await prisma.customFieldsOptions.findMany({
      where: { field_id },
      orderBy: { value: 'asc' }
    });

    return NextResponse.json({
      message: newOptions.length > 0 
        ? `Created ${newOptions.length} new options. ${existingOptions.length} options already existed.`
        : "All options already exist, no new options created.",
      options: updatedOptions
    }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating Custom Field Options:", error);
    return NextResponse.json({ 
      error: "Failed to create Custom Field Options",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
