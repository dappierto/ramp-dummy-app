import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/accounting/fields";
const RAMP_API_KEY = process.env.RAMP_API_KEY || "ramp_tok_1N7UxXdLhF0tEXDN1L2cvqCGDphAYu0bPppRN7ZjJm"; // Ensure you set this in your env

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Starting Custom Fields Sync...");

    // Fetch all Custom Fields that have not been synced (i.e., ramp_id is null)
    const unsyncedFields = await prisma.customFields.findMany({
      where: { ramp_id: null }, // Only sync fields without a ramp_id
    });

    if (unsyncedFields.length === 0) {
      console.log("ℹ️ No new Custom Fields to sync.");
      return NextResponse.json({ message: "No new Custom Fields to sync." }, { status: 200 });
    }

    const syncResults = [];

    for (const field of unsyncedFields) {
      const payload = {
        id: field.id,
        name: field.name,
        input_type: field.input_type,
        is_splittable: field.is_splittable === "true",
      };

      console.log(`🔄 Syncing field to Ramp: ${JSON.stringify(payload, null, 2)}`);

      // Send request to Ramp API
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
        console.error(`❌ Ramp API Sync Error for field ${field.id}: ${response.statusText}`, result);
        syncResults.push({ fieldId: field.id, success: false, error: result });
        continue; // Skip updating database on failure
      }

      console.log(`✅ Successfully synced field ${field.id} to Ramp.`);

      // Store returned `ramp_id` in our database
      await prisma.customFields.update({
        where: { id: field.id },
        data: { ramp_id: result.ramp_id }, // Assign Ramp ID
      });

      syncResults.push({ fieldId: field.id, success: true, rampId: result.ramp_id });
    }

    return NextResponse.json({
      message: "Custom Fields sync completed",
      results: syncResults,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error syncing Custom Fields to Ramp:", error);
    return NextResponse.json({ error: "Failed to sync Custom Fields" }, { status: 500 });
  }
}
