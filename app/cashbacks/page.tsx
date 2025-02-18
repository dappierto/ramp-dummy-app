"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Define Cashback Type
type Cashback = {
  id: string;
  entity_id: string;
  amount: {
    currency_code: string;
    amount: number;
  };
  created_at: string;
};

export default function CashbacksPage() {
  const [cashbacks, setCashbacks] = useState<Cashback[]>([]);
  const [selectedCashbacks, setSelectedCashbacks] = useState<Set<string>>(new Set());
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showRawData, setShowRawData] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [rawApiData, setRawApiData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const endpoint = "/api/cashbacks";
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        logAction("📥 API Fetch", endpoint, "GET", data);
        setRawApiData(data);
        setCashbacks(Array.isArray(data) ? data : []);
      })
      .catch((err) => logAction("❌ Error", endpoint, "GET", { error: err.message }));
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedCashbacks((prev) => {
      const newSelection = new Set(prev);
      newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
      return newSelection;
    });
  };

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

  const syncSelectedCashbacks = async (isFailure: boolean = false) => {
    if (selectedCashbacks.size === 0) {
      alert("❌ No cashbacks selected.");
      return;
    }

    const syncData: any = {
      idempotency_key: uuidv4(),
      sync_type: "STATEMENT_CREDIT_SYNC",
    };

    if (isFailure) {
      syncData.failed_syncs = Array.from(selectedCashbacks).map((id) => ({
        id,
        error: { message: "Mimicked sync failure - ERP system rejected the cashback." },
      }));
    } else {
      syncData.successful_syncs = Array.from(selectedCashbacks).map((id) => ({
        id,
        reference_id: uuidv4(),
      }));
    }

    const endpoint = "/api/sync";

    try {
      logAction("📤 Request Sent", endpoint, "POST", syncData);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncData),
      });

      const responseData = await response.json();

      logAction(response.ok ? "✅ Success" : "❌ Failure", endpoint, "POST", responseData);

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} - ${responseData.message || "Unknown error"}`);
      }

      alert(`✅ Successfully synced ${selectedCashbacks.size} cashback(s)!`);
      setSelectedCashbacks(new Set());
    } catch (error) {
      logAction("❌ Error", endpoint, "POST", { error: error.message });
      alert(`❌ Failed to sync selected cashbacks.`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🚀 Cashbacks</h1>
        <button onClick={() => router.push("/")} className="btn-ramp">← Back to Command Center</button>
      </div>

      {/* Master Sync Buttons */}
      <div className="flex gap-4 mb-4">
        <button className="btn-ramp" onClick={() => syncSelectedCashbacks(false)}>✅ Sync Selected</button>
        <button className="btn-danger" onClick={() => syncSelectedCashbacks(true)}>❌ Mimic Failed Sync</button>
      </div>

      {/* Cashbacks Table */}
      <div className="overflow-x-auto">
        <table className="table-style">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Cashback ID</th>
              <th>Entity ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            {cashbacks.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCashbacks.has(tx.id)}
                    onChange={() => toggleSelection(tx.id)}
                  />
                </td>
                <td>{tx.id}</td>
                <td>{tx.entity_id}</td>
                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                <td>${(tx.amount.amount / 100).toFixed(2)}</td>
                <td>{tx.amount.currency_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raw API Data */}
      <button onClick={() => setShowRawData(!showRawData)} className="btn-ramp mt-4">
        📜 Toggle Raw API Data
      </button>
      {showRawData && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(rawApiData, null, 2)}
        </pre>
      )}

      {/* API Log Panel */}
      <button onClick={() => setShowLogs(!showLogs)} className="btn-ramp mt-4">
        📜 Toggle API Logs
      </button>
      {showLogs && (
        <div className="bg-gray-100 p-4 mt-4 rounded overflow-auto">
          <h2 className="text-lg font-semibold mb-2">📜 API Logs</h2>
          <div className="space-y-2">
            {apiLog.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  log.type === "✅ Success"
                    ? "bg-green-100 text-green-800"
                    : log.type === "❌ Error"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <span className="font-bold">{log.time} - {log.type}</span>
                <p className="text-sm text-gray-500">
                  🔗 Endpoint: <span className="font-mono">{log.endpoint}</span> ({log.method})
                </p>
                <pre className="whitespace-pre-wrap text-sm">{log.message}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
