// components/RampConnections.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RampConnection {
  id: string;
  businessName: string;
  businessId: string;
  scopes: string;
  tokenExpires: string;
  refreshToken?: string;
}

const RampConnections = () => {
  const [connections, setConnections] = useState<RampConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<{[key: string]: boolean}>({});
  const [refreshStatus, setRefreshStatus] = useState<{type: 'success' | 'error' | null, message: string | null}>({
    type: null,
    message: null
  });
  const router = useRouter();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/ramp/connections');
      const data = await response.json();
      setConnections(data.connections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (businessId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    
    try {
      await fetch(`/api/ramp/connections/${businessId}`, {
        method: 'DELETE'
      });
      await fetchConnections();
      setRefreshStatus({
        type: 'success',
        message: 'Account disconnected successfully'
      });
      
      setTimeout(() => {
        setRefreshStatus({ type: null, message: null });
      }, 3000);
    } catch (error) {
      console.error('Error disconnecting:', error);
      setRefreshStatus({
        type: 'error',
        message: 'Failed to disconnect account'
      });
      
      setTimeout(() => {
        setRefreshStatus({ type: null, message: null });
      }, 3000);
    }
  };

  const handleRefreshToken = async (businessId: string) => {
    setRefreshing({...refreshing, [businessId]: true});
    
    try {
      const response = await fetch('/api/ramp/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          grant_type: 'refresh_token', 
          business_id: businessId 
        }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error('Failed to parse response from server');
      }
      
      if (!response.ok) {
        throw new Error(
          typeof data === 'object' && data !== null && 'error' in data 
            ? String(data.error) 
            : `Failed to refresh token (${response.status})`
        );
      }
      
      await fetchConnections();
      setRefreshStatus({
        type: 'success',
        message: 'Token refreshed successfully. ' + 
          (data.expires_at ? `Expires: ${new Date(data.expires_at).toLocaleTimeString()}` : '')
      });
      
      setTimeout(() => {
        setRefreshStatus({ type: null, message: null });
      }, 5000);
    } catch (error) {
      console.error('Error refreshing token:', error);
      setRefreshStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to refresh token'
      });
      
      setTimeout(() => {
        setRefreshStatus({ type: null, message: null });
      }, 5000);
    } finally {
      setRefreshing({...refreshing, [businessId]: false});
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getExpiryStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const timeLeft = expiry.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / (1000 * 60));
    
    if (minutesLeft < 0) {
      return { status: 'expired', text: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (minutesLeft < 10) {
      return { status: 'critical', text: `Expires in ${minutesLeft} mins`, color: 'bg-red-100 text-red-800' };
    } else if (minutesLeft < 30) {
      return { status: 'warning', text: `Expires in ${minutesLeft} mins`, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'good', text: `Expires in ${Math.floor(minutesLeft / 60)} hrs ${minutesLeft % 60} mins`, color: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Connected Ramp Accounts</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/oauth-demo')}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              + Connect New Account
            </button>
            <button 
              onClick={() => router.push('/')}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
        
        {refreshStatus.type && (
          <div className={`mb-6 p-4 rounded-lg ${
            refreshStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-2">
                {refreshStatus.type === 'success' ? '✅' : '❌'}
              </span>
              <span>{refreshStatus.message}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No Ramp accounts connected yet</p>
            <button 
              onClick={() => router.push('/oauth-demo')}
              className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Connect your first account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {connections.map((connection) => {
              const expiryStatus = getExpiryStatus(connection.tokenExpires);
              
              return (
                <div 
                  key={connection.id} 
                  className="border rounded-lg p-6 bg-white shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="font-semibold text-lg">
                        {connection.businessName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {connection.businessId}
                      </p>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                          {expiryStatus.text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {formatDate(connection.tokenExpires)}
                      </p>
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 mb-1">Available Scopes:</div>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                          {connection.scopes.split(' ').map((scope) => (
                            <span 
                              key={scope}
                              className="text-xs bg-gray-100 px-2 py-1 rounded"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleRefreshToken(connection.businessId)}
                        disabled={refreshing[connection.businessId]}
                        className={`px-4 py-2 rounded text-sm ${
                          refreshing[connection.businessId] 
                            ? 'bg-blue-100 text-blue-800 cursor-wait' 
                            : expiryStatus.status === 'expired' || expiryStatus.status === 'critical' || expiryStatus.status === 'warning'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {refreshing[connection.businessId] 
                          ? 'Refreshing...' 
                          : '🔄 Refresh Token'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(connection.businessId)}
                        className="text-red-600 hover:text-red-800 text-sm px-4 py-2 rounded border border-red-200 hover:bg-red-50"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RampConnections;