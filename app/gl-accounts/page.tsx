"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Define GL Account type (Ramp)
type GLAccount = {
  id: string;
  ramp_id?: string;
  name: string;
  code?: string;
  classification: string;
  is_active: boolean;
  created_at: string;
};

// Define ERP Account type
type ERPAccount = {
  id: string;
  name: string;
  code?: string;
  type: string; // Maps to "classification" in Ramp
  is_active: boolean;
};

export default function GLAccountsPage() {
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
  const [erpAccounts, setERPAccounts] = useState<ERPAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchERPAccounts();
    fetchGLAccounts();
  }, []);

  // Fetch ERP Accounts
  const fetchERPAccounts = () => {
    const endpoint = "/api/erp-accounts";
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        logAction("📥 ERP Accounts Fetched", endpoint, "GET", data);
        setERPAccounts(Array.isArray(data) ? data : []);
        const sortedData = data.sort((a: ERPAccount, b: ERPAccount) => Number(b.is_active) - Number(a.is_active));

        setERPAccounts(Array.isArray(sortedData) ? sortedData : []);
      })
      
      .catch((err) => logAction("❌ Error", endpoint, "GET", { error: err.message }));
  };

  // Fetch Ramp GL Accounts
  const fetchGLAccounts = () => {
    const endpoint = "/api/gl-accounts";
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        logAction("📥 GL Accounts Fetched", endpoint, "GET", data);
        setGLAccounts(Array.isArray(data) ? data : []);
        const sortedData = data.sort((a: GLAccount, b: GLAccount) => Number(b.is_active) - Number(a.is_active));

        setGLAccounts(Array.isArray(sortedData) ? sortedData : []);
        setLoading(false);
        setLoading(false);
      })
      .catch((err) => logAction("❌ Error", endpoint, "GET", { error: err.message }));
  };

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
  

  // **🔹 Sync All Unsynced ERP Accounts to Ramp**
  const syncAllERPToRamp = async () => {
    if (erpAccounts.length === 0) {
      alert("❌ No ERP accounts available for syncing.");
      return;
    }
  
    const unsyncedERPAccounts = erpAccounts.filter(
      (erpAcc) => !glAccounts.some((glAcc) => glAcc.id === erpAcc.id) // Not in Ramp yet
    );
  
    const inactiveERPAccounts = erpAccounts
      .filter((erpAcc) => !erpAcc.is_active) // Inactive in ERP
      .map((erpAcc) => ({
        ...erpAcc,
        ramp_id: glAccounts.find((glAcc) => glAcc.id === erpAcc.id)?.ramp_id,
      }))
      .filter((account) => account.ramp_id); // Ensure ramp_id exists
  
    const reactivatedERPAccounts = erpAccounts
      .filter((erpAcc) => erpAcc.is_active) // Active in ERP
      .map((erpAcc) => ({
        ...erpAcc,
        ramp_id: glAccounts.find((glAcc) => glAcc.id === erpAcc.id && !glAcc.is_active)?.ramp_id,
      }))
      .filter((account) => account.ramp_id); // Ensure ramp_id exists
  
    if (unsyncedERPAccounts.length === 0 && inactiveERPAccounts.length === 0 && reactivatedERPAccounts.length === 0) {
      alert("✅ All ERP accounts are synced, no deletions or reactivations required.");
      return;
    }
  
    try {
      // 🔹 **Sync New Accounts to Ramp**
      if (unsyncedERPAccounts.length > 0) {
        const payload = {
          gl_accounts: unsyncedERPAccounts.map((erpAcc) => ({
            id: erpAcc.id,
            name: erpAcc.name,
            code: erpAcc.code || "",
            classification: erpAcc.type,
          })),
        };
  
        // Log the payload before making the API request
        logAction("📤 Sending Payload", "/api/gl-sync", "POST", payload);
  
        const response = await fetch("/api/gl-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
        logAction("📥 Response Received", "/api/gl-sync", "POST", result, true);
  
        if (!response.ok) throw new Error(`Sync failed: ${result.message || "Unknown error"}`);
      }
  
      // 🔹 **Delete Inactive Accounts in Ramp**
      for (const account of inactiveERPAccounts) {
        const deleteEndpoint = `/api/gl-accounts/${account.ramp_id}`;
        logAction("🗑️ Deleting Account in Ramp", deleteEndpoint, "DELETE", account);
  
        const deleteResponse = await fetch(deleteEndpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
  
        if (!deleteResponse.ok) {
          throw new Error(`Delete failed for ${account.name}`);
        }
  
        logAction("✅ Deleted", deleteEndpoint, "DELETE", { account });
        alert(`🗑️ Deleted ${account.name} from Ramp.`);
      }
  
      // 🔹 **Reactivate Accounts in Ramp**
      for (const account of reactivatedERPAccounts) {
        const patchEndpoint = `/api/gl-accounts/${account.ramp_id}`;
        logAction("🔄 Reactivating Account in Ramp", patchEndpoint, "PATCH", account);
  
        const patchResponse = await fetch(patchEndpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reactivate: true }),
        });
  
        if (!patchResponse.ok) {
          throw new Error(`Reactivation failed for ${account.name}`);
        }
  
        logAction("✅ Reactivated", patchEndpoint, "PATCH", { account });
        alert(`🔄 Reactivated ${account.name} in Ramp.`);
      }
  
      alert("✅ Sync process completed!");
    } catch (error) {
      logAction("❌ Error", "/api/gl-sync", "POST", { error: error.message });
      alert("❌ Failed to sync, delete, or reactivate ERP Accounts.");
    }
  };
  
  
  

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading GL Accounts...</p>;

  return (
    <div className="page-container">
      <div className="header-container">
        <h1 className="text-2xl font-bold text-gray-900">🚀 GL Accounts</h1>
        <button onClick={() => router.push("/")} className="btn-ramp">
          ← Back to Command Center
        </button>
      </div>

{/* API Logs Toggle */}
<button onClick={() => setShowLogs(!showLogs)} className="btn-ramp mb-4">
        📜 Toggle API Logs
      </button>
      {showLogs && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">📜 API Logs</h2>
          <div className="space-y-2">
            {apiLog.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  log.type.includes("✅") ? "bg-green-100 text-green-800" : log.type.includes("❌") ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
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
<button className="btn-ramp mb-3" onClick={syncAllERPToRamp}>
  🔄 Sync All to Ramp
</button>

      {/* Two Tables Side by Side */}
      {/* Two Tables Side by Side */}
      <div className="flex-container">
        {/* ERP Accounts Table */}
        <div className="flex-item card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">ERP Accounts</h2>
          <div className="table-container">
            <table className="table-style">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {erpAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td>{account.id}</td>
                    <td>{account.name}</td>
                    <td>{account.code || "—"}</td>
                    <td>{account.type}</td>
                    <td>
                      <span className={`status-pill ${account.is_active ? "bg-green-500" : "bg-red-500"}`}>
                        {account.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ramp GL Accounts Table */}
        <div className="flex-item card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Ramp GL Accounts</h2>
          <div className="table-container">
            <table className="table-style">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ramp ID</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Classification</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {glAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td>{account.id}</td>
                    <td>{account.ramp_id || "—"}</td>
                    <td>{account.name}</td>
                    <td>{account.code || "—"}</td>
                    <td>{account.classification}</td>
                    <td>
                      <span className={`status-pill ${account.is_active ? "bg-green-500" : "bg-red-500"}`}>
                        {account.is_active ? "Active" : "Inactive"}
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