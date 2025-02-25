'use client';

import React, { useState, useEffect } from 'react';

const Base64Demo = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (clientId && clientSecret) {
      const combined = `${clientId}:${clientSecret}`;
      const encoded = btoa(combined);
      setBase64Output(encoded);
    } else {
      setBase64Output('');
    }
  }, [clientId, clientSecret]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Base64 Encoding for API Authentication</h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          When using Basic Authentication for APIs, we need to combine the client ID and secret
          with a colon separator, then encode it in base64. This demo shows how the process works.
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Enter Your Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g., ramp_id_xxx..."
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="e.g., ramp_sec_xxx..."
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Terminal Command</h2>
          <p className="text-gray-600 mb-2">This is how you would encode these credentials in the terminal:</p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
            echo -n "{clientId}:{clientSecret}" | base64
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Base64 Output</h2>
          <p className="text-gray-600 mb-2">The encoded credentials that you'll use in your Authorization header:</p>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all">
            {base64Output || 'Enter credentials above to see output...'}
          </div>
          {base64Output && (
            <div className="mt-4 text-gray-600">
              <p className="font-semibold">Use in your API calls as:</p>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm mt-2 break-all">
                Authorization: Basic {base64Output}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-3 text-gray-600">
            <p>1. Combine client ID and secret with a colon: <code>client_id:client_secret</code></p>
            <p>2. Convert the combined string to base64 format</p>
            <p>3. Prefix with "Basic " in the Authorization header</p>
            <p>4. Use this header in your API requests</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a client-side demo to show how base64 encoding works. 
          In a production environment, you should never expose or transmit your API secrets in the browser.
        </p>
      </div>
    </div>
  );
};

export default Base64Demo;