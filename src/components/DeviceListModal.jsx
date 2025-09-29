// DeviceListModal.js
import React from "react";
import { X, Activity } from "lucide-react"; // assuming you use lucide-react icons
import { sendMessage } from "./websocket";

// Example: You can pass StatusIcon, getStatusBg, getStatusColor from parent or import them here
export default function DeviceListModal({
  deviceList,
  deviceListModal,
  setDeviceListModal,
  setSelectedDevice,
  StatusIcon,
  getStatusBg,
  getStatusColor,
}) {
  if (!deviceListModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                Active Devices
              </h2>
              <p className="text-blue-100 text-sm">
                {deviceList.filter(d => d.status === 'online').length} of {deviceList.length} devices online
              </p>
            </div>
          </div>

          <button
            onClick={() => setDeviceListModal(false)}
            className="absolute right-4 top-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device List */}
        <div className="flex-1 max-h-[400px] overflow-y-auto">
          <div className="p-4 space-y-3">
            {deviceList.map((item) => (
              <div 
                key={item.device_name}
                className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                onClick={() => {
                  setSelectedDevice(item.device_name);

                  sendMessage({
                    type: "deviceSelected",
                    deviceName: item.device_name,
                    userID: localStorage.getItem("userId"), // include user if needed
                  });
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <StatusIcon status={item.status} />
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {item.device_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Last seen: {item.last_seen}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span 
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium capitalize
                        ${getStatusBg(item.status)} ${getStatusColor(item.status)}
                      `}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <button
              onClick={() => setDeviceListModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
