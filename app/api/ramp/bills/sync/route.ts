// app/api/erp/sync-bill/route.ts
import { getActiveAccountToken } from "@/app/lib/ramp";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/bills";

export async function POST(request: NextRequest) {
  let token;
  
  try {
    // Get token first, handle any errors
    token = await getActiveAccountToken();
    if (!token) {
      console.error("🔑 Authentication Error: Failed to get active account token");
      return NextResponse.json({ 
        error: "Failed to get active account token" 
      }, { status: 401 });
    }
    
    // Parse request body with error handling
    const body = await request.json().catch(e => {
      console.error("📄 Request Parsing Error:", e);
      return null;
    });
    
    if (!body || !body.billId) {
      console.error("📄 Invalid Request:", body);
      return NextResponse.json({ 
        error: "Invalid request: Bill ID is required" 
      }, { status: 400 });
    }
    
    const { billId } = body;
    
    console.log(`🚀 Starting Bill Sync to Ramp for ID: ${billId}`);
    
    // Find the bill with error handling
    const unsyncedBill = await prisma.bills.findFirst({
      where: {
        id: billId,
        ramp_bill_id: null
      },
      include: {
        line_items: true,
      },
    });

    if (!unsyncedBill) {
      console.log("🔍 No unsyncable bill found:", billId);
      return NextResponse.json({ 
        message: "No bill found to sync or bill already synced." 
      }, { status: 404 });
    }

    console.log("📋 Found bill to sync:", JSON.stringify(unsyncedBill, null, 2));

    // Prepare line items with careful null/undefined checking
    const regularLineItems = unsyncedBill.line_items
      .filter(item => item.line_type === "Expense")
      .map(item => ({
        accounting_field_selections: [{
          field_external_id: "Category",
          field_option_external_id: item.category_id || item.gl_account_id || item.field_option_id || "default_category"
        }],
        amount: item.total_amount,
        memo: item.description || ""
      }));

    const inventoryLineItems = unsyncedBill.line_items
      .filter(item => item.line_type === "Item")
      .map(item => ({
        accounting_field_selections: [],
        unit_price: item.unit_price,
        unit_quantity: item.quantity,
        memo: item.description || ""
      }));

    // Prepare payload with all required fields and fallbacks
    const payload = {
      invoice_number: unsyncedBill.invoice_number,
      invoice_currency: unsyncedBill.invoice_currency || "USD",
      payment_method: unsyncedBill.payment_method,
      entity_id: unsyncedBill.ramp_entity_id || "",
      vendor_id: unsyncedBill.vendor_id,
      vendor_contact_id: unsyncedBill.vendor_contact_id || "",
      due_at: unsyncedBill.due_date.toISOString().split("T")[0],
      issued_at: unsyncedBill.issue_date.toISOString().split("T")[0],
      line_items: regularLineItems.length > 0 ? regularLineItems : [],
      inventory_line_items: inventoryLineItems.length > 0 ? inventoryLineItems : [],
      accounting_field_selections: [],
      memo: unsyncedBill.memo || "",
    };

    // Log the payload in multiple formats for better debugging
    console.log("📤 PAYLOAD PREVIEW - BEGIN");
    console.log("============================================");
    console.log("📤 Formatted JSON Payload:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("============================================");
    console.log("📤 Compact JSON Payload:");
    console.log(JSON.stringify(payload));
    console.log("============================================");
    console.log("📤 Raw Object Payload:");
    console.log(payload);
    console.log("============================================");
    console.log("📤 Object Keys:");
    console.log(Object.keys(payload));
    console.log("============================================");
    console.log("📤 Line Items Count:", payload.line_items.length);
    console.log("📤 Inventory Items Count:", payload.inventory_line_items.length);
    console.log("📤 PAYLOAD PREVIEW - END");

    // Return the payload for preview if requested
    if (body.previewOnly) {
      return NextResponse.json({
        message: "Bill payload preview",
        payload: payload
      }, { status: 200 });
    }

    // Fetch with proper error handling
    try {
      console.log("🌐 About to make API request to:", RAMP_API_URL);
      
      const response = await fetch(RAMP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      console.log("🌐 API Response Status:", response.status, response.statusText);
      console.log("🌐 API Response Headers:", Object.fromEntries(response.headers.entries()));
      
      // First handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("🌐 Non-JSON response received:", text);
        return NextResponse.json({
          error: "Received non-JSON response from Ramp API",
          details: text.substring(0, 500), // Include first 500 chars of response
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }, { status: 500 });
      }
      
      const result = await response.json();
      console.log("🌐 API Response Body:", result);

      if (!response.ok) {
        console.error("❌ Ramp API Sync Error:", result);
        return NextResponse.json({
          error: "Failed to sync with Ramp",
          details: result,
          status: response.status,
          statusText: response.statusText
        }, { status: response.status });
      }

      console.log(`✅ Bill ${payload.invoice_number} successfully synced to Ramp.`);

      // Update bill with success
      await prisma.bills.update({
        where: { id: unsyncedBill.id },
        data: { ramp_bill_id: result.id },
      });

      return NextResponse.json({
        message: "Bill synced successfully",
        synced_bill: result
      }, { status: 201 });
    } catch (fetchError) {
      console.error("🌐 Fetch error:", fetchError);
      return NextResponse.json({
        error: "Error fetching from Ramp API",
        details: fetchError instanceof Error ? fetchError.message : String(fetchError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("❌ Error syncing Bill to Ramp:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}