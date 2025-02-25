// app/api/erp/bills/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all bills with related vendor and entity info
    const bills = await prisma.bills.findMany({
      include: {
        line_items: true,
      },
      orderBy: {
        issue_date: 'desc',
      },
    });

    // Fetch vendors and entities separately for lookup
    const vendors = await prisma.vendor.findMany();
    const entities = await prisma.entities.findMany();

    // Create lookup maps
    const vendorMap = new Map(vendors.map(v => [v.ramp_vendor_id, v]));
    const entityMap = new Map(entities.map(e => [e.ramp_entity_id, e]));

    // Calculate total amount and add vendor/entity names
    const processedBills = bills.map(bill => {
      const totalAmount = bill.line_items.reduce(
        (sum, item) => sum + item.total_amount, 
        0
      );

      // Look up the vendor and entity
      const vendor = vendorMap.get(bill.vendor_id);
      const entity = entityMap.get(bill.ramp_entity_id || '');

      return {
        ...bill,
        due_date: bill.due_date.toISOString(),
        issue_date: bill.issue_date.toISOString(),
        total_amount: totalAmount,
        vendor_name: vendor?.name || "Unknown Vendor",
        entity_name: entity?.entity_name || "Unknown Entity",
      };
    });

    return NextResponse.json(processedBills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" }, 
      { status: 500 }
    );
  }
}