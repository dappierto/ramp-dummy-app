"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define ERP Vendor type
type ERPEntity = {
  entity_id: string;
  entity_name: string;
  ramp_entity_id?: string;
};

export default function EntitiesPage() {
  const [entities, setEntities] = useState<ERPEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchEntities();
  }, []);

  // Fetch Vendors from ERP API
  const fetchEntities = () => {
    fetch("/api/erp/get-entities")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) => Number(b.is_active) - Number(a.is_active)); // Sort by active status
          setEntities(sortedData);
        } else {
          console.error("❌ Invalid entities Response:", data);
          setEntities([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching entities:", err);
        setEntities([]);
        setLoading(false);
      });
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading Entities...</p>;

  return (
    <div className="page-container">
      <div className="header-container">
        <h1 className="text-2xl font-bold text-gray-900">🏢 ERP Entities</h1>
        <button onClick={() => router.push("/")} className="btn-ramp">← Back to Command Center</button>
      </div>

      {/* Vendors Table */}
      <div className="flex-item card">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">ERP Entities</h2>
        <div className="table-container">
          <table className="table-style">
            <thead>
              <tr>
                <th>ERP ID</th>
                <th>Name</th>
                <th>Ramp ID</th>
              </tr>
            </thead>
            <tbody>
              {entities.length > 0 ? (
                entities.map((entity) => (
                  <tr key={entity.entity_id} className="hover:bg-gray-50">
                    <td>{entity.entity_id}</td>
                    <td>{entity.entity_name}</td>
                    <td>{entity.ramp_entity_id || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center text-gray-500">No entities available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
