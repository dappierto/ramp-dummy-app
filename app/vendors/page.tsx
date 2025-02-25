"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define ERP Vendor type
type ERPVendor = {
  id: string;
  erp_id?: string;
  ramp_vendor_id?: string;
  ramp_accounting_id?: string;
  ramp_vendor_contact_id?: string;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  payment_method?: string;
  bank_account?: string;
  routing_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// New vendor form data type
type NewVendorForm = Omit<ERPVendor, 'id' | 'created_at' | 'updated_at'>;

export default function VendorsPage() {
  const [vendors, setVendors] = useState<ERPVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [syncingToRamp, setSyncingToRamp] = useState(false);
  const [syncingFromRamp, setSyncingFromRamp] = useState(false);
  const [syncResult, setSyncResult] = useState<{status: 'success' | 'error', message: string} | null>(null);
  const [newVendor, setNewVendor] = useState<NewVendorForm>({
    name: '',
    is_active: true,
    payment_method: 'ACH'
  });
  
  const router = useRouter();

  useEffect(() => {
    fetchVendors();
  }, []);

  // Fetch Vendors from ERP API
  const fetchVendors = () => {
    fetch("/api/erp/vendors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) => Number(b.is_active) - Number(a.is_active)); // Sort by active status
          setVendors(sortedData);
        } else {
          console.error("❌ Invalid ERP Vendor Response:", data);
          setVendors([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching ERP Vendors:", err);
        setVendors([]);
        setLoading(false);
      });
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setNewVendor(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  // Submit new vendor form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormSuccess(null);
    setFormError(null);
    
    try {
      const response = await fetch('/api/erp/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVendor),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create vendor');
      }
      
      // Success - reset form, show success message
      setFormSuccess('Vendor added successfully!');
      setNewVendor({
        name: '',
        is_active: true,
        payment_method: 'ACH'
      });
      
      // Refresh vendors list
      fetchVendors();
      
      // Auto-close form after 3 seconds
      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess(null);
      }, 3000);
      
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Sync vendors to Ramp (ERP -> Ramp)
  const syncVendorsToRamp = async () => {
    // Count unsynced vendors
    const unsyncedCount = vendors.filter(v => !v.ramp_accounting_id).length;
    
    if (unsyncedCount === 0) {
      setSyncResult({
        status: 'error',
        message: 'No unsynced vendors found. All vendors are already synced with Ramp.'
      });
      
      // Auto-hide message after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
      return;
    }
    
    // Confirm before syncing
    if (!confirm(`Sync ${unsyncedCount} vendor(s) to Ramp?`)) {
      return;
    }
    
    setSyncingToRamp(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/ramp/erp-to-ramp-vendors');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync vendors to Ramp');
      }
      
      // Success message
      setSyncResult({
        status: 'success',
        message: `Successfully synced ${result.synced_vendors?.length || 0} vendor(s) to Ramp.`
      });
      
      // Refresh vendors list to show updated sync status
      fetchVendors();
      
    } catch (error) {
      setSyncResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred during sync to Ramp'
      });
    } finally {
      setSyncingToRamp(false);
      
      // Auto-hide message after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  // Sync vendors from Ramp (Ramp -> ERP)
  const syncVendorsFromRamp = async () => {
    // Count vendors eligible for syncing from Ramp (those with ramp_accounting_id but no ramp_vendor_id)
    const eligibleCount = vendors.filter(v => v.ramp_accounting_id && !v.ramp_vendor_id).length;
    
    if (eligibleCount === 0) {
      setSyncResult({
        status: 'error',
        message: 'No vendors eligible for Ramp to ERP sync. Make sure vendors have been synced to Ramp Accounting first.'
      });
      
      // Auto-hide message after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
      return;
    }
    
    // Confirm before syncing
    if (!confirm(`Pull vendor details for ${eligibleCount} vendor(s) from Ramp?`)) {
      return;
    }
    
    setSyncingFromRamp(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/ramp/vendors/sync');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync vendors from Ramp');
      }
      
      // Success message
      setSyncResult({
        status: 'success',
        message: `Successfully pulled details for ${result.updated_vendors?.length || 0} vendor(s) from Ramp.`
      });
      
      // Refresh vendors list to show updated details
      fetchVendors();
      
    } catch (error) {
      setSyncResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred during sync from Ramp'
      });
    } finally {
      setSyncingFromRamp(false);
      
      // Auto-hide message after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  if (loading) return (
    <div className="page-container">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ERP Vendors...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏢 ERP Vendors</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className={`btn-ramp ${showAddForm ? 'bg-gray-200' : ''}`}
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Vendor'}
          </button>
          <button onClick={() => router.push("/")} className="btn-ramp">← Back to Command Center</button>
        </div>
      </div>

      {/* Add Vendor Form */}
      {showAddForm && (
        <div className="card mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Vendor</h2>
          
          {formSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              ✅ {formSuccess}
            </div>
          )}
          
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              ❌ {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={newVendor.name}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                      placeholder="Vendor Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newVendor.email || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="contact@vendor.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={newVendor.phone || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      name="tax_id"
                      value={newVendor.tax_id || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                </div>
              </div>
              
              {/* Address Information */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={newVendor.address || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="123 Main St"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={newVendor.city || ''}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        value={newVendor.state || ''}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="State"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input
                        type="text"
                        name="zip_code"
                        value={newVendor.zip_code || ''}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={newVendor.country || ''}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Payment Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      name="payment_method"
                      value={newVendor.payment_method || 'ACH'}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="ACH">ACH</option>
                      <option value="Check">Check</option>
                      <option value="Wire">Wire</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {(newVendor.payment_method === 'ACH' || newVendor.payment_method === 'Wire') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account #</label>
                        <input
                          type="text"
                          name="bank_account"
                          value={newVendor.bank_account || ''}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Bank Account Number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                        <input
                          type="text"
                          name="routing_number"
                          value={newVendor.routing_number || ''}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Routing Number"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="pt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={newVendor.is_active}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Vendor is active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t pt-4 flex justify-end">
              <button
                type="submit"
                disabled={formSubmitting}
                className="btn-ramp w-full md:w-auto"
              >
                {formSubmitting ? 'Adding Vendor...' : '💾 Save Vendor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sync Status Message */}
      {syncResult && (
        <div className={`mb-6 px-4 py-3 rounded border ${
          syncResult.status === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {syncResult.status === 'success' ? '✅' : '❌'} {syncResult.message}
        </div>
      )}

      {/* Vendors Table */}
      <div className="card">
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">ERP Vendors</h2>
              <span className="text-sm text-gray-500">
                {vendors.length} vendors total 
                ({vendors.filter(v => !v.ramp_accounting_id).length} unsynced to Accounting, 
                {vendors.filter(v => v.ramp_accounting_id && !v.ramp_vendor_id).length} unsynced to Bills)
              </span>
            </div>
            
            {/* Sync Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              {/* Step 1: ERP to Ramp Accounting Sync */}
              <button 
                onClick={syncVendorsToRamp} 
                disabled={syncingToRamp || syncingFromRamp}
                className={`btn-ramp ${(syncingToRamp || syncingFromRamp) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {syncingToRamp ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing to Accounting...
                  </span>
                ) : (
                  '1️⃣ Sync to Ramp Accounting'
                )}
              </button>
              
              {/* Step 2: Ramp Vendors to ERP Sync */}
              <button 
                onClick={syncVendorsFromRamp} 
                disabled={syncingToRamp || syncingFromRamp}
                className={`btn-ramp ${(syncingToRamp || syncingFromRamp) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {syncingFromRamp ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Pulling from Ramp...
                  </span>
                ) : (
                  '2️⃣ Pull from Ramp Bills'
                )}
              </button>
            </div>
          </div>
          
          {/* Visual Sync Process Explainer */}
          <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Two-Step Vendor Sync Process:</h3>
            <ol className="text-xs text-gray-600 space-y-1 ml-5 list-decimal">
              <li><strong>Step 1:</strong> Sync vendors to Ramp Accounting (creates accounting vendor records)</li>
              <li><strong>Step 2:</strong> Pull Ramp Bills vendor data (after bill pay vendors are created in Ramp)</li>
            </ol>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="table-style">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tax ID</th>
                <th>Payment Method</th>
                <th>Bank Account</th>
                <th>Address</th>
                <th>Ramp Accounting ID</th>
                <th>Ramp Vendor ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className={`hover:bg-gray-50 ${
                    !vendor.ramp_accounting_id 
                      ? 'bg-yellow-50' // Not synced at all
                      : vendor.ramp_accounting_id && !vendor.ramp_vendor_id 
                      ? 'bg-blue-50' // Synced to accounting but not bills
                      : ''
                  }`}>
                    <td className="font-medium">{vendor.name}</td>
                    <td>{vendor.email || "—"}</td>
                    <td>{vendor.phone || "—"}</td>
                    <td>{vendor.tax_id || "—"}</td>
                    <td>{vendor.payment_method || "—"}</td>
                    <td>{vendor.bank_account ? `•••• ${vendor.bank_account.slice(-4)}` : "—"}</td>
                    <td>
                      {vendor.address ? 
                        `${vendor.address}, ${vendor.city || ''} ${vendor.state || ''} ${vendor.zip_code || ''}`.trim() : 
                        "—"}
                    </td>
                    <td>
                      {vendor.ramp_accounting_id ? (
                        <span className="text-green-600">{vendor.ramp_accounting_id}</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">Step 1 required</span>
                      )}
                    </td>
                    <td>
                      {vendor.ramp_vendor_id ? (
                        <span className="text-green-600">{vendor.ramp_vendor_id}</span>
                      ) : vendor.ramp_accounting_id ? (
                        <span className="text-blue-600 font-medium">Step 2 required</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${vendor.is_active ? "bg-green-500" : "bg-red-500"}`}>
                        {vendor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center text-gray-500 py-8">
                    No vendors available. Click "Add Vendor" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}