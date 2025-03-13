// app/components/GlobalHeader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useActiveAccount } from '@/app/contexts/ActiveAccountContext';
import AccountSwitcher from './AccountSwitcher';

interface BusinessDetails {
  businessName: string;
  businessId: string;
}

const GlobalHeader = () => {
  const { activeBusinessId, isLoading } = useActiveAccount();
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      if (!activeBusinessId) {
        setBusinessDetails(null);
        return;
      }

      try {
        const response = await fetch('/api/ramp/connections');
        const data = await response.json();
        const activeBusiness = data.connections.find(
          (conn: BusinessDetails) => conn.businessId === activeBusinessId
        );
        if (activeBusiness) {
          setBusinessDetails(activeBusiness);
        }
      } catch (error) {
        console.error('Error fetching business details:', error);
      }
    };

    fetchBusinessDetails();
  }, [activeBusinessId]);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="font-geist-sans font-medium text-lg text-gray-900">
            Ramp API Command Center
          </div>
          
          <div className="flex items-center gap-6">
            {businessDetails ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 font-geist-sans">Active Business:</div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium font-geist-sans">
                  {businessDetails.businessName}
                  <span className="text-blue-400 text-xs ml-2 font-geist-mono">
                    {businessDetails.businessId}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 font-geist-sans">
                No business selected
              </div>
            )}
            <div className="border-l border-gray-200 pl-6">
              <AccountSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;