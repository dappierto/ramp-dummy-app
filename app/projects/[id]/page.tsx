"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Select from 'react-select';

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

interface Engagement {
  id: string;
  name: string;
  client: Client;
  client_id: string;
  engagement_manager: string;
  engagement_director: string;
  project_team: string[];
  start_date: string;
  end_date: string | null;
  status: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Engagement | null>(null);

  // Transform users into select options
  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.first_name} ${user.last_name}`
  }));

  // Transform clients into select options
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.name
  }));

  // Get selected team members
  const selectedTeamMembers = formData?.project_team.map(userId => ({
    value: userId,
    label: users.find(u => u.id === userId)
      ? `${users.find(u => u.id === userId)!.first_name} ${users.find(u => u.id === userId)!.last_name}`
      : "Unknown User"
  })) || [];

  // Fetch users, clients, and project data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch("/api/ramp/users");
        if (!usersResponse.ok) throw new Error("Failed to fetch users");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Fetch clients
        const clientsResponse = await fetch("/api/clients");
        if (!clientsResponse.ok) throw new Error("Failed to fetch clients");
        const clientsData = await clientsResponse.json();
        setClients(clientsData);

        // Fetch project
        const projectResponse = await fetch(`/api/projects/${params.id}`);
        if (!projectResponse.ok) throw new Error("Failed to fetch project");
        const projectData = await projectResponse.json();
        
        // Format dates for form inputs
        setFormData({
          ...projectData,
          start_date: new Date(projectData.start_date).toISOString().split('T')[0],
          end_date: projectData.end_date ? new Date(projectData.end_date).toISOString().split('T')[0] : ""
        });

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
    
    if (!formData) return;

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project");
      }

      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string) => (selectedOption: any) => {
    if (!formData) return;

    if (name === 'project_team') {
      const selectedValues = selectedOption ? selectedOption.map((option: SelectOption) => option.value) : [];
      setFormData(prev => ({
        ...prev!,
        project_team: selectedValues
      }));
    } else {
      setFormData(prev => ({
        ...prev!,
        [name]: selectedOption ? selectedOption.value : ''
      }));
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!formData) return <div className="p-4">No project found</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div style={{ width: '95%', maxWidth: '1800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center h-16 px-4">
            <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
            <button 
              onClick={() => router.push("/projects")} 
              className="btn-ramp"
            >
              ← Back to Projects
            </button>
          </div>
        </div>
      </header>

      <main style={{ width: '95%', maxWidth: '1800px', margin: '0 auto', padding: '0 16px' }}>
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <Select
                id="client_id"
                name="client_id"
                value={clientOptions.find(option => option.value === formData.client_id)}
                onChange={handleSelectChange('client_id')}
                options={clientOptions}
                className="mt-1"
                classNamePrefix="select"
              />
            </div>

            <div>
              <label htmlFor="engagement_manager" className="block text-sm font-medium text-gray-700">
                Engagement Manager
              </label>
              <Select
                id="engagement_manager"
                name="engagement_manager"
                value={userOptions.find(option => option.value === formData.engagement_manager)}
                onChange={handleSelectChange('engagement_manager')}
                options={userOptions}
                className="mt-1"
                classNamePrefix="select"
              />
            </div>

            <div>
              <label htmlFor="engagement_director" className="block text-sm font-medium text-gray-700">
                Engagement Director
              </label>
              <Select
                id="engagement_director"
                name="engagement_director"
                value={userOptions.find(option => option.value === formData.engagement_director)}
                onChange={handleSelectChange('engagement_director')}
                options={userOptions}
                className="mt-1"
                classNamePrefix="select"
              />
            </div>

            <div>
              <label htmlFor="project_team" className="block text-sm font-medium text-gray-700">
                Project Team
              </label>
              <Select
                isMulti
                id="project_team"
                name="project_team"
                value={selectedTeamMembers}
                onChange={handleSelectChange('project_team')}
                options={userOptions}
                className="mt-1"
                classNamePrefix="select"
                placeholder="Select team members..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  id="start_date"
                  required
                  value={formData.start_date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  id="end_date"
                  value={formData.end_date || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-ramp"
              >
                Update Project
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 