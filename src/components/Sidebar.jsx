import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MoreVertical, LayoutDashboard, FileText, ClipboardCheck, BarChart3, Users, Database, Menu, X, Building2, UserRoundPen } from 'lucide-react';
import lgu_seal from '/assets/images/lgu_seal.png'; 

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  // Get user info from localStorage
  const firstName = localStorage.getItem('firstName') || '';
  const lastName = localStorage.getItem('lastname') || '';
  const accessLevel = localStorage.getItem('accessLevel') || '';

  const navLinkClass =
    'flex items-center space-x-3 text-gray-700 p-3 rounded-lg transition-colors';
  const activeClass =
    'bg-blue-100 text-blue-800 font-semibold';

  return (
    <>
      {/* Mobile menu button - only show when sidebar is closed */}
      {!open && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 bg-white shadow-sm w-64 transform
          ${open ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-200
          md:static md:translate-x-0 md:w-64 md:block
        `}
        style={{ minHeight: '100vh' }}
      >
        {/* Close button for mobile */}
        {open && (
          <button
            className="md:hidden absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src={lgu_seal} alt="LGU Seal" className="w-14 h-14 object-cover mx-auto mb-0" />
            <div>
              <h1 className="text-sm font-semibold text-gray-800">Property, Plant & Equipment</h1>
              <p className="text-xs text-gray-600">Management System</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {firstName && lastName
                    ? `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
                    : 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {firstName && lastName
                    ? `${firstName} ${lastName}`
                    : 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {accessLevel || 'Role'}
                </p>
              </div>
            </div>
            <button className="p-1">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/purchase-order"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Purchase Order</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/air-report"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Acceptance and Inspection</span>
              </NavLink>
            </li>
            <li>
              <a href="#" className={navLinkClass + " hover:bg-gray-100"}>
                <ClipboardCheck className="w-5 h-5" />
                <span className="text-sm font-medium">Inspection</span>
              </a>
            </li>
            <li>
              <a href="#" className={navLinkClass + " hover:bg-gray-100"}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Report</span>
              </a>
            </li>
            <li>
              <NavLink
                to="/accounts"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Account Management</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/departments"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-medium">Department/Offices</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <UserRoundPen className="w-5 h-5" />
                <span className="text-sm font-medium">Profile</span>
              </NavLink>
            </li>
            <li>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="w-full flex items-center space-x-3 text-red-600 p-3 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                </svg>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;