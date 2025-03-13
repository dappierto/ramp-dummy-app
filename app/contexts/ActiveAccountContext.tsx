'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ActiveAccountContextType {
  activeBusinessId: string | null;
  setActiveBusinessId: (businessId: string) => Promise<void>;
  isLoading: boolean;
}

const ActiveAccountContext = createContext<ActiveAccountContextType | undefined>(undefined);

export function ActiveAccountProvider({ children }: { children: React.ReactNode }) {
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial active account from database only once on mount
    const loadActiveAccount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/ramp/active-account');
        const data = await response.json();
        if (data.businessId) {
          setActiveBusinessIdState(data.businessId);
        }
      } catch (error) {
        console.error('Failed to load active account:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveAccount();
  }, []); // Empty dependency array means this only runs once on mount

  const setActiveBusinessId = async (businessId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ramp/set-active-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId }),
      });

      if (!response.ok) {
        throw new Error('Failed to set active account');
      }

      setActiveBusinessIdState(businessId);
    } catch (error) {
      console.error('Failed to set active account:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    activeBusinessId,
    setActiveBusinessId,
    isLoading
  };

  return (
    <ActiveAccountContext.Provider value={value}>
      {children}
    </ActiveAccountContext.Provider>
  );
}

export function useActiveAccount() {
  const context = useContext(ActiveAccountContext);
  if (context === undefined) {
    throw new Error('useActiveAccount must be used within an ActiveAccountProvider');
  }
  return context;
} 