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
};

type CustomFieldOption = {
  id: string;
  field_id: string;
  value: string;
  code: string;
  is_active: boolean;
};

export default function CustomFieldsPage() {
  const [erpCustomFields, setERPCustomFields] = useState<CustomField[]>([]);
  const [rampCustomFields, setRampCustomFields] = useState<CustomField[]>([]);
  const [customFieldOptions, setCustomFieldOptions] = useState<CustomFieldOption[]>([]);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const router = useRouter();

  // Fetch ERP Custom Fields (From Database)
  useEffect(() => {
    fetch("/api/erp/custom-fields")
      .then((res) => res.json())
      .then((data) => setERPCustomFields(data))
      .catch((err) => console.error("❌ Error fetching ERP Custom Fields:", err));
  }, []);

  // Fetch Ramp Custom Fields (From Ramp API)
  useEffect(() => {
    fetch("/api/ramp/custom-fields")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data)) {
          setRampCustomFields(data);
        } else {
          console.error("❌ Invalid Ramp API Response Structure", data);
          setRampCustomFields([]); // Prevents UI errors
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("❌ Error fetching Ramp Custom Fields:", error);
        setRampCustomFields([]);
        setLoading(false);
      });
  }, []);

  

  
  

  // Fetch Custom Field Options When a Field is Selected
  const fetchCustomFieldOptions = (fieldId: string) => {
    fetch(`/api/erp/custom-field-options?field_id=${fieldId}`)
      .then((res) => res.json())
      .then((data) => setCustomFieldOptions(data))
      .catch(() => setCustomFieldOptions([]));
  };

  const handleRowClick = (field: CustomField) => {
    setSelectedField(field);
    fetchCustomFieldOptions(field.id);
  };

  // API Logging
  const logAction = (type: string, endpoint: string, method: string, message: any, isResponse: boolean = false) => {
    setApiLog((prev) => [
      {
        type: isResponse ? `📥 Response Received` : `📤 Request Sent`,
        endpoint,
        method,
        message: JSON.stringify(message, null, 2),
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  // **🔄 Sync ERP Custom Fields to Ramp**
  const syncERPFieldsToRamp = async () => {
    try {
      logAction("📤 Syncing Custom Fields", "/api/ramp/sync", "POST", {});

      const response = await fetch("/api/ramp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      logAction("📥 Response Received", "/api/ramp/sync", "POST", result, true);

      if (!response.ok) throw new Error(result.error || "Unknown error");

      alert("✅ Custom Fields successfully synced to Ramp!");
    } catch (error) {
      logAction("❌ Sync Error", "/api/ramp/sync", "POST", { error: error.message });
      alert("❌ Failed to sync Custom Fields.");
    }
  };

  // **🔄 Sync Field Options to Ramp**
  const syncFieldOptionsToRamp = async () => {
    try {
      logAction("📤 Syncing Field Options", "/api/ramp/custom-field-options/sync", "POST", {});

      const response = await fetch("/api/ramp/custom-field-options/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      logAction("📥 Response Received", "/api/ramp/custom-field-options/sync", "POST", result, true);

      if (!response.ok) throw new Error(result.error || "Unknown error");

      alert("✅ Field Options successfully synced to Ramp!");
    } catch (error) {
      logAction("❌ Sync Error", "/api/ramp/custom-field-options/sync", "POST", {
        error: (error as Error).message || "Unknown error",
      });
      
      alert("❌ Failed to sync Field Options.");
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading Custom Fields...</p>;

  return (
    <div className="page-container">
      <div className="header-container">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Custom Fields</h1>
        <div className="flex gap-4">
          <button onClick={syncERPFieldsToRamp} className="btn-ramp">🔄 Sync Fields</button>
          <button onClick={syncFieldOptionsToRamp} className="btn-ramp">🔄 Sync Field Options</button>
        </div>
      </div>

      {/* API Logs Toggle */}
      <button onClick={() => setShowLogs(!showLogs)} className="btn-ramp mb-4">📜 Toggle API Logs</button>
      <button onClick={() => router.push("/")} className="btn-ramp">← Back to Command Center</button>
      
      {showLogs && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">📜 API Logs</h2>
          <div className="space-y-2">
            {apiLog.map((log, index) => (
              <div key={index} className={`p-3 rounded ${log.type.includes("✅") ? "bg-green-100 text-green-800" : log.type.includes("❌") ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
                <span className="font-bold">{log.time} - {log.type}</span>
                <p className="text-sm text-gray-500">🔗 Endpoint: <span className="font-mono">{log.endpoint}</span> ({log.method})</p>
                <pre className="whitespace-pre-wrap text-sm">{log.message}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Three Table Layout */}
      <div className="flex-container">
        {/* ERP Custom Fields Table */}
        <div className="flex-item card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">ERP Custom Fields</h2>
          <div className="table-container">
            <table className="table-style">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Splittable</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {erpCustomFields.map((field) => (
                  <tr key={field.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleRowClick(field)}>
                    <td>{field.name}</td>
                    <td>{field.input_type}</td>
                    <td>{field.is_splittable}</td>
                    <td>
                      <span className={`status-pill ${field.is_active ? "bg-green-500" : "bg-red-500"}`}>
                        {field.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Field Options Table */}
        <div className="flex-item card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {selectedField ? `Field Options for: ${selectedField.name}` : "Select an ERP Field"}
          </h2>
          <div className="table-container">
            <table className="table-style">
              <thead>
                <tr>
                  <th>Value</th>
                  <th>Code</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {customFieldOptions.length > 0 ? (
                  customFieldOptions.map((option) => (
                    <tr key={option.id}>
                      <td>{option.value}</td>
                      <td>{option.code}</td>
                      <td>
                        <span className={`status-pill ${option.is_active ? "bg-green-500" : "bg-red-500"}`}>
                          {option.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500">No options available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ramp Custom Fields Table */}
        <div className="flex-item card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Ramp Custom Fields</h2>
          <div className="table-container">
            <table className="table-style">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Splittable</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {rampCustomFields.map((field) => (
                  <tr key={field.id}>
                    <td>{field.name}</td>
                    <td>{field.input_type}</td>
                    <td>{field.is_splittable}</td>
                    <td>
                      <span className={`status-pill ${field.is_active ? "bg-green-500" : "bg-red-500"}`}>
                        {field.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
