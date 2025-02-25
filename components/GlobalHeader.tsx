// app/components/GlobalHeader.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface ActiveBusiness {
  businessName: string;
  businessId: string;
}

const GlobalHeader = () => {
  const [activeBusiness, setActiveBusiness] = useState<ActiveBusiness | null>(null);

  const fetchActiveBusiness = async () => {
    try {
      const response = await fetch('/api/ramp/active-account');
      const data = await response.json();
      if (data.business) {
        setActiveBusiness(data.business);
      }
    } catch (error) {
      console.error('Error fetching active business:', error);
    }
  };

  // Set up an interval to check for changes
  useEffect(() => {
    fetchActiveBusiness(); // Initial fetch

    // Poll for changes every few seconds
    const interval = setInterval(fetchActiveBusiness, 2000);

    return () => clearInterval(interval);
  }, []);

  // Also set up an event listener for account changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchActiveBusiness();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="font-geist-sans font-medium text-lg text-gray-900">
            Ramp API Command Center
          </div>
          
          {activeBusiness ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 font-geist-sans">Active Business:</div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium font-geist-sans">
                {activeBusiness.businessName}
                <span className="text-blue-400 text-xs ml-2 font-geist-mono">
                  {activeBusiness.businessId}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 font-geist-sans">
              No business selected
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;