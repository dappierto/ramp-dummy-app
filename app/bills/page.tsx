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
  const [billPayments, setBillPayments] = useState<Bill[]>([]);
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [selectedBillPayments, setSelectedBillPayments] = useState<Set<string>>(new Set());
  const [apiLog, setApiLog] = useState<{ type: string; endpoint: string; method: string; message: string; time: string }[]>([]);
  const [showRawData, setShowRawData] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [rawApiData, setRawApiData] = useState<any>(null);
  const [rawBillPaymentsData, setRawBillPaymentsData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{type: 'success' | 'error' | null, message: string | null}>({
    type: null,
    message: null
  });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetchBills();
    fetchBillPayments();
  };

  const fetchBills = () => {
    const endpoint = "/api/bills";
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        logAction("📥 API Fetch", endpoint, "GET", data);
        setRawApiData(data);
        setBills(Array.isArray(data) ? data : []);
      })
      .catch((err) => logAction("❌ Error", endpoint, "GET", { error: err.message }));
  };
      
  const fetchBillPayments = () => {
    const billPaymentsEndpoint = "/api/billpayments";
    fetch(billPaymentsEndpoint)
      .then((res) => res.json())
      .then((data) => {
        logAction("📥 API Fetch", billPaymentsEndpoint, "GET", data);
        setRawBillPaymentsData(data);
        setBillPayments(Array.isArray(data) ? data : []);
      })
      .catch((err) => logAction("❌ Error", billPaymentsEndpoint, "GET", { error: err.message }));
  };

  const toggleSelection = (id: string) => {
    setSelectedBills((prev) => {
      const newSelection = new Set(prev);
      newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
      return newSelection;
    });
  };

  const toggleBillPaymentSelection = (id: string) => {
    setSelectedBillPayments((prev) => {
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
      setSyncStatus({
        type: 'error',
        message: 'No bills selected. Please select at least one bill to sync.'
      });
      
      setTimeout(() => {
        setSyncStatus({ type: null, message: null });
      }, 5000);
      
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: null });

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

      setSyncStatus({
        type: 'success',
        message: `Successfully synced ${selectedBills.size} bill(s)!`
      });
      
      fetchData(); // Refresh data
      setSelectedBills(new Set());
      
      setTimeout(() => {
        setSyncStatus({ type: null, message: null });
      }, 5000);
    } catch (error) {
      logAction("❌ Error", endpoint, "POST", { error: error.message });
      
      setSyncStatus({
        type: 'error',
        message: `Failed to sync bills: ${error.message}`
      });
      
      setTimeout(() => {
        setSyncStatus({ type: null, message: null });
      }, 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncSelectedBillPayments = async (isFailure: boolean = false) => {
    if (selectedBillPayments.size === 0) {
      setSyncStatus({
        type: 'error',
        message: 'No bill payments selected. Please select at least one payment to sync.'
      });
      
      setTimeout(() => {
        setSyncStatus({ type: null, message: null });
      }, 5000);
      
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: null });

    const syncData: any = {
      idempotency_key: uuidv4(),
      sync_type: "BILL_PAYMENT_SYNC",
    };

    if (isFailure) {
      syncData.failed_syncs = Array.from(selectedBillPayments).map((id) => ({
        id,
        error: { message: "Mimicked sync failure - ERP system rejected the bill payment." },
      }));
    } else {
      syncData.successful_syncs = Array.from(selectedBillPayments).map((id) => ({
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

      setSyncStatus({
        type: 'success',
        message: `Successfully synced ${selectedBillPayments.size} bill payment(s)!`
      });
      
      fetchData(); // Refresh data
      setSelectedBillPayments(new Set());
      
      setTimeout(() => {
        setSyncStatus({ type: null, message: null });
      }, 5000);
    } catch (error) {
      logAction("❌ Error", endpoint, "POST", { error: error.message });
      
      setSyncStatus({
        type: 'error',
        message: `Failed to sync bill payments: ${error.message}`
      });
      
      setTimeout(() => {
        setSyncStatus({ type: null, message: null });
      }, 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const selectAllBills = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBills(new Set(bills.map(bill => bill.id)));
    } else {
      setSelectedBills(new Set());
    }
  };

  const selectAllBillPayments = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBillPayments(new Set(billPayments.map(bill => bill.id)));
    } else {
      setSelectedBillPayments(new Set());
    }
  };

  return (
    <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📄 Bills & Payments</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/new_bills")}
            className="btn-ramp"
          >
            ➕ Create New Bill
          </button>
          <button 
            onClick={() => router.push("/")} 
            className="btn-ramp"
          >
            ← Back to Command Center
          </button>
        </div>
      </header>

      {/* Status Messages */}
      {syncStatus.type && (
        <div className={`mb-6 p-4 rounded-lg ${
          syncStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="text-xl mr-2">
              {syncStatus.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{syncStatus.message}</span>
          </div>
        </div>
      )}

      {/* Bills Section */}
      <div className="card mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">📄 Bills</h2>
            <div className="flex gap-4">
              <button 
                className="btn-ramp" 
                onClick={() => syncSelectedBills(false)}
                disabled={isSyncing || selectedBills.size === 0}
              >
                {isSyncing ? 'Syncing...' : '✅ Sync Selected Bills'}
              </button>
              <button 
                className="btn-danger" 
                onClick={() => syncSelectedBills(true)}
                disabled={isSyncing || selectedBills.size === 0}
              >
                {isSyncing ? 'Syncing...' : '❌ Mimic Failed Bills Sync'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {bills.length} bills total, {selectedBills.size} selected
          </p>
        </div>

        {/* Bills Table */}
        <div className="overflow-x-auto">
          <table className="table-style">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    onChange={selectAllBills}
                    checked={selectedBills.size > 0 && selectedBills.size === bills.length}
                    className="h-4 w-4"
                  />
                </th>
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
              {bills.length > 0 ? (
                bills.map((bill) => (
                  <tr key={bill.id} className={selectedBills.has(bill.id) ? 'bg-blue-50' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBills.has(bill.id)}
                        onChange={() => toggleSelection(bill.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="font-medium">{bill.invoice_number || "—"}</td>
                    <td>{bill.vendor?.name || "—"}</td>
                    <td>{bill.amount.currency_code} ${(bill.amount.amount / 100).toFixed(2)}</td>
                    <td>{new Date(bill.due_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.approval_status === "APPROVED" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {bill.approval_status}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.sync_status === "BILL_SYNCED" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {bill.sync_status}
                      </span>
                    </td>
                    <td>{bill.status}</td>
                    <td>{bill.memo || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No bills found. Click "Create New Bill" to add bills.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Bill Payments Section */}
      <div className="card mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">💰 Bill Payments</h2>
            <div className="flex gap-4">
              <button 
                className="btn-ramp" 
                onClick={() => syncSelectedBillPayments(false)}
                disabled={isSyncing || selectedBillPayments.size === 0}
              >
                {isSyncing ? 'Syncing...' : '✅ Sync Selected Payments'}
              </button>
              <button 
                className="btn-danger" 
                onClick={() => syncSelectedBillPayments(true)}
                disabled={isSyncing || selectedBillPayments.size === 0}
              >
                {isSyncing ? 'Syncing...' : '❌ Mimic Failed Payments Sync'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {billPayments.length} payments total, {selectedBillPayments.size} selected
          </p>
        </div>
        
        {/* Bill Payments Table */}
        <div className="overflow-x-auto">
          <table className="table-style">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    onChange={selectAllBillPayments}
                    checked={selectedBillPayments.size > 0 && selectedBillPayments.size === billPayments.length}
                    className="h-4 w-4"
                  />
                </th>
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
              {billPayments.length > 0 ? (
                billPayments.map((bill) => (
                  <tr key={bill.id} className={selectedBillPayments.has(bill.id) ? 'bg-blue-50' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBillPayments.has(bill.id)}
                        onChange={() => toggleBillPaymentSelection(bill.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="font-medium">{bill.invoice_number || "—"}</td>
                    <td>{bill.vendor?.name || "—"}</td>
                    <td>{bill.amount.currency_code} ${(bill.amount.amount / 100).toFixed(2)}</td>
                    <td>{new Date(bill.due_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.approval_status === "APPROVED" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {bill.approval_status}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.sync_status === "BILL_SYNCED" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {bill.sync_status}
                      </span>
                    </td>
                    <td>{bill.status}</td>
                    <td>{bill.memo || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No bill payments found.
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
            className="btn-ramp"
          >
            {showRawData ? '🔼 Hide' : '🔽 Show'} Raw API Data
          </button>
          
          {showRawData && (
            <div className="mt-4 space-y-4">
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-2">Bills Data:</h3>
                <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">
                  {JSON.stringify(rawApiData, null, 2)}
                </pre>
              </div>
              
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-2">Bill Payments Data:</h3>
                <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">
                  {JSON.stringify(rawBillPaymentsData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* API Log Panel */}
        <div>
          <button 
            onClick={() => setShowLogs(!showLogs)} 
            className="btn-ramp"
          >
            {showLogs ? '🔼 Hide' : '🔽 Show'} API Logs
          </button>
          
          {showLogs && (
            <div className="card p-4 mt-4">
              <h2 className="text-lg font-semibold mb-4">📜 API Activity Logs</h2>
              <div className="space-y-3">
                {apiLog.length > 0 ? (
                  apiLog.map((log, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded ${
                        log.type.includes("Success") 
                          ? "bg-green-50 border border-green-200" 
                          : log.type.includes("Error") || log.type.includes("Failure")
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
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No API logs yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}