"use client";
import { useRouter } from "next/navigation";
import AccountSwitcher from '@/components/AccountSwitcher';
import { useState } from "react";

// Define types for recipes and endpoints
type Recipe = {
  name: string;
  path: string;
  icon: string;
  description: string;
  status: 'ready' | 'in-progress' | 'planned';
};

type Endpoint = {
  name: string;
  path: string;
  icon: string;
  description: string;
};

type AuthTool = {
  name: string;
  path: string;
  icon: string;
  description: string;
};

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recipes' | 'data' | 'auth'>('recipes');

  // Define recipes with their current status
  const recipes: Recipe[] = [
    {
      name: "Transaction Sync Recipe",
      path: "/transactions",
      icon: "📊",
      description: "Learn how to sync transactions with proper error handling and validation",
      status: 'ready'
    },
    {
      name: "Reimbursement Sync Recipe",
      path: "/reimbursements",
      icon: "💰",
      description: "Learn how to sync reimbursements with success and failure flows",
      status: 'ready'
    },
    {
      name: "GL Accounts Recipe",
      path: "/gl-accounts",
      icon: "📒",
      description: "Map and sync GL accounts between your ERP and Ramp",
      status: 'ready'
    },
    {
      name: "Custom Fields Recipe",
      path: "/custom-fields",
      icon: "🔧",
      description: "Set up and sync custom fields with field options",
      status: 'ready'
    },
    {
      name: "Entity Management Recipe",
      path: "/entities",
      icon: "🏢",
      description: "Create and sync entities between your ERP and Ramp",
      status: 'ready'
    },
    {
      name: "Bill Management Recipe",
      path: "/bills",
      icon: "📄",
      description: "Create and sync bills with line items",
      status: 'planned'
    }
  ];

  // Define data views
  const dataViews: Endpoint[] = [
    { 
      name: "Projects & Engagements", 
      path: "/projects", 
      icon: "📊",
      description: "View and manage consulting projects and client engagements"
    },
    { 
      name: "Transactions", 
      path: "/transactions", 
      icon: "📊",
      description: "View synced transactions"
    },
    { 
      name: "Reimbursements", 
      path: "/reimbursements", 
      icon: "💵",
      description: "View synced reimbursements"
    },
    { 
      name: "GL Accounts", 
      path: "/gl-accounts", 
      icon: "📒",
      description: "View synced GL accounts"
    },
    { 
      name: "Custom Fields", 
      path: "/custom-fields", 
      icon: "🔧",
      description: "View synced custom fields"
    },
    { 
      name: "Entities", 
      path: "/entities", 
      icon: "🏢",
      description: "View synced entities"
    }
  ];

  // Define auth tools
  const authTools: AuthTool[] = [
    {
      name: "Connect New Account",
      path: "/oauth-demo",
      icon: "🔐",
      description: "Connect a new account using OAuth authentication",
    },
    {
      name: "Manage Connections",
      path: "/connections",
      icon: "🔌",
      description: "View and manage your connected accounts",
    },
    {
      name: "Settings",
      path: "/settings",
      icon: "⚙️",
      description: "Configure system settings and approval policies",
    }
  ];

  const getStatusColor = (status: Recipe['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'planned':
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Ramp API Learning Center</h2>
          <p className="text-lg text-gray-600">Explore our interactive recipes and tools to master the Ramp API</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recipes' 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Learning Recipes
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'data' 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Data Views
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'auth' 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Auth & Settings
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6">
          {/* Section Description */}
          <div className="text-center mb-4">
            {activeTab === 'recipes' && (
              <p className="text-gray-600">Interactive tutorials to help you learn the Ramp API step-by-step</p>
            )}
            {activeTab === 'data' && (
              <p className="text-gray-600">Direct access to view and manage your data</p>
            )}
            {activeTab === 'auth' && (
              <p className="text-gray-600">Manage your authentication and API connections</p>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'recipes' && recipes.map((recipe, index) => (
              <div 
                key={index}
                onClick={() => router.push(recipe.path)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-400"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{recipe.icon}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recipe.status)}`}>
                    {recipe.status === 'ready' ? '✓ Ready' : 
                     recipe.status === 'in-progress' ? '⚡ In Progress' : 
                     '🔜 Planned'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{recipe.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{recipe.description}</p>
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Click to start learning →</p>
                </div>
              </div>
            ))}

            {activeTab === 'data' && dataViews.map((view, index) => (
              <div 
                key={index}
                onClick={() => router.push(view.path)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-400"
              >
                <div className="flex items-center mb-4">
                  <span className="text-2xl">{view.icon}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{view.name}</h3>
                <p className="text-gray-600 text-sm">{view.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Click to view data →</p>
                </div>
              </div>
            ))}

            {activeTab === 'auth' && authTools.map((tool, index) => (
              <div 
                key={index}
                onClick={() => router.push(tool.path)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-400"
              >
                <div className="flex items-center mb-4">
                  <span className="text-2xl">{tool.icon}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
                <p className="text-gray-600 text-sm">{tool.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Click to manage →</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Help Section */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Help</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start">
              <span className="text-xl mr-3">📚</span>
              <div>
                <h4 className="font-medium">Documentation</h4>
                <p className="text-sm text-gray-600">Each recipe includes detailed API documentation</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-xl mr-3">💡</span>
              <div>
                <h4 className="font-medium">Interactive Learning</h4>
                <p className="text-sm text-gray-600">Step-by-step guides with live API calls</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-xl mr-3">🔍</span>
              <div>
                <h4 className="font-medium">API Logs</h4>
                <p className="text-sm text-gray-600">View detailed logs for every API interaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Ramp API Command Center</p>
        </footer>
      </main>
    </div>
  );
}

// this is the main page that displays all the endpoints and allows the user to navigate to the different pages