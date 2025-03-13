// app/migrate/vendors/page.tsx
"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
// Import papaparse dynamically to avoid server-side issues
import dynamic from 'next/dynamic';

// Define types
type BillDotComVendor = {
  "Active?": string;
  "Vendor Name": string;
  "Vendor Id": string | number;
  "Tax ID": string;
  "Address Line 1": string;
  "City": string;
  "State / Province": string;
  "ZIP / Postal Code": string | number;
  "Country": string;
  "Primary Email": string;
  "Phone": string | number;
  [key: string]: any; // For other fields
};

// Based on Ramp API payload format
type RampVendor = {
  name: string;
  country: string;
  state?: string;
  business_vendor_contacts?: {
    email?: string;
    phone?: string;
  };
  vendor_owner_id?: string;
  // Additional fields for display/tracking
  original_id?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  is_active?: boolean;
};

export default function VendorMigrationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BillDotComVendor[]>([]);
  const [processedVendors, setProcessedVendors] = useState<RampVendor[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorOwnerId, setVendorOwnerId] = useState<string>('');
  const [importStatus, setImportStatus] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    logs: [] as {type: 'info' | 'success' | 'error', message: string}[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    console.log(`Selected file: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`);
  };

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    setImportStatus(prev => ({
      ...prev,
      logs: [{type, message}, ...prev.logs]
    }));
  };

  const parseCSV = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Dynamically import papaparse
      const Papa = (await import('papaparse')).default;
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("Parsing complete:", results);
          
          // Check if results are valid
          if (results.errors && results.errors.length > 0) {
            setError(`Error parsing CSV: ${results.errors[0].message}`);
            setIsProcessing(false);
            return;
          }

          const data = results.data as BillDotComVendor[];
          setParsedData(data);
          
          // Process the data
          try {
            const processed = data.map(transformVendor);
            setProcessedVendors(processed);
            addLog('success', `Successfully parsed ${data.length} vendors from CSV`);
            
            // Move to next step
            setStep('preview');
          } catch (err) {
            console.error("Error transforming data:", err);
            setError(`Error processing data: ${err instanceof Error ? err.message : String(err)}`);
            addLog('error', `Error processing data: ${err instanceof Error ? err.message : String(err)}`);
          }
          
          setIsProcessing(false);
        },
        error: (error) => {
          console.error("CSV Parse Error:", error);
          setError(`Error parsing CSV: ${error.message}`);
          addLog('error', `Error parsing CSV: ${error.message}`);
          setIsProcessing(false);
        }
      });
    } catch (err) {
      console.error("Error importing or using papaparse:", err);
      setError(`Error with CSV parser: ${err instanceof Error ? err.message : String(err)}`);
      addLog('error', `Error with CSV parser: ${err instanceof Error ? err.message : String(err)}`);
      setIsProcessing(false);
    }
  };

  const transformVendor = (vendor: BillDotComVendor): RampVendor => {
    console.log("Transforming vendor:", vendor);
    
    // Format phone number for Ramp format (should be E.164 format)
    let phone = vendor.Phone ? String(vendor.Phone).replace(/\D/g, '') : undefined;
    if (phone && !phone.startsWith('+')) {
      phone = phone.startsWith('1') ? `+${phone}` : `+1${phone}`;
    }
    
    // Country code mapping
    const countryMap: {[key: string]: string} = {
      "USA": "US",
      "United States": "US",
      "Canada": "CA",
      "Mexico": "MX",
      // Add more as needed
    };
    
    // Get country code - default to US if not mapped
    const country = vendor.Country ? 
      (countryMap[vendor.Country] || vendor.Country) : 
      "US";
    
    // For state, Ramp expects the two-letter state code
    const state = vendor["State / Province"];
    
    // Default to true if "Active?" is "Yes" or if the field doesn't exist
    const isActive = vendor["Active?"] === undefined || 
                    vendor["Active?"] === "Yes" || 
                    vendor["Active?"] === "TRUE" || 
                    vendor["Active?"] === "true";

    return {
      name: vendor["Vendor Name"] || "Unknown Vendor",
      country: country,
      state: state,
      business_vendor_contacts: {
        email: vendor["Primary Email"] || undefined,
        phone: phone
      },
      // This would come from your form input
      vendor_owner_id: vendorOwnerId || undefined,
      // Additional fields for display
      original_id: vendor["Vendor Id"] ? String(vendor["Vendor Id"]) : undefined,
      tax_id: vendor["Tax ID"] || undefined,
      address: vendor["Address Line 1"] || undefined,
      city: vendor["City"] || undefined,
      zip_code: vendor["ZIP / Postal Code"] ? String(vendor["ZIP / Postal Code"]) : undefined,
      is_active: isActive
    };
  };

  const startImport = async () => {
    if (!vendorOwnerId) {
      setError('Vendor Owner ID is required to sync vendors to Ramp');
      return;
    }

    if (processedVendors.length === 0) {
      setError('No vendors to import');
      return;
    }

    setIsImporting(true);
    setError(null);
    setStep('import');

    // Reset import status
    setImportStatus({
      total: processedVendors.length,
      processed: 0,
      successful: 0,
      failed: 0,
      logs: []
    });

    addLog('info', `Starting import of ${processedVendors.length} vendors to Ramp...`);

    // Process vendors one by one to avoid overwhelming the API
    for (let i = 0; i < processedVendors.length; i++) {
      const vendor = processedVendors[i];
      
      // Make sure vendor_owner_id is set
      const vendorToCreate = {
        ...vendor,
        vendor_owner_id: vendorOwnerId,
        // Remove display-only fields
        original_id: undefined,
        tax_id: undefined,
        address: undefined,
        city: undefined,
        zip_code: undefined,
        is_active: undefined
      };
      
      try {
        addLog('info', `Importing ${vendor.name}...`);
        
        const response = await fetch('/api/ramp/bdc-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(vendorToCreate)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Unknown error');
        }
        
        addLog('success', `Successfully created vendor: ${vendor.name}`);
        
        setImportStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          successful: prev.successful + 1
        }));
      } catch (error) {
        console.error(`Error importing vendor ${vendor.name}:`, error);
        addLog('error', `Failed to create vendor ${vendor.name}: ${error instanceof Error ? error.message : String(error)}`);
        
        setImportStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1
        }));
      }
      
      // Short delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    addLog('info', `Import complete. ${importStatus.successful} vendors created successfully, ${importStatus.failed} failed.`);
    setIsImporting(false);
  };

  return (
    <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '24px 16px' }}>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 Vendor Migration Tool</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/")} 
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Back to Command Center
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Upload Bill.com Vendor CSV</h2>
          <p className="mb-4 text-gray-600">
            Select a CSV file exported from Bill.com containing your vendor data.
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                ref={fileInputRef}
              />
              {file && (
                <div className="mt-2 text-gray-700">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
            
            {/* Ramp-specific fields */}
            <div className="mt-6 space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Required Ramp Information</h3>
              <p className="text-sm text-gray-600">
                The Vendor Owner ID is required to create vendors in Ramp. You can find this in your Ramp dashboard.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Owner ID *
                </label>
                <input
                  type="text"
                  value={vendorOwnerId}
                  onChange={(e) => setVendorOwnerId(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. 6b864472-294e-4fc9-91ab-158d684c8886"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The Ramp user ID who will own these vendors
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={isProcessing}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={parseCSV}
                disabled={!file || isProcessing}
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${(!file || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? 'Processing...' : 'Parse CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Preview Ramp Vendor Data</h2>
          <p className="mb-4 text-gray-600">
            {processedVendors.length} vendors will be created in Ramp. Review the data below.
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedVendors.slice(0, 10).map((vendor, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.business_vendor_contacts?.email || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.business_vendor_contacts?.phone || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {[
                        vendor.address,
                        vendor.city,
                        vendor.state,
                        vendor.country
                      ].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {processedVendors.length > 10 && (
            <p className="mt-2 text-gray-500 text-sm">
              Showing 10 of {processedVendors.length} vendors
            </p>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Sample Ramp API Payload</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
              <pre className="text-xs">
                {JSON.stringify(
                  {
                    ...processedVendors[0],
                    vendor_owner_id: vendorOwnerId,
                    // Remove display-only fields
                    original_id: undefined,
                    tax_id: undefined,
                    address: undefined,
                    city: undefined,
                    zip_code: undefined,
                    is_active: undefined
                  }, 
                  null, 
                  2
                )}
              </pre>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back
            </button>
            <button
              type="button"
              onClick={startImport}
              disabled={!vendorOwnerId}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${!vendorOwnerId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Import to Ramp
            </button>
          </div>
        </div>
      )}

      {/* Import Step */}
      {step === 'import' && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Import Progress</h2>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium mb-1">
              <span>Progress: {importStatus.processed} of {importStatus.total} vendors</span>
              <span>{Math.round((importStatus.processed / importStatus.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(importStatus.processed / importStatus.total) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold">{importStatus.total}</div>
              <div className="text-gray-500">Total</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{importStatus.successful}</div>
              <div className="text-green-600">Successful</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{importStatus.failed}</div>
              <div className="text-red-600">Failed</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Import Log</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
              {importStatus.logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`py-1 px-2 mb-1 rounded ${
                    log.type === 'error' 
                      ? 'bg-red-50 text-red-800'
                      : log.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  <span className="mr-2">
                    {log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : 'ℹ️'}
                  </span>
                  {log.message}
                </div>
              ))}
              {importStatus.logs.length === 0 && (
                <div className="text-gray-500 text-center py-4">No logs yet</div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            {!isImporting && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Start Over
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Finish
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}