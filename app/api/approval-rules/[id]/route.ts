import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.approvalRule.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete approval rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete approval rule' },
      { status: 500 }
    );
  }
} 