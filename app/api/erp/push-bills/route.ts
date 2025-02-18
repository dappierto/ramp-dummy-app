import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.invoice_number || !body.ramp_vendor_id || !body.due_date || !body.line_items) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newBill = await prisma.bills.create({
      data: {
        invoice_number: body.invoice_number,
        invoice_currency: body.invoice_currency || "USD",
        memo:body.memo,
        payment_method: body.payment_method || "ACH",
        vendor_contact_id: body.ramp_vendor_contact_id || "",
        vendor_id: body.ramp_vendor_id,
        ramp_entity_id: body.ramp_entity_id,
        due_date: new Date(body.due_date),
        issue_date: new Date(body.issue_date),
        line_items: {
          create: body.line_items.map((item: any) => ({
            category_id: item.category_id,
            description: item.description,
            line_type: item.line_type,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
          })),
        },
      },
      include: {
        line_items: true,
      },
    });

    console.log("✅ Bill successfully stored in ERP:", newBill);
    return NextResponse.json({ message: "Bill created successfully", bill: newBill }, { status: 201 });

  } catch (error) {
    console.error("❌ Error storing bill in ERP:", error);
    return NextResponse.json({ error: "Failed to create bill", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}