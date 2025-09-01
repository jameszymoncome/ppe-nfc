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
} from 'lucide-react';
import EM_Sidebar from '../../components/EM_Sidebar';
import { BASE_URL } from '../../utils/connection';

function EM_Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loggedInUserID = localStorage.getItem('userId');

    useEffect(() => {
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // assume you have loggedInUserID from context or props
      const response = await fetch(
        `${BASE_URL}/ic_reportsgetItems.php?userId=${encodeURIComponent(loggedInUserID)}`
      );

      const data = await response.json();
      if (data.items) {
        setDocuments(data.items);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loggedInUserID) {
    fetchDocuments();
  }
}, [loggedInUserID]);

  // Get unique users for the dropdown
  const uniqueUsers = ['All', ...new Set(documents.map(doc => doc.user))];

  const filteredDocuments = documents.filter(doc => {
  const matchesSearch = doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.office.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesFilter = selectedFilter === 'All' || doc.type === selectedFilter;
  const matchesUser = selectedUser === 'All' || doc.user === selectedUser;
  const matchesDate = !selectedDate || doc.dateIssued.includes(selectedDate);
  return matchesSearch && matchesFilter && matchesUser && matchesDate;
});

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortBy) return 0;
    
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle date sorting
    if (sortBy === 'dateIssued') {
      aValue = new Date(aValue.split('-').reverse().join('-'));
      bValue = new Date(bValue.split('-').reverse().join('-'));
    }
    
    // Handle number sorting
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
      {/* Sidebar Placeholder - Hidden on mobile */}
      <EM_Sidebar />

      {/* Main Content */}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter Dropdown */}
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
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* User Filter */}
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10"
                >
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>
                      {user === 'All' ? 'All Users' : user}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Date Filter */}
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

            {/* Mobile: Collapsible filters */}
            {showFilters && (
              <div className="lg:hidden space-y-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Type Filter */}
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
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* User Filter */}
                  <div className="relative">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10 text-sm"
                    >
                      {uniqueUsers.map(user => (
                        <option key={user} value={user}>
                          {user === 'All' ? 'All Users' : user}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Date Filter */}
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
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Document No.
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Type
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    User
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Office/Department
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Date Issued
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Items
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">No data found</td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.documentNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.type === 'ICS' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.office}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.dateIssued}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.items}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800 p-1 rounded">
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
                    <h3 className="font-semibold text-gray-900 text-sm">{doc.docNo}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        doc.type === 'ICS' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {doc.type}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 p-1 rounded">
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
                    <span className="text-gray-900 text-right flex-1 ml-2">{doc.department}</span>
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
      </div>
    </div>
  );
}

export default EM_Reports;