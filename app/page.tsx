"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🚀 Ramp API Command Center
        </h1>
        <p className="text-gray-600 mt-2">A learning tool for interacting with Ramp APIs</p>
      </div>

      {/* Main Content Section */}
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-3xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Explore API Endpoints</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push("/transactions")} className="btn-ramp w-full">
            View Transactions
          </button>
          <button onClick={() => router.push("/bills")} className="btn-ramp w-full">
            View Bills
          </button>
          <button onClick={() => router.push("/gl-accounts")} className="btn-ramp w-full">
            Manage GL Accounts
          </button>
          <button onClick={() => router.push("/custom-fields")} className="btn-ramp w-full">
            Manage Custom Fields
          </button>
          <button onClick={() => router.push("/reimbursements")} className="btn-ramp w-full">
            View Reimbursements
          </button>
          <button onClick={() => router.push("/transfers")} className="btn-ramp w-full">
            View Transfers
          </button>
          <button onClick={() => router.push("/cashbacks")} className="btn-ramp w-full">
            View Cashbacks
          </button>
          <button onClick={() => router.push("/vendors")} className="btn-ramp w-full">
            View Vendors
          </button>

          <button onClick={() => router.push("/entities")} className="btn-ramp w-full">
            View Entities
          </button>
          <button onClick={() => router.push("/new_bills")} className="btn-ramp w-full">
            Create New Bills
          </button>
        </div>
      </div>
    </div>
  );
}
