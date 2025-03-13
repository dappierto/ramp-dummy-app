"use client";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

type Reimbursement = {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  state: string;
  memo: string | null;
  user_full_name: string;
  transaction_date: string;
};

// Define the Recipe Type
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
  }[];
};

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [selectedReimbursements, setSelectedReimbursements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [apiLog, setApiLog] = useState<{
    type: string;
    endpoint: string;
    method: string;
    message: string;
    time: string;
  }[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  // Define recipes
  const recipes: Recipe[] = [
    {
      id: 'successful-sync',
      title: '✅ Successful Reimbursement Sync Flow',
      description: 'Learn how to fetch sync-ready reimbursements and successfully sync them to your ERP system.',
      steps: [
        {
          number: 1,
          title: 'Fetch Sync-Ready Reimbursements',
          description: 'First, well fetch all reimbursements that are ready to be synced.',
          apiEndpoint: '/api/reimbursements?sync_ready=true',
          apiMethod: 'GET',
        },
        {
          number: 2,
          title: 'Select Reimbursements',
          description: 'Select one or more reimbursements from the list that you want to sync.',
          action: () => document.getElementById('reimbursement-table')?.scrollIntoView({ behavior: 'smooth' }),
        },
        {
          number: 3,
          title: 'Initiate Sync Process',
          description: 'Sync the selected reimbursements to your ERP system.',
          apiEndpoint: '/api/sync',
          apiMethod: 'POST',
        }
      ],
    },
    {
      id: 'failed-sync',
      title: '❌ Failed Reimbursement Sync Flow',
      description: 'Understand how to handle and debug failed reimbursement syncs.',
      steps: [
        {
          number: 1,
          title: 'Fetch Sync-Ready Reimbursements',
          description: 'First, well fetch all reimbursements that are ready to be synced.',
          apiEndpoint: '/api/reimbursements?sync_ready=true',
          apiMethod: 'GET',
        },
        {
          number: 2,
          title: 'Select Reimbursements',
          description: 'Select reimbursements to simulate a failed sync.',
          action: () => document.getElementById('reimbursement-table')?.scrollIntoView({ behavior: 'smooth' }),
        },
        {
          number: 3,
          title: 'Simulate Failed Sync',
          description: 'Attempt to sync with invalid data to simulate failure handling.',
          apiEndpoint: '/api/sync',
          apiMethod: 'POST',
        }
      ],
    }
  ];

  const fetchReimbursements = async () => {
    setLoading(true);
    const endpoint = "/api/reimbursements";
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      logAction("📥 API Fetch", endpoint, "GET", data);
      setReimbursements(Array.isArray(data) ? data : []);
    } catch (err: any) {
      logAction("❌ Error", endpoint, "GET", { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, []);

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

  const logAction = (type: string, endpoint: string, method: string, message: any, isResponse: boolean = false) => {
    const getRampEndpoint = (localEndpoint: string) => {
      const endpointMap: { [key: string]: string } = {
        '/api/reimbursements': 'https://demo-api.ramp.com/developer/v1/reimbursements',
        '/api/sync': 'https://demo-api.ramp.com/developer/v1/sync'
      };
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

  const toggleSelection = (id: string) => {
    setSelectedReimbursements((prev) => {
      const newSelection = new Set(prev);
      newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
      return newSelection;
    });
  };

  const syncSelectedReimbursements = async (isFailure: boolean = false) => {
    if (selectedReimbursements.size === 0) {
      alert("❌ No reimbursements selected.");
      return;
    }

    const syncData = {
      idempotency_key: uuidv4(),
      sync_type: "REIMBURSEMENT_SYNC",
      ...(isFailure ? {
        failed_syncs: Array.from(selectedReimbursements).map((id) => ({
          id,
          error: { message: "Mimicked sync failure - ERP system rejected the reimbursement." }
        }))
      } : {
        successful_syncs: Array.from(selectedReimbursements).map((id) => ({
          id,
          reference_id: uuidv4()
        }))
      })
    };

    const endpoint = "/api/sync";
    try {
      logAction("📤 Request", endpoint, "POST", syncData);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncData),
      });

      const responseData = await response.json();
      logAction(response.ok ? "✅ Success" : "❌ Failure", endpoint, "POST", responseData, true);

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} - ${responseData.message || "Unknown error"}`);
      }

      alert(`✅ Successfully synced ${selectedReimbursements.size} reimbursement(s)!`);
      setSelectedReimbursements(new Set());
      setCurrentStep(0);
      setActiveRecipe(null);
    } catch (error: any) {
      logAction("❌ Error", endpoint, "POST", { error: error.message }, true);
      alert(`❌ Failed to sync selected reimbursements.`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">💰 Ramp Reimbursements</h1>
            <button 
              onClick={() => router.push("/")} 
              className="btn-ramp"
            >
              ← Back to Command Center
            </button>
          </div>
        </div>
      </header>

      <main style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '0 16px' }}>
        {/* Recipe Selection */}
        {!activeRecipe ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id}
                className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={async () => {
                  setActiveRecipe(recipe);
                  await fetchReimbursements();
                }}
              >
                <h2 className="text-xl font-bold mb-2">{recipe.title}</h2>
                <p className="text-gray-600 mb-4">{recipe.description}</p>
                <button className="btn-ramp w-full">Start Recipe</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{activeRecipe.title}</h2>
              <button 
                onClick={() => {
                  setActiveRecipe(null);
                  setCurrentStep(0);
                  setSelectedReimbursements(new Set());
                }}
                className="btn-ramp"
              >
                ← Back to Recipes
              </button>
            </div>

            {/* Step Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {activeRecipe.steps.map((step, index) => (
                  <div 
                    key={step.number}
                    className={`flex-1 ${index !== activeRecipe.steps.length - 1 ? 'border-b-2' : ''} ${
                      index < currentStep ? 'border-green-500' : 
                      index === currentStep ? 'border-blue-500' : 
                      'border-gray-200'
                    }`}
                  >
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full mb-2
                      ${index < currentStep ? 'bg-green-500 text-white' : 
                        index === currentStep ? 'bg-blue-500 text-white' : 
                        'bg-gray-200 text-gray-600'}
                    `}>
                      {step.number}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Step */}
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Step {activeRecipe.steps[currentStep].number}: {activeRecipe.steps[currentStep].title}
              </h3>
              <p className="text-gray-600 mb-4">{activeRecipe.steps[currentStep].description}</p>

              {/* API Documentation */}
              {activeRecipe.steps[currentStep].apiEndpoint && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <span className={`
                      px-2 py-1 rounded text-xs font-bold mr-2
                      ${activeRecipe.steps[currentStep].apiMethod === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                    `}>
                      {activeRecipe.steps[currentStep].apiMethod}
                    </span>
                    <code className="text-sm">{activeRecipe.steps[currentStep].apiEndpoint}</code>
                  </div>
                  {(currentStep === activeRecipe.steps.length - 1 && selectedReimbursements.size > 0) && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Current Payload:</p>
                      <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify({
                          idempotency_key: uuidv4(),
                          sync_type: "REIMBURSEMENT_SYNC",
                          ...(activeRecipe.id === 'failed-sync' ? {
                            failed_syncs: Array.from(selectedReimbursements).map(id => ({
                              id,
                              error: { message: "Mimicked sync failure - ERP system rejected the reimbursement." }
                            }))
                          } : {
                            successful_syncs: Array.from(selectedReimbursements).map(id => ({
                              id,
                              reference_id: uuidv4()
                            }))
                          })
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Show Reimbursements Table only on step 2 */}
              {currentStep === 1 && (
                <div className="card mb-6">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table-style" id="reimbursement-table">
                        <thead>
                          <tr>
                            <th>
                              <input 
                                type="checkbox" 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedReimbursements(new Set(reimbursements.map(r => r.id)));
                                  } else {
                                    setSelectedReimbursements(new Set());
                                  }
                                }}
                                checked={selectedReimbursements.size === reimbursements.length}
                              />
                            </th>
                            <th>Merchant</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>User</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reimbursements.length > 0 ? (
                            reimbursements.map((tx) => (
                              <tr key={tx.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedReimbursements.has(tx.id)}
                                    onChange={() => toggleSelection(tx.id)}
                                  />
                                </td>
                                <td>{tx.merchant}</td>
                                <td>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                <td>${tx.amount.toFixed(2)}</td>
                                <td>{tx.user_full_name}</td>
                                <td>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      tx.state === "REIMBURSED" 
                                        ? "bg-green-100 text-green-800" 
                                        : tx.state === "PENDING"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : tx.state === "DECLINED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {tx.state}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-gray-500">
                                No reimbursements found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  className="btn-ramp"
                  disabled={currentStep === 0}
                >
                  ← Previous Step
                </button>
                {currentStep === activeRecipe.steps.length - 1 ? (
                  <button
                    onClick={() => syncSelectedReimbursements(activeRecipe.id === 'failed-sync')}
                    className="btn-ramp"
                    disabled={selectedReimbursements.size === 0}
                  >
                    {activeRecipe.id === 'failed-sync' ? 'Simulate Failed Sync' : 'Complete Sync'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeRecipe.steps[currentStep].action) {
                        activeRecipe.steps[currentStep].action!();
                      }
                      setCurrentStep(prev => Math.min(activeRecipe.steps.length - 1, prev + 1));
                    }}
                    className="btn-ramp"
                  >
                    Next Step →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Logs */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">API Logs</h3>
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
                  onClick={() => {
                    setExpandedLogs(prev => {
                      const next = new Set(prev);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    });
                  }}
                >
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${log.type.includes('Error') ? 'text-red-600' : 'text-gray-900'}`}>
                        {log.type}
                      </span>
                      <span className="text-sm text-gray-600">{log.method} {log.endpoint}</span>
                    </div>
                    <span className="text-sm text-gray-500">{log.time}</span>
                  </div>
                  
                  {!expandedLogs.has(index) ? (
                    <div className="px-3 pb-3 text-sm text-gray-600">
                      <span className="font-mono">{getMessagePreview(log.message)}</span>
                    </div>
                  ) : (
                    <pre className="p-3 text-sm font-mono overflow-auto bg-gray-100">{log.message}</pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
