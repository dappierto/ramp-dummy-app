"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define ERP Vendor type
type ERPVendor = {
  id: string;
  erp_id?: string;
  ramp_vendor_id?: string;
  ramp_accounting_id?: string;
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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<ERPVendor[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading ERP Vendors...</p>;

  return (
    <div className="page-container">
      <div className="header-container">
        <h1 className="text-2xl font-bold text-gray-900">🏢 ERP Vendors</h1>
        <button onClick={() => router.push("/")} className="btn-ramp">← Back to Command Center</button>
      </div>

      {/* Vendors Table */}
      <div className="flex-item card">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">ERP Vendors</h2>
        <div className="table-container">
          <table className="table-style">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>ERP ID</th>
                <th>Ramp Vendor ID</th>
                <th>Ramp Accounting ID</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tax ID</th>
                <th>Payment Method</th>
                <th>Bank Account</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td>{vendor.id}</td>
                    <td>{vendor.name}</td>
                    <td>{vendor.erp_id || "—"}</td>
                    <td>{vendor.ramp_vendor_id || "—"}</td>
                    <td>{vendor.ramp_accounting_id || "—"}</td>
                    <td>{vendor.email || "—"}</td>
                    <td>{vendor.phone || "—"}</td>
                    <td>{vendor.tax_id || "—"}</td>
                    <td>{vendor.payment_method || "—"}</td>
                    <td>{vendor.bank_account ? `•••• ${vendor.bank_account.slice(-4)}` : "—"}</td>
                    <td>
                      <span className={`status-pill ${vendor.is_active ? "bg-green-500" : "bg-red-500"}`}>
                        {vendor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center text-gray-500">No vendors available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
