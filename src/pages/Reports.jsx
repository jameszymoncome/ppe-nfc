import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  ChevronDown,
  Eye,
  Download,
  Printer,
  Filter,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { BASE_URL } from "../utils/connection";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";


// --- Modal Component ---
function PrintOptionsModal({ open, onClose, onSelect, doc }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const options = ["ICS", "PAR", "StockCard", "Property Condition"];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">Print Options</h2>
        {doc && (
          <p className="text-xs text-gray-500 mb-4">
            Document: <span className="font-medium">{doc.documentNo}</span> • Type:{" "}
            <span className="font-medium">{doc.type}</span>
          </p>
        )}

        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {opt}
            </button>
          ))}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("All");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-green-100 text-green-800";
      case "Upload Scanned Copy":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/reports_getItems.php`);
        const data = await response.json();
        if (data.items) {
          setDocuments(data.items);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handlePrintClick = (doc) => {
    setSelectedDoc(doc);
    setShowPrintModal(true);
  };

  const handlePrintOption = (option) => {
    console.log(`Printing ${option} for document:`, selectedDoc);
    setShowPrintModal(false);
  };

  // Export Helpers
  const exportToPDF = (docs) => {
  const pdf = new jsPDF();

  pdf.text("Property, Plant, and Equipment Reports", 14, 15);

  autoTable(pdf, {
    startY: 25,
    head: [["Document No.", "Type", "User", "Office", "Date Issued", "Items", "Status"]],
    body: docs.map((doc) => [
      doc.documentNo,
      doc.type,
      doc.user,
      doc.office,
      doc.dateIssued,
      doc.items,
      doc.status,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  pdf.save("reports.pdf");
};

  const exportToExcel = (docs) => {
    const worksheet = XLSX.utils.json_to_sheet(docs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PPE Report");
    XLSX.writeFile(workbook, "ppe_report.xlsx");
  };

  // Unique users for dropdown
  const uniqueUsers = ["All", ...new Set(documents.map((doc) => doc.user))];

  // Filtering + Sorting
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.office.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "All" || doc.type === selectedFilter;
    const matchesUser = selectedUser === "All" || doc.user === selectedUser;
    const matchesDate = !selectedDate || doc.dateIssued.includes(selectedDate);
    return matchesSearch && matchesFilter && matchesUser && matchesDate;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortBy) return 0;
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (sortBy === "dateIssued") {
      aValue = new Date(aValue.split("-").reverse().join("-"));
      bValue = new Date(bValue.split("-").reverse().join("-"));
    }
    if (sortBy === "items") {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    }
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Chart Data
  const conditionData = [
    { name: "Serviceable", value: documents.filter((d) => d.status === "Assigned").length },
    { name: "Pending", value: documents.filter((d) => d.status === "Pending").length },
    { name: "Others", value: documents.filter((d) => d.status !== "Assigned" && d.status !== "Pending").length },
  ];
  const COLORS = ["#4ade80", "#facc15", "#ef4444"];

  const deptData = Object.values(
    documents.reduce((acc, d) => {
      if (!acc[d.office]) acc[d.office] = { department: d.office, items: 0 };
      acc[d.office].items += parseInt(d.items) || 0;
      return acc;
    }, {})
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-3 lg:p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-blue-800 mb-2">
              Property, Plant, and Equipment Reports
            </h1>
            <p className="text-gray-600 text-sm lg:text-base hidden sm:block">
              Generate and manage reports for all government-owned property, plant, and equipment.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Print
            </button>
            <button
              onClick={() => exportToPDF(sortedDocuments)}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              PDF
            </button>
            <button
              onClick={() => exportToExcel(sortedDocuments)}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Excel
            </button>
          </div>
        </div>

        {/* 🔹 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h2 className="text-xl font-bold">{documents.length}</h2>
            <p className="text-gray-600 text-sm">Total Documents</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h2 className="text-xl font-bold">
              {documents.filter((d) => d.type === "PAR").length}
            </h2>
            <p className="text-gray-600 text-sm">Total PAR</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h2 className="text-xl font-bold">
              {documents.filter((d) => d.type === "ICS").length}
            </h2>
            <p className="text-gray-600 text-sm">Total ICS</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h2 className="text-xl font-bold">
              {documents.filter((d) => d.status === "Assigned").length}
            </h2>
            <p className="text-gray-600 text-sm">Assigned Assets</p>
          </div>
        </div>

        {/* 🔹 Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold mb-4">Property by Condition</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={conditionData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {conditionData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold mb-4">Assets by Department</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptData}>
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="items" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔽 Table & Mobile Cards stay same as your code ... */}

        {/* Modal */}
        <PrintOptionsModal
          open={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          onSelect={(option) => handlePrintOption(option)}
          doc={selectedDoc}
        />
      </div>
    </div>
  );
}

export default Reports;
