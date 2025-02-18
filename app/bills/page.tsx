"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

type Bill = {
  id: string;
  invoice_number: string;
  vendor: { name: string };
  amount: { currency_code: string; amount: number };
  due_at: string;
  issued_at: string;
  approval_status: string;
  sync_status: string;
  status: string;
  memo: string | null;
  deep_link_url?: string | null;
};

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showRawData, setShowRawData] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [rawApiData, setRawApiData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const endpoint = "/api/bills";
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        logAction("📥 API Fetch", endpoint, "GET", data);
        setRawApiData(data);
        setBills(Array.isArray(data) ? data : []);
      })
      .catch((err) => logAction("❌ Error", endpoint, "GET", { error: err.message }));
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedBills((prev) => {
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

  const syncSelectedBills = async (isFailure: boolean = false) => {
    if (selectedBills.size === 0) {
      alert("❌ No bills selected.");
      return;
    }

    const syncData: any = {
      idempotency_key: uuidv4(),
      sync_type: "BILL_SYNC",
    };

    if (isFailure) {
      syncData.failed_syncs = Array.from(selectedBills).map((id) => ({
        id,
        error: { message: "Mimicked sync failure - ERP system rejected the bill." },
      }));
    } else {
      syncData.successful_syncs = Array.from(selectedBills).map((id) => ({
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

      alert(`✅ Successfully synced ${selectedBills.size} bill(s)!`);
      setSelectedBills(new Set());
    } catch (error) {
      logAction("❌ Error", endpoint, "POST", { error: error.message });
      alert(`❌ Failed to sync selected bills.`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🚀 Bills</h1>
        <button onClick={() => router.push("/")} className="btn-ramp">← Back to Command Center</button>
      </div>

      {/* Master Sync Buttons */}
      <div className="flex gap-4 mb-4">
        <button className="btn-ramp" onClick={() => syncSelectedBills(false)}>✅ Sync Selected</button>
        <button className="btn-danger" onClick={() => syncSelectedBills(true)}>❌ Mimic Failed Sync</button>
      </div>

      {/* Bills Table */}
      <div className="overflow-x-auto">
        <table className="table-style">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Invoice #</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Approval Status</th>
              <th>Sync Status</th>
              <th>Status</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedBills.has(bill.id)}
                    onChange={() => toggleSelection(bill.id)}
                  />
                </td>
                <td>{bill.invoice_number || "—"}</td>
                <td>{bill.vendor?.name || "—"}</td>
                <td>{bill.amount.currency_code} ${(bill.amount.amount / 100).toFixed(2)}</td>
                <td>{new Date(bill.due_at).toLocaleDateString()}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-white ${bill.approval_status === "APPROVED" ? "bg-green-500" : "bg-yellow-500"}`}>
                    {bill.approval_status}
                  </span>
                </td>
                <td>
                  <span className={`px-2 py-1 rounded text-white ${bill.sync_status === "BILL_SYNCED" ? "bg-blue-500" : "bg-red-500"}`}>
                    {bill.sync_status}
                  </span>
                </td>
                <td>{bill.status}</td>
                <td>{bill.memo || "—"}</td>
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
              <div key={index} className={`p-3 rounded ${log.type.includes("Success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
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
