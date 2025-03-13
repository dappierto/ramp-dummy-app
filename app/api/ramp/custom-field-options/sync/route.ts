import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, CustomFields, CustomFieldsOptions } from "@prisma/client";
import { getActiveAccountToken } from "@/app/lib/ramp";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/accounting/field-options";

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Starting Custom Field Options Sync...");

    // Fetch all unsynced field options (where ramp_field_option_id is NULL)
    const fieldOptions = await prisma.$queryRaw<(CustomFieldsOptions & { field_ramp_id: string | null })[]>`
      SELECT o.*, f.ramp_id as field_ramp_id 
      FROM CustomFieldsOptions o
      JOIN CustomFields f ON o.field_id = f.id
      WHERE o.ramp_field_option_id IS NULL
    `;

    console.log("🛠 Retrieved field options from DB:", JSON.stringify(fieldOptions, null, 2));

    if (!fieldOptions || fieldOptions.length === 0) {
      console.warn("⚠️ No new field options to sync.");
      return NextResponse.json({ message: "No new field options to sync." }, { status: 200 });
    }

    const responses = [];

    // Group options by field_id to send them together
    const optionsByField = fieldOptions.reduce((acc, option) => {
      if (!acc[option.field_id]) {
        acc[option.field_id] = [];
      }
      acc[option.field_id].push(option);
      return acc;
    }, {} as { [key: string]: typeof fieldOptions });

    for (const [fieldId, options] of Object.entries(optionsByField)) {
      const firstOption = options[0];
      if (!firstOption.field_ramp_id) {
        console.warn(`⚠️ Skipping options for field ${fieldId}, missing Ramp field ID.`);
        continue;
      }

      // Build the payload exactly as shown in the Ramp API docs
      const payload = {
        field_id: firstOption.field_ramp_id,
        options: options.map(option => ({
          id: option.id,
          value: option.value,
        })),
      };

      console.log("📤 Final Payload to Ramp API:", JSON.stringify(payload, null, 2));

      // Validate payload
      if (!payload.field_id || !Array.isArray(payload.options) || payload.options.length === 0) {
        console.error("❌ Invalid payload detected:", payload);
        continue;
      }

      try {
        const token = await getActiveAccountToken();
        const response = await fetch(RAMP_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log("📥 Response from Ramp API:", JSON.stringify(result, null, 2));

        if (!response.ok) {
          console.error(`❌ Ramp API Sync Error: ${response.statusText} -`, result);
          responses.push(...options.map(opt => ({ 
            optionId: opt.id, 
            success: false, 
            error: result 
          })));
          continue;
        }

        console.log(`✅ Successfully synced options for field ${fieldId} to Ramp.`);

        // Update all options with their Ramp IDs
        const uploadedOptions = result.options || [];
        for (const uploadedOption of uploadedOptions) {
          const localOption = options.find(opt => opt.id === uploadedOption.id);
          if (localOption) {
            await prisma.customFieldsOptions.update({
              where: { id: localOption.id },
              data: { ramp_field_option_id: uploadedOption.ramp_id }
            });
            responses.push({ optionId: localOption.id, success: true });
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing options for field ${fieldId}:`, error);
        responses.push(...options.map(opt => ({ 
          optionId: opt.id, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })));
      }
    }

    return NextResponse.json({
      message: "Custom Field Options sync completed",
      results: responses,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error syncing Custom Field Options to Ramp:", error);
    return NextResponse.json({ 
      error: "Failed to sync Custom Field Options",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
