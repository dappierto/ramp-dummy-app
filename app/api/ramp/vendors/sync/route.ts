import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/vendors"; // Ramp Vendors API

export async function GET() {
  try {
    console.log("🚀 Fetching Ramp Vendors & Associating with ERP Vendors...");

    // **Fetch All Ramp Vendors**
    const response = await fetch(RAMP_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ramp_tok_UfFJbYxa1wIEJTKZC1kzMfq5Ki8xUz8m8XkIsQlGxH`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("❌ Ramp API Fetch Error:", result);
      return NextResponse.json({ error: "Failed to fetch vendors from Ramp", details: result }, { status: 500 });
    }

    console.log("📥 Fetched Ramp Vendors:", JSON.stringify(result, null, 2));

    // **Filter Only Vendors That Have `accounting_vendor_remote_id`**
    const vendorsToUpdate = result.data.filter((vendor: any) => vendor.accounting_vendor_remote_id);

    if (vendorsToUpdate.length === 0) {
      console.log("✅ No vendors to update.");
      return NextResponse.json({ message: "No vendors to update." }, { status: 200 });
    }

    console.log("🔄 Matching Ramp Vendors to ERP Vendors...");

    // **Update ERP Vendors**
    const updatePromises = vendorsToUpdate.map(async (vendor: any) => {
      console.log(`🔄 Updating Vendor: ${vendor.name} | ERP ID: ${vendor.accounting_vendor_remote_id}`);

      return prisma.vendor.updateMany({
        where: { id: vendor.accounting_vendor_remote_id },
        data: {
          ramp_vendor_id :vendor.id,
          ramp_vendor_contact_id : vendor.vendor_owner_id,
          country : vendor.country,
          state : vendor.state
        },
      });
    });

    // Execute Updates
    await Promise.all(updatePromises);

    console.log("✅ Vendor Sync Complete!");

    return NextResponse.json({
      message: "Vendors updated successfully",
      updated_vendors: vendorsToUpdate,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error fetching & updating Ramp Vendors:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
