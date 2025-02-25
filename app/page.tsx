"use client";
import { useRouter } from "next/navigation";
import AccountSwitcher from '@/components/AccountSwitcher';
import { useState } from "react";

// Define a type for each endpoint
type Endpoint = {
  name: string;
  path: string;
  icon: string;
};

// Define a type for your endpoints categories
type EndpointCategories = {
  views: Endpoint[];
  management: Endpoint[];
  technical: Endpoint[];
  [key: string]: Endpoint[];
};

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'views' | 'management' | 'technical'>('all');

  // Group endpoints by category for better organization
  const endpoints: EndpointCategories = {
    views: [
      { name: "View Transactions", path: "/transactions", icon: "📊" },
      { name: "View Bills", path: "/bills", icon: "📄" },
      { name: "View Reimbursements", path: "/reimbursements", icon: "💵" },
      { name: "View Transfers", path: "/transfers", icon: "↔️" },
      { name: "View Cashbacks", path: "/cashbacks", icon: "💰" },
      { name: "View Vendors", path: "/vendors", icon: "🏢" },
      { name: "View Entities", path: "/entities", icon: "👥" },
    ],
    management: [
      { name: "Manage GL Accounts", path: "/gl-accounts", icon: "📒" },
      { name: "Manage Custom Fields", path: "/custom-fields", icon: "🔧" },
      { name: "Create New Bills", path: "/new_bills", icon: "➕" },
    ],
    technical: [
      { name: "Base 64 Demo", path: "/base64-demo", icon: "🔐" },
      { name: "OAuth Demo", path: "/oauth-demo", icon: "🔑" },
      { name: "Connections", path: "/connections", icon: "🔌" },
    ]
  };

  // Filter endpoints based on active tab
  const getFilteredEndpoints = (): Endpoint[] => {
    if (activeTab === 'all') {
      return [
        ...endpoints.views,
        ...endpoints.management,
        ...endpoints.technical
      ];
    }
    return endpoints[activeTab] || [];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-black">🚀</span>
              <h1 className="ml-2 text-xl font-semibold text-black">Ramp API Command Center</h1>
            </div>
            <div className="flex items-center">
              <AccountSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '0 16px' }}>
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600">A learning tool for interacting with Ramp APIs</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('views')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'views' 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              View Data
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'management' 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Management
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'technical' 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Technical
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          width: '100%'
        }}>
          {getFilteredEndpoints().map((endpoint, index) => (
            <div 
              key={index}
              onClick={() => router.push(endpoint.path)}
              style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                border: '1px solid #E5E7EB'
              }}
              className="hover:shadow-lg hover:-translate-y-1 hover:border-blue-400"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <span className="text-2xl">{endpoint.icon}</span>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{endpoint.name}</h3>
                </div>
              </div>
              <div className="bg-gray-50 py-2 px-5 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-right">Click to explore</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-8 text-center text-gray-400 text-sm">
          <p>© 2025 Ramp API Command Center</p>
        </footer>
      </main>
    </div>
  );
}