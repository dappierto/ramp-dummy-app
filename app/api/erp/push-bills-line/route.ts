import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.invoice_number || !body.ramp_vendor_id || !body.due_date || !body.line_items) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create multiple bill line items in a transaction
    const billLines = await prisma.$transaction(
      body.line_items.map((item: any) => 
        prisma.billLineItem.create({
          data: {
            id: `${body.invoice_number}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for each line
            bill_id: body.invoice_number,
            description: item.description,
            line_type: item.line_type,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
            gl_account_id: item.category_id,
          },
        })
      )
    );

    console.log("✅ Bill lines successfully stored in ERP:", billLines);
    return NextResponse.json({ 
      message: "Bill lines created successfully", 
      billLines 
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error storing bill lines in ERP:", error);
    return NextResponse.json({ 
      error: "Failed to create bill lines", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}