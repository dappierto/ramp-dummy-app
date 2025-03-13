import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ProjectTeamMember = {
  user_id: string;
  engagement_id: string;
};

type EngagementWithRelations = {
  id: string;
  name: string;
  client_id: string;
  client: {
    id: string;
    name: string;
    industry: string | null;
    status: string;
    client_owner: string;
  };
  engagement_manager: string;
  engagement_director: string;
  start_date: Date;
  end_date: Date | null;
  status: string;
  team_members: ProjectTeamMember[];
};

type TransformedEngagement = Omit<EngagementWithRelations, 'team_members'> & {
  project_team: string[];
};

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const engagement = await prisma.engagement.findUnique({
      where: { id },
      include: {
        client: true,
        team_members: true,
      },
    }) as EngagementWithRelations | null;

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedEngagement: TransformedEngagement = {
      ...engagement,
      project_team: engagement.team_members.map((member: ProjectTeamMember) => member.user_id),
    };

    return NextResponse.json(transformedEngagement);
  } catch (error) {
    console.error("Error fetching engagement:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const data = await request.json();
    const {
      name,
      client_id,
      engagement_manager,
      engagement_director,
      project_team,
      start_date,
      end_date,
      status,
    } = data;

    // Delete existing team members
    await prisma.projectTeamMember.deleteMany({
      where: { engagement_id: id },
    });

    // Update engagement and create new team members
    const updatedEngagement = await prisma.engagement.update({
      where: { id },
      data: {
        name,
        client_id,
        engagement_manager,
        engagement_director,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        status,
        team_members: {
          create: project_team.map((userId: string) => ({
            user_id: userId,
          })),
        },
      },
      include: {
        client: true,
        team_members: true,
      },
    }) as EngagementWithRelations;

    // Transform the data to match the expected format
    const transformedEngagement: TransformedEngagement = {
      ...updatedEngagement,
      project_team: updatedEngagement.team_members.map(
        (member: ProjectTeamMember) => member.user_id
      ),
    };

    return NextResponse.json(transformedEngagement);
  } catch (error) {
    console.error("Error updating engagement:", error);
    return NextResponse.json(
      { error: "Failed to update engagement" },
      { status: 500 }
    );
  }
} 