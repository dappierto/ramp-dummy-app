"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Define the Field Option Type
type FieldOption = {
  id: string;
  value: string;
  ramp_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export default function FieldOptionsPage({ params }: { params: Promise<{ ramp_id: string }> }) {
  const { ramp_id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [fieldName, setFieldName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [newOption, setNewOption] = useState({ id: "", value: "" });
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // ✅ Extract field name from query parameters
  useEffect(() => {
    const nameFromQuery = searchParams.get("name");
    if (nameFromQuery) {
      setFieldName(decodeURIComponent(nameFromQuery));
    }
  }, [searchParams]);

  // 🔵 Fetch Existing Field Options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const endpoint = `/api/field-options?field_id=${ramp_id}`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Error fetching options: ${response.statusText}`);

        const data = await response.json();
        setFieldOptions(data.data || []);
        logAction("📥 API Fetch", endpoint, "GET", data);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching field options:", error);
        setLoading(false);
      }
    };

    fetchOptions();
  }, [ramp_id]);

  // ✅ Log API Actions
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

  // 🔵 Sync New Field Options to Ramp
  const syncNewOptions = async () => {
    if (!newOption.id || !newOption.value) {
      alert("❌ Please enter both an ID and a Value.");
      return;
    }

    const payload = {
      field_id: ramp_id,
      options: [{ id: newOption.id, value: newOption.value }],
    };

    const endpoint = "/api/field-options";

    try {
      logAction("📤 Request Sent", endpoint, "POST", payload);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      logAction(response.ok ? "✅ Success" : "❌ Failure", endpoint, "POST", result);

      if (!response.ok) {
        throw new Error(result.message || "Unknown sync error");
      }

      // ✅ Add new option to UI
      setFieldOptions((prev) => [
        ...prev,
        {
          id: newOption.id,
          value: newOption.value,
          ramp_id: result.uploaded?.[0] || "Sync Failed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
      ]);

      setNewOption({ id: "", value: "" });
      alert("✅ Successfully synced new option!");
    } catch (error) {
      console.error("❌ Error syncing new field option:", error);
      alert("❌ Failed to sync new field option.");
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading Field Options...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          📂 Field Options for <span className="text-blue-600">{fieldName || "Unknown Field"}</span>
        </h1>
        <button onClick={() => router.push("/custom-fields")} className="btn-ramp">
          ← Back to Custom Fields
        </button>
      </div>

      {/* Add New Field Option */}
      <div className="bg-gray-100 p-4 mb-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800">Add New Field Option</h2>
        <div className="flex gap-3 mt-3">
          <input
            type="text"
            placeholder="Option ID"
            className="p-2 rounded bg-white border w-1/4"
            value={newOption.id}
            onChange={(e) => setNewOption({ ...newOption, id: e.target.value })}
          />
          <input
            type="text"
            placeholder="Option Value"
            className="p-2 rounded bg-white border w-1/2"
            value={newOption.value}
            onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
          />
          <button className="btn-ramp" onClick={syncNewOptions}>
            Add Option
          </button>
        </div>
      </div>

      {/* Field Options Table */}
      <div className="overflow-x-auto">
        <table className="table-style">
          <thead>
            <tr>
              <th>ID</th>
              <th>Value</th>
              <th>Ramp ID</th>
            </tr>
          </thead>
          <tbody>
            {fieldOptions.length > 0 ? (
              fieldOptions.map((option) => (
                <tr key={option.id}>
                  <td>{option.id}</td>
                  <td>{option.value}</td>
                  <td className="text-gray-500">
                    {option.ramp_id ? "Imported from Ramp" : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center p-4 text-gray-400">
                  No options found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* API Logs */}
      <button onClick={() => setShowLogs(!showLogs)} className="btn-ramp mt-4">📜 Toggle API Logs</button>
      {showLogs && (
        <div className="bg-gray-100 p-4 mt-4 rounded overflow-auto">
          <h2 className="text-lg font-semibold mb-2">📜 API Logs</h2>
          <div className="space-y-2">
            {apiLog.map((log, index) => (
              <div key={index} className={`p-3 rounded ${log.type.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <span className="font-bold">{log.time} - {log.type}</span>
                <p className="text-sm text-gray-500">🔗 Endpoint: <span className="font-mono">{log.endpoint}</span> ({log.method})</p>
                <pre className="whitespace-pre-wrap text-sm">{log.message}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
