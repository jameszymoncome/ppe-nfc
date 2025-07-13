import React, { useState } from 'react';
import { Search, Calendar, Download, Eye, FileText, ChevronDown, Home, FileCheck, ClipboardList, BarChart, Users, Settings } from 'lucide-react';
import GE_Sidebar from '../../components/GE_Sidebar';
import { useNavigate } from 'react-router-dom';

const GE_PAR_ICS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const navigate = useNavigate();

  // Sample data - replace with your actual data source
  const [documents] = useState([
    {
      id: 1,
      documentNo: '001-07-2025',
      type: 'ICS',
      user: 'Angelo Aban',
      office: 'Mayor\'s office',
      dateIssued: '07-04-2025',
      items: 3,
      status: 'For Tagging'
    },
    {
      id: 2,
      documentNo: '002-07-2025',
      type: 'ICS',
      user: 'Samantha Marmol',
      office: 'GSO Office',
      dateIssued: '07-05-2025',
      items: 1,
      status: 'Upload Scanned Copy'
    },
    {
      id: 3,
      documentNo: '002-07-2025',
      type: 'PAR',
      user: 'Samantha Marmol',
      office: 'GSO Office',
      dateIssued: '07-04-2025',
      items: 1,
      status: 'Assigned'
    }
  ]);

  const filterOptions = ['All', 'PAR', 'ICS'];
  const statusOptions = ['All', 'For Signature', 'Complete', 'Pending'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.office.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || doc.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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

  const handleIssuePAR = () => {
    // Navigate to the Property Assignment page or handle PAR issuance logic
    navigate('/property-assignment');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <GE_Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">
                Property Acknowledgement Receipt (PAR) and Inventory Custodian Slip (ICS)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                From Needs to Assets—Simplified PPE Requests.
              </p>
            </div>
            <button onClick={handleIssuePAR} className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <FileText className="h-4 w-4" />
              Issue PAR/ICS
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {filterOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full bg-white">
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
                {filteredDocuments.map((doc, index) => (
                  <tr key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.documentNo}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.user}</td>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.office}</td>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.dateIssued}</td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-center">{doc.items}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors">
                          <FileText className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
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
  );
};

export default GE_PAR_ICS;