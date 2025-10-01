import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import {
  FileText,
  Users,
  TrendingUp,
  Package,
  Eye,
  ChevronRight,
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
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
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const calcTrend = (current, previous) => {
  if (previous === 0) return 0;
  return (((current - previous) / previous) * 100).toFixed(1); // percentage change
};

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const previousMonth = (currentMonth - 1 + 12) % 12;

  const docsThisMonth = documents.filter(d => new Date(d.dateIssued).getMonth() === currentMonth);
  const docsLastMonth = documents.filter(d => new Date(d.dateIssued).getMonth() === previousMonth);

  const totalDocsTrend = calcTrend(docsThisMonth.length, docsLastMonth.length);

  const parThisMonth = docsThisMonth.filter(d => d.type === "PAR").length;
  const parLastMonth = docsLastMonth.filter(d => d.type === "PAR").length;
  const totalPARTrend = calcTrend(parThisMonth, parLastMonth);

  const icsThisMonth = docsThisMonth.filter(d => d.type === "ICS").length;
  const icsLastMonth = docsLastMonth.filter(d => d.type === "ICS").length;
  const totalICSTrend = calcTrend(icsThisMonth, icsLastMonth);

  const assignedThisMonth = docsThisMonth.filter(d => d.status === "Assigned").length;
  const assignedLastMonth = docsLastMonth.filter(d => d.status === "Assigned").length;
  const assignedTrend = calcTrend(assignedThisMonth, assignedLastMonth);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/reports_getItems.php`);
        const data = await response.json();
        setDocuments(data.items || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // Summary Data
  const totalDocs = documents.length;
  const totalPAR = documents.filter((d) => d.type === "PAR").length;
  const totalICS = documents.filter((d) => d.type === "ICS").length;
  const assignedAssets = documents.filter((d) => d.status === "Assigned").length;
  const pendingAssets = documents.filter((d) => d.status === "Pending").length;

  // Charts Data
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

  const deptData = Object.values(
    documents.reduce((acc, d) => {
      if (!acc[d.office])
        acc[d.office] = { department: d.office, items: 0 };
      acc[d.office].items += parseInt(d.items) || 0;
      return acc;
    }, {})
  );

  // Mock trend data (can later be connected to backend)
  const trendData = [
    { month: "Jul", value: 45 },
    { month: "Aug", value: 52 },
    { month: "Sep", value: 48 },
    { month: "Oct", value: 61 },
  ];

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color,
    delay,
  }) => (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 cursor-pointer ${color}`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setHoveredCard(title)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Icon size={18} />
            <span className="font-medium">{title}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <TrendingUp
              size={14}
              className={trend < 0 ? "rotate-180" : ""}
            />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div
        className={`mt-3 h-1 bg-gray-100 rounded-full overflow-hidden transition-all duration-500 ${
          hoveredCard === title ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"
          style={{ width: "70%" }}
        ></div>
      </div>
    </div>
  );

  useEffect(() => {
    // Fetch recent documents (same endpoint/logic as PAR_ICS.jsx)
    const fetchRecentDocs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/getItems.php`);
        const data = await response.json();
        const formatted = (data.items || []).map((item, index) => ({
          id: index + 1,
          documentNo: item.documentNo,
          type: item.type,
          user: item.user,
          office: item.office,
          dateIssued: item.dateIssued,
          items: item.items,
          status: item.status || 'N/A',
          air_no: item.air_no,
        }));
        setRecentDocs(formatted);
      } catch (error) {
        setRecentDocs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentDocs();
  }, []);

  // Color helpers (copied from PAR_ICS.jsx)
  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return 'bg-green-100 text-green-800';
      case 'For Tagging':
        return 'bg-yellow-100 text-yellow-800';
      case 'Upload Scanned Copy':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PAR':
        return 'bg-blue-100 text-blue-800';
      case 'ICS':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Activity className="animate-pulse" size={32} />
                  GSO Admin Dashboard
                </h1>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                  <Calendar size={16} />
                  Welcome back! Here’s what’s happening with your property
                  records today.
                </p>
              </div>
              <div className="flex gap-2">
                {["week", "month", "year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedPeriod === period
                        ? "bg-white text-blue-700 font-semibold"
                        : "bg-blue-700 hover:bg-blue-600"
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 mt-1">
          <StatCard
          icon={Package}
          title="Total Documents"
          value={totalDocs}
          subtitle="All PAR & ICS records"
          trend={totalDocsTrend}
          color="border-blue-500"
          delay={0}
        />
        <StatCard
          icon={FileText}
          title="PAR Documents"
          value={totalPAR}
          subtitle="Property acknowledgement"
          trend={totalPARTrend}
          color="border-green-500"
          delay={100}
        />
        <StatCard
          icon={FileText}
          title="ICS Documents"
          value={totalICS}
          subtitle="Semi-expendable items"
          trend={totalICSTrend}
          color="border-yellow-500"
          delay={200}
        />
        <StatCard
          icon={CheckCircle}
          title="Assigned Assets"
          value={assignedAssets}
          subtitle={`${pendingAssets} pending assignment`}
          trend={assignedTrend}
          color="border-purple-500"
          delay={300}
        />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-8 mb-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                Property by Condition
              </h3>
              <span className="text-sm text-gray-500">Distribution Overview</span>
            </div>

            {/* Chart */}
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
                  paddingAngle={4}
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  isAnimationActive={true}
                >
                  {conditionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} items`, name]}
                  contentStyle={{
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "0.85rem" }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                Assets by Department
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptData}>
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="items" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-blue-800">Recent Documents</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Document No.</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Office/Department</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Date Issued</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Items</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : recentDocs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">No documents found.</td>
                    </tr>
                  ) : (
                    recentDocs.slice(0, 10).map((doc, index) => (
                      <tr key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-4 px-6 text-sm text-gray-900">{doc.documentNo}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)}`}>
                            {doc.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-900">{doc.user}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 text-center">{doc.office}</td>
                        <td className="py-4 px-6 text-sm text-gray-900">{doc.dateIssued}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 text-center">{doc.items}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              // onClick={...} // Add your view handler here
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors"
                              // onClick={...} // Add your print handler here
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {doc.status === 'Upload Scanned Copy' && (
                              <button className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                                // onClick={...} // Add your upload handler here
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                            )}
                            {doc.status === 'Assigned' && (
                              <button className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50 transition-colors"
                                // onClick={...} // Add your download handler here
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Empty State */}
              {recentDocs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
