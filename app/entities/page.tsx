"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define types
type ERPEntity = {
  entity_id: string;
  entity_name: string;
  ramp_entity_id?: string;
};

type RampEntity = {
  id: string;
  entity_name: string;
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

export default function EntitiesPage() {
  const [entities, setEntities] = useState<ERPEntity[]>([]);
  const [rampEntities, setRampEntities] = useState<RampEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntityName, setNewEntityName] = useState("");
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Define recipes
  const recipes: Recipe[] = [
    {
      id: 'create-and-sync',
      title: '🔄 Create & Sync Entity Flow',
      description: 'Add a new entity to your ERP system and sync it with Ramp.',
      steps: [
        {
          number: 1,
          title: 'Create New Entity',
          description: 'First, create a new entity in your ERP system. The entity name should match exactly with what exists in Ramp.',
          apiEndpoint: '/api/erp/entities',
          apiMethod: 'POST',
          apiPayload: {
            entity_name: "Example Corp"
          }
        },
        {
          number: 2,
          title: 'View Entity Matching',
          description: 'Review your ERP entities and see which ones match with Ramp entities. Matches are determined by exact name matching.',
          showComparison: true,
          action: () => fetchRampEntities()
        },
        {
          number: 3,
          title: 'Sync with Ramp',
          description: 'Match your ERP entities with Ramp entities based on exact name matching.',
          apiEndpoint: '/api/ramp/entities/sync',
          apiMethod: 'GET'
        }
      ]
    }
  ];

  useEffect(() => {
    fetchEntities();
    fetchRampEntities();
  }, []);

  const logAction = (type: string, endpoint: string, method: string, message: any) => {
    setApiLog((prev) => [
      {
        type,
        endpoint,
        method,
        message: JSON.stringify(message, null, 2),
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  // Fetch Ramp Entities
  const fetchRampEntities = async () => {
    try {
      const response = await fetch("/api/ramp/entities");
      logAction("📤 Request", "/api/ramp/entities", "GET", null);
      
      const data = await response.json();
      
      if (!response.ok) {
        logAction("❌ Error", "/api/ramp/entities", "GET", data);
        console.error("Failed to fetch Ramp entities:", data);
        return;
      }
      
      logAction("✅ Success", "/api/ramp/entities", "GET", data);
      
      if (Array.isArray(data)) {
        const mappedEntities = data.map((entity: any) => ({
          id: entity.id,
          entity_name: entity.name || entity.entity_name // Try both name formats
        }));
        setRampEntities(mappedEntities);
      } else {
        console.error("❌ Invalid Ramp entities Response:", data);
        setRampEntities([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Error fetching Ramp entities:", error);
        logAction("❌ Error", "/api/ramp/entities", "GET", { error: error.message });
      }
      setRampEntities([]);
    }
  };

  // Fetch Entities from ERP API
  const fetchEntities = async () => {
    try {
      const res = await fetch("/api/erp/get-entities");
      const data = await res.json();
      
      logAction("📥 Fetch", "/api/erp/get-entities", "GET", data);
      
      if (Array.isArray(data)) {
        setEntities(data);
      } else {
        console.error("❌ Invalid entities Response:", data);
        setEntities([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("❌ Error fetching entities:", error);
        logAction("❌ Error", "/api/erp/get-entities", "GET", { error: error.message });
      }
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new entity
  const addEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;

    try {
      const payload = { entity_name: newEntityName.trim() };
      logAction("📤 Request", "/api/erp/entities", "POST", payload);

      const response = await fetch("/api/erp/entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to create entity");

      logAction("✅ Success", "/api/erp/entities", "POST", data);
      await fetchEntities();
      setNewEntityName("");
      setShowForm(false);
      
      if (activeRecipe) {
        setCurrentStep(prev => Math.min(prev + 1, activeRecipe.steps.length - 1));
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to create entity:", error);
        logAction("❌ Error", "/api/erp/entities", "POST", { error: error.message });
        alert("Failed to create entity. Please try again.");
      }
    }
  };

  // Sync with Ramp
  const syncWithRamp = async () => {
    setSyncStatus("Syncing with Ramp...");
    try {
      logAction("📤 Request", "/api/ramp/entities/sync", "GET", null);
      
      const response = await fetch("/api/ramp/entities/sync");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Sync failed");

      logAction("✅ Success", "/api/ramp/entities/sync", "GET", data);
      await fetchEntities();
      setSyncStatus("✅ Sync complete!");
      setTimeout(() => setSyncStatus(""), 3000);
      
      if (activeRecipe) {
        setActiveRecipe(null);
        setCurrentStep(0);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Sync failed:", error);
        logAction("❌ Error", "/api/ramp/entities/sync", "GET", { error: error.message });
        setSyncStatus("❌ Sync failed. Please try again.");
      }
    }
  };

  // Check if an entity name exists in Ramp
  const getMatchStatus = (entityName: string) => {
    const match = rampEntities.find(re => 
      re && re.entity_name && entityName &&
      re.entity_name.toLowerCase() === entityName.toLowerCase()
    );
    return match ? "✅ Match Found" : "❌ No Match";
  };

  // Check if a Ramp entity has an ERP match
  const hasERPMatch = (rampEntityName: string) => {
    return entities.some(e => 
      e && e.entity_name && rampEntityName &&
      e.entity_name.toLowerCase() === rampEntityName.toLowerCase()
    );
  };

  // Utility function for log message preview
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

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading Entities...</p>;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">🏢 ERP Entities</h1>
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
          <div className="grid md:grid-cols-1 gap-6 mb-8">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id}
                className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveRecipe(recipe)}
              >
                <h2 className="text-xl font-bold mb-2">{recipe.title}</h2>
                <p className="text-gray-600 mb-4">{recipe.description}</p>
                <button className="btn-ramp">Start Recipe</button>
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

              {/* Entity Comparison */}
              {activeRecipe.steps[currentStep].showComparison && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold">Entity Comparison</h4>
                    <button
                      onClick={fetchRampEntities}
                      className="text-sm btn-secondary flex items-center gap-2"
                    >
                      🔄 Refresh Ramp Entities
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* ERP Entities */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">ERP Entities</h4>
                      <div className="bg-white rounded-lg shadow">
                        {entities.map(entity => (
                          <div key={entity.entity_id} className="p-3 border-b last:border-b-0">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{entity.entity_name}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                getMatchStatus(entity.entity_name).includes("✅") 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {getMatchStatus(entity.entity_name)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {entities.length === 0 && (
                          <p className="p-3 text-gray-500 text-sm">No ERP entities found</p>
                        )}
                      </div>
                    </div>

                    {/* Ramp Entities */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Ramp Entities</h4>
                      <div className="bg-white rounded-lg shadow">
                        {rampEntities.map(entity => (
                          <div key={entity.id} className="p-3 border-b last:border-b-0">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{entity.entity_name}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                hasERPMatch(entity.entity_name)
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {hasERPMatch(entity.entity_name)
                                  ? "✅ Has ERP Match"
                                  : "⚠️ No ERP Match"}
                              </span>
                            </div>
                          </div>
                        ))}
                        {rampEntities.length === 0 && (
                          <p className="p-3 text-gray-500 text-sm">No Ramp entities found</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  {activeRecipe.steps[currentStep].apiPayload && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Example Payload:</p>
                      <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(activeRecipe.steps[currentStep].apiPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Step Actions */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  className="btn-ramp"
                  disabled={currentStep === 0}
                >
                  ← Previous Step
                </button>
                {currentStep === 0 ? (
                  <button 
                    className="btn-ramp"
                    onClick={() => setShowForm(true)}
                  >
                    Create New Entity
                  </button>
                ) : currentStep === activeRecipe.steps.length - 1 ? (
                  <button
                    onClick={syncWithRamp}
                    className="btn-ramp"
                  >
                    Sync with Ramp
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={fetchRampEntities}
                      className="btn-secondary"
                    >
                      🔄 Refresh
                    </button>
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
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Entity Form */}
        {showForm && (
          <div className="card mb-6 p-6">
            <form onSubmit={addEntity} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Name
                </label>
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="Enter entity name (must match Ramp entity name)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-ramp">
                  Add Entity
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setNewEntityName("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Entities Table */}
        <div id="entities-table" className="card">
          <div className="overflow-x-auto">
            <table className="table-style">
              <thead>
                <tr>
                  <th>ERP ID</th>
                  <th>Name</th>
                  <th>Ramp ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entities.length > 0 ? (
                  entities.map((entity) => (
                    <tr key={entity.entity_id} className="hover:bg-gray-50">
                      <td>{entity.entity_id}</td>
                      <td>{entity.entity_name}</td>
                      <td>{entity.ramp_entity_id || "—"}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entity.ramp_entity_id 
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {entity.ramp_entity_id ? "Synced" : "Not Synced"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-4">
                      No entities available. Add your first entity to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
