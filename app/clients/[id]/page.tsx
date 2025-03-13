"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Link from "next/link";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  client_owner: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch("/api/ramp/users");
        if (!usersResponse.ok) throw new Error("Failed to fetch users");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Fetch client
        const clientResponse = await fetch(`/api/clients/${params.id}`);
        if (!clientResponse.ok) throw new Error("Failed to fetch client");
        const clientData = await clientResponse.json();
        setClient(clientData);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
      });

      if (!response.ok) throw new Error("Failed to update client");
      router.push("/clients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update client");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (client) {
      setClient({ ...client, [name]: value });
    }
  };

  const handleSelectChange = (selectedOption: SelectOption | null, field: string) => {
    if (selectedOption && client) {
      setClient({ ...client, [field]: selectedOption.value });
    }
  };

  const userOptions: SelectOption[] = users.map(user => ({
    value: user.id,
    label: `${user.first_name} ${user.last_name}`
  }));

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!client) return <div className="p-4">Client not found</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
            <Link href="/clients" className="btn-ramp">
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <main style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '0 16px' }}>
        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Client Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={client.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                id="industry"
                value={client.industry || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="client_owner" className="block text-sm font-medium text-gray-700">
                Client Owner
              </label>
              <Select
                id="client_owner"
                name="client_owner"
                options={userOptions}
                value={userOptions.find(option => option.value === client.client_owner)}
                onChange={(option) => handleSelectChange(option, 'client_owner')}
                className="mt-1"
                classNamePrefix="select"
                placeholder="Select client owner..."
                isClearable
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={client.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                className="btn-ramp"
              >
                Update Client
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 