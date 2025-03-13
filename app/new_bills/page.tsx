"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Entity Type Definitions
type Entity = {
  entity_id: string;
  entity_name: string;
  ramp_entity_id: string | null;
};

type Vendor = {
  name: string;
  ramp_vendor_id: string;
  ramp_vendor_contact_id: string | null;
};

type BillLineItem = {
  category_id: string;
  description: string;
  line_type: "Item" | "Expense";
  quantity: number;
  unit_price: number;
  total_amount: number;
};

type BillData = {
  invoice_number: string;
  invoice_currency: string;
  memo: string;
  payment_method: string;
  ramp_vendor_id: string;
  ramp_vendor_contact_id: string;
  due_date: string;
  issue_date: string;
  ramp_entity_id: string;
  lineItems: BillLineItem[];
};

// Define Bill type for existing bills
type Bill = {
  id: string;
  invoice_number: string;
  invoice_currency: string;
  memo: string;
  payment_method: string;
  due_date: string;
  issue_date: string;
  ramp_bill_id: string | null;
  ramp_entity_id: string;
  vendor_id: string;
  vendor_contact_id: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  vendor_name?: string;
  entity_name?: string;
};

// Define API Log type
type ApiLog = {
  type: string;
  endpoint: string;
  method: string;
  payload?: any;
  response?: any;
  timestamp: string;
};

export default function BillsPage() {
  const router = useRouter();
  const [billData, setBillData] = useState<BillData>({
    invoice_number: "",
    invoice_currency: "USD",
    memo: "",
    payment_method: "",
    ramp_vendor_id: "",
    ramp_vendor_contact_id: "",
    due_date: "",
    issue_date: "",
    ramp_entity_id: "",
    lineItems: [],
  });

  const [entities, setEntities] = useState<Entity[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [erpAccounts, setErpAccounts] = useState<{ id: string; name: string }[]>([]);
  const [totalBillAmount, setTotalBillAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{type: 'success' | 'error' | null, message: string | null}>({
    type: null,
    message: null
  });

  // States for existing bills
  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    status: 'idle' | 'syncing' | 'success' | 'error';
    message: string | null;
  }>({ status: 'idle', message: null });
  
  // Toggle for showing create form or bill list
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Add API logging state
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [showApiLogs, setShowApiLogs] = useState(false);

  const logApiCall = (type: string, endpoint: string, method: string, payload?: any, response?: any) => {
    setApiLogs(prev => [{
      type,
      endpoint,
      method,
      payload,
      response,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev]);
  };

  useEffect(() => {
    fetch("/api/erp-accounts")
      .then((res) => res.json())
      .then((data) => {
        logApiCall('📥 Fetch', '/api/erp-accounts', 'GET', null, data);
        setErpAccounts(data);
      })
      .catch((error) => {
        logApiCall('❌ Error', '/api/erp-accounts', 'GET', null, error.message);
        console.error("Error fetching accounts:", error);
      });
  }, []);

  useEffect(() => {
    fetch("/api/erp/get-entities")
      .then((res) => res.json())
      .then((data) => {
        logApiCall('📥 Fetch', '/api/erp/get-entities', 'GET', null, data);
        setEntities(data);
      })
      .catch((error) => {
        logApiCall('❌ Error', '/api/erp/get-entities', 'GET', null, error.message);
        console.error("Error fetching entities:", error);
      });
  }, []);

  useEffect(() => {
    fetch("/api/erp/vendors")
      .then((res) => res.json())
      .then((data) => {
        logApiCall('📥 Fetch', '/api/erp/vendors', 'GET', null, data);
        setVendors(data);
      })
      .catch((error) => {
        logApiCall('❌ Error', '/api/erp/vendors', 'GET', null, error.message);
        console.error("Error fetching vendors:", error);
      });
  }, []);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    setTotalBillAmount(
      billData.lineItems.reduce((sum, item) => sum + item.total_amount, 0)
    );
  }, [billData.lineItems]);

  const fetchBills = async () => {
    setLoadingBills(true);
    try {
      const response = await fetch("/api/erp/bills");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error("Failed to fetch bills");
      }

      logApiCall('📥 Fetch', '/api/erp/bills', 'GET', null, data);
      
      // Process and sort data - sync-eligible bills at the top
      const sortedData = data.sort((a: Bill, b: Bill) => {
        // First sort by sync status (unsynced first)
        if (a.ramp_bill_id === null && b.ramp_bill_id !== null) return -1;
        if (a.ramp_bill_id !== null && b.ramp_bill_id === null) return 1;
        
        // Then by date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setBills(sortedData);
    } catch (error) {
      logApiCall('❌ Error', '/api/erp/bills', 'GET', null, error instanceof Error ? error.message : 'Unknown error');
      console.error("Error fetching bills:", error);
    } finally {
      setLoadingBills(false);
    }
  };

  const syncBill = async () => {
    if (!selectedBillId) {
      alert("Please select a bill to sync");
      return;
    }

    // Confirm before syncing
    if (!confirm(`Are you sure you want to sync this bill to Ramp?`)) {
      return;
    }

    // Show API logs when syncing
    setShowApiLogs(true);
    setSyncStatus({ status: 'syncing', message: "Syncing bill to Ramp..." });

    const payload = { billId: selectedBillId };
    logApiCall('📤 Request', '/api/ramp/bills/sync', 'POST', payload);

    try {
      const response = await fetch("/api/ramp/bills/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync bill");
      }

      logApiCall('✅ Success', '/api/ramp/bills/sync', 'POST', payload, result);

      setSyncStatus({ 
        status: 'success', 
        message: `Bill successfully synced to Ramp! Ramp Bill ID: ${result.synced_bill.id}` 
      });
      
      // Refresh the bills list after successful sync
      fetchBills();
      
      // Reset selection
      setSelectedBillId(null);
      
      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: null });
      }, 5000);
      
    } catch (error) {
      logApiCall('❌ Error', '/api/ramp/bills/sync', 'POST', payload, error instanceof Error ? error.message : 'Unknown error');
      
      setSyncStatus({ 
        status: 'error', 
        message: `Error syncing bill: ${error instanceof Error ? error.message : String(error)}` 
      });
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setSyncStatus({ status: 'idle', message: null });
      }, 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setBillData({ ...billData, [e.target.name]: e.target.value });
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEntity = entities.find((entity) => entity.ramp_entity_id === e.target.value);
    setBillData({
      ...billData,
      ramp_entity_id: selectedEntity?.ramp_entity_id || "",
    });
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendor = vendors.find((vendor) => vendor.ramp_vendor_id === e.target.value);
    setBillData({
      ...billData,
      ramp_vendor_id: selectedVendor?.ramp_vendor_id || "",
      ramp_vendor_contact_id: selectedVendor?.ramp_vendor_contact_id || "",
    });
  };

  const handleLineItemChange = (index: number, field: keyof BillLineItem, value: any) => {
    const updatedItems = [...billData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    
    if (field === "quantity" || field === "unit_price") {
      updatedItems[index].total_amount = 
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setBillData({ ...billData, lineItems: updatedItems });
  };

  const addLineItem = () => {
    const newLineItem: BillLineItem = {
      category_id: "",
      description: "",
      line_type: "Item",
      quantity: 1,
      unit_price: 0,
      total_amount: 0,
    };
    setBillData({
      ...billData,
      lineItems: [...billData.lineItems, newLineItem],
    });
  };

  const removeLineItem = (index: number) => {
    const updatedItems = billData.lineItems.filter((_, i) => i !== index);
    setBillData({ ...billData, lineItems: updatedItems });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({type: null, message: null});
  
    const billDataPayload = {
      invoice_number: billData.invoice_number,
      invoice_currency: billData.invoice_currency,
      memo: billData.memo,
      payment_method: billData.payment_method,
      ramp_vendor_id: billData.ramp_vendor_id,
      ramp_vendor_contact_id: billData.ramp_vendor_contact_id,
      due_date: billData.due_date,
      issue_date: billData.issue_date,
      ramp_entity_id: billData.ramp_entity_id,
      line_items: billData.lineItems.map(item => ({
        category_id: item.category_id,
        description: item.description,
        line_type: item.line_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
      })),
    };

    logApiCall('📤 Request', '/api/erp/push-bills', 'POST', billDataPayload);
  
    try {
      const response = await fetch('/api/erp/push-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billDataPayload),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create bill');
      }

      logApiCall('✅ Success', '/api/erp/push-bills', 'POST', billDataPayload, result);
  
      // Reset form to initial state
      setBillData({
        invoice_number: "",
        invoice_currency: "USD",
        memo:"",
        payment_method: "",
        ramp_vendor_id: "",
        ramp_vendor_contact_id: "",
        due_date: "",
        issue_date: "",
        ramp_entity_id: "",
        lineItems: [],
      });
  
      setFormStatus({
        type: 'success',
        message: 'Bill created successfully!'
      });
      
      // Refresh bills list
      fetchBills();
  
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      logApiCall('❌ Error', '/api/erp/push-bills', 'POST', billDataPayload, error instanceof Error ? error.message : 'Unknown error');
      
      setFormStatus({
        type: 'error',
        message: `Error creating bill: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency || 'USD' 
    }).format(amount);
  };

  if (loadingBills && !showCreateForm) {
    return (
      <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '24px 16px' }}>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bills...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '24px 16px' }}>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {showCreateForm ? '➕ Create New Bill' : '📄 Bills Management'}
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowApiLogs(!showApiLogs)} 
            className="btn-ramp"
          >
            {showApiLogs ? '🔍 Hide API Logs' : '🔍 Show API Logs'}
          </button>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="btn-ramp"
          >
            {showCreateForm ? '← Back to Bills List' : '➕ Create New Bill'}
          </button>
          <button onClick={() => router.push("/")} className="btn-ramp">← Back to Command Center</button>
        </div>
      </header>

      {/* API Logs Panel */}
      {showApiLogs && (
        <div className="mb-6 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-100 border-b border-gray-200">
            <h2 className="text-lg font-semibold">🔍 API Logs</h2>
            <p className="text-sm text-gray-600">Real-time API calls and responses</p>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {apiLogs.length > 0 ? (
              <div className="space-y-4">
                {apiLogs.map((log, index) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    log.type.includes('❌') ? 'bg-red-50 border border-red-200' :
                    log.type.includes('✅') ? 'bg-green-50 border border-green-200' :
                    'bg-white border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{log.type} {log.method} {log.endpoint}</span>
                      <span className="text-sm text-gray-500">{log.timestamp}</span>
                    </div>
                    {log.payload && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Request Payload:</p>
                        <pre className="text-xs bg-gray-800 text-white p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.response && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                        <pre className="text-xs bg-gray-800 text-white p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No API calls logged yet. Actions will appear here as they occur.
              </div>
            )}
          </div>
        </div>
      )}

      {formStatus.type && (
        <div className={`mb-6 p-4 rounded-lg ${
          formStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="text-xl mr-2">
              {formStatus.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{formStatus.message}</span>
          </div>
        </div>
      )}

      {syncStatus.status !== 'idle' && syncStatus.message && (
        <div className={`mb-6 p-4 rounded-lg ${
          syncStatus.status === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : syncStatus.status === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center">
            <span className="text-xl mr-2">
              {syncStatus.status === 'success' 
                ? '✅' 
                : syncStatus.status === 'error' 
                ? '❌' 
                : '⏳'}
            </span>
            <span>{syncStatus.message}</span>
          </div>
        </div>
      )}

      {/* Bill Creation Form */}
      {showCreateForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number *
                    </label>
                    <input
                      type="text"
                      name="invoice_number"
                      value={billData.invoice_number}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter invoice number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency *
                    </label>
                    <select
                      name="invoice_currency"
                      value={billData.invoice_currency}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select Currency</option>
                      {[
                        "USD", "EUR", "GBP", "AUD", "CAD", "INR", "JPY", "CNY", "BRL", "MXN",
                        "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AWG", "AZN", "BAM",
                        "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV", "BSD",
                      ].map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Memo
                    </label>
                    <textarea
                      name="memo"
                      value={billData.memo}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Enter invoice memo"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      name="payment_method"
                      value={billData.payment_method}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select Payment Method</option>
                      {[
                        "ACH",
                        "CARD",
                        "CHECK",
                        "DOMESTIC_WIRE",
                        "INTERNATIONAL",
                        "ONE_TIME_CARD",
                        "ONE_TIME_CARD_DELIVERY",
                        "PAID_MANUALLY",
                        "SWIFT",
                        "UNSPECIFIED",
                        "VENDOR_CREDIT",
                      ].map((method) => (
                        <option key={method} value={method}>
                          {method.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entity *
                    </label>
                    <select
                      name="ramp_entity_id"
                      value={billData.ramp_entity_id}
                      onChange={handleEntityChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select Entity</option>
                      {entities.map((entity) => (
                        <option key={entity.entity_id} value={entity.ramp_entity_id || ""}>
                          {entity.entity_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor *
                    </label>
                    <select
                      name="ramp_vendor_id"
                      value={billData.ramp_vendor_id}
                      onChange={handleVendorChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.ramp_vendor_id} value={vendor.ramp_vendor_id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={billData.due_date}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      name="issue_date"
                      value={billData.issue_date}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Line Items</h2>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="btn-ramp flex items-center"
                    >
                      <span className="mr-1">+</span> Add Line Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table-style">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billData.lineItems.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <select
                                value={item.category_id}
                                onChange={(e) => handleLineItemChange(index, "category_id", e.target.value)}
                                className="input-field"
                                required
                              >
                                <option value="">Select Category</option>
                                {erpAccounts.map((account) => (
                                  <option key={account.id} value={account.id}>
                                    {account.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                                className="input-field"
                                placeholder="Description"
                              />
                            </td>
                            <td>
                              <select
                                value={item.line_type}
                                onChange={(e) => handleLineItemChange(index, "line_type", e.target.value as "Item" | "Expense")}
                                className="input-field"
                              >
                                <option value="Item">Item</option>
                                <option value="Expense">Expense</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={item.quantity}
                                min="1"
                                onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                                className="input-field"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={item.unit_price}
                                min="0"
                                step="0.01"
                                onChange={(e) => handleLineItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                className="input-field"
                              />
                            </td>
                            <td className="font-medium">
                              ${(item.total_amount).toFixed(2)}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="text-red-600 hover:text-red-800 text-xl"
                                aria-label="Remove line item"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                        {billData.lineItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center text-gray-500 py-4">
                              No line items added. Click "Add Line Item" to add the first item.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-lg font-semibold">
                      Total: <span className="text-xl">${totalBillAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex space-x-4">
                      <button 
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="btn-ramp bg-gray-200 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting || billData.lineItems.length === 0}
                        className={`btn-ramp ${
                          isSubmitting || billData.lineItems.length === 0 
                            ? 'opacity-70 cursor-not-allowed' 
                            : ''
                        }`}
                      >
                        {isSubmitting ? 'Creating...' : 'Create Bill'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          {/* Bill Summary Panel */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Bill Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Invoice #:</span>
                  <span className="font-medium">{billData.invoice_number || '—'}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium">
                    {vendors.find(v => v.ramp_vendor_id === billData.ramp_vendor_id)?.name || '—'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Entity:</span>
                  <span className="font-medium">
                    {entities.find(e => e.ramp_entity_id === billData.ramp_entity_id)?.entity_name || '—'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium">
                    {billData.due_date ? new Date(billData.due_date).toLocaleDateString() : '—'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {billData.payment_method ? billData.payment_method.replace(/_/g, " ") : '—'}
                  </span>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Items ({billData.lineItems.length})</h3>
                  {billData.lineItems.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {billData.lineItems.map((item, i) => (
                        <div key={i} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium truncate max-w-[200px]">
                              {item.description || `Item #${i+1}`}
                            </span>
                            <span>${item.total_amount.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.quantity} × ${item.unit_price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">No items added yet</div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-xl">${totalBillAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bill Management Section */
        <>
          {/* Sync Action Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">Sync Bills to Ramp</h2>
                <p className="text-gray-600 text-sm">
                  Select an unsynced bill from the table below and click "Sync to Ramp" to push it to Ramp.
                </p>
              </div>
              
              <button
                onClick={syncBill}
                disabled={!selectedBillId || syncStatus.status === 'syncing' || bills.find(b => b.id === selectedBillId)?.ramp_bill_id !== null}
                className={`btn-ramp ${
                  !selectedBillId || syncStatus.status === 'syncing' || bills.find(b => b.id === selectedBillId)?.ramp_bill_id !== null
                    ? 'opacity-60 cursor-not-allowed'
                    : ''
                }`}
              >
                {syncStatus.status === 'syncing' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </span>
                ) : (
                  '🔄 Sync Selected Bill to Ramp'
                )}
              </button>
            </div>
          </div>

          {/* Bills Table */}
          <div className="card">
            <div className="flex justify-between items-center p-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">ERP Bills</h2>
                <span className="text-sm text-gray-500">
                  {bills.length} bills total ({bills.filter(b => !b.ramp_bill_id).length} unsynced)
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table-style">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Invoice #</th>
                    <th>Vendor</th>
                    <th>Entity</th>
                    <th>Amount</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Payment Method</th>
                    <th>Sync Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length > 0 ? (
                    bills.map((bill) => (
                      <tr 
                        key={bill.id} 
                        className={`hover:bg-gray-50 ${
                          bill.id === selectedBillId ? 'bg-yellow-50' : bill.ramp_bill_id ? 'bg-green-50' : ''
                        }`}
                      >
                        <td>
                          <input 
                            type="radio" 
                            name="selectedBill" 
                            checked={bill.id === selectedBillId}
                            onChange={() => setSelectedBillId(bill.id)}
                            disabled={bill.ramp_bill_id !== null}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="font-medium">{bill.invoice_number}</td>
                        <td>{bill.vendor_name || 'Unknown Vendor'}</td>
                        <td>{bill.entity_name || 'Unknown Entity'}</td>
                        <td>{bill.invoice_currency} {(bill.total_amount || 0).toFixed(2)}</td>
                        <td>{new Date(bill.issue_date).toLocaleDateString()}</td>
                        <td>{new Date(bill.due_date).toLocaleDateString()}</td>
                        <td>{bill.payment_method.replace(/_/g, ' ')}</td>
                        <td>
                          {bill.ramp_bill_id ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Synced ✓
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Not Synced
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center text-gray-500 py-8">
                        No bills available. Click "Create New Bill" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Explainer Box */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-800 mb-2">📋 Bill Sync Process</h3>
            <ol className="list-decimal pl-6 text-blue-700 space-y-1">
              <li>Create a bill using the "Create New Bill" button</li>
              <li>Select an unsynced bill from the table above</li>
              <li>Click the "Sync Selected Bill to Ramp" button to push it to Ramp</li>
              <li>Once synced, the bill will be marked with a green "Synced" status</li>
            </ol>
            <p className="mt-3 text-sm text-blue-600">
              <strong>Note:</strong> Only one bill can be synced to Ramp at a time.
            </p>
          </div>
        </>
      )}
    </div>
  );
}