import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ChevronDown,
  Eye,
  FileImage,
  Download,
  Printer,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return 'bg-green-100 text-green-800';
      case 'Assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'Upload Scanned Copy':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sample data for the table
  const documents = [
    {
      docNo: '2025 - 0001',
      type: 'ICS',
      user: 'Samantha Laad Marmol',
      department: 'ACCOUNTING',
      dateIssued: '07-15-2025',
      items: 1,
      status: 'Assigned',
      statusColor: 'bg-gray-100 text-gray-800'
    },
    {
      docNo: '2025 - 0001',
      type: 'PAR',
      user: 'Jyp Pardo Baclao',
      department: "MAYOR'S OFFICE",
      dateIssued: '07-15-2025',
      items: 2,
      status: 'Assigned',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      docNo: '2025 - 0002',
      type: 'ICS',
      user: 'Samantha Laad Marmol',
      department: 'ACCOUNTING',
      dateIssued: '07-15-2025',
      items: 1,
      status: 'Assigned',
      statusColor: 'bg-gray-100 text-gray-800'
    },
    {
      docNo: '2025 - 0002',
      type: 'PAR',
      user: 'Jyp Pardo Baclao',
      department: "MAYOR'S OFFICE",
      dateIssued: '07-15-2025',
      items: 1,
      status: 'Assigned',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      docNo: '2025 - 0003',
      type: 'ICS',
      user: 'Kikay Sayson Benalla',
      department: "MAYOR'S OFFICE",
      dateIssued: '07-15-2025',
      items: 3,
      status: 'Assigned',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      docNo: '2025 - 0004',
      type: 'ICS',
      user: 'Angelo Parica Aban',
      department: 'MPDO',
      dateIssued: '07-16-2025',
      items: 2,
      status: 'Assigned',
      statusColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  // Get unique users for the dropdown
  const uniqueUsers = ['All', ...new Set(documents.map(doc => doc.user))];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.department.toLowerCase().includes(searchTerm.toLowerCase());
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
      {/* Sidebar */}
      <Sidebar/>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-3">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-blue-800 mb-2">
                Property, Plant, and Equipment Reports
              </h1>
              <p className="text-gray-600">Generate and manage reports for all government-owned property, plant, and equipment.</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 border-b">
          <div className="flex gap-4 items-center">
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
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
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
                {filteredDocuments.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm  text-gray-900">
                      {doc.docNo}
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
                      {doc.department}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;