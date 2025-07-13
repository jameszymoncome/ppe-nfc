import React from 'react';
import { Search } from 'lucide-react';
import EU_Sidebar from './EU_Sidebar';

const EU_Dashboard = () => {
  const firstName = localStorage.getItem('firstName') || '';
  const lastName = localStorage.getItem('lastname') || '';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <EU_Sidebar />

      {/* Main content area */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-blue-800">Hi, {firstName && lastName
                    ? `${firstName} ${lastName}`
                    : 'User'}</h2>
          <div className="relative w-80">
            <input
              type="text"
              placeholder="Search"
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Page content (currently empty) */}
        <div className="bg-white rounded-lg p-6 h-full border border-dashed border-gray-200 text-gray-400 text-center">
          Page content goes here...
        </div>
      </div>
    </div>
  );
};

export default EU_Dashboard;
