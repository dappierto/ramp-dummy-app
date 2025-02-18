import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/accounting/vendors";

export async function GET() {
  try {
    console.log("🚀 Starting ERP Vendor Sync to Ramp...");

    // Fetch all ERP vendors that have not yet been synced (ramp_vendor_id is NULL)
    const unsyncedVendors = await prisma.vendor.findMany({
      where: { ramp_accounting_id: null },
      select: { id: true, name: true }, // `id` represents ERP ID
    });

    if (unsyncedVendors.length === 0) {
      console.log("✅ No new ERP vendors to sync.");
      return NextResponse.json({ message: "No new vendors to sync." }, { status: 200 });
    }

    // Format payload for Ramp API
    const payload = {
      vendors: unsyncedVendors.map((vendor) => ({
        id: vendor.id, // Send ERP ID as reference
        name: vendor.name,
      })),
    };

    console.log("📤 Sending Payload to Ramp:", JSON.stringify(payload, null, 2));

    // Make the API request to Ramp
    const response = await fetch(RAMP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ramp_tok_uhNHVaTlfECLF1Z0krVrTLssMWN6rXmFUWJaF6JbXq`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Handle API errors
    if (!response.ok) {
      console.error("❌ Ramp API Sync Error:", result);
      return NextResponse.json({ error: "Failed to sync ERP Vendors to Ramp", details: result }, { status: 500 });
    }

    console.log("✅ Successfully synced vendors to Ramp. Updating database...");

    // Log full API response for debugging
    console.log("📥 Full Ramp API Response:", JSON.stringify(result, null, 2));

    // Extract the returned Ramp IDs and update the ERP vendor records
    const updatedVendors = result.vendors.map(async (vendor: any) => {
      if (!vendor.id || !vendor.ramp_id) {
        console.warn(`⚠️ Skipping vendor update due to missing fields:`, vendor);
        return null;
      }

      console.log(`🔄 Updating Vendor in DB: ERP ID ${vendor.id} → Ramp ID ${vendor.ramp_id}`);

      return prisma.vendor.update({
        where: { id: vendor.id }, // Match based on ERP ID (from API response)
        data: { ramp_accounting_id: vendor.ramp_id }, // Store Ramp ID properly
      });
    });

    // Execute all updates
    await Promise.all(updatedVendors);

    console.log("✅ ERP Vendor Table Updated with Ramp IDs.");

    return NextResponse.json({ message: "Vendors synced successfully", synced_vendors: result.vendors }, { status: 201 });

  } catch (error) {
    console.error("❌ Error syncing ERP Vendors to Ramp:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
