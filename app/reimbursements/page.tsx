"use client";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

type Reimbursement = {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  state: string;
  memo: string | null;
  user_full_name: string;
  transaction_date: string;
};

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [selectedReimbursements, setSelectedReimbursements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/reimbursements")
      .then((res) => res.json())
      .then((data) => {
        console.log("📥 API Response:", data);
        setReimbursements(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to load reimbursements:", err);
        setReimbursements([]);
        setLoading(false);
      });
  }, []);

  // ✅ Function to Toggle Selection
  const toggleSelection = (id: string) => {
    setSelectedReimbursements((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  // ✅ Function to Sync Multiple Reimbursements
  const syncSelectedReimbursements = async (isFailure: boolean = false) => {
    if (selectedReimbursements.size === 0) {
      alert("❌ No reimbursements selected.");
      return;
    }

    const syncData: any = {
      idempotency_key: uuidv4(),
      sync_type: "REIMBURSEMENT_SYNC",
    };

    if (isFailure) {
      syncData.failed_syncs = Array.from(selectedReimbursements).map((id) => ({
        id,
        error: { message: "Mimicked sync failure - ERP system rejected the reimbursement." },
      }));
    } else {
      syncData.successful_syncs = Array.from(selectedReimbursements).map((id) => ({
        id,
        reference_id: uuidv4(),
      }));
    }

    try {
      console.log(`📤 Sending ${isFailure ? "Failed" : "Successful"} Sync Request:`, JSON.stringify(syncData, null, 2));

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} - ${responseData.message || "Unknown error"}`);
      }

      console.log(`✅ Sync Completed!`, responseData);
      alert(`✅ Successfully synced ${selectedReimbursements.size} reimbursement(s)!`);
      setSelectedReimbursements(new Set()); // ✅ Clear Selection After Sync
    } catch (error) {
      console.error("❌ Error syncing reimbursements:", error);
      alert(`❌ Failed to sync selected reimbursements.`);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading reimbursements...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          🚀 Reimbursements
        </h1>
        <button onClick={() => router.push("/")} className="btn-ramp">
          ← Back to Command Center
        </button>
      </div>

      {/* Master Sync Buttons */}
      <div className="flex gap-4 mb-4">
        <button className="btn-ramp" onClick={() => syncSelectedReimbursements(false)}>
          ✅ Sync Selected
        </button>
        <button className="btn-danger" onClick={() => syncSelectedReimbursements(true)}>
          ❌ Mimic Failed Sync
        </button>
      </div>

      {/* Reimbursements Table */}
      <div className="overflow-x-auto">
        <table className="table-style">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelectedReimbursements(
                      e.target.checked ? new Set(reimbursements.map((r) => r.id)) : new Set()
                    )
                  }
                  checked={selectedReimbursements.size === reimbursements.length}
                />
              </th>
              <th>Merchant</th>
              <th>Date</th>
              <th>Amount</th>
              <th>User</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reimbursements.length > 0 ? (
              reimbursements.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedReimbursements.has(tx.id)}
                      onChange={() => toggleSelection(tx.id)}
                    />
                  </td>
                  <td>{tx.merchant}</td>
                  <td>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                  <td>${tx.amount.toFixed(2)}</td>
                  <td>{tx.user_full_name}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        tx.state === "REIMBURSED"
                          ? "bg-green-500"
                          : tx.state === "PENDING"
                          ? "bg-yellow-500"
                          : tx.state === "DECLINED"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {tx.state}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-400">
                  No reimbursements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
