import React from 'react';
import Sidebar from '../components/Sidebar';
import { Search, CalendarDays } from 'lucide-react';

// Sample AIR data
const airData = [
  {
    airNo: '001-07-2025',
    poNo: '001-07-2025',
    receivedDate: '2025-07-02',
    inspectedBy: 'Angelo Aban',
    status: 'Accepted – Pending Inspection',
    actions: ['clipboard'],
  },
  {
    airNo: '001-07-2025',
    poNo: '001-07-2025',
    receivedDate: '2025-07-02',
    inspectedBy: 'Angelo Aban',
    status: 'Inspected – Awaiting Signed AIR Upload',
    actions: ['printer', 'download'],
  },
  {
    airNo: '002-07-2025',
    poNo: '002-07-2025',
    receivedDate: '2025-07-02',
    inspectedBy: 'Samantha Marmol',
    status: 'Signed AIR Uploaded – Ready for PAR/ICS',
    actions: ['user'],
  },
  {
    airNo: '002-07-2025',
    poNo: '002-07-2025',
    receivedDate: '2025-07-02',
    inspectedBy: 'Samantha Marmol',
    status: 'PAR/ICS Issued – Completed',
    actions: ['eye', 'download'],
  },
];

// Icon mapping for actions
const actionIcons = {
  clipboard: (
    <span title="Upload AIR" className="text-gray-600 hover:text-blue-700 cursor-pointer">
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
        <rect width="8" height="4" x="8" y="2" rx="1" />
      </svg>
    </span>
  ),
  printer: (
    <span title="Print" className="text-gray-600 hover:text-blue-700 cursor-pointer">
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect width="12" height="8" x="6" y="14" rx="2"/>
      </svg>
    </span>
  ),
  download: (
    <span title="Download" className="text-gray-600 hover:text-blue-700 cursor-pointer">
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7l-7 7-7-7"/>
      </svg>
    </span>
  ),
  user: (
    <span title="PAR/ICS" className="text-gray-600 hover:text-blue-700 cursor-pointer">
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="4"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 21a7.5 7.5 0 0113 0"/>
      </svg>
    </span>
  ),
  eye: (
    <span title="View" className="text-gray-600 hover:text-blue-700 cursor-pointer">
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    </span>
  ),
};

const AIR = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-800">Acceptance and Inspection Report(AIR)</h1>
          <p className="text-sm text-gray-500">
            From Needs to Assets—<span className="text-blue-700 underline cursor-pointer">Simplified PPE Requests.</span>
          </p>
        </div>

        {/* Filters/Search */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          {/* Dropdown */}
          <select className="min-w-[120px] px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="inspected">Inspected</option>
            <option value="completed">Completed</option>
          </select>

          {/* Date Picker */}
          <div className="relative min-w-[180px]">
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none text-sm"
            />
            <CalendarDays className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-4 font-medium text-left">AIR No.</th>
                <th className="py-2 px-4 font-medium text-left">P.O No.</th>
                <th className="py-2 px-4 font-medium text-left">Received Date</th>
                <th className="py-2 px-4 font-medium text-left">Inspected By</th>
                <th className="py-2 px-4 font-medium text-left">Status</th>
                <th className="py-2 px-4 font-medium text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {airData.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{row.airNo}</td>
                  <td className="py-2 px-4">{row.poNo}</td>
                  <td className="py-2 px-4">{row.receivedDate}</td>
                  <td className="py-2 px-4">{row.inspectedBy}</td>
                  <td className="py-2 px-4">{row.status}</td>
                  <td className="py-2 px-4 flex gap-2">
                    {row.actions.map((action, i) => (
                      <span key={i}>{actionIcons[action]}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIR;