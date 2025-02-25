// app/oauth-demo/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface OAuthDebugInfo {
    step: number;
    authUrl?: string;
    authUrlParams?: Record<string, string>;
    authorizationCode?: string;
    returnedState?: string;  // Changed from string | null
    savedState?: string;     // Changed from string | null
    tokenResponse?: any;
    exchangeParams?: any;
    error?: string;
  }

export default function OAuthDemoPage() {
  const [clientId, setClientId] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<OAuthDebugInfo>({ step: 1 });
  const REDIRECT_URI = 'http://localhost:3000/oauth-demo';

  useEffect(() => {
    fetch('/api/ramp/client-id')
      .then(res => res.json())
      .then(data => setClientId(data.clientId));
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
    const savedState = localStorage.getItem('oauth_state');
    
    if (code) {
      setDebugInfo(prev => ({
        ...prev,
        step: 2,
        authorizationCode: code,
        returnedState: returnedState || undefined,  // Convert null to undefined
        savedState: savedState || undefined        // Convert null to undefined
      }));
      
      if (returnedState === savedState) {
        handleTokenExchange(code);
      } else {
        setDebugInfo(prev => ({
          ...prev,
          error: 'State mismatch - possible CSRF attack!'
        }));
      }
    }
  }, []);

  const handleConnectRamp = () => {
    const savedState = localStorage.getItem('oauth_state');
    if (!savedState) {
      const newState = Math.random().toString(36).substring(7);
      localStorage.setItem('oauth_state', newState);
      setState(newState);
    }

    const authUrl = new URL('https://demo.ramp.com/v1/authorize');
    
    // Explanation of required parameters
    const params = {
      'response_type': 'code',  // Indicates we want an authorization code
      'scope': [  // Permissions we're requesting
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
      ].join(' '),
      'client_id': clientId,  // Your application's ID
      'redirect_uri': REDIRECT_URI,  // Where to send the user after authorization
      'state': savedState || state  // Anti-CSRF token
    };

    Object.entries(params).forEach(([key, value]) => {
      authUrl.searchParams.append(key, value);
    });

    setDebugInfo(prev => ({
      ...prev,
      step: 1,
      authUrl: authUrl.toString(),
      authUrlParams: params
    }));

    window.location.href = authUrl.toString();
  };

  const handleTokenExchange = async (code: string) => {
    try {
      setDebugInfo(prev => ({ 
        ...prev, 
        step: 3,
        exchangeParams: {
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        }
      }));

      const response = await fetch('/api/ramp/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: REDIRECT_URI
        }),
      });

      const data = await response.json();
      setDebugInfo(prev => ({
        ...prev,
        step: 4,
        tokenResponse: data
      }));
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to exchange token'
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">OAuth 2.0 Authorization Code Flow</h1>
        <p className="text-gray-600 mb-4">
          This demo walks through the OAuth 2.0 Authorization Code flow step by step, 
          showing the exact data being exchanged at each point.
        </p>
      </div>

      <div className="space-y-8">
        {/* Step 1: Authorization Request */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
            Authorization Request
          </h2>
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              First, we'll redirect you to Ramp's authorization page with these parameters:
            </p>
            {debugInfo.authUrlParams && (
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono">
                {JSON.stringify(debugInfo.authUrlParams, null, 2)}
              </pre>
            )}
          </div>
          <button
            onClick={handleConnectRamp}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Start Authorization
          </button>
        </div>

        {/* Step 2: Authorization Code */}
        {debugInfo.step >= 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">2</span>
              Authorization Code Response
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Authorization Code:</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono">
                  {debugInfo.authorizationCode}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">State Verification:</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono">
                  {JSON.stringify({
                    returnedState: debugInfo.returnedState,
                    savedState: debugInfo.savedState,
                    matches: debugInfo.returnedState === debugInfo.savedState
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Token Exchange */}
        {debugInfo.step >= 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">3</span>
              Token Exchange
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Exchange Parameters:</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono">
                  {JSON.stringify(debugInfo.exchangeParams, null, 2)}
                </pre>
              </div>
              {debugInfo.tokenResponse && (
                <div>
                  <h3 className="font-medium mb-2">Token Response:</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm font-mono">
                    {JSON.stringify(debugInfo.tokenResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {debugInfo.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">Error:</h3>
            <pre className="text-red-600 font-mono">
              {debugInfo.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}