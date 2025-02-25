// components/AccountSwitcher.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface RampConnection {
  id: string;
  businessName: string;
  businessId: string;
  scopes: string;
}

const AccountSwitcher = () => {
  const [connections, setConnections] = useState<RampConnection[]>([]);
  const [activeAccount, setActiveAccount] = useState<RampConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConnections();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/ramp/connections');
      const data = await response.json();
      setConnections(data.connections);
      
      // Set active account if any
      const active = data.connections.find((conn: RampConnection) => 
        conn.businessId === localStorage.getItem('activeAccountId')
      );
      if (active) {
        setActiveAccount(active);
      } else if (data.connections.length > 0) {
        setActiveAccount(data.connections[0]);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSwitch = async (connection: RampConnection) => {
    try {
      const response = await fetch('/api/ramp/set-active-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: connection.businessId })
      });
      
      if (response.ok) {
        setActiveAccount(connection);
        localStorage.setItem('activeAccountId', connection.businessId);
        // Dispatch a custom event
        window.dispatchEvent(new Event('storage'));
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error switching accounts:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="text-sm font-medium truncate max-w-[150px]">
          {activeAccount?.businessName || "Select Account"}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-2">
              Switch Account
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {connections.map((connection) => (
                <button
                  key={connection.id}
                  onClick={() => handleAccountSwitch(connection)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeAccount?.businessId === connection.businessId
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{connection.businessName}</span>
                    {activeAccount?.businessId === connection.businessId && (
                      <span className="flex-shrink-0 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">{connection.businessId}</p>
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-100 mt-2 pt-2">
              <a 
                href="/oauth-demo"
                className="block px-3 py-2 text-sm text-indigo-600 hover:bg-gray-100 rounded-md"
              >
                + Connect New Account
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;