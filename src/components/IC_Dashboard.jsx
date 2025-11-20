import React, { useEffect, useState } from "react";
import IC_Sidebar from "./IC_Sidebar";
import {
  FileText,
  TrendingUp,
  Package,
  CheckCircle,
  Calendar,
  Activity,
  Eye,
  ClipboardCheck
} from "lucide-react";
import { BASE_URL } from "../utils/connection";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const calcTrend = (current, previous) => {
  if (previous === 0) return 0;
  return (((current - previous) / previous) * 100).toFixed(1);
};

const IC_Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [recentDocs, setRecentDocs] = useState([]);

  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastname") || "";
  const office = localStorage.getItem("office") || ""; // KEY PART: Filter by IC's department

  const now = new Date();
  const currentMonth = now.getMonth();
  const previousMonth = (currentMonth - 1 + 12) % 12;

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/reports_getItems.php`);
        const data = await response.json();
        const allDocs = data.items || [];

        // FILTER ONLY DEPARTMENT DOCUMENTS
        const filtered = allDocs.filter((d) => d.office === office);
        setDocuments(filtered);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const docsThisMonth = documents.filter(
    (d) => new Date(d.dateIssued).getMonth() === currentMonth
  );
  const docsLastMonth = documents.filter(
    (d) => new Date(d.dateIssued).getMonth() === previousMonth
  );

  const totalDocsTrend = calcTrend(docsThisMonth.length, docsLastMonth.length);
  const parThisMonth = docsThisMonth.filter((d) => d.type === "PAR").length;
  const parLastMonth = docsLastMonth.filter((d) => d.type === "PAR").length;
  const totalPARTrend = calcTrend(parThisMonth, parLastMonth);

  const icsThisMonth = docsThisMonth.filter((d) => d.type === "ICS").length;
  const icsLastMonth = docsLastMonth.filter((d) => d.type === "ICS").length;
  const totalICSTrend = calcTrend(icsThisMonth, icsLastMonth);

  const assignedThisMonth = docsThisMonth.filter(
    (d) => d.status === "Assigned"
  ).length;
  const assignedLastMonth = docsLastMonth.filter(
    (d) => d.status === "Assigned"
  ).length;
  const assignedTrend = calcTrend(assignedThisMonth, assignedLastMonth);

  const totalDocs = documents.length;
  const totalPAR = documents.filter((d) => d.type === "PAR").length;
  const totalICS = documents.filter((d) => d.type === "ICS").length;
  const assignedAssets = documents.filter((d) => d.status === "Assigned").length;
  const pendingAssets = documents.filter((d) => d.status === "Pending").length;

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

  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        const res = await fetch(`${BASE_URL}/getItems.php`);
        const data = await res.json();

        const filtered = (data.items || [])
          .filter((item) => item.office === office)
          .map((item, index) => ({
            id: index + 1,
            documentNo: item.documentNo,
            type: item.type,
            user: item.user,
            office: item.office,
            dateIssued: item.dateIssued,
            items: item.items,
            status: item.status,
            air_no: item.air_no,
          }));

        setRecentDocs(filtered);
      } catch (error) {
        setRecentDocs([]);
      }
    };
    fetchRecentDocs();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
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

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color,
  }) => (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${color}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Icon size={18} />
            <span className="font-medium">{title}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        {trend !== undefined && (
          <div
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              trend >= 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <TrendingUp size={14} className={trend < 0 ? "rotate-180" : ""} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <IC_Sidebar />

      <div className="flex-1 overflow-auto">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
          <div className="p-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="animate-pulse" size={32} />
              Inventory Committee Dashboard
            </h1>
            <p className="text-blue-100 text-sm flex items-center gap-2">
              <Calendar size={16} />
              Hello {firstName} {lastName}! Here is your department’s asset
              overview.
            </p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
          <StatCard
            icon={Package}
            title="Total Documents"
            value={totalDocs}
            subtitle="Department Records"
            trend={totalDocsTrend}
            color="border-blue-500"
          />
          <StatCard
            icon={FileText}
            title="PAR Documents"
            value={totalPAR}
            subtitle="Property Acknowledgement"
            trend={totalPARTrend}
            color="border-green-500"
          />
          <StatCard
            icon={FileText}
            title="ICS Documents"
            value={totalICS}
            subtitle="Semi-expendable"
            trend={totalICSTrend}
            color="border-yellow-500"
          />
          <StatCard
            icon={CheckCircle}
            title="Assigned Assets"
            value={assignedAssets}
            subtitle={`${pendingAssets} pending`}
            trend={assignedTrend}
            color="border-purple-500"
          />
        </div>

        {/* PIE CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 px-8 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">Asset Condition Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={conditionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                >
                  {conditionData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT DOCUMENTS + INSPECTION BUTTON */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-blue-800">
                Department Assets
              </h2>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-6 text-left">Document No.</th>
                  <th className="py-3 px-6 text-left">Type</th>
                  <th className="py-3 px-6 text-left">User</th>
                  <th className="py-3 px-6 text-left">Date Issued</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {recentDocs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-6 text-gray-500"
                    >
                      No assets found.
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc) => (
                    <tr key={doc.id} className="border-b">
                      <td className="py-3 px-6">{doc.documentNo}</td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                            doc.type
                          )}`}
                        >
                          {doc.type}
                        </span>
                      </td>
                      <td className="py-3 px-6">{doc.user}</td>
                      <td className="py-3 px-6">{doc.dateIssued}</td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center flex gap-3 justify-center">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye size={18} />
                        </button>

                        <button
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          onClick={() => {
                            localStorage.setItem(
                              "inspectionDoc",
                              JSON.stringify(doc)
                            );
                            window.location.href = "/inspection-details";
                          }}
                        >
                          <ClipboardCheck size={18} />
                          Inspect
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

export default IC_Dashboard;
