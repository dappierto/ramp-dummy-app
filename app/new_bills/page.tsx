"use client";

import { useState, useEffect } from "react";

// Entity Type Definitions
type Entity = {
  entity_id: string;
  entity_name: string;
  ramp_entity_id: string | null;
};

type Vendor = {
  name: string;
  ramp_vendor_id: string;
  ramp_vendor_contact_id: string | null;
};

type BillLineItem = {
  category_id: string;
  description: string;
  line_type: "Item" | "Expense";
  quantity: number;
  unit_price: number;
  total_amount: number;
};

type BillData = {
  invoice_number: string;
  invoice_currency: string;
  memo: string;
  payment_method: string;
  ramp_vendor_id: string;
  ramp_vendor_contact_id: string;
  due_date: string;
  issue_date: string;
  ramp_entity_id: string;
  lineItems: BillLineItem[];
};

export default function NewBillPage() {
  const [billData, setBillData] = useState<BillData>({
    invoice_number: "",
    invoice_currency: "",
    memo: "",
    payment_method: "",
    ramp_vendor_id: "",
    ramp_vendor_contact_id: "",
    due_date: "",
    issue_date: "",
    ramp_entity_id: "",
    lineItems: [],
  });

  const [entities, setEntities] = useState<Entity[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [erpAccounts, setErpAccounts] = useState<{ id: string; name: string }[]>([]);
  const [totalBillAmount, setTotalBillAmount] = useState(0);

  useEffect(() => {
    fetch("/api/erp-accounts")
      .then((res) => res.json())
      .then((data) => {
        setErpAccounts(data);
      })
      .catch((error) => console.error("Error fetching accounts:", error));
  }, []);

  useEffect(() => {
    fetch("/api/erp/get-entities")
      .then((res) => res.json())
      .then((data) => {
        setEntities(data);
      })
      .catch((error) => console.error("Error fetching entities:", error));
  }, []);

  useEffect(() => {
    fetch("/api/erp/vendors")
      .then((res) => res.json())
      .then((data) => {
        setVendors(data);
      })
      .catch((error) => console.error("Error fetching vendors:", error));
  }, []);

  useEffect(() => {
    setTotalBillAmount(
      billData.lineItems.reduce((sum, item) => sum + item.total_amount, 0)
    );
  }, [billData.lineItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBillData({ ...billData, [e.target.name]: e.target.value });
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEntity = entities.find((entity) => entity.ramp_entity_id === e.target.value);
    setBillData({
      ...billData,
      ramp_entity_id: selectedEntity?.ramp_entity_id || "",
    });
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVendor = vendors.find((vendor) => vendor.ramp_vendor_id === e.target.value);
    setBillData({
      ...billData,
      ramp_vendor_id: selectedVendor?.ramp_vendor_id || "",
      ramp_vendor_contact_id: selectedVendor?.ramp_vendor_contact_id || "",
    });
  };

  const handleLineItemChange = (index: number, field: keyof BillLineItem, value: any) => {
    const updatedItems = [...billData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    
    if (field === "quantity" || field === "unit_price") {
      updatedItems[index].total_amount = 
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setBillData({ ...billData, lineItems: updatedItems });
  };

  const addLineItem = () => {
    const newLineItem: BillLineItem = {
      category_id: "",
      description: "",
      line_type: "Item",
      quantity: 1,
      unit_price: 0,
      total_amount: 0,
    };
    setBillData({
      ...billData,
      lineItems: [...billData.lineItems, newLineItem],
    });
  };

  const removeLineItem = (index: number) => {
    const updatedItems = billData.lineItems.filter((_, i) => i !== index);
    setBillData({ ...billData, lineItems: updatedItems });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const billDataPayload = {
      invoice_number: billData.invoice_number,
      invoice_currency: billData.invoice_currency,
      memo: billData.memo,
      payment_method: billData.payment_method,
      ramp_vendor_id: billData.ramp_vendor_id,
      ramp_vendor_contact_id: billData.ramp_vendor_contact_id,
      due_date: billData.due_date,
      issue_date: billData.issue_date,
      ramp_entity_id: billData.ramp_entity_id,
      line_items: billData.lineItems.map(item => ({
        category_id: item.category_id,
        description: item.description,
        line_type: item.line_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
      })),
    };
  
    try {
      const response = await fetch('/api/erp/push-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billDataPayload),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        // Reset form to initial state
        setBillData({
          invoice_number: "",
          invoice_currency: "",
          memo:"",
          payment_method: "",
          ramp_vendor_id: "",
          ramp_vendor_contact_id: "",
          due_date: "",
          issue_date: "",
          ramp_entity_id: "",
          lineItems: [],
        });
  
        // Show success message (you can style this better with a proper UI component)
        alert("Bill created successfully!");
  
        // Optional: Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(`Error creating bill: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error creating bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Bill</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                value={billData.invoice_number}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter invoice number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                name="invoice_currency"
                value={billData.invoice_currency}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Currency</option>
                {[
                  "USD", "EUR", "GBP", "AUD", "CAD", "INR", "JPY", "CNY", "BRL", "MXN",
                  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AWG", "AZN", "BAM",
                  "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV", "BSD",
                ].map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Memo
              </label>
              <input
                type="text"
                name="memo"
                value={billData.memo}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter invoice memo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                name="payment_method"
                value={billData.payment_method}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Payment Method</option>
                {[
                  "ACH",
                  "CARD",
                  "CHECK",
                  "DOMESTIC_WIRE",
                  "INTERNATIONAL",
                  "ONE_TIME_CARD",
                  "ONE_TIME_CARD_DELIVERY",
                  "PAID_MANUALLY",
                  "SWIFT",
                  "UNSPECIFIED",
                  "VENDOR_CREDIT",
                ].map((method) => (
                  <option key={method} value={method}>
                    {method.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity
              </label>
              <select
                name="ramp_entity_id"
                value={billData.ramp_entity_id}
                onChange={handleEntityChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Entity</option>
                {entities.map((entity) => (
                  <option key={entity.entity_id} value={entity.ramp_entity_id || ""}>
                    {entity.entity_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                name="ramp_vendor_id"
                value={billData.ramp_vendor_id}
                onChange={handleVendorChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.ramp_vendor_id} value={vendor.ramp_vendor_id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={billData.due_date}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                name="issue_date"
                value={billData.issue_date}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                + Add Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Category ID</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Type</th>
                    <th className="border p-2 text-left">Quantity</th>
                    <th className="border p-2 text-left">Unit Price</th>
                    <th className="border p-2 text-left">Total</th>
                    <th className="border p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="border p-2">
                        <select
                          value={item.category_id}
                          onChange={(e) => handleLineItemChange(index, "category_id", e.target.value)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="">Select Category</option>
                          {erpAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          value={item.line_type}
                          onChange={(e) => handleLineItemChange(index, "line_type", e.target.value as "Item" | "Expense")}
                          className="w-full p-1 border rounded"
                        >
                          <option value="Item">Item</option>
                          <option value="Expense">Expense</option>
                        </select>
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(index, "unit_price", parseFloat(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        ${(item.total_amount).toFixed(2)}
                      </td>
                      <td className="border p-2">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="text-lg font-semibold">
                Total: ${totalBillAmount.toFixed(2)}
              </div>
              <div className="space-x-4">
                <button 
                  type="button"
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Save Draft
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Bill
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* Add this right before the final closing </div> */}
<div className="mt-8 bg-gray-50 p-6 rounded-lg">
  <h2 className="text-xl font-bold mb-4">Bill Summary</h2>
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Category</th>
          <th className="border p-2 text-left">Description</th>
          <th className="border p-2 text-left">Type</th>
          <th className="border p-2 text-left">Quantity</th>
          <th className="border p-2 text-left">Unit Price</th>
          <th className="border p-2 text-left">Total</th>
        </tr>
      </thead>
      <tbody>
        {billData.lineItems.map((item, index) => (
          <tr key={index}>
            <td className="border p-2">{item.category_id}</td>
            <td className="border p-2">{item.description}</td>
            <td className="border p-2">{item.line_type}</td>
            <td className="border p-2">{item.quantity}</td>
            <td className="border p-2">${item.unit_price.toFixed(2)}</td>
            <td className="border p-2">${item.total_amount.toFixed(2)}</td>
          </tr>
        ))}
        <tr className="bg-gray-50">
          <td colSpan={5} className="border p-2 text-right font-bold">Total:</td>
          <td className="border p-2 font-bold">${totalBillAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
    </div>
    
  );
  
}