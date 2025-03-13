"use client";

import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <main style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '0 16px' }}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link 
            href="/settings/approval-rules"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Approval Rules</h2>
            <p className="text-gray-600">Configure approval policies based on spend thresholds.</p>
          </Link>
          
          {/* Add more settings cards here as needed */}
        </div>
      </main>
    </div>
  );
} 