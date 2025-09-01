import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Notification = () => {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  const navigate = useNavigate();

  const handleNotificationClick = (notif) => {
    if (notif.target) {
      navigate(notif.target);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto mt-8 bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">Notifications</h1>
          <ul className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <li className="p-4 text-gray-500 text-center">No notifications</li>
            ) : (
              notifications.map((notif, idx) => (
                <li
                  key={notif.id || idx}
                  className={`relative p-4 cursor-pointer hover:bg-blue-100 transition ${notif.read ? "bg-white" : "bg-blue-50"}`}
                  onClick={() => handleNotificationClick(notif)}
                  tabIndex={0}
                  role="button"
                >
                  {!notif.read && (
                    <span className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                  <div className="text-sm break-words whitespace-pre-line ml-4">{notif.message}</div>
                  <div className="text-xs text-gray-400 mt-1 ml-4">{notif.time}</div>
                </li>
              ))
            )}
          </ul>
          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;