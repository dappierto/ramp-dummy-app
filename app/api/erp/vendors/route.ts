// app/api/erp/vendors/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: [
        { is_active: 'desc' },
        { name: 'asc' }
      ]
    });
    
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Vendor name is required' },
        { status: 400 }
      );
    }
    
    // Create new vendor in the database
    const newVendor = await prisma.vendor.create({
      data: {
        name: data.name,
        erp_id: data.erp_id || null,
        ramp_vendor_id: data.ramp_vendor_id || null,
        ramp_accounting_id: data.ramp_accounting_id || null,
        ramp_vendor_contact_id: data.ramp_vendor_contact_id || null,
        tax_id: data.tax_id || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zip_code || null,
        country: data.country || null,
        payment_method: data.payment_method || null,
        bank_account: data.bank_account || null,
        routing_number: data.routing_number || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
      }
    });
    
    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' }, 
      { status: 500 }
    );
  }
}