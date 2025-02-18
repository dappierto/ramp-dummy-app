import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/bills";
const RAMP_API_KEY = 'ramp_tok_qi9FjJYnMziVtn8KYZUS0dklliUFpnMKYS49GWJ6Ln';

export async function POST() {
  try {
    console.log("🚀 Starting Single Bill Sync to Ramp...");

    const unsyncedBill = await prisma.bills.findFirst({
      where: { 
        invoice_number: "INV008", // Replace with your test invoice number
        ramp_bill_id: null 
      },
      select: {
        id: true,
        invoice_number: true,
        invoice_currency: true,
        memo:true,
        payment_method: true,
        ramp_entity_id: true,
        vendor_id: true,
        vendor_contact_id: true,
        due_date: true,
        issue_date: true,
        line_items: true,
      },
    });

    if (!unsyncedBill) {
      console.log("✅ No bill found to sync.");
      return NextResponse.json({ message: "No bill found to sync." }, { status: 200 });
    }

    console.log("📋 Found bill to sync:", unsyncedBill);

    const regularLineItems = unsyncedBill.line_items
      .filter(item => item.line_type === "Expense")
      .map(item => ({
        accounting_field_selections: [],
        amount: item.total_amount,
        memo: item.description
      }));

    const inventoryLineItems = unsyncedBill.line_items
      .filter(item => item.line_type === "Item")
      .map(item => ({
        accounting_field_selections: [],
        unit_price: item.unit_price,
        unit_quantity: item.quantity,
        memo: item.description
      }));

    const payload = {
      invoice_number: unsyncedBill.invoice_number,
      invoice_currency: unsyncedBill.invoice_currency,
      payment_method: unsyncedBill.payment_method,
      entity_id: unsyncedBill.ramp_entity_id,
      vendor_id: unsyncedBill.vendor_id,
      vendor_contact_id: unsyncedBill.vendor_contact_id,
      due_at: unsyncedBill.due_date.toISOString().split("T")[0],
      issued_at: unsyncedBill.issue_date.toISOString().split("T")[0],
      line_items: regularLineItems,
      inventory_line_items: inventoryLineItems,
      accounting_field_selections: [],
      memo: unsyncedBill.memo,
      remote_id: null,
      posting_date: null,
    };

    console.log("📤 Sending Payload to Ramp:", JSON.stringify(payload, null, 2));

    const response = await fetch(RAMP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RAMP_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Ramp API Sync Error:", result);
      return NextResponse.json({ 
        error: "Failed to sync with Ramp", 
        details: result 
      }, { status: response.status });
    }

    console.log(`✅ Bill ${payload.invoice_number} successfully synced to Ramp.`);

    await prisma.bills.update({
      where: { id: unsyncedBill.id },
      data: { ramp_bill_id: result.id },
    });

    return NextResponse.json({ 
      message: "Bill synced successfully", 
      synced_bill: result 
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error syncing Bill to Ramp:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}