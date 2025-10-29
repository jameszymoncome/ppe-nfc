import React, { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { MoreVertical, LayoutDashboard, FileText, ClipboardCheck, BarChart3, Users, Database, Menu, X, Building2, UserRoundPen, Folder, ChevronDown, ChevronRight, Smartphone, FolderSync, Shredder, MessageCircleWarning } from 'lucide-react';
import lgu_seal from '/assets/images/lgu_seal.png'; 

const AD_Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const location = useLocation();
  const pathname = location.pathname;

  // Get user info from localStorage
  const firstName = localStorage.getItem('firstName') || '';
  const lastName = localStorage.getItem('lastname') || '';
  const accessLevel = localStorage.getItem('accessLevel') || '';
  const position = localStorage.getItem('position') || '';

  const toggleTransfer = () => {
    setIsTransferOpen(!isTransferOpen);
  };

  const navLinkClass =
    'flex items-center space-x-3 text-gray-700 p-3 rounded-lg transition-colors';
  const activeClass =
    'bg-blue-300 text-blue-800 font-semibold';

  const toggleInspection = () => {
    setIsInspectionOpen(!isInspectionOpen);
  };

  useEffect(() => {
  if (location.pathname.startsWith('/inspection')) {
    setIsInspectionOpen(true);
  }
}, [location]);

  useEffect(() => {
    if (location.pathname.startsWith('/assets')) {
      setIsTransferOpen(true);
    }
  }, [location]);

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
              <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {firstName && lastName
                    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
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
                  {position || 'Position not set'}
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
                to="/ad-dashboard"
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
                to="/ad-par-ics"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${pathname.startsWith('/ad-par-ics') || pathname.startsWith('/ad-property-assignment') ? activeClass : ''}`
                }
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">PAR/ICS</span>
              </NavLink>
            </li>
            {/* Asset Management dropdown */}
            <li>
              <div>
                <a
                  href="#"
                  className={`${navLinkClass} hover:bg-gray-100 flex items-center justify-between 
                    ${pathname.startsWith('/assets') ? activeClass : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleTransfer();
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <FolderSync className="w-5 h-5" />
                    <span className="text-sm font-medium">Asset Management</span>
                  </div>
                  {isTransferOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </a>

                {isTransferOpen && (
                  <ul className="ml-6 mt-2 space-y-1">
                    <li>
                      <NavLink
                        to="/assets/ad-asset-transfer"
                        className={({ isActive }) =>
                          `${navLinkClass} hover:bg-gray-50 pl-4 py-2 flex items-center ${
                            isActive ? 'bg-blue-100 text-blue-700' : ''
                          }`
                        }
                      >
                        <FolderSync className="w-4 h-4 mr-2" />
                        <span className="text-sm">Transfer</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/assets/ad-assets"
                        className={({ isActive }) =>
                          `${navLinkClass} hover:bg-gray-50 pl-4 py-2 flex items-center ${
                            isActive ? 'bg-blue-100 text-blue-700' : ''
                          }`
                        }
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm">Assets</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/assets/ad-waste-disposal"
                        className={({ isActive }) =>
                          `${navLinkClass} hover:bg-gray-50 pl-4 py-2 flex items-center ${
                            isActive ? 'bg-blue-100 text-blue-700' : ''
                          }`
                        }
                      >
                        <Shredder className="w-4 h-4 mr-2" />
                        <span className="text-sm">Waste Disposal</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/assets/ad-report-issue"
                        className={({ isActive }) =>
                          `${navLinkClass} hover:bg-gray-50 pl-4 py-2 flex items-center ${
                            isActive ? 'bg-blue-100 text-blue-700' : ''
                          }`
                        }
                      >
                        <MessageCircleWarning className="w-4 h-4 mr-2" />
                        <span className="text-sm">Report Issue</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </div>
            </li>

            <li>
            <div>
              {/* Main Inspection Item */}
              <a 
                href="#" 
                className={`${navLinkClass} hover:bg-gray-100 flex items-center justify-between ${pathname.startsWith('/inspection') ? activeClass : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleInspection();
                }}
              >
                <div className="flex items-center space-x-3">
                  <ClipboardCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Inspection</span>
                </div>
                {isInspectionOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </a>

              {/* Sub-menu Items */}
              {isInspectionOpen && (
                <ul className="ml-6 mt-2 space-y-1">
                  <li>
                    <NavLink
                      to="/inspection/ad-nfc-tagged"
                      className={({ isActive }) =>
                        `${navLinkClass} hover:bg-gray-50 pl-4 py-2 flex items-center ${isActive ? 'bg-blue-100 text-blue-700' : ''}`
                      }
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      <span className="text-sm">NFC-Tagged Items</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/inspection/ad-manual-untagged"
                      className={({ isActive }) =>
                        `${navLinkClass} hover:bg-gray-50 pl-4 py-2 flex items-center ${isActive ? 'bg-blue-100 text-blue-700' : ''}`
                      }
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="text-sm">Manual Inspection (Untagged)</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </div>
          </li>

            <li>
              <NavLink
                to="/ad-reports"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Reports</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ad-accounts"
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
                to="/ad-profile"
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

export default AD_Sidebar;