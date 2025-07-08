import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Search } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../utils/connection';

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.post(`${BASE_URL}/getDepartments.php`);
        if (response.data.success) {
          setDepartments(response.data.departments);
        } else {
          console.error(response.data.message);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchDepartments();
  }, []);

  // Filtered list
  const filtered = departments.filter(dep =>
    dep.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Departments</h1>
            <p className="text-sm text-gray-500">List of all registered departments/entities.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-80 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>

        {/* Department Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Department Name</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {filtered.length > 0 ? (
                filtered.map((dep) => (
                  <tr key={dep.id}>
                    <td className="px-6 py-4">{dep.id}</td>
                    <td className="px-6 py-4">{dep.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          dep.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4" colSpan="3">
                    No departments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Department;
