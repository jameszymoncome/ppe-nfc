import React, { useState, useEffect } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import {
  MoreVertical, LayoutDashboard, FileText, ClipboardCheck, BarChart3,
  Users, Menu, X, Building2, UserRoundPen, Folder,
  ChevronDown, ChevronRight, Smartphone, Bell, FolderSync 
} from 'lucide-react';
import lgu_seal from '/assets/images/lgu_seal.png';
import { sendMessage, onMessage, connectWebSocket } from './websocket';
import NotificationBell from '../pages/NotificationBell';

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  // Get user info from localStorage
  const firstName = localStorage.getItem('firstName') || '';
  const lastName = localStorage.getItem('lastname') || '';
  const accessLevel = localStorage.getItem('accessLevel') || '';

  const navLinkClass =
    'flex items-center space-x-3 text-gray-700 p-3 rounded-lg transition-colors';
  const activeClass =
    'bg-blue-300 text-blue-800 font-semibold';

  const toggleInspection = () => {
    setIsInspectionOpen(!isInspectionOpen);
  };

  // Expand submenu if already on inspection route
  useEffect(() => {
    if (location.pathname.startsWith('/inspection')) {
      setIsInspectionOpen(true);
    }
  }, [location]);

  // Restore notifications from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("notifications")) || [];
    setNotifications(saved);
  }, []);

  // Persist notifications
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // WebSocket for SUPER ADMIN
  useEffect(() => {
    if (accessLevel === 'SUPER ADMIN') {
      const ws = new WebSocket('ws://localhost:8080'); // change to server

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'signup') {
          setNotifications(prev => {
            const exists = prev.some(
              n => n.message === `New user signed up: ${data.fullName} (${data.department})`
            );
            if (exists) return prev;
            return [
              {
                id: Date.now(),
                message: `New user signed up: ${data.fullName} (${data.department})`,
                time: new Date().toISOString(),
                read: false,
                target: '/accounts', // <-- add this property for navigation
              },
              ...prev,
            ];
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [accessLevel]);

  const logOutSocket = () => {
    const usersID = localStorage.getItem('userId');
    sendMessage({
      type: "logout",
      userID: usersID
    });
  }

  // Format time (e.g., "2m ago")
  const formatTime = (time) => {
    const diff = (new Date() - new Date(time)) / 1000; // seconds
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(time).toLocaleDateString();
  };

  const handleOpenDropdown = () => {
    setShowNotifDropdown(!showNotifDropdown);

    // Mark all as read when opening
    if (!showNotifDropdown) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifDropdown && !event.target.closest('.notification-dropdown')) {
        setShowNotifDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifDropdown]);

  // WebSocket for SUPER ADMIN
  useEffect(() => {
    if (accessLevel === 'SUPER ADMIN') {
      const unsubscribe = onMessage((rawMessage) => {
        try {
          const data = JSON.parse(rawMessage);

          if (data.type === "signup") {
            setNotifications((prev) => {
              const exists = prev.some(
                (n) =>
                  n.message ===
                  `New user signed up: ${data.fullName} (${data.department})`
              );
              if (exists) return prev;

              return [
                {
                  id: Date.now(),
                  message: `New user signed up: ${data.fullName} (${data.department})`,
                  time: new Date().toISOString(),
                  read: false,
                  target: "/accounts", // for navigation
                },
                ...prev,
              ];
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      // Cleanup when component unmounts
      return () => unsubscribe();
    }
  }, [accessLevel]);


  return (
    <>
      {/* Mobile menu button */}
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
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img src={lgu_seal} alt="LGU Seal" className="w-12 h-12 object-cover flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-800 leading-tight">Property, Plant & Equipment</h1>
                <p className="text-xs text-gray-600">Management System</p>
              </div>
            </div>
            <div className="flex-shrink-0 pt-1">
              <NotificationBell/>
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
        <nav className="p-4 flex-1">
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
                to="/par-ics"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${pathname.startsWith('/par-ics') || pathname.startsWith('/property-assignment') ? activeClass : ''}`
                }
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">PAR/ICS</span>
              </NavLink>
            </li>

            {/* Inspection dropdown */}
            <li>
              <div>
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

                {isInspectionOpen && (
                  <ul className="ml-6 mt-2 space-y-1">
                    <li>
                      <NavLink
                        to="/inspection/nfc-tagged"
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
                        to="/inspection/manual-untagged"
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
                to="/asset-transfer"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${pathname.startsWith('/asset-transfer') || pathname.startsWith('/asset-transfer-3') ? activeClass : ''}`
                }
              >
                <FolderSync className="w-5 h-5" />
                <span className="text-sm font-medium">Asset Transfer</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/reports"
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
                to="/category"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`
                }
              >
                <Folder className="w-5 h-5" />
                <span className="text-sm font-medium">Category</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${navLinkClass} hover:bg-gray-100 ${isActive ? activeClass : ''}`}
              >
                <UserRoundPen className="w-5 h-5" />
                <span className="text-sm font-medium">Profile</span>
              </NavLink>
            </li>

            {/* Notifications */}
            {/* <li>
              <div className="relative notification-dropdown">
                <button
                  className={
                    `${navLinkClass} hover:bg-gray-100 w-full relative ` +
                    (pathname.startsWith('/notification') ? activeClass : '')
                  }
                  onClick={() => {
                    setShowNotifDropdown(false);
                    navigate("/notification");
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="text-sm font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-3 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </li> */}

            {/* Logout */}
            <li>
              <button
                onClick={() => {
                  logOutSocket();
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
          </ul> {/* ✅ Close UL properly */}
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
