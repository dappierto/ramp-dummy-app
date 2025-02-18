"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define the ERP Account type
type ERPAccount = {
  id: string;
  name: string;
  code: string;
  type: string;
};

export default function ERPAccountsPage() {
  const [erpAccounts, setERPAccounts] = useState<ERPAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/erp-accounts")
      .then((res) => res.json())
      .then((data) => {
        console.log("📥 ERP Accounts API Response:", data);
        setERPAccounts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to load ERP accounts:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading ERP Accounts...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">💰 ERP Accounts</h1>
        <button onClick={() => router.push("/")} className="btn-ramp">
          ← Back to Command Center
        </button>
      </div>

      {/* ERP Accounts Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-300 shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border border-gray-300">ERP GL Name</th>
              <th className="p-3 border border-gray-300">ERP GL Code</th>
              <th className="p-3 border border-gray-300">Type</th>
            </tr>
          </thead>
          <tbody>
            {erpAccounts.length > 0 ? (
              erpAccounts.map((account) => (
                <tr key={account.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 border border-gray-300">{account.name}</td>
                  <td className="p-3 border border-gray-300">{account.code}</td>
                  <td className="p-3 border border-gray-300">{account.type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center p-4 text-gray-500">
                  No ERP accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
