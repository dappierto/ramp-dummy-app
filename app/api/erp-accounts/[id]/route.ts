import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Handle PATCH requests to update account status
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is awaited before accessing id
    const { id: accountId } = await Promise.resolve(params);
    const body = await req.json();

    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Account ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the account in the database
    const updatedAccount = await prisma.eRPAccount.update({
      where: { id: accountId },
      data: body,
    });

    return new Response(JSON.stringify(updatedAccount), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to update GL account:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update GL account' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 