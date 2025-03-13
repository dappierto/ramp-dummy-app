import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.approvalRule.findMany({
      orderBy: {
        min_amount: 'asc'
      }
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Failed to fetch approval rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate the data
    if (!data.min_amount || !data.approver_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate approver_type
    if (!['manager', 'director', 'client_owner'].includes(data.approver_type)) {
      return NextResponse.json(
        { error: 'Invalid approver type' },
        { status: 400 }
      );
    }

    // Create the rule
    const rule = await prisma.approvalRule.create({
      data: {
        min_amount: parseFloat(data.min_amount),
        max_amount: data.max_amount ? parseFloat(data.max_amount) : null,
        approver_type: data.approver_type,
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Failed to create approval rule:', error);
    return NextResponse.json(
      { error: 'Failed to create approval rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id || !data.min_amount || !data.approver_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate approver_type
    if (!['manager', 'director', 'client_owner'].includes(data.approver_type)) {
      return NextResponse.json(
        { error: 'Invalid approver type' },
        { status: 400 }
      );
    }

    const rule = await prisma.approvalRule.update({
      where: { id: data.id },
      data: {
        min_amount: parseFloat(data.min_amount),
        max_amount: data.max_amount ? parseFloat(data.max_amount) : null,
        approver_type: data.approver_type,
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Failed to update approval rule:', error);
    return NextResponse.json(
      { error: 'Failed to update approval rule' },
      { status: 500 }
    );
  }
} 