import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getActiveAccountToken } from "@/app/lib/ramp";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/accounting/fields";

export async function POST(req: NextRequest) {
  const token = await getActiveAccountToken();
  try {
    console.log("🚀 Starting Custom Fields Sync...");

    // Fetch all Custom Fields that have not been synced (i.e., ramp_id is null)
    const unsyncedFields = await prisma.customFields.findMany({
      where: { ramp_id: null }, // Only sync fields without a ramp_id
    });

    if (unsyncedFields.length === 0) {
      console.log("ℹ️ No new Custom Fields to sync.");
      return NextResponse.json({ 
        message: "No new Custom Fields to sync.",
        results: []
      }, { status: 200 });
    }

    console.log(`Found ${unsyncedFields.length} unsynced fields to process`);
    const syncResults = [];
    const rawRampResponses = [];

    for (const field of unsyncedFields) {
      // Ensure input_type matches Ramp's expected values
      // Ramp API expects: BOOLEAN, FREE_FORM_TEXT, SINGLE_CHOICE
      const inputType = field.input_type;
      
      // Validate input type before sending to Ramp
      if (!['BOOLEAN', 'FREE_FORM_TEXT', 'SINGLE_CHOICE'].includes(inputType)) {
        console.error(`❌ Invalid input_type for field ${field.id}: ${inputType}`);
        syncResults.push({ 
          fieldId: field.id, 
          success: false, 
          error: { message: `Invalid input_type: ${inputType}. Must be one of: BOOLEAN, FREE_FORM_TEXT, SINGLE_CHOICE` } 
        });
        continue; // Skip this field
      }

      // Format the payload according to Ramp API requirements
      // Required fields: id, name, input_type, is_splittable
      const payload = {
        id: field.id,
        name: field.name,
        input_type: inputType,
        is_splittable: field.is_splittable === "true"
      };

      // Log the exact payload being sent to Ramp API
      console.log(`🔄 Syncing field to Ramp - ACTUAL PAYLOAD SENT: ${JSON.stringify(payload, null, 2)}`);

      // Send request to Ramp API
      const response = await fetch(RAMP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Log the raw response status
      console.log(`Ramp API Response Status: ${response.status} ${response.statusText}`);
      
      const result = await response.json();
      console.log(`Ramp API Raw Response: ${JSON.stringify(result, null, 2)}`);
      
      // Store the raw response for returning to the client
      rawRampResponses.push(result);

      if (!response.ok) {
        console.error(`❌ Ramp API Sync Error for field ${field.id}: ${response.statusText}`, result);
        syncResults.push({ 
          fieldId: field.id, 
          success: false, 
          error: result 
        });
        continue; // Skip updating database on failure
      }

      console.log(`✅ Successfully synced field ${field.id} to Ramp.`);

      // Store returned Ramp ID in our database
      // The Ramp API returns the ramp_id in the response
      const rampId = result.ramp_id;
      
      if (!rampId) {
        console.error(`❌ No Ramp ID returned for field ${field.id}`);
        syncResults.push({ 
          fieldId: field.id, 
          success: false, 
          error: { message: "No Ramp ID returned in response" } 
        });
        continue;
      }
      
      await prisma.customFields.update({
        where: { id: field.id },
        data: { ramp_id: rampId }
      });

      syncResults.push({ 
        fieldId: field.id, 
        success: true, 
        rampId: rampId 
      });
    }

    return NextResponse.json({
      message: "Custom Fields sync completed",
      results: syncResults,
      rawRampResponses: rawRampResponses
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error syncing Custom Fields to Ramp:", error);
    return NextResponse.json({ 
      error: "Failed to sync Custom Fields",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
