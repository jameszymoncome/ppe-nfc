import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  BarChart3, 
  Users, 
  Table,
  ChevronDown,
  Menu
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

function Reports() {
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const reportTypes = [
    'Asset Inventory Report',
    'Depreciation Report',
    'Maintenance Report',
    'Disposal Report',
    'Acquisition Report'
  ];

  const years = ['2024', '2023', '2022', '2021', '2020'];
  
  const departments = [
    'Information Technology',
    'Finance Department',
    'Human Resources',
    'Operations',
    'Administration'
  ];

  const users = [
    'John Doe',
    'Jane Smith',
    'Mike Johnson',
    'Sarah Wilson',
    'David Brown'
  ];

  const handleGenerate = () => {
    // Generate report logic would go here
    console.log('Generating report...', {
      reportType: selectedReportType,
      year: selectedYear,
      department: selectedDepartment,
      user: selectedUser
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-2">Property, Plant, and Equipment Reports</h1>
          <p className="text-gray-600">Generate and manage reports for all government-owned property, plant, and equipment.</p>
        </div>

        {/* Report Generation Form */}
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-200 rounded-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-blue-800 mb-2">Generate Report</h2>
                <p className="text-gray-600">Generate property and equipment reports by type, year, department or user.</p>
              </div>

              <div className="space-y-6">
                {/* Report Type */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Report Type :
                  </label>
                  <div className="relative">
                    <select
                      value={selectedReportType}
                      onChange={(e) => setSelectedReportType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
                    >
                      <option value="">Choose report type...</option>
                      {reportTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Year */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Year :
                  </label>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
                    >
                      <option value="">Choose year...</option>
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Department */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Office/Department :
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
                    >
                      <option value="">Choose department...</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* User */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accountable Officer / User :
                  </label>
                  <div className="relative">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
                    >
                      <option value="">Choose user...</option>
                      {users.map((user) => (
                        <option key={user} value={user}>{user}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleGenerate}
                    className="px-12 py-3 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    GENERATE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
