import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entity_name } = body;

    if (!entity_name) {
      return NextResponse.json({ error: "Entity name is required" }, { status: 400 });
    }

    // Create new entity
    const entity = await prisma.entities.create({
      data: {
        entity_id: uuidv4(), // Generate a unique ID
        entity_name: entity_name,
        // ramp_entity_id will be null until synced
      },
    });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating entity:", error);
    return NextResponse.json(
      { error: "Failed to create entity" },
      { status: 500 }
    );
  }
} 