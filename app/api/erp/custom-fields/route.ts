import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    console.log("📊 Fetching ERP Custom Fields...");
    
    const customFields = await prisma.customFields.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`✅ Successfully retrieved ${customFields.length} custom fields from ERP database`);
    
    // Return a more structured response
    return NextResponse.json({
      success: true,
      count: customFields.length,
      data: customFields
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching ERP Custom Fields:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch ERP Custom Fields",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📝 Creating new ERP Custom Field:", body);
    
    // Validate required fields
    if (!body.name || !body.input_type) {
      console.warn("⚠️ Validation failed: Missing required fields");
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: "Name and input_type are required fields"
      }, { status: 400 });
    }
    
    // Validate input_type matches allowed values
    if (!['BOOLEAN', 'FREE_FORM_TEXT', 'SINGLE_CHOICE'].includes(body.input_type)) {
      console.warn(`⚠️ Validation failed: Invalid input_type '${body.input_type}'`);
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: `Invalid input_type: ${body.input_type}. Must be one of: BOOLEAN, FREE_FORM_TEXT, SINGLE_CHOICE`
      }, { status: 400 });
    }

    // Create new custom field
    const newField = await prisma.customFields.create({
      data: {
        name: body.name,
        input_type: body.input_type,
        is_splittable: body.is_splittable ? "true" : "false",
        is_active: body.is_active
      }
    });

    console.log(`✅ Successfully created new custom field: ${newField.name} (${newField.id})`);
    
    return NextResponse.json({
      success: true,
      message: "Custom field created successfully",
      data: newField
    }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating custom field:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create custom field",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
