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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showRawData, setShowRawData] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [rawApiData, setRawApiData] = useState<any>(null);
  const router = useRouter();

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

  const syncSelectedTransactions = async (isFailure: boolean = false) => {
    if (selectedTransactions.size === 0) {
      alert("❌ No transactions selected.");
      return;
    }

    const syncData: any = {
      idempotency_key: uuidv4(),
      sync_type: "TRANSACTION_SYNC",
    };

    if (isFailure) {
      syncData.failed_syncs = Array.from(selectedTransactions).map((id) => ({
        id,
        error: { message: "Mimicked sync failure - ERP system rejected the transaction." },
      }));
    } else {
      syncData.successful_syncs = Array.from(selectedTransactions).map((id) => ({
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

      alert(`✅ Successfully synced ${selectedTransactions.size} transaction(s)!`);
      setSelectedTransactions(new Set());
    } catch (error) {
      logAction("❌ Error", endpoint, "POST", { error: error.message });
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
        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button 
            className="btn-ramp" 
            onClick={() => syncSelectedTransactions(false)}
          >
            ✅ Sync Selected
          </button>
          <button 
            className="btn-danger" 
            onClick={() => syncSelectedTransactions(true)}
          >
            ❌ Mimic Failed Sync
          </button>
        </div>

        {/* Transactions Table */}
        <div className="card mb-6">
          <div className="overflow-x-auto">
            <table className="table-style">
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
        </div>

        {/* Data and Logs Section */}
        <div className="space-y-6">
          {/* Raw API Data Section */}
          <div>
            <button 
              onClick={() => setShowRawData(!showRawData)} 
              className="btn-ramp mb-2"
            >
              {showRawData ? "🔼 Hide" : "🔽 Show"} Raw API Data
            </button>
            
            {showRawData && (
              <div className="card bg-gray-50 p-4">
                <pre className="overflow-auto max-h-96 text-sm">
                  {JSON.stringify(rawApiData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* API Logs Section */}
          <div>
            <button 
              onClick={() => setShowLogs(!showLogs)} 
              className="btn-ramp mb-2"
            >
              {showLogs ? "🔼 Hide" : "🔽 Show"} API Logs
            </button>
            
            {showLogs && (
              <div className="card bg-gray-50 p-4">
                <h2 className="text-lg font-semibold mb-4">📜 API Activity Logs</h2>
                <div className="space-y-3">
                  {apiLog.map((log, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded ${
                        log.type.includes("Success") 
                          ? "bg-green-50 border border-green-200" 
                          : log.type.includes("Error") 
                          ? "bg-red-50 border border-red-200" 
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold">
                          {log.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Endpoint:</span> 
                        <code className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-xs">
                          {log.endpoint} ({log.method})
                        </code>
                      </p>
                      <div className="mt-2 bg-white rounded p-2 max-h-40 overflow-auto">
                        <pre className="whitespace-pre-wrap text-xs">{log.message}</pre>
                      </div>
                    </div>
                  ))}
                  
                  {apiLog.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No API logs yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-8 text-center text-gray-400 text-sm">
          <p>© 2025 Ramp API Command Center</p>
        </footer>
      </main>
    </div>
  );
}