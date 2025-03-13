"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Define the Transaction Type
type Transaction = {
  id: string;
  merchant_name: string;
  amount: number;
  currency_code: string;
  state: string;
  sk_category_name: string;
  user_transaction_time: string;
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [apiLog, setApiLog] = useState<{
    type: string;
    endpoint: string;
    method: string;
    message: string;
    time: string;
  }[]>([]);
  const [showRawData, setShowRawData] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [rawApiData, setRawApiData] = useState<any>(null);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchTransactions = async () => {
    setIsLoading(true);
    const endpoint = "/api/transactions";
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      logAction("📥 API Fetch", endpoint, "GET", data);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      logAction("❌ Error", endpoint, "GET", { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Define recipes
  const recipes: Recipe[] = [
    {
      id: 'successful-sync',
      title: '✅ Successful Transaction Sync Flow',
      description: 'Learn how to fetch sync-ready transactions and successfully sync them to your ERP system.',
      steps: [
        {
          number: 1,
          title: 'Fetch Sync-Ready Transactions',
          description: 'First, well fetch all transactions that are ready to be synced using the Ramp API.',
          apiEndpoint: '/api/transactions?sync_ready=true&has_no_sync_commits=true',
          apiMethod: 'GET'
        },
        {
          number: 2,
          title: 'Select Transactions',
          description: 'Select one or more transactions from the list that you want to sync.',
          action: () => document.getElementById('transaction-table')?.scrollIntoView({ behavior: 'smooth' })
        },
        {
          number: 3,
          title: 'Initiate Sync Process',
          description: 'Sync the selected transactions to your ERP system.',
          apiEndpoint: '/api/sync',
          apiMethod: 'POST',
          apiPayload: null // We'll generate this dynamically
        }
      ]
    },
    {
      id: 'failed-sync',
      title: '❌ Failed Transaction Sync Flow',
      description: 'Understand how to handle and debug failed transaction syncs.',
      steps: [
        {
          number: 1,
          title: 'Fetch Sync-Ready Transactions',
          description: 'First, well fetch all transactions that are ready to be synced.',
          apiEndpoint: '/api/transactions?sync_ready=true&has_no_sync_commits=true',
          apiMethod: 'GET'
        },
        {
          number: 2,
          title: 'Select Transactions',
          description: 'Select transactions to simulate a failed sync.',
          action: () => document.getElementById('transaction-table')?.scrollIntoView({ behavior: 'smooth' })
        },
        {
          number: 3,
          title: 'Simulate Failed Sync',
          description: 'Attempt to sync with invalid data to simulate failure handling.',
          apiEndpoint: '/api/sync',
          apiMethod: 'POST',
          apiPayload: null // We'll generate this dynamically
        }
      ]
    }
  ];

  // Function to generate payload based on selected transactions
  const generateSyncPayload = (isFailure: boolean) => {
    return {
      idempotency_key: uuidv4(),
      sync_type: "TRANSACTION_SYNC",
      ...(isFailure ? {
        failed_syncs: Array.from(selectedTransactions).map((id) => ({
          id,
          error: { message: "Mimicked sync failure - ERP system rejected the transaction." }
        }))
      } : {
        successful_syncs: Array.from(selectedTransactions).map((id) => ({
          id,
          reference_id: uuidv4()
        }))
      })
    };
  };

  useEffect(() => {
    const endpoint = "/api/transactions";
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        logAction("📥 API Fetch", endpoint, "GET", data);
        setRawApiData(data); // Store Raw API Data
        setTransactions(Array.isArray(data) ? data : []);
      })
      .catch((err) => logAction("❌ Error", endpoint, "GET", { error: err.message }));
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedTransactions((prev) => {
      const newSelection = new Set(prev);
      newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
      return newSelection;
    });
  };

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
        '/api/transactions': 'https://demo-api.ramp.com/developer/v1/transactions',
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

  const syncSelectedTransactions = async (isFailure: boolean = false) => {
    if (selectedTransactions.size === 0) {
      alert("❌ No transactions selected.");
      return;
    }

    const syncData = generateSyncPayload(isFailure);
    const endpoint = "/api/sync";

    try {
      logAction("📤 Request Sent", endpoint, "POST", syncData);

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

      alert(`✅ Successfully synced ${selectedTransactions.size} transaction(s)!`);
      setSelectedTransactions(new Set());
      setCurrentStep(0);
      setActiveRecipe(null);
    } catch (error: any) {
      logAction("❌ Error", endpoint, "POST", { error: error.message }, true);
      alert(`❌ Failed to sync selected transactions.`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">📊 Ramp Transactions</h1>
            <button 
              onClick={() => router.push("/")} 
              className="btn-ramp flex items-center"
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
                  await fetchTransactions();
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
                  setSelectedTransactions(new Set());
                  setTransactions([]);
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
                  {(currentStep === activeRecipe.steps.length - 1 && selectedTransactions.size > 0) ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Current Payload:</p>
                      <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(generateSyncPayload(activeRecipe.id === 'failed-sync'), null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Show Transactions Table only on step 2 */}
              {currentStep === 1 && (
                <div className="card mb-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table-style" id="transaction-table">
                        <thead>
                          <tr>
                            <th>
                              <input 
                                type="checkbox" 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTransactions(new Set(transactions.map(tx => tx.id)));
                                  } else {
                                    setSelectedTransactions(new Set());
                                  }
                                }}
                              />
                            </th>
                            <th>Merchant</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Category</th>
                            <th>State</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td>
                                <input 
                                  type="checkbox" 
                                  checked={selectedTransactions.has(tx.id)} 
                                  onChange={() => toggleSelection(tx.id)} 
                                />
                              </td>
                              <td>{tx.merchant_name}</td>
                              <td>{new Date(tx.user_transaction_time).toLocaleDateString()}</td>
                              <td>
                                {tx.currency_code} {tx.amount.toFixed(2)}
                              </td>
                              <td>{tx.sk_category_name || "—"}</td>
                              <td>
                                <span 
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    tx.state === "APPROVED" 
                                      ? "bg-green-100 text-green-800" 
                                      : tx.state === "DECLINED" 
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {tx.state}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {transactions.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-gray-500">
                                No transactions found
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
                    onClick={() => syncSelectedTransactions(activeRecipe.id === 'failed-sync')}
                    className="btn-ramp"
                    disabled={selectedTransactions.size === 0}
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

        {/* Footer */}
        <footer className="mt-16 mb-8 text-center text-gray-400 text-sm">
          <p>© 2025 Ramp API Command Center</p>
        </footer>
      </main>
    </div>
  );
}