import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type EngagementWithRelations = Prisma.EngagementGetPayload<{
  include: {
    client: true;
    team_members: true;
  }
}>;

type TransformedEngagement = Omit<EngagementWithRelations, 'team_members'> & {
  project_team: string[];
};

export async function GET() {
  try {
    const engagements = await prisma.engagement.findMany({
      include: {
        client: true,
        team_members: true,
      },
    });

    // Transform the data to match the expected format
    const transformedEngagements = engagements.map(engagement => ({
      ...engagement,
      project_team: engagement.team_members.map(member => member.user_id),
    }));

    return NextResponse.json(transformedEngagements);
  } catch (error) {
    console.error("Error fetching engagements:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagements" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const engagement = await prisma.engagement.create({
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
    });

    // Transform the data to match the expected format
    const transformedEngagement = {
      ...engagement,
      project_team: engagement.team_members.map(member => member.user_id),
    };

    return NextResponse.json(transformedEngagement);
  } catch (error) {
    console.error("Error creating engagement:", error);
    return NextResponse.json(
      { error: "Failed to create engagement" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Engagement ID is required' },
        { status: 400 }
      );
    }

    // Update the engagement and team members
    const engagement = await prisma.$transaction(async (tx) => {
      // Delete existing team members
      await tx.projectTeamMember.deleteMany({
        where: { engagement_id: body.id }
      });

      // Update engagement and create new team members
      return tx.engagement.update({
        where: { id: body.id },
        data: {
          name: body.name,
          client_id: body.client_id,
          engagement_manager: body.engagement_manager,
          engagement_director: body.engagement_director,
          start_date: body.start_date ? new Date(body.start_date) : undefined,
          end_date: body.end_date ? new Date(body.end_date) : null,
          status: body.status,
          team_members: {
            create: body.project_team.map((userId: string) => ({
              user_id: userId
            }))
          }
        },
        include: {
          client: true,
          team_members: true
        }
      });
    });

    // Transform the response to match the expected format
    const transformedEngagement: TransformedEngagement = {
      ...engagement,
      project_team: engagement.team_members.map(member => member.user_id)
    };

    return NextResponse.json(transformedEngagement);
  } catch (error) {
    console.error('Error updating engagement:', error);
    return NextResponse.json(
      { error: 'Failed to update engagement' },
      { status: 500 }
    );
  }
} 