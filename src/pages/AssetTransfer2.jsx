import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Eye,
  Users,
  Table,
  BarChart,
  ChevronDown,
  Plus,
  Settings
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { BASE_URL } from '../utils/connection';
import { useNavigate } from 'react-router-dom';

const AssetTransfer2 = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('Department');
  const [employeeData, setEmployeeData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
      const fetchEmployees = async () => {
        try {
          const response = await fetch(`${BASE_URL}/getAssetTransferEmployees.php`);
          const data = await response.json();
          setEmployeeData(data.employees || []);
        } catch (error) {
          setEmployeeData([]);
        }
      };
      fetchEmployees();
    }, []);

      // Filtering logic
    const filteredEmployees = employeeData.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === 'Department' || emp.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Asset Transfer</h1>
            <p className="text-sm text-gray-600 mt-1">
              Reassign or relocate assets to a different employee, department, or location.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search and Filter Row */}
          <div className="flex items-center space-x-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Dropdown */}
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              >
                <option value="Department">Department</option>
                <option value="IT Office">IT Office</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="w-12 h-12 text-gray-300" />
                        <p className="text-lg font-medium">No employees found</p>
                        <p className="text-sm">Use the search or filter options to find employees</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-blue-50 cursor-pointer border-b border-gray-200"
                      onClick={() => navigate(
                        `/asset-transfer-3?user_id=${employee.id}&from_officer=${encodeURIComponent(employee.name)}&department=${encodeURIComponent(employee.department)}`
                      )}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-blue-600">
                            <Plus className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default AssetTransfer2;