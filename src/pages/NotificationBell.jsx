import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BASE_URL } from '../utils/connection';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const userId = localStorage.getItem('userId');

  const fetchNotifications = async () => {
    const res = await fetch(`${BASE_URL}/getNotifications.php?user_id=${userId}`);
    const data = await res.json();
    setNotifications(data.notifications || []);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // ✅ mark as read
  const handleNotificationClick = async (notifId) => {
    try {
      await fetch(`${BASE_URL}/markNotificationRead.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notifId })
      });

      // update UI locally
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, is_read: 1 } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setShowDropdown(!showDropdown)} className="relative">
        <Bell className="w-6 h-6 text-blue-700" />
        {notifications.some((n) => !n.is_read) && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute left-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          <div className="p-3 font-bold border-b">Notifications</div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-3 text-gray-500">No notifications</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id)} // ✅ click handler
                  className={`p-3 border-b cursor-pointer ${
                    n.is_read ? "text-gray-500" : "text-blue-800 font-semibold"
                  }`}
                >
                  {n.message}
                  <div className="text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
