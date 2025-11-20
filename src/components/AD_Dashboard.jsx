import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {
  FileText,
  Users,
  TrendingUp,
  Package,
  Eye,
  Activity,
  Calendar,
  CheckCircle,
  Upload,
  Download
} from "lucide-react";

import { BASE_URL } from "../utils/connection";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import AD_Sidebar from "./AD_Sidebar";

const calcTrend = (current, previous) => {
  if (previous === 0) return 0;
  return (((current - previous) / previous) * 100).toFixed(1);
};

const AD_Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // user details
  const accessLevel = localStorage.getItem("accessLevel");
  const userOffice = localStorage.getItem("department");
  const userName = localStorage.getItem("firstname") + " " + localStorage.getItem("lastname");

  const now = new Date();
  const currentMonth = now.getMonth();
  const previousMonth = (currentMonth - 1 + 12) % 12;

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/reports_getItems.php`);
        const data = await response.json();

        let filtered = data.items || [];

        // ADMIN FILTERING HERE
        if (accessLevel === "Admin") {
          filtered = filtered.filter(
            d => d.office === userOffice || d.user === userName
          );
        }

        setDocuments(filtered);
      } catch (error) {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        const response = await fetch(`${BASE_URL}/getItems.php`);
        const data = await response.json();

        let filtered = data.items || [];

        // ADMIN FILTER
        if (accessLevel === "Admin") {
          filtered = filtered.filter(
            d => d.office === userOffice || d.user === userName
          );
        }

        setRecentDocs(filtered);
      } catch {
        setRecentDocs([]);
      }
    };
    fetchRecentDocs();
  }, []);

  // Calculations
  const totalDocs = documents.length;
  const totalPAR = documents.filter((d) => d.type === "PAR").length;
  const totalICS = documents.filter((d) => d.type === "ICS").length;
  const assignedAssets = documents.filter((d) => d.status === "Assigned").length;
  const pendingAssets = documents.filter((d) => d.status === "Pending").length;

  const docsThisMonth = documents.filter(
    (d) => new Date(d.dateIssued).getMonth() === currentMonth
  );

  const docsLastMonth = documents.filter(
    (d) => new Date(d.dateIssued).getMonth() === previousMonth
  );

  const totalDocsTrend = calcTrend(docsThisMonth.length, docsLastMonth.length);

  const deptData = Object.values(
    documents.reduce((acc, d) => {
      if (!acc[d.office])
        acc[d.office] = { department: d.office, items: 0 };
      acc[d.office].items += parseInt(d.items) || 0;
      return acc;
    }, {})
  );

  const conditionData = [
    { name: "Serviceable", value: assignedAssets },
    { name: "Pending", value: pendingAssets },
    {
      name: "Others",
      value: documents.filter(
        (d) => d.status !== "Assigned" && d.status !== "Pending"
      ).length,
    },
  ];

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Upload Scanned Copy":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "PAR":
        return "bg-blue-100 text-blue-800";
      case "ICS":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AD_Sidebar />

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
          <div className="p-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity size={32} />
              Admin Dashboard
            </h1>
            <p className="text-blue-100">
              Showing data only for your department & assignments
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 mt-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 flex items-center gap-2">
              <Package size={16} /> Total Documents
            </p>
            <h2 className="text-3xl font-bold mt-2">{totalDocs}</h2>
            <p className="text-sm text-gray-500">PAR & ICS you can access</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 flex items-center gap-2">
              <FileText size={16} /> PAR Assigned
            </p>
            <h2 className="text-3xl font-bold mt-2">{totalPAR}</h2>
            <p className="text-sm text-gray-500">PAR within department</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-500 flex items-center gap-2">
              <FileText size={16} /> ICS Assigned
            </p>
            <h2 className="text-3xl font-bold mt-2">{totalICS}</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <p className="text-gray-500 flex items-center gap-2">
              <CheckCircle size={16} /> Assigned Assets
            </p>
            <h2 className="text-3xl font-bold mt-2">{assignedAssets}</h2>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-8 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-gray-800 mb-4">Condition Status</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RePieChart>
                <Pie
                  data={conditionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                >
                  {conditionData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-gray-800 mb-4">
              Assets by Department
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData}>
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="items" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <h2 className="p-4 border-b text-lg font-semibold text-blue-800">
              Recent Documents
            </h2>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Doc No</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Office</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  recentDocs.slice(0, 10).map((doc, i) => (
                    <tr key={i} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-3">{doc.documentNo}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                            doc.type
                          )}`}
                        >
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-3">{doc.user}</td>
                      <td className="p-3 text-center">{doc.office}</td>
                      <td className="p-3">{doc.dateIssued}</td>
                      <td className="p-3 text-center">{doc.items}</td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </td>

                      <td className="p-3">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye size={16} />
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

export default AD_Dashboard;
