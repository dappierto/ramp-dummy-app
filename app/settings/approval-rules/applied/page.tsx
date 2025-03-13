"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ApprovalRule {
  id: string;
  min_amount: number;
  max_amount: number | null;
  approver_type: string;
}

interface Approval {
  amount: number;
  threshold: {
    min: number;
    max: number | 'No Limit';
  };
  approver: User | null;
  rule: ApprovalRule | null;
}

interface ProjectApproval {
  id: string;
  name: string;
  client: string;
  approvals: Approval[];
}

export default function AppliedRulesPage() {
  const [projectApprovals, setProjectApprovals] = useState<ProjectApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectApprovals = async () => {
      try {
        const response = await fetch("/api/project-approvals");
        if (!response.ok) throw new Error("Failed to fetch project approvals");
        const data = await response.json();
        setProjectApprovals(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchProjectApprovals();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  // Get unique thresholds from all project approvals
  const thresholds = projectApprovals.length > 0 
    ? projectApprovals[0].approvals.map(a => ({
        amount: a.amount,
        min: a.threshold.min,
        max: a.threshold.max
      }))
    : [];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">Applied Approval Rules</h1>
            <div className="space-x-4">
              <Link href="/settings/approval-rules" className="btn-ramp">
                Manage Rules
              </Link>
              <Link href="/settings" className="btn-ramp">
                Back to Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '0 16px' }}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  {thresholds.map((threshold, index) => (
                    <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ${threshold.min.toFixed(2)} - {typeof threshold.max === 'number' ? `$${threshold.max.toFixed(2)}` : threshold.max}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectApprovals.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.client}
                    </td>
                    {project.approvals.map((approval, index) => (
                      <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.approver ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {approval.approver.first_name} {approval.approver.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {approval.rule?.approver_type.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-500">No rule defined</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {projectApprovals.length === 0 && (
                  <tr>
                    <td colSpan={thresholds.length + 2} className="px-6 py-4 text-center text-sm text-gray-500">
                      No projects found. Create a project to see approval rules in action.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Understanding Approval Rules</h2>
          <p className="text-gray-600 mb-4">
            This table shows how approval rules are applied to each project based on the configured spend thresholds.
            Each column represents a threshold range and shows the appropriate approver for that amount.
          </p>
          <p className="text-gray-600">
            To modify these thresholds or approver assignments, use the "Manage Rules" button above.
          </p>
        </div>
      </main>
    </div>
  );
} 