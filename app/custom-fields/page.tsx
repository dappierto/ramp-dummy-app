"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define Types
type CustomField = {
  id: string;
  name: string;
  input_type: string;
  is_splittable: string;
  is_active: boolean;
  ramp_id?: string;
  ramp_status?: 'not_synced' | 'synced_active' | 'synced_inactive';
};

type CustomFieldOption = {
  id?: string;
  value: string;
  field_id: string;
  ramp_field_option_id?: string;
  is_active: boolean;
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
  }[];
};

export default function CustomFieldsPage() {
  const [erpCustomFields, setERPCustomFields] = useState<CustomField[]>([]);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [fieldOptions, setFieldOptions] = useState<CustomFieldOption[]>([]);
  const [newOption, setNewOption] = useState<string>('');
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // New state for form
  const [newField, setNewField] = useState({
    name: '',
    input_type: 'FREE_FORM_TEXT',
    is_splittable: false,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();

  // Input type options
  const inputTypes = [
    { value: 'FREE_FORM_TEXT', label: 'Free Form Text' },
    { value: 'BOOLEAN', label: 'Boolean' },
    { value: 'SINGLE_CHOICE', label: 'Single Choice' }
  ];

  // Define recipes
  const recipes: Recipe[] = [
    {
      id: 'create-and-sync',
      title: '✨ Create & Sync Custom Field',
      description: 'Create a new custom field in your ERP system and sync it to Ramp.',
      steps: [
        {
          number: 1,
          title: 'Create Custom Field',
          description: 'Create a new custom field in your local database.',
          apiEndpoint: '/api/erp/custom-fields',
          apiMethod: 'POST'
        },
        {
          number: 2,
          title: 'Verify Creation',
          description: 'Verify the custom field was created successfully in your local database.',
          apiEndpoint: '/api/erp/custom-fields',
          apiMethod: 'GET'
        },
        {
          number: 3,
          title: 'Sync to Ramp',
          description: 'Sync the new custom field to Ramp using the accounting fields endpoint.',
          apiEndpoint: '/api/ramp/sync',
          apiMethod: 'POST'
        },
        {
          number: 4,
          title: 'Complete',
          description: 'Custom field has been successfully created and synced to Ramp.',
          apiEndpoint: '',
          apiMethod: ''
        }
      ]
    },
    {
      id: 'manage-field-options',
      title: '🔤 Manage Field Options',
      description: 'Add and sync options for a Single Choice custom field.',
      steps: [
        {
          number: 1,
          title: 'Select Field',
          description: 'Select a Single Choice custom field to manage its options.',
          apiEndpoint: '/api/erp/custom-fields',
          apiMethod: 'GET'
        },
        {
          number: 2,
          title: 'Add Options',
          description: 'Add one or more options for the selected field.',
          apiEndpoint: '/api/erp/custom-field-options',
          apiMethod: 'POST'
        },
        {
          number: 3,
          title: 'Sync to Ramp',
          description: 'Sync the field options to Ramp.',
          apiEndpoint: '/api/ramp/custom-field-options/sync',
          apiMethod: 'POST'
        },
        {
          number: 4,
          title: 'Complete',
          description: 'Field options have been successfully created and synced to Ramp.',
          apiEndpoint: '',
          apiMethod: ''
        }
      ]
    }
  ];

  // Fetch Custom Fields and their Ramp status
  const fetchCustomFields = async () => {
    setLoading(true);
    try {
      // First fetch ERP fields
      const erpResponse = await fetch("/api/erp/custom-fields");
      const erpResult = await erpResponse.json();
      const erpData = erpResult.data || erpResult;
      
      // Log the successful fetch with count information
      logAction("📥 Fetch Complete", "/api/erp/custom-fields", "GET", { 
        success: erpResult.success,
        count: erpResult.count || erpData.length,
        message: erpResult.message || "Custom fields retrieved"
      }, true);
      
      // Try to fetch Ramp fields, but don't let it block the UI if it fails
      let rampData = [];
      try {
        const rampResponse = await fetch("/api/ramp/custom-fields");
        if (rampResponse.ok) {
          const rampResult = await rampResponse.json();
          rampData = Array.isArray(rampResult) ? rampResult : [];
        } else {
          logAction("⚠️ Warning", "/api/ramp/custom-fields", "GET", { 
            warning: "Failed to fetch Ramp fields, will show fields as not synced",
            status: rampResponse.status,
            statusText: rampResponse.statusText
          });
        }
      } catch (rampError) {
        logAction("⚠️ Warning", "/api/ramp/custom-fields", "GET", { 
          warning: "Failed to fetch Ramp fields, will show fields as not synced",
          error: rampError instanceof Error ? rampError.message : String(rampError)
        });
      }
      
      // Map ERP fields with their Ramp sync status
      const mappedFields = erpData.map((field: CustomField) => {
        const rampField = rampData.find((rf: CustomField) => rf.name === field.name);
        return {
          ...field,
          ramp_status: !rampField ? 'not_synced' : 
                      rampField.is_active ? 'synced_active' : 
                      'synced_inactive'
        };
      });
      
      setERPCustomFields(mappedFields);
    } catch (error: any) {
      logAction("❌ Error", "/api/erp/custom-fields", "GET", { 
        error: error.message,
        details: "Failed to fetch custom fields"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch field options
  const fetchFieldOptions = async (fieldId: string) => {
    try {
      logAction("📤 Request", "/api/erp/custom-field-options", "GET", { field_id: fieldId });
      
      const response = await fetch(`/api/erp/custom-field-options?field_id=${fieldId}`);
      const data = await response.json();
      
      logAction("📥 Response", "/api/erp/custom-field-options", "GET", data, true);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch field options");
      }
      
      setFieldOptions(data);
    } catch (error) {
      logAction("❌ Error", "/api/erp/custom-field-options", "GET", { 
        error: error instanceof Error ? error.message : String(error)
      });
      alert("Failed to fetch field options: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Add a new option to the list
  const handleAddOption = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newOption.trim()) return;
    
    setFieldOptions(prev => [...prev, {
      value: newOption.trim(),
      field_id: selectedField!.id,
      is_active: true
    }]);
    setNewOption('');
  };

  // Remove an option from the list
  const handleRemoveOption = (index: number) => {
    setFieldOptions(prev => prev.filter((_, i) => i !== index));
  };

  // Save options to local database
  const handleSaveOptions = async () => {
    if (!selectedField || fieldOptions.length === 0) return;
    
    setIsSubmitting(true);
    try {
      logAction("📤 Request", "/api/erp/custom-field-options", "POST", {
        field_id: selectedField.id,
        options: fieldOptions
      });
      
      const response = await fetch("/api/erp/custom-field-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: selectedField.id,
          options: fieldOptions
        })
      });
      
      const data = await response.json();
      logAction("📥 Response", "/api/erp/custom-field-options", "POST", data, true);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save field options");
      }
      
      // Update field options with returned data (including IDs)
      setFieldOptions(data.options);
      setCurrentStep(2);
      
    } catch (error) {
      logAction("❌ Error", "/api/erp/custom-field-options", "POST", { 
        error: error instanceof Error ? error.message : String(error)
      });
      alert("Failed to save field options: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync options to Ramp
  const handleSyncOptions = async () => {
    if (!selectedField || fieldOptions.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Filter out options that are already synced
      const unsyncedOptions = fieldOptions.filter(option => !option.ramp_field_option_id);
      
      if (unsyncedOptions.length === 0) {
        alert("All options have already been synced to Ramp!");
        setCurrentStep(3);
        return;
      }

      logAction("📤 Request", "/api/ramp/custom-field-options/sync", "POST", {
        field_id: selectedField.id,
        options: unsyncedOptions.map(opt => ({
          id: opt.id,
          value: opt.value
        }))
      });
      
      const response = await fetch("/api/ramp/custom-field-options/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_id: selectedField.id,
          options: unsyncedOptions.map(opt => ({
            id: opt.id,
            value: opt.value
          }))
        })
      });
      
      const data = await response.json();
      logAction("📥 Response", "/api/ramp/custom-field-options/sync", "POST", data, true);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to sync field options to Ramp");
      }
      
      // Refresh field options to get updated Ramp IDs
      await fetchFieldOptions(selectedField.id);
      
      // Show success message with counts
      const successCount = unsyncedOptions.length;
      const totalCount = fieldOptions.length;
      alert(`✅ Successfully synced ${successCount} new options to Ramp!\n${totalCount - successCount} options were already synced.`);
      
      setCurrentStep(3);
      
    } catch (error) {
      logAction("❌ Error", "/api/ramp/custom-field-options/sync", "POST", { 
        error: error instanceof Error ? error.message : String(error)
      });
      alert("Failed to sync field options: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCustomFields();
  }, []);

  // API Logging
  const logAction = (type: string, endpoint: string, method: string, message: any, isResponse: boolean = false) => {
    // Determine if this is a local or Ramp API operation
    const isLocalOperation = endpoint.startsWith('/api/erp');
    const isRampOperation = endpoint.startsWith('/api/ramp');
    
    // Create a prefix for the type
    let typePrefix = '';
    if (isLocalOperation) {
      typePrefix = '[LOCAL] ';
    } else if (isRampOperation) {
      typePrefix = '[RAMP API] ';
    }
    
    // Map local endpoints to Ramp API endpoints
    const getRampEndpoint = (localEndpoint: string): string => {
      const endpointMap: { [key: string]: string } = {
        '/api/erp/custom-fields': 'https://demo-api.ramp.com/developer/v1/custom-fields',
        '/api/ramp/sync': 'https://demo-api.ramp.com/developer/v1/accounting/fields',
        '/api/ramp/custom-fields': 'https://demo-api.ramp.com/developer/v1/accounting/fields'
      };
      return endpointMap[localEndpoint] || localEndpoint;
    };

    setApiLog((prev) => [
      {
        type: `${typePrefix}${isResponse ? '📥 Response' : '📤 Request'}`,
        endpoint: isRampOperation ? getRampEndpoint(endpoint) : endpoint,
        method,
        message: JSON.stringify(message, null, 2),
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };

  // Utility function for message preview
  const getMessagePreview = (message: string) => {
    try {
      const parsed = JSON.parse(message);
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        return `Array[${parsed.length} items]`;
      } else if (typeof parsed === 'object') {
        // Check if this is a raw Ramp response
        if ('rawRampResponses' in parsed && Array.isArray(parsed.rawRampResponses)) {
          return `Raw Ramp Responses: ${parsed.rawRampResponses.length} items`;
        }
        
        // Check if this is an individual raw Ramp response
        if ('id' in parsed && 'name' in parsed && !('input_type' in parsed)) {
          return `Ramp Response: ID: ${parsed.id}, Name: ${parsed.name}`;
        }
        
        // Check if this is an actual payload to Ramp
        if ('name' in parsed && 'input_type' in parsed) {
          return `Field: ${parsed.name}, ID: ${parsed.id || 'N/A'}, Type: ${parsed.input_type}, Splittable: ${parsed.is_splittable}`;
        }
        
        // Check for fields array (sync request)
        if ('fields' in parsed && Array.isArray(parsed.fields)) {
          return `Syncing ${parsed.fields.length} fields: ${parsed.fields.join(', ')}`;
        }
        
        // Check for results array (sync response)
        if ('results' in parsed && Array.isArray(parsed.results)) {
          const successCount = parsed.results.filter((r: any) => r.success).length;
          const failCount = parsed.results.length - successCount;
          if (parsed.results.length === 0) {
            return `No fields to sync`;
          }
          return `Results: ${successCount} succeeded, ${failCount} failed`;
        }
        
        // Check for success/error status
        if ('success' in parsed) {
          return parsed.success 
            ? `✅ Success: ${parsed.message || 'Operation completed'}`
            : `❌ Error: ${parsed.error || 'Operation failed'}`;
        }
        
        // Check for count information
        if ('count' in parsed) {
          return `📊 ${parsed.count} items`;
        }
        
        // Check for message
        if ('message' in parsed) {
          return `📝 ${parsed.message}`;
        }
        
        // Check for error information
        if ('error' in parsed) {
          return `❌ Error: ${parsed.error}${parsed.details ? ` - ${parsed.details}` : ''}`;
        }
        
        // Default object preview
        return `Object{${Object.keys(parsed).join(', ')}}`;
      }
      return message;
    } catch {
      return message;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First, create in local database
      logAction("📤 Request", "/api/erp/custom-fields", "POST", newField);
      
      const response = await fetch("/api/erp/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newField)
      });
      
      const result = await response.json();
      logAction("📥 Response", "/api/erp/custom-fields", "POST", result, true);
      
      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to create custom field");
      }
      
      // Refresh the fields list
      await fetchCustomFields();
      
      // Clear the form
      setNewField({
        name: '',
        input_type: 'FREE_FORM_TEXT',
        is_splittable: false,
        is_active: true
      });
      
      // Show success message
      alert(result.message || "✅ Custom field created successfully!");
      
      // Move to next step
      setCurrentStep(1);
    } catch (error: any) {
      logAction("❌ Error", "/api/erp/custom-fields", "POST", { 
        error: error.message,
        details: "Failed to create custom field"
      });
      alert("Failed to create custom field: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sync to Ramp
  const handleSync = async () => {
    if (currentStep !== 2) return;
    
    setIsSubmitting(true);
    
    try {
      // Log the unsynced fields that will be sent to Ramp
      // Get the count of unsynced fields first
      const erpResponse = await fetch("/api/erp/custom-fields");
      const erpResult = await erpResponse.json();
      const erpData = erpResult.data || erpResult;
      
      // Count unsynced fields
      const unsyncedFields = erpData.filter((field: CustomField) => !field.ramp_id);
      
      // This is just for UI display, not the actual payload sent to the API
      const requestInfo = {
        message: "Syncing custom fields to Ramp",
        unsyncedCount: unsyncedFields.length,
        fields: unsyncedFields.map((f: CustomField) => f.name)
      };
      
      logAction("📤 Request Info", "/api/ramp/sync", "POST", requestInfo);
      
      // Log the actual payloads that will be sent to Ramp
      unsyncedFields.forEach((field: CustomField) => {
        const actualPayload = {
          id: field.id,
          name: field.name,
          input_type: field.input_type,
          is_splittable: field.is_splittable === "true"
        };
        
        logAction("📤 Actual Payload", "/api/ramp/sync", "POST", actualPayload);
      });
      
      const response = await fetch("/api/ramp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await response.json();
      
      // Log the actual raw response from Ramp
      logAction("📥 Raw Ramp Response", "/api/ramp/sync", "POST", data, true);
      
      // Log each individual raw Ramp response if available
      if (data.rawRampResponses && Array.isArray(data.rawRampResponses)) {
        data.rawRampResponses.forEach((rawResponse: any, index: number) => {
          logAction(`📥 Raw Ramp Response for Field ${index + 1}`, "/api/ramp/sync", "POST", rawResponse, true);
        });
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to sync to Ramp");
      }
      
      // Refresh the fields list to show updated sync status
      await fetchCustomFields();
      
      // Move to completion
      setCurrentStep(3);
      
      // Show success message with details
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failCount = data.results?.filter((r: any) => !r.success).length || 0;
      
      let message = "✅ Successfully synced custom fields to Ramp!";
      if (successCount > 0 || failCount > 0) {
        message += `\n${successCount} fields synced successfully.`;
        if (failCount > 0) {
          message += `\n${failCount} fields failed to sync.`;
        }
      }
      
      alert(message);
    } catch (error: any) {
      logAction("❌ Error", "/api/ramp/sync", "POST", { 
        error: error.message,
        details: "Failed to sync custom fields to Ramp"
      });
      alert("Failed to sync to Ramp: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Custom Fields</h1>
            <button onClick={() => router.push("/")} className="btn-ramp">
              ← Back to Command Center
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Recipe Selection */}
        {!activeRecipe ? (
          <div className="grid md:grid-cols-1 gap-6 mb-8">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id}
                className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setActiveRecipe(recipe);
                  fetchCustomFields();
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
            {/* Recipe Header */}
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

              {/* Create Custom Field Form - Only show in step 1 of create-and-sync recipe */}
              {activeRecipe.id === 'create-and-sync' && currentStep === 0 && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newField.name}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter field name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Input Type
                    </label>
                    <select
                      value={newField.input_type}
                      onChange={(e) => setNewField(prev => ({ ...prev, input_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inputTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newField.is_splittable}
                        onChange={(e) => setNewField(prev => ({ ...prev, is_splittable: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Is Splittable</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newField.is_active}
                        onChange={(e) => setNewField(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Is Active</span>
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-ramp w-full flex justify-center items-center"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        'Create Custom Field'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Field Options Management - For manage-field-options recipe */}
              {activeRecipe.id === 'manage-field-options' && (
                <div className="space-y-4 mb-6">
                  {/* Step 1: Select Field */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {erpCustomFields
                          .filter(field => field.input_type === 'SINGLE_CHOICE' && field.ramp_status === 'synced_active')
                          .map(field => (
                            <button
                              key={field.id}
                              onClick={() => {
                                setSelectedField(field);
                                fetchFieldOptions(field.id);
                                setCurrentStep(1);
                              }}
                              className="p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium">{field.name}</div>
                              <div className="text-sm text-gray-500">✓ Synced with Ramp</div>
                            </button>
                        ))}
                      </div>
                      {erpCustomFields.filter(field => 
                        field.input_type === 'SINGLE_CHOICE' && 
                        field.ramp_status === 'synced_active'
                      ).length === 0 && (
                        <div className="text-center p-4 border border-gray-200 rounded-lg">
                          <p className="text-gray-500">No synced Single Choice fields available.</p>
                          <p className="text-sm text-gray-400 mt-2">Create and sync a Single Choice field first.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Add Options */}
                  {currentStep === 1 && selectedField && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-700">Selected Field: {selectedField.name}</h4>
                        <p className="text-sm text-blue-600 mt-1">Add options for this field below</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Add New Option
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter option value"
                          />
                          <button
                            onClick={handleAddOption}
                            disabled={!newOption.trim()}
                            className="btn-ramp"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Options</h4>
                        <div className="space-y-2">
                          {fieldOptions.map((option, index) => (
                            <div
                              key={option.id || index}
                              className="flex items-center justify-between p-2 border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span>{option.value}</span>
                                {option.ramp_field_option_id && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    ✓ Synced to Ramp
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveOption(index)}
                                className="text-red-500 hover:text-red-600"
                                disabled={!!option.ramp_field_option_id}
                              >
                                {option.ramp_field_option_id ? 'Synced' : 'Remove'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {fieldOptions.length > 0 && (
                        <button
                          onClick={handleSaveOptions}
                          className="btn-ramp w-full mt-4"
                        >
                          Save Options
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 3: Sync options to Ramp */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <button
                        onClick={handleSyncOptions}
                        disabled={isSubmitting}
                        className="btn-ramp w-full"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Syncing...</span>
                          </div>
                        ) : (
                          'Sync Options to Ramp'
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 4: Completion */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-700">✅ Success!</h4>
                        <p className="text-sm text-green-600">Field options have been successfully synced to Ramp.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Fields Table - Only show for create-and-sync recipe */}
              {activeRecipe.id === 'create-and-sync' && (
                <div className="overflow-x-auto">
                  <table className="table-style">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>ERP Status</th>
                        <th>Ramp Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        erpCustomFields.map((field) => (
                          <tr key={field.id}>
                            <td>{field.name}</td>
                            <td>{field.input_type}</td>
                            <td>
                              <span className={`status-pill ${field.is_active ? "bg-green-500" : "bg-red-500"}`}>
                                {field.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <span className={`status-pill ${
                                field.ramp_status === 'synced_active' ? "bg-green-500" :
                                field.ramp_status === 'synced_inactive' ? "bg-yellow-500" :
                                "bg-gray-500"
                              }`}>
                                {field.ramp_status === 'synced_active' ? "Synced" :
                                 field.ramp_status === 'synced_inactive' ? "Inactive in Ramp" :
                                 "Not Synced"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
                {activeRecipe.id === 'create-and-sync' && currentStep === 2 ? (
                  <button
                    onClick={handleSync}
                    disabled={isSubmitting}
                    className="btn-ramp flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Syncing...
                      </>
                    ) : (
                      <>Sync to Ramp</>
                    )}
                  </button>
                ) : currentStep === 3 ? (
                  <button
                    onClick={() => {
                      setActiveRecipe(null);
                      setCurrentStep(0);
                    }}
                    className="btn-ramp"
                  >
                    Start New Recipe
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep(prev => Math.min(activeRecipe.steps.length - 1, prev + 1))}
                    className="btn-ramp"
                    disabled={currentStep === activeRecipe.steps.length - 1}
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
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          </div>
          
          {showLogs && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2 max-h-96 overflow-auto">
              {apiLog.map((log, index) => (
                <div 
                  key={index} 
                  className={`bg-gray-50 rounded-lg overflow-hidden border ${
                    log.type.includes('Raw Ramp Response') ? 'border-purple-500' : 
                    log.type.includes('Actual Payload') ? 'border-blue-500' : 
                    'border-gray-200'
                  }`}
                  onClick={() => {
                    setExpandedLogs(prev => {
                      const next = new Set(prev);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    });
                  }}
                >
                  <div className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 ${
                    log.type.includes('Raw Ramp Response') ? 'bg-purple-50' : 
                    log.type.includes('Actual Payload') ? 'bg-blue-50' : 
                    ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${
                        log.type.includes('Raw Ramp Response') ? 'text-purple-600' : 
                        log.type.includes('Actual Payload') ? 'text-blue-600' : 
                        ''
                      }`}>{log.type}</span>
                      <span className="text-sm text-gray-600">{log.method} {log.endpoint}</span>
                    </div>
                    <span className="text-sm text-gray-500">{log.time}</span>
                  </div>
                  
                  {expandedLogs.has(index) ? (
                    <pre className="p-3 text-sm font-mono overflow-auto bg-gray-100">{log.message}</pre>
                  ) : (
                    <div className="px-3 pb-3 text-sm text-gray-600">
                      <span className="font-mono">{getMessagePreview(log.message)}</span>
                    </div>
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
