import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const erpAccounts = await prisma.eRPAccount.findMany();
    return NextResponse.json(erpAccounts, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching ERP Accounts:", error);
    return NextResponse.json({ error: "Failed to fetch ERP Accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const newAccount = await prisma.eRPAccount.create({
      data: {
        id: uuidv4(),
        name: body.name,
        code: body.code || "",
        type: body.type.toUpperCase(), // Ensure type is uppercase
        is_active: true
      }
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating ERP Account:", error);
    return NextResponse.json({ error: "Failed to create ERP Account" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const accountId = url.pathname.split('/').pop();

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const updatedAccount = await prisma.eRPAccount.update({
      where: { id: accountId },
      data: {
        is_active: body.is_active
      }
    });

    return NextResponse.json(updatedAccount, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating ERP Account:", error);
    return NextResponse.json({ error: "Failed to update ERP Account" }, { status: 500 });
  }
}
