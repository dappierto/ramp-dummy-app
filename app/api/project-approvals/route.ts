import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveAccountToken } from "@/app/lib/ramp";
import { Prisma, Engagement, Client, ApprovalRule, projectApprover, EngagementApprovalRule } from '@prisma/client';

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type ProjectApprover = {
  id: string;
  engagement_id: string;
  user_id: string;
  approver_type: string;
  created_at: Date;
  updated_at: Date;
};

type EngagementWithRelations = Engagement & {
  client: Client;
  approvers: ProjectApprover[];
  project_rules: EngagementApprovalRule[];
};

export async function GET() {
  try {
    console.log('=== GET request started ===');
    
    // Get Ramp API token
    const token = await getActiveAccountToken();
    
    // Fetch all necessary data
    const [projects, globalRules, usersResponse] = await Promise.all([
      prisma.engagement.findMany({
        include: {
          client: true,
          approvers: true,
          project_rules: true
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.approvalRule.findMany({
        orderBy: {
          min_amount: 'asc'
        }
      }),
      fetch("https://demo-api.ramp.com/developer/v1/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    ]) as [EngagementWithRelations[], ApprovalRule[], Response];

    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`);
    }

    const usersData = await usersResponse.json();
    const users = usersData.data || [];

    console.log('Data fetched:');
    console.log('Projects:', JSON.stringify(projects, null, 2));
    console.log('Global Rules:', JSON.stringify(globalRules, null, 2));
    console.log('Users:', JSON.stringify(users, null, 2));

    // Function to find the appropriate approver based on amount
    const findApprover = (amount: number, project: EngagementWithRelations) => {
      console.log('=== findApprover called ===');
      console.log('Amount:', amount);
      console.log('Project:', JSON.stringify(project, null, 2));
      
      // First check project-specific rules
      const projectRule = project.project_rules.find(r => {
        const matches = amount >= r.min_amount && (!r.max_amount || amount <= r.max_amount);
        console.log('Project Rule check:', {
          min: r.min_amount,
          max: r.max_amount,
          type: r.approver_type,
          matches
        });
        return matches;
      });

      // If no project rule found, fall back to global rules
      const rule = projectRule || globalRules.find(r => {
        const matches = amount >= r.min_amount && (!r.max_amount || amount <= r.max_amount);
        console.log('Global Rule check:', {
          min: r.min_amount,
          max: r.max_amount,
          type: r.approver_type,
          matches
        });
        return matches;
      });

      if (!rule) {
        console.log('No matching rule found');
        return null;
      }

      console.log('Matching rule:', JSON.stringify(rule, null, 2));
      console.log('Rule is project-specific:', !!projectRule);

      console.log('Project details:', {
        manager: project.engagement_manager,
        director: project.engagement_director,
        client_owner: project.client?.client_owner
      });

      let approver = null;
      switch (rule.approver_type) {
        case 'manager':
          approver = users.find((u: User) => u.id === project.engagement_manager);
          console.log('Looking for manager:', {
            needed_id: project.engagement_manager,
            found: approver ? JSON.stringify(approver) : 'null'
          });
          break;
        case 'director':
          approver = users.find((u: User) => u.id === project.engagement_director);
          console.log('Looking for director:', {
            needed_id: project.engagement_director,
            found: approver ? JSON.stringify(approver) : 'null'
          });
          break;
        case 'client_owner':
          approver = users.find((u: User) => u.id === project.client?.client_owner);
          console.log('Looking for client owner:', {
            needed_id: project.client?.client_owner,
            found: approver ? JSON.stringify(approver) : 'null'
          });
          break;
      }

      console.log('Final approver:', approver ? JSON.stringify(approver) : 'null');
      console.log('=== findApprover end ===');
      return approver;
    };

    // Get unique thresholds from both global and project rules
    const projectRules = projects.flatMap(p => p.project_rules);
    const allRules = [...projectRules, ...globalRules];
    const thresholds = Array.from(new Set(allRules.map(r => r.min_amount))).sort((a, b) => a - b);
    console.log('Using thresholds:', thresholds);

    const projectApprovals = projects.map(project => ({
      id: project.id,
      name: project.name,
      client: project.client.name,
      approvals: thresholds.map(amount => {
        // Check project rules first
        const projectRule = project.project_rules.find(r => 
          amount >= r.min_amount && (!r.max_amount || amount <= r.max_amount)
        );
        
        // Fall back to global rules if no project rule found
        const rule = projectRule || globalRules.find(r => 
          amount >= r.min_amount && (!r.max_amount || amount <= r.max_amount)
        );

        return {
          amount,
          threshold: {
            min: rule?.min_amount || amount,
            max: rule?.max_amount || 'No Limit'
          },
          approver: findApprover(amount, project),
          rule,
          is_project_specific: !!projectRule
        };
      })
    }));

    return NextResponse.json(projectApprovals);
  } catch (error) {
    console.error('Failed to fetch project approvals:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to fetch project approvals' },
      { status: 500 }
    );
  }
}

// Add endpoint to manage project approvers
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate the data
    if (!data.engagement_id || !data.min_amount || !data.approver_type) {
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

    // Create or update the project rule
    const rule = await prisma.engagementApprovalRule.upsert({
      where: {
        engagement_id_min_amount_max_amount: {
          engagement_id: data.engagement_id,
          min_amount: parseFloat(data.min_amount),
          max_amount: data.max_amount ? parseFloat(data.max_amount) : null
        }
      },
      update: {
        approver_type: data.approver_type
      },
      create: {
        engagement_id: data.engagement_id,
        min_amount: parseFloat(data.min_amount),
        max_amount: data.max_amount ? parseFloat(data.max_amount) : null,
        approver_type: data.approver_type
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Failed to create/update project rule:', error);
    return NextResponse.json(
      { error: 'Failed to create/update project rule' },
      { status: 500 }
    );
  }
} 