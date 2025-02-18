import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Starting Custom Field Options Sync...");

    // Fetch all unsynced field options (ramp_field_id is NULL)
    const fieldOptions = await prisma.customFieldsOptions.findMany({
      where: { ramp_field_id: null },
    });

    console.log("🛠 Retrieved field options from DB:", JSON.stringify(fieldOptions, null, 2));

    if (!fieldOptions || fieldOptions.length === 0) {
      console.warn("⚠️ No new field options to sync.");
      return NextResponse.json({ message: "No new field options to sync." }, { status: 200 });
    }

    const responses = [];

    for (const option of fieldOptions) {
      // Fetch the corresponding field's `ramp_id` from CustomFields
      const relatedField = await prisma.customFields.findUnique({
        where: { id: option.field_id },
      });

      console.log(`🔍 Checking related field for option ${option.id}:`, relatedField);

      if (!relatedField || !relatedField.ramp_id) {
        console.warn(`⚠️ Skipping option ${option.id}, missing related Ramp field.`);
        continue; // Skip this option if no valid Ramp field ID exists
      }

      const rampFieldId = relatedField.ramp_id;

      console.log(`✅ Found Ramp Field ID: ${rampFieldId} for option ${option.id}`);

      // **Build the payload**
      const payload = {
        field_id: rampFieldId, // Ramp field ID
        options: [
          {
            id: option.id,
            value: option.value,
          },
        ],
      };

      console.log("📤 Final Payload to Ramp API:", JSON.stringify(payload, null, 2));

      // **Validation Step Before Sending**
      if (
        !payload.field_id || 
        typeof payload.field_id !== "string" || 
        !Array.isArray(payload.options) || 
        payload.options.length === 0
      ) {
        console.error("❌ Invalid payload detected:", payload);
        continue; // Skip this iteration
      }

      // **Send Request to Ramp API**
      const response = await fetch("https://demo-api.ramp.com/developer/v1/accounting/field-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ramp_tok_1N7UxXdLhF0tEXDN1L2cvqCGDphAYu0bPppRN7ZjJm`, // Replace with actual API key
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      console.log("📥 Response from Ramp API:", result);

      if (!response.ok) {
        console.error(`❌ Ramp API Sync Error: ${response.statusText} -`, result);
        responses.push({ optionId: option.id, success: false, error: result });
        continue;
      }

      console.log(`✅ Successfully synced option ${option.id} to Ramp.`);

      const uploadedOptions = result.options || []; // Ensure response structure is correct

      for (const uploadedOption of uploadedOptions) {
        await prisma.customFieldsOptions.update({
          where: { id: uploadedOption.id }, // Match by our local option ID
          data: { ramp_field_id: uploadedOption.ramp_id }, // ✅ Correctly store the new Ramp-assigned ID
        });
      }

      responses.push({ optionId: option.id, success: true });
    }

    return NextResponse.json({
      message: "Custom Field Options sync completed",
      results: responses,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error syncing Custom Field Options to Ramp:", error);
    return NextResponse.json({ error: "Failed to sync Custom Field Options" }, { status: 500 });
  }
}
