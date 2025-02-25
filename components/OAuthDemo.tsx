// components/OAuthDemo.tsx
'use client';

import React, { useState, useEffect } from 'react';

const REDIRECT_URI = 'http://localhost:3000/oauth-demo';

interface DebugInfo {
  code: string | null;
  returnedState: string | null;
  savedState: string | null;
  tokenResponse?: any;
}

const OAuthDemo = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'authorized' | 'connected' | 'error'>('disconnected');
  const [clientId, setClientId] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    code: null,
    returnedState: null,
    savedState: null
  });

  // Get client ID on mount
  useEffect(() => {
    fetch('/api/ramp/client-id')
      .then(res => res.json())
      .then(data => setClientId(data.clientId))
      .catch(err => {
        console.error('Error fetching client ID:', err);
        setError('Failed to initialize');
      });
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('oauth_state');
    if (savedState) {
      setState(savedState);
    } else {
      const newState = Math.random().toString(36).substring(7);
      setState(newState);
      localStorage.setItem('oauth_state', newState);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const returnedState = urlParams.get('state');
    const errorParam = urlParams.get('error');
    const savedState = localStorage.getItem('oauth_state');
    
    if (errorParam) {
      setError(errorParam);
      setConnectionStatus('error');
      return;
    }

    if (code) {
      setDebugInfo({
        code,
        returnedState,
        savedState,
      });
      
      if (returnedState === savedState) {
        setConnectionStatus('authorized');
        handleTokenExchange(code);
        localStorage.removeItem('oauth_state');
      } else {
        setError('State mismatch - possible security issue');
        setConnectionStatus('error');
      }
    }
  }, []);

  const handleTokenExchange = async (code: string) => {
    try {
      const response = await fetch('/api/ramp/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        }),
      });

      const data = await response.json();
      setDebugInfo(prev => ({ ...prev, tokenResponse: data }));
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to exchange token');
      }

      setConnectionStatus('connected');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      setConnectionStatus('error');
    }
  };

  const handleConnectRamp = () => {
    const savedState = localStorage.getItem('oauth_state');
    if (!savedState) {
      const newState = Math.random().toString(36).substring(7);
      localStorage.setItem('oauth_state', newState);
      setState(newState);
    }

    const authUrl = new URL('https://demo.ramp.com/v1/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', [
      'accounting:read',
      'accounting:write',
      'bank_accounts:read',
      'bills:read',
      'bills:write',
      'business:read',
      'cards:read',
      'cards:write',
      'cashbacks:read',
      'departments:read',
      'departments:write',
      'entities:read',
      'leads:read',
      'leads:write',
      'limits:read',
      'limits:write',
      'locations:read',
      'locations:write',
      'memos:read',
      'merchants:read',
      'receipt_integrations:read',
      'receipt_integrations:write',
      'receipts:read',
      'reimbursements:read',
      'spend_programs:read',
      'spend_programs:write',
      'statements:read',
      'transactions:read',
      'transfers:read',
      'users:read',
      'users:write',
      'vendors:read',
      'vendors:write'
    ].join(' '));
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('state', savedState || state);

    window.location.href = authUrl.toString();
  };

  return (
    <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Connect Your Ramp Account</h1>
          <p className="text-gray-600">
            Securely connect your Ramp account to enable automatic expense synchronization
          </p>
        </div>

        <div className="flex flex-col items-center mb-8">
          {connectionStatus === 'disconnected' && (
            <button
              onClick={handleConnectRamp}
              disabled={!clientId}
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-300"
            >
              Connect Ramp Account
            </button>
          )}

          {connectionStatus === 'authorized' && (
            <div className="text-center">
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-4">
                ⏳ Authorization successful, exchanging token...
              </div>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
                ✓ Successfully connected to Ramp!
              </div>
              <a 
                href="/connections" 
                className="mt-4 inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                View Connected Accounts
              </a>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="text-center">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                ❌ Error: {error}
              </div>
              <button
                onClick={handleConnectRamp}
                className="mt-4 bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {Object.keys(debugInfo).length > 0 && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-xl font-bold mb-4">Debug Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthDemo;