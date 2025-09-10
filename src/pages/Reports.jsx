import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  ChevronDown,
  Eye,
  FileImage,
  Download,
  Printer,
  Filter,
  Menu,
  X, // <-- needed for modal close button
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { BASE_URL } from '../utils/connection';

// --- Modal Component ---
function PrintOptionsModal({ open, onClose, onSelect, doc }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const options = ['ICS', 'PAR', 'StockCard', 'Property Condition'];

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
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">Print Options</h2>
        {doc && (
          <p className="text-xs text-gray-500 mb-4">
            Document: <span className="font-medium">{doc.documentNo}</span> • Type:{' '}
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return 'bg-green-100 text-green-800';
      case 'Upload Scanned Copy':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    // TODO: hook this to your print endpoints or routing
    console.log(`Printing ${option} for document:`, selectedDoc);
    setShowPrintModal(false);
  };

  // Get unique users for the dropdown
  const uniqueUsers = ['All', ...new Set(documents.map((doc) => doc.user))];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.office.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || doc.type === selectedFilter;
    const matchesUser = selectedUser === 'All' || doc.user === selectedUser;
    const matchesDate = !selectedDate || doc.dateIssued.includes(selectedDate);
    return matchesSearch && matchesFilter && matchesUser && matchesDate;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortBy) return 0;

    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'dateIssued') {
      aValue = new Date(aValue.split('-').reverse().join('-'));
      bValue = new Date(bValue.split('-').reverse().join('-'));
    }

    if (sortBy === 'items') {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-3 lg:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-blue-800 mb-2">
                Property, Plant, and Equipment Reports
              </h1>
              <p className="text-gray-600 text-sm lg:text-base hidden sm:block">
                Generate and manage reports for all government-owned property, plant, and equipment.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 border-b">
          <div className="space-y-3 lg:space-y-0">
            {/* Mobile: Search + Filter Toggle */}
            <div className="flex gap-2 lg:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Desktop: All filters in one row */}
            <div className="hidden lg:flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                >
                  <option value="All">All</option>
                  <option value="PAR">PAR</option>
                  <option value="ICS">ICS</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                >
                  {uniqueUsers.map((user) => (
                    <option key={user} value={user}>
                      {user === 'All' ? 'All Users' : user}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>

            {showFilters && (
              <div className="lg:hidden space-y-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10 text-sm"
                    >
                      <option value="All">All Types</option>
                      <option value="PAR">PAR</option>
                      <option value="ICS">ICS</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10 text-sm"
                    >
                      {uniqueUsers.map((user) => (
                        <option key={user} value={user}>
                          {user === 'All' ? 'All Users' : user}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Select date"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table - Desktop View */}
        <div className="flex-1 overflow-auto hidden md:block">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No data found
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.documentNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doc.type === 'ICS'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.office}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.dateIssued}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.items}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-800 p-1 rounded"
                            onClick={() => handlePrintClick(doc)}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800 p-1 rounded">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="flex-1 overflow-auto md:hidden">
          <div className="p-4 space-y-4">
            {sortedDocuments.map((doc, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{doc.documentNo}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.type === 'ICS'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {doc.type}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-800 p-1 rounded"
                      onClick={() => handlePrintClick(doc)}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-800 p-1 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">User:</span>
                    <span className="text-gray-900 text-right flex-1 ml-2">{doc.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department:</span>
                    <span className="text-gray-900 text-right flex-1 ml-2">{doc.office}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-900">{doc.dateIssued}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items:</span>
                    <span className="text-gray-900">{doc.items}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔽 Render the modal once, at the end of the page */}
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
