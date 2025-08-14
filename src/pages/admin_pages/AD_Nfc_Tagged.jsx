import React, { useState } from 'react';
import { Search, QrCode } from 'lucide-react';
import AD_Sidebar from '../../components/AD_Sidebar';

const AD_Nfc_Tagged = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [yearFilter, setYearFilter] = useState('Year');

  // Sample data for the table
  const taggedItems = [
    {
      id: 1,
      propertyNo: '2025-05-0002-03',
      description: 'Laptop',
      model: 'Vivobook',
      serialNo: '8805432GDEDF7',
      department: 'Office of the Mayor',
      dateInspected: 'July 13, 2025',
      status: 'Good'
    }
  ];

  const filteredItems = taggedItems.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.propertyNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar placeholder - replace with actual Sidebar component */}
      <AD_Sidebar />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">NFC - Tagged Items</h1>
            <p className="text-gray-600">Scan & Inspect items with assigned NFC tags</p>
          </div>
          <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <QrCode size={20} />
            Scan NFC Tag to Inspect
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Tagged Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tagged Items</h3>
            <div className="text-3xl font-bold text-gray-800 mb-1">1,056</div>
            <p className="text-sm text-green-600">+ 35 items added since Last Year</p>
          </div>

          {/* Annual Inspection Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Annual Inspection Progress (2025)</h3>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-gray-800">25%</div>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="25, 75"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="0, 25, 15, 60"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">315 of 420 tagged items inspected</p>
          </div>

          {/* Last Inspection Date */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Last Inspection Date</h3>
            <div className="text-3xl font-bold text-gray-800 mb-1">July 12, 2025</div>
            <p className="text-sm text-gray-600">Most recent inspection recorded this year</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>All</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option>Year</option>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Property/Inventory No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Model</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Serial No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date Inspected</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-800">{item.propertyNo}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.description}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.model}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.serialNo}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.department}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.dateInspected}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
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
  );
};

export default AD_Nfc_Tagged;