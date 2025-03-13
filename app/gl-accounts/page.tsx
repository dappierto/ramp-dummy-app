'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
type GLAccount = {
  id: string;
  ramp_id?: string;
  name: string;
  code?: string;
  classification: string;
  is_active: boolean;
  status?: string;
  created_at: string;
};

type ERPAccount = {
  id: string;
  name: string;
  code?: string;
  type: string;
  is_active: boolean;
  ramp_id?: string;
};

type Recipe = {
  id: string;
  title: string;
  description: string;
  steps: {
    number: number;
    title: string;
    description: string;
    apiEndpoint?: string;
    apiMethod?: string;
    apiPayload?: any;
    action?: () => void;
    showComparison?: boolean;
  }[];
};

export default function GLAccountsPage() {
  // State management
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
  const [erpAccounts, setERPAccounts] = useState<ERPAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    code: '',
    type: 'EXPENSE'
  });
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [apiLog, setApiLog] = useState<{
    type: string;
    endpoint: string;
    method: string;
    message: string;
    time: string;
  }[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  // Utility functions
  const getMessagePreview = (message: string) => {
    try {
      const parsed = JSON.parse(message);
      if (Array.isArray(parsed)) {
        return `Array[${parsed.length} items]`;
      } else if (typeof parsed === 'object') {
        return `Object{${Object.keys(parsed).join(', ')}}`;
      }
      return message;
    } catch {
      return message;
    }
  };

  // Toggle log expansion
  const toggleLogExpansion = (index: number) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const logAction = (type: string, endpoint: string, method: string, message: any, isResponse: boolean = false) => {
    // Map local endpoints to Ramp API endpoints where applicable
    const getRampEndpoint = (localEndpoint: string) => {
      const endpointMap: { [key: string]: string } = {
        '/api/gl-accounts': 'https://demo-api.ramp.com/developer/v1/accounting/accounts',
        '/api/gl-sync': 'https://demo-api.ramp.com/developer/v1/accounting/accounts'
      };

      // Check if it's a delete operation on gl-accounts
      if (localEndpoint.startsWith('/api/gl-accounts/') && method === 'DELETE') {
        const id = localEndpoint.split('/').pop();
        return `https://demo-api.ramp.com/developer/v1/accounting/accounts/${id}`;
      }

      return endpointMap[localEndpoint] || localEndpoint;
    };

    setApiLog((prev) => [
      {
        type: isResponse ? '📥 Response' : '📤 Request',
        endpoint: getRampEndpoint(endpoint),
        method,
        message: JSON.stringify(message, null, 2),
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };

  // Data fetching functions
  const fetchERPAccounts = async () => {
    try {
      const response = await fetch('/api/erp-accounts');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch ERP accounts');
      
      logAction('📥 Fetched', '/api/erp-accounts', 'GET', data);
      
      // Sort accounts to prioritize inactive ERP accounts that are active in Ramp
      setERPAccounts(Array.isArray(data) ? data.sort((a, b) => {
        const aRampAccount = glAccounts.find(gl => gl.id === a.id);
        const bRampAccount = glAccounts.find(gl => gl.id === b.id);
        
        // First priority: Inactive in ERP but active in Ramp
        const aIsCleanupNeeded = !a.is_active && aRampAccount?.is_active;
        const bIsCleanupNeeded = !b.is_active && bRampAccount?.is_active;
        
        if (aIsCleanupNeeded && !bIsCleanupNeeded) return -1;
        if (!aIsCleanupNeeded && bIsCleanupNeeded) return 1;
        
        // Second priority: Active accounts
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        
        // Finally, sort by name
        return a.name.localeCompare(b.name);
      }) : []);
    } catch (error) {
      console.error('Failed to fetch ERP accounts:', error);
      logAction('❌ Error', '/api/erp-accounts', 'GET', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const fetchGLAccounts = async () => {
    try {
      const response = await fetch('/api/gl-accounts');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch GL accounts');
      
      logAction('📥 Fetched', '/api/gl-accounts', 'GET', data);
      // Use the is_active field directly from Ramp's response
      const transformedAccounts = Array.isArray(data) ? data : [];
      
      setGLAccounts(transformedAccounts);
      // Re-sort ERP accounts after GL accounts are updated
      await fetchERPAccounts();
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch GL accounts:', error);
      logAction('❌ Error', '/api/gl-accounts', 'GET', { error: error instanceof Error ? error.message : 'Unknown error' });
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchERPAccounts();
    fetchGLAccounts();
  }, []);

  // Account management functions
  const addGLAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountData.name.trim()) return;

    try {
      const payload = {
        name: newAccountData.name.trim(),
        code: newAccountData.code.trim(),
        type: newAccountData.type
      };
      logAction('📤 Creating', '/api/erp-accounts', 'POST', payload);

      const response = await fetch('/api/erp-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to create GL account');

      logAction('✅ Created', '/api/erp-accounts', 'POST', data, true);
      await fetchERPAccounts();
      setNewAccountData({ name: '', code: '', type: 'EXPENSE' });
      setShowForm(false);
      
      if (activeRecipe) {
        setCurrentStep(prev => Math.min(prev + 1, activeRecipe.steps.length - 1));
      }
    } catch (error) {
      console.error('Failed to create GL account:', error);
      logAction('❌ Error', '/api/erp-accounts', 'POST', { error: error instanceof Error ? error.message : 'Unknown error' });
      alert('Failed to create GL account. Please try again.');
    }
  };

  const disableSelectedAccounts = async () => {
    if (selectedAccountIds.size === 0) {
      alert('Please select at least one account to disable');
      return;
    }

    try {
      for (const accountId of selectedAccountIds) {
        logAction('📤 Disabling', `/api/erp-accounts/${accountId}`, 'PATCH', { is_active: false });

        const response = await fetch(`/api/erp-accounts/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: false }),
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to disable GL account');

        logAction('✅ Disabled', `/api/erp-accounts/${accountId}`, 'PATCH', data, true);
      }

      await fetchERPAccounts();
      
      if (activeRecipe) {
        setCurrentStep(prev => Math.min(prev + 1, activeRecipe.steps.length - 1));
      }
    } catch (error) {
      console.error('Failed to disable GL accounts:', error);
      logAction('❌ Error', '/api/erp-accounts', 'PATCH', { error: error instanceof Error ? error.message : 'Unknown error' });
      alert('Failed to disable GL accounts. Please try again.');
    }
  };

  const syncWithRamp = async () => {
    if (erpAccounts.length === 0) {
      alert('No ERP accounts available for syncing.');
      return;
    }

    try {
      if (activeRecipe?.id === 'create-and-sync') {
        // Get unsynced accounts
        const unsyncedAccounts = erpAccounts.filter(
          erpAcc => !glAccounts.some(glAcc => glAcc.id === erpAcc.id)
        );

        if (unsyncedAccounts.length === 0) {
          alert('All accounts are already synced.');
          return;
        }

        const payload = {
          gl_accounts: unsyncedAccounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            code: acc.code || '',
            classification: acc.type
          }))
        };

        logAction('📤 Syncing', '/api/gl-sync', 'POST', payload);

        const response = await fetch('/api/gl-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to sync with Ramp');

        logAction('✅ Synced', '/api/gl-sync', 'POST', data, true);
      } else if (activeRecipe?.id === 'disable-and-sync') {
        // Get selected accounts that need to be disabled in Ramp
        const selectedAccounts = Array.from(selectedAccountIds)
          .map(id => {
            const account = erpAccounts.find(acc => acc.id === id);
            const rampAccount = glAccounts.find(gl => gl.id === id);
            return { ...account, ramp_id: rampAccount?.ramp_id };
          })
          .filter(acc => acc.ramp_id);

        if (selectedAccounts.length === 0) {
          alert('No accounts selected for disabling in Ramp.');
          return;
        }

        for (const account of selectedAccounts) {
          logAction('📤 Disabling in Ramp', `/api/gl-accounts/${account.ramp_id}`, 'DELETE', {
            gl_account_id: account.ramp_id,
            name: account.name,
            operation: 'disable'
          });

          const response = await fetch(`/api/gl-accounts/${account.ramp_id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            throw new Error(`Failed to disable account ${account.name} in Ramp`);
          }

          logAction('✅ Disabled in Ramp', `/api/gl-accounts/${account.ramp_id}`, 'DELETE', {
            gl_account_id: account.ramp_id,
            name: account.name,
            status: 'disabled'
          }, true);
        }
      }

      await fetchGLAccounts();
      alert('Successfully synced with Ramp!');
      
      if (activeRecipe) {
        setActiveRecipe(null);
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('Failed to sync with Ramp:', error);
      logAction('❌ Error', '/api/gl-sync', 'POST', { error: error instanceof Error ? error.message : 'Unknown error' });
      alert('Failed to sync with Ramp. Please try again.');
    }
  };

  // Selection management
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(accountId)) {
        newSelection.delete(accountId);
      } else {
        newSelection.add(accountId);
      }
      return newSelection;
    });
  };

  const toggleAllAccounts = () => {
    const accountsToSync = erpAccounts.filter(acc => {
      const rampAccount = glAccounts.find(gl => gl.id === acc.id);
      // Select accounts that are either:
      // 1. Active in ERP (existing behavior)
      // 2. Inactive in ERP but still active in Ramp (needs cleanup)
      return acc.is_active || (rampAccount?.is_active && !acc.is_active);
    });

    if (selectedAccountIds.size === accountsToSync.length) {
      setSelectedAccountIds(new Set());
    } else {
      setSelectedAccountIds(new Set(accountsToSync.map(acc => acc.id)));
    }
  };

  // Recipe definitions after all functions are declared
  const recipes: Recipe[] = [
    {
      id: 'create-and-sync',
      title: '➕ Create & Sync GL Account',
      description: 'Create a new GL account in your ERP system and sync it with Ramp.',
      steps: [
        {
          number: 1,
          title: 'Create New GL Account',
          description: 'First, create a new GL account in your ERP system.',
          apiEndpoint: '/api/erp-accounts',
          apiMethod: 'POST'
        },
        {
          number: 2,
          title: 'Review GL Account Status',
          description: 'Review your ERP GL accounts and their sync status with Ramp.',
          showComparison: true
        },
        {
          number: 3,
          title: 'Sync with Ramp',
          description: 'Sync your new GL account with Ramp.',
          apiEndpoint: '/api/gl-sync',
          apiMethod: 'POST'
        }
      ]
    },
    {
      id: 'disable-and-sync',
      title: '🚫 Disable GL Account',
      description: 'Disable one or more GL accounts in your ERP and sync the changes with Ramp.',
      steps: [
        {
          number: 1,
          title: 'Select Accounts to Disable',
          description: 'Choose which active GL accounts you want to disable.',
          showComparison: true
        },
        {
          number: 2,
          title: 'Disable in ERP',
          description: 'Disable the selected accounts in your ERP system.',
          apiEndpoint: '/api/erp-accounts',
          apiMethod: 'PATCH',
          action: disableSelectedAccounts
        },
        {
          number: 3,
          title: 'Review Changes',
          description: 'Review the accounts that will be disabled in Ramp.',
          apiEndpoint: '/api/gl-accounts',
          apiMethod: 'DELETE'
        }
      ]
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-500">Loading GL Accounts...</p>
    </div>;
  }

  // Continue with the JSX...
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Command Center Link */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Command Center
          </a>
        </div>

        {/* Recipe Selection */}
        {!activeRecipe && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">GL Account Management</h1>
            <p className="text-gray-600">Select a recipe to get started:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => {
                    setActiveRecipe(recipe);
                    setCurrentStep(0);
                  }}
                >
                  <h3 className="text-lg font-semibold text-gray-900">{recipe.title}</h3>
                  <p className="mt-2 text-gray-600">{recipe.description}</p>
                </div>
              ))}
            </div>

            {/* Debug Table */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Debug: All GL Accounts</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ERP Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ramp Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ramp ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Raw Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {erpAccounts.map((account) => {
                      const rampAccount = glAccounts.find((gl) => gl.id === account.id);
                      return (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">{account.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{account.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{account.code || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{account.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                account.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {account.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                !rampAccount
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : rampAccount.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {!rampAccount 
                                ? 'Not Synced'
                                : rampAccount.is_active
                                ? 'Synced (Active)'
                                : 'Synced (Inactive)'}
                            </span>
                            <div className="mt-1 text-xs text-gray-500">
                              {rampAccount && `Raw is_active: ${String(rampAccount.is_active)}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                            {rampAccount?.ramp_id || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                            {rampAccount ? JSON.stringify({ status: rampAccount.status, is_active: rampAccount.is_active }) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Active Recipe */}
        {activeRecipe && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setActiveRecipe(null);
                  setCurrentStep(0);
                  setShowForm(false);
                  setSelectedAccountIds(new Set());
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Recipes
              </button>
              <h2 className="text-xl font-bold text-gray-900">{activeRecipe.title}</h2>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {activeRecipe.steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  {index > 0 && <div className="h-1 w-8 bg-gray-200 mr-2" />}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${
                        index === currentStep
                          ? 'bg-blue-500 text-white'
                          : index < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {step.number}
                  </div>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Step {activeRecipe.steps[currentStep].number}: {activeRecipe.steps[currentStep].title}
              </h3>
              <p className="text-gray-600 mb-6">{activeRecipe.steps[currentStep].description}</p>

              {/* Create Account Form */}
              {activeRecipe.id === 'create-and-sync' && currentStep === 0 && (
                <div className="space-y-4">
                  {!showForm ? (
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Create New GL Account
                    </button>
                  ) : (
                    <form onSubmit={addGLAccount} className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Name</label>
                        <input
                          type="text"
                          value={newAccountData.name}
                          onChange={(e) => setNewAccountData(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g., Marketing Expenses"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Code</label>
                        <input
                          type="text"
                          value={newAccountData.code}
                          onChange={(e) => setNewAccountData(prev => ({ ...prev, code: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g., 5100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Type</label>
                        <select
                          value={newAccountData.type}
                          onChange={(e) => setNewAccountData(prev => ({ ...prev, type: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="EXPENSE">Expense</option>
                          <option value="REVENUE">Revenue</option>
                          <option value="ASSET">Asset</option>
                          <option value="LIABILITY">Liability</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Create Account
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Unified GL Accounts Table */}
              {((activeRecipe.id === 'create-and-sync' && currentStep === 1) ||
                (activeRecipe.id === 'disable-and-sync' && currentStep === 0)) && (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {activeRecipe.id === 'disable-and-sync' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedAccountIds.size === erpAccounts.filter(acc => acc.is_active).length}
                              onChange={toggleAllAccounts}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ramp Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ramp ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {erpAccounts.map((account) => {
                        const rampAccount = glAccounts.find((gl) => gl.id === account.id);
                        return (
                          <tr key={account.id} className="hover:bg-gray-50">
                            {activeRecipe.id === 'disable-and-sync' && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                {/* Show checkbox if account is active in ERP OR active in Ramp */}
                                {(account.is_active || (rampAccount?.is_active && !account.is_active)) && (
                                  <input
                                    type="checkbox"
                                    checked={selectedAccountIds.has(account.id)}
                                    onChange={() => toggleAccountSelection(account.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                )}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{account.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{account.code || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{account.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  account.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {account.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  !rampAccount
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : rampAccount.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {!rampAccount 
                                  ? 'Not Synced'
                                  : rampAccount.is_active
                                  ? 'Synced (Active)'
                                  : 'Synced (Inactive)'}
                              </span>
                              <div className="mt-1 text-xs text-gray-500">
                                {rampAccount && `Raw is_active: ${String(rampAccount.is_active)}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {rampAccount?.ramp_id || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* API Documentation */}
              {((activeRecipe.id === 'create-and-sync' && currentStep === 2) ||
                (activeRecipe.id === 'disable-and-sync' && currentStep === 2)) && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">API Endpoint</h4>
                    <code className="block bg-gray-100 p-3 rounded-md text-sm font-mono">
                      {activeRecipe.id === 'create-and-sync' 
                        ? 'POST https://demo-api.ramp.com/developer/v1/accounting/accounts'
                        : 'DELETE https://demo-api.ramp.com/developer/v1/accounting/accounts/{gl_account_id}'}
                    </code>
                  </div>

                  {activeRecipe.id === 'create-and-sync' && (
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Request Payload</h4>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono overflow-auto">
                        {JSON.stringify(
                          {
                            gl_accounts: erpAccounts
                              .filter((acc) => !glAccounts.some((gl) => gl.id === acc.id))
                              .map((acc) => ({
                                id: acc.id,
                                name: acc.name,
                                code: acc.code || '',
                                classification: acc.type,
                              })),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Description</h4>
                    <p className="text-sm text-gray-600">
                      {activeRecipe.id === 'create-and-sync'
                        ? 'This will create new GL accounts in Ramp for any unsynced accounts in your ERP system.'
                        : `This will disable the following GL accounts in Ramp:\n${Array.from(selectedAccountIds)
                            .map(id => {
                              const account = erpAccounts.find(acc => acc.id === id);
                              const rampAccount = glAccounts.find(gl => gl.id === id);
                              return `• ${account?.name} (Ramp ID: ${rampAccount?.ramp_id})`;
                            })
                            .join('\n')}`}
                    </p>
                  </div>

                  {activeRecipe.id === 'disable-and-sync' && (
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Example API Call</h4>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono overflow-auto">
                        {`// For each selected account:
DELETE https://demo-api.ramp.com/developer/v1/accounting/accounts/${
                          glAccounts.find(gl => gl.id === Array.from(selectedAccountIds)[0])?.ramp_id || 'gl_account_id'
                        }
// No request body needed`}
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={syncWithRamp}
                    className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    {activeRecipe.id === 'create-and-sync' ? 'Sync with Ramp' : 'Disable Accounts in Ramp'}
                  </button>
                </div>
              )}

              {/* Step Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    currentStep === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
                  }`}
                  disabled={currentStep === 0}
                >
                  Previous
                </button>

                {activeRecipe.id === 'disable-and-sync' && currentStep === 1 && (
                  <button
                    onClick={disableSelectedAccounts}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      selectedAccountIds.size === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600 transition-colors'
                    }`}
                    disabled={selectedAccountIds.size === 0}
                  >
                    Disable Selected Accounts
                  </button>
                )}

                {activeRecipe.id === 'disable-and-sync' && currentStep === 2 && (
                  <button
                    onClick={syncWithRamp}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      selectedAccountIds.size === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600 transition-colors'
                    }`}
                    disabled={selectedAccountIds.size === 0}
                  >
                    Disable in Ramp
                  </button>
                )}

                <button
                  onClick={() => setCurrentStep((prev) => Math.min(prev + 1, activeRecipe.steps.length - 1))}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    currentStep === activeRecipe.steps.length - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                  }`}
                  disabled={currentStep === activeRecipe.steps.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Logs */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">API Logs</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setExpandedLogs(new Set(apiLog.map((_, i) => i)))}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedLogs(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Collapse All
              </button>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {showLogs ? 'Hide Logs' : 'Show Logs'}
              </button>
            </div>
          </div>
          
          {showLogs && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2 max-h-96 overflow-auto">
              {apiLog.map((log, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleLogExpansion(index)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${log.type.includes('Error') ? 'text-red-600' : 'text-gray-900'}`}>
                        {log.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        {log.method} {log.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{log.time}</span>
                      <svg 
                        className={`w-4 h-4 transform transition-transform ${expandedLogs.has(index) ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {!expandedLogs.has(index) && (
                    <div className="px-3 pb-3 text-sm text-gray-600">
                      <span className="font-mono">{getMessagePreview(log.message)}</span>
                    </div>
                  )}
                  
                  {expandedLogs.has(index) && (
                    <div className="border-t border-gray-200">
                      <pre className="p-3 text-sm font-mono overflow-auto bg-gray-100 max-h-64">
                        {log.message}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 