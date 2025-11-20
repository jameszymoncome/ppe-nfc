import React, { useEffect, useState } from "react";
import EM_Sidebar from "./EM_Sidebar";
import {
  Activity,
  Calendar,
  CheckCircle,
  FileText,
  Package,
  ClipboardPlus,
  Eye,
} from "lucide-react";

import { BASE_URL } from "../utils/connection";

const EM_Dashboard = () => {
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastname");
  
  // IMPORTANT: must match backend parameter ?usersID=
  const userId = localStorage.getItem("userId");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH EMPLOYEE ITEMS FROM BACKEND
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/getItems.php?role=EMPLOYEE&usersID=${userId}`
        );

        const data = await res.json();

        if (data.items) {
          setItems(data.items);
        }

        setLoading(false);
      } catch (err) {
        console.log("Error loading employee items:", err);
        setLoading(false);
      }
    };

    fetchItems();
  }, [userId]);

  const totalAssets = items.length;
  const assigned = items.filter((d) => d.status === "Assigned").length;
  const pending = items.filter((d) => d.status === "For Tagging").length;

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-green-100 text-green-700";
      case "For Tagging":
        return "bg-yellow-100 text-yellow-700";
      case "Done Tagging":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <EM_Sidebar />

      {/* MAIN PAGE */}
      <div className="flex-1 overflow-auto">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
          <div className="p-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity size={32} />
              Employee Dashboard
            </h1>

            <p className="text-blue-200 flex items-center gap-2">
              <Calendar size={16} /> Your personal assets only
            </p>

            <p className="mt-2 text-lg font-semibold">
              Welcome, {firstName} {lastName}
            </p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">

          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-gray-500 flex items-center gap-2">
              <Package size={20} /> Total My Assets
            </p>
            <h2 className="text-4xl font-bold mt-1">{totalAssets}</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-gray-500 flex items-center gap-2">
              <CheckCircle size={20} /> Assigned
            </p>
            <h2 className="text-4xl font-bold mt-1">{assigned}</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
            <p className="text-gray-500 flex items-center gap-2">
              <FileText size={20} /> For Tagging
            </p>
            <h2 className="text-4xl font-bold mt-1">{pending}</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
            <p className="text-gray-500 flex items-center gap-2">
              <Activity size={20} /> Recent Updates
            </p>
            <h2 className="text-4xl font-bold mt-1">
              {items.slice(0, 5).length}
            </h2>
          </div>

        </div>

        {/* RECENT ASSETS TABLE */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl shadow overflow-hidden">

            <h2 className="p-4 border-b text-lg font-semibold text-blue-800">
              My Recent Assets
            </h2>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Document No</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Date Issued</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-6">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6">No assets found.</td></tr>
                ) : (
                  items.slice(0, 15).map((item, i) => (
                    <tr key={i} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-3">{item.documentNo}</td>
                      <td className="p-3">{item.type}</td>
                      <td className="p-3">{item.dateIssued}</td>

                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3 flex items-center gap-3">
                        {/* VIEW BUTTON */}
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye size={18} />
                        </button>

                        {/* ADD INSPECTION DETAILS */}
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() =>
                            console.log("Add inspection for:", item.documentNo)
                          }
                        >
                          <ClipboardPlus size={18} />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EM_Dashboard;
