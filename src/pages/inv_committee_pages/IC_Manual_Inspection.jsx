import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, User, BarChart3, FileText, Users, Database, Settings, Menu, X } from 'lucide-react';
import IC_Sidebar from '../../components/IC_Sidebar';

const IC_ManualInspection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sample data for the table
  const inspectionData = [
    {
      propertyNo: '2025-05-0002-03',
      description: 'Laptop',
      model: 'Vivobook',
      serialNo: '8B054324CDEDF7',
      department: 'Office of the Mayor',
      dateInspected: 'July 13, 2025',
      status: 'Good'
    }
  ];

  const navItems = [
    { icon: BarChart3, label: 'Dashboard', active: false },
    { icon: FileText, label: 'PPE Entry Form', active: false },
    { icon: Search, label: 'Inspection', active: true },
    { icon: FileText, label: 'Report', active: false },
    { icon: Users, label: 'Account Management', active: false },
    { icon: Database, label: 'Manage Tables', active: false }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <IC_Sidebar/>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 sm:p-6">
          {/* Mobile Header with Menu Button */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-blue-800">Manual Inspection</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="hidden lg:block text-2xl font-bold text-blue-800 mb-2">Manual Inspection (Untagged)</h1>
            <p className="text-gray-600 text-sm sm:text-base">Track inspection progress of untagged assets</p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Total Untagged Items */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Untagged Items</h3>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">1,056</div>
              <p className="text-xs sm:text-sm text-green-600">+ 214 items added since Last Year</p>
            </div>

            {/* Annual Inspection Progress */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Annual Inspection Progress (2025)</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">25%</div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="25, 75"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">315 of 420 tagged items inspected</p>
            </div>

            {/* Last Inspection Date */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Last Inspection Date</h3>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">July 12, 2025</div>
              <p className="text-xs sm:text-sm text-gray-600">Most recent inspection recorded this year</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                  >
                    <option value="All">All</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              {inspectionData.map((item, index) => (
                <div key={index} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{item.propertyNo}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Description:</span> {item.description}</p>
                      <p><span className="font-medium">Model:</span> {item.model}</p>
                      <p><span className="font-medium">Serial No:</span> {item.serialNo}</p>
                      <p><span className="font-medium">Department:</span> {item.department}</p>
                      <p><span className="font-medium">Date Inspected:</span> {item.dateInspected}</p>
                    </div>
                    <div className="flex justify-end">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Property/Inventory No.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Model</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Serial No.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Date Inspected</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionData.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-800">{item.propertyNo}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{item.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{item.model}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{item.serialNo}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{item.department}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{item.dateInspected}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IC_ManualInspection;