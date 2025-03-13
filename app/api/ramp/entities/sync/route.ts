import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { TokenManager } from "@/app/lib/tokens/tokenManager";

const prisma = new PrismaClient();
const RAMP_API_URL = "https://demo-api.ramp.com/developer/v1/entities"; // Ramp Entities API

export async function GET() {
  try {
    console.log("🚀 Fetching Ramp Entities & Associating with ERP Entities...");

    // Get token
    const token = await TokenManager.getInstance().getToken('entities:read');
    if (!token) {
      throw new Error("Failed to get authentication token");
    }

    // **Fetch All Ramp Entities**
    const response = await fetch(RAMP_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Ramp API Fetch Error:", errorText);
      return NextResponse.json({ error: "Failed to fetch entities from Ramp", details: errorText }, { status: response.status });
    }

    const result = await response.json();
    console.log("📥 Fetched Ramp Entities:", JSON.stringify(result, null, 2));

    // **Get ERP Entities (Entities Table)**
    const erpEntities = await prisma.entities.findMany({
      select: { entity_id: true, entity_name: true, ramp_entity_id: true },
    });

    console.log("📥 Fetched ERP Entities:", JSON.stringify(erpEntities, null, 2));

    // **Filter Entities That Need Updating**
    const entitiesToUpdate = result.data.filter((rampEntity: any) =>
      erpEntities.some((erpEntity) => erpEntity.entity_name === rampEntity.entity_name && !erpEntity.ramp_entity_id)
    );

    if (entitiesToUpdate.length === 0) {
      console.log("✅ No new entities to update.");
      return NextResponse.json({ message: "No entities to update." }, { status: 200 });
    }

    console.log("🔄 Matching Ramp Entities to ERP Entities...");

    // **Update ERP Entities with Ramp ID**
    const updatePromises = entitiesToUpdate.map(async (rampEntity: any) => {
      console.log(`🔄 Updating Entity: ${rampEntity.name} | Ramp ID: ${rampEntity.id}`);

      return prisma.entities.updateMany({
        where: { entity_name: rampEntity.entity_name },
        data: {
          ramp_entity_id: rampEntity.id, // Assign Ramp Entity ID
        },
      });
    });

    // Execute Updates
    await Promise.all(updatePromises);

    console.log("✅ Entity Sync Complete!");

    return NextResponse.json({
      message: "Entities updated successfully",
      updated_entities: entitiesToUpdate,
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Error fetching & updating Ramp Entities:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
