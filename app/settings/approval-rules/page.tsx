"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ApprovalRule {
  id: string;
  min_amount: number;
  max_amount: number | null;
  approver_type: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  id?: string;
  min_amount: string;
  max_amount: string;
  approver_type: string;
}

export default function ApprovalRulesPage() {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    min_amount: "",
    max_amount: "",
    approver_type: "manager"
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch("/api/approval-rules");
      if (!response.ok) throw new Error("Failed to fetch rules");
      const data = await response.json();
      setRules(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/approval-rules" + (isEditing && formData.id ? `/${formData.id}` : ""), {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save rule");
      
      // Reset form and refresh rules
      setFormData({
        min_amount: "",
        max_amount: "",
        approver_type: "manager"
      });
      setIsEditing(false);
      fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rule");
    }
  };

  const handleEdit = (rule: ApprovalRule) => {
    setFormData({
      id: rule.id,
      min_amount: rule.min_amount.toString(),
      max_amount: rule.max_amount?.toString() || "",
      approver_type: rule.approver_type
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const response = await fetch(`/api/approval-rules/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete rule");
      fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">Approval Rules</h1>
            <div className="space-x-4">
              <Link href="/settings/approval-rules/applied" className="btn-ramp">
                View Applied Rules
              </Link>
              <Link href="/settings" className="btn-ramp">
                Back to Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '0 16px' }}>
        <div className="bg-white rounded-lg shadow overflow-hidden p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="min_amount" className="block text-sm font-medium text-gray-700">
                  Minimum Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="min_amount"
                  id="min_amount"
                  required
                  value={formData.min_amount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="max_amount" className="block text-sm font-medium text-gray-700">
                  Maximum Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="max_amount"
                  id="max_amount"
                  value={formData.max_amount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div>
                <label htmlFor="approver_type" className="block text-sm font-medium text-gray-700">
                  Approver Type
                </label>
                <select
                  id="approver_type"
                  name="approver_type"
                  value={formData.approver_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="manager">Manager</option>
                  <option value="director">Director</option>
                  <option value="client_owner">Client Owner</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      min_amount: "",
                      max_amount: "",
                      approver_type: "manager"
                    });
                    setIsEditing(false);
                  }}
                  className="btn-ramp bg-gray-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn-ramp"
              >
                {isEditing ? "Update Rule" : "Add Rule"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Range
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${rule.min_amount.toFixed(2)} - {rule.max_amount ? `$${rule.max_amount.toFixed(2)}` : "No Limit"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.approver_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    No approval rules defined yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
} 