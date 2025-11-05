import React, { useState, useEffect } from 'react';
import { MonitorX, Smartphone, Tablet, Laptop, Battery, User, Circle } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import { BASE_URL } from '../utils/connection';
import axios from 'axios';
import { onMessage, sendMessage } from '../components/websocket';

// Mock data for devices
const mockDevices = [
  {
    id: 1,
    name: 'MacBook Pro 16"',
    type: 'laptop',
    status: 'online',
    employee: 'John Smith',
    battery: 87,
    lastActive: '2 mins ago',
    specs: 'macOS Sonoma, 16GB RAM'
  },
  {
    id: 2,
    name: 'iPhone 15 Pro',
    type: 'smartphone',
    status: 'online',
    employee: 'Sarah Johnson',
    battery: 62,
    lastActive: 'Active now',
    specs: 'iOS 17, 256GB'
  },
  {
    id: 3,
    name: 'Dell XPS 15',
    type: 'laptop',
    status: 'offline',
    employee: 'Mike Chen',
    battery: 45,
    lastActive: '3 hours ago',
    specs: 'Windows 11, 32GB RAM'
  },
  {
    id: 4,
    name: 'iPad Air',
    type: 'tablet',
    status: 'online',
    employee: 'Emily Davis',
    battery: 95,
    lastActive: '5 mins ago',
    specs: 'iPadOS 17, 128GB'
  },
  {
    id: 5,
    name: 'Samsung Galaxy S24',
    type: 'smartphone',
    status: 'offline',
    employee: 'David Brown',
    battery: 23,
    lastActive: '1 day ago',
    specs: 'Android 14, 512GB'
  },
  {
    id: 6,
    name: 'ThinkPad X1 Carbon',
    type: 'laptop',
    status: 'online',
    employee: 'Lisa Anderson',
    battery: 71,
    lastActive: 'Active now',
    specs: 'Windows 11, 16GB RAM'
  }
];

const DeviceMonitoring = () => {
    const [filter, setFilter] = useState('all');
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectingDevice, setSelectingDevice] = useState(null);
    const [deviceList, setDeviceList] = useState([]);
    const [deviceStatus, setDeviceStatus] = useState({});
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/deviceList.php`);
                console.log(response.data.data);
                setDeviceList(
                    response.data.data.map((device) => ({
                        ...device,
                        status: deviceStatus[device.device_name] || "offline", // overwrite with latest WS status
                    }))
                );
            } catch (error) {
                console.error('Error fetching end users:', error);
            }
        };

        fetchDevices();
    },[]);

    useEffect(() => {
        console.log('Selected Device:', selectedDevice);
        console.log('Is Available:', isAvailable);
        if (selectingDevice && isAvailable) {
            setSelectedDevice(selectingDevice);
            // setDeviceListModal(false);
            // setViewNFCModal(true);
        }
    }, [selectingDevice, isAvailable]);

    useEffect(() => {
        const unsubscribe = onMessage((raw) => {
            try {
                const data = JSON.parse(raw);
                if (data.type === "deviceConnection" && data.message === "Connected") {
                    getUsers(data.userID, data.deviceName);
                    //   setShowScanningModal(true);
                }
                if (data.type === "deviceConnection" && data.message === "Not connected") {
                    console.log("No Connection");
                    // setDeviceListModal(true);
                }
                if (data.type === "nfcEvent") {
                    console.log("NFC Event:", data.uid);
                    startNFCScan(data.uid);
                }
                if (data.type === "status" && data.ssid) {
                    setDeviceList((prev) =>
                        prev.map((device) =>
                            device.device_name === data.ssid
                                ? { ...device, status: data.status }
                                : device
                        )
                    );
                }
                if (data.type === "deviceStatus"){
                    setIsAvailable(false);
                    Swal.fire({
                        title: "Device Already in Use",
                        text: "This device is still active. Please wait until the current session is finished.",
                        icon: "warning",
                        confirmButtonText: "OK",
                        customClass: {
                            popup: "rounded-2xl",
                            confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
                        },
                        buttonsStyling: false,
                    }).then(() => {
                        return;
                    });
                }
                if (data.type === "command"){
                    setIsAvailable(true);
                }
                if (data.type === "deviceList"){
                    data.data.forEach((device) => {
                        getAllUsers(device.userID, device.deviceName);
                    });
                }
                if (data.type === "frontendStatus"){
                    checkConnection();
                }
            } catch (err) {
                console.error("❌ Error parsing WS message:", err);
            }
        });
    
        return () => unsubscribe();
    }, []);

    const checkConnection = () => {
        sendMessage({
            type: "connection",
            userID: localStorage.getItem("userId")
        });
    };

    const getUsers = async (usersIDS, deviceName) => {
        try {
            const response = await axios.get(`${BASE_URL}/getUsers.php`, {
                params: {
                    user_id: usersIDS
                }
            });
            if(response.data.success){
                const nameFromPHP = response.data.head.names;
                setDeviceList((prevList) => {
                const updatedList = prevList.map((device) =>
                    device.device_name === deviceName
                    ? { ...device, names: nameFromPHP } // ✅ Update matched device
                    : device
                );

                // ✅ Also set the selected device (the one that matched)
                const updatedDevice = updatedList.find((d) => d.device_name === deviceName);
                if (updatedDevice) {
                    setSelectedDevice(updatedDevice);
                }

                return updatedList;
                });
            }
            else{
                setDeviceList((prevList) =>
                    prevList.map((device) =>
                    device.device_name === deviceName
                        ? { ...device, names: "Unknown" }
                        : device
                    )
                );
            }
            
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const getAllUsers = async (usersIDS, deviceName) => {
        try {
            const response = await axios.get(`${BASE_URL}/getUsers.php`, {
                params: {
                    user_id: usersIDS
                }
            });
            if(response.data.success){
                const nameFromPHP = response.data.head.names;
                setDeviceList((prevList) =>
                    prevList.map((device) =>
                    device.device_name === deviceName
                        ? { ...device, names: nameFromPHP } // ✅ Update matched device
                        : device // keep others the same
                    )
                );
            }
            else{
                setDeviceList((prevList) =>
                    prevList.map((device) =>
                    device.device_name === deviceName
                        ? { ...device, names: "Unknown" }
                        : device
                    )
                );
            }
            
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };


    const getDeviceIcon = (type) => {
        switch(type) {
        case 'laptop': return <Laptop className="w-6 h-6" />;
        case 'smartphone': return <Smartphone className="w-6 h-6" />;
        case 'tablet': return <Tablet className="w-6 h-6" />;
        default: return <MonitorX className="w-6 h-6" />;
        }
    };

    const getBatteryColor = (battery) => {
        if (battery > 60) return 'text-green-500';
        if (battery > 30) return 'text-yellow-500';
        return 'text-red-500';
    };

    const filteredDevices = deviceList.filter(device => {
        if (filter === 'all') return true;
        return device.status === filter;
    });

    const stats = {
        total: mockDevices.length,
        online: mockDevices.filter(d => d.status === 'online').length,
        offline: mockDevices.filter(d => d.status === 'offline').length
    };

    function getTimeAgo(lastSeen) {
        if (!lastSeen) return "Unknown";

        const last = new Date(lastSeen.replace(" ", "T")); // ensure proper Date parsing
        const now = new Date();
        const diffMs = now - last; // difference in milliseconds

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
        if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
        return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header with small filter buttons */}
                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Device Monitor</h1>
                                    <p className="text-slate-400">Real-time device tracking and management</p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        filter === 'all'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        All ({stats.total})
                                    </button>
                                    <button
                                        onClick={() => setFilter('online')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                        filter === 'online'
                                            ? 'bg-green-600 text-white shadow-lg'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        <Circle className="w-3 h-3 fill-current" />
                                        Online ({stats.online})
                                    </button>
                                    <button
                                        onClick={() => setFilter('offline')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                        filter === 'offline'
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        <Circle className="w-3 h-3" />
                                        Offline ({stats.offline})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Layout - Changes based on selection */}
                        {!selectedDevice ? (
                        /* No device selected - Show only device list */
                        <div className="bg-slate-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">
                            {filter === 'all' ? 'All Devices' : filter === 'online' ? 'Online Devices' : 'Offline Devices'}
                            </h2>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredDevices.map(device => (
                                <div
                                    key={device.device_name}
                                    onClick={() => {
                                        console.log(device);
                                        sendMessage({
                                            type: "deviceSelected",
                                            deviceName: device.device_name,
                                            userID: localStorage.getItem("userId"), // include user if needed
                                        });
                                    }}
                                    className="p-4 rounded-lg cursor-pointer transition-all bg-slate-750 hover:bg-slate-700 border-2 border-transparent hover:border-blue-500"
                                >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                                    <div className={`p-3 rounded-lg ${
                                        device.status === 'online' ? 'bg-green-600/20' : 'bg-slate-600/20'
                                    }`}>
                                        {getDeviceIcon(device.type)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-semibold truncate">{device.device_name}</h3>
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            device.status === 'online' ? 'bg-green-500' : 'bg-slate-500'
                                        }`} />
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                                        <User className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{device.names}</span>
                                        </div>
                                        
                                        <p className="text-xs text-slate-500 mt-1">
                                            {device.status === "online"
                                                ? "Active now"
                                                : getTimeAgo(device.last_seen)
                                            }
                                        </p>
                                    </div>
                                    </div>

                                    <div className={`flex items-center space-x-1 ml-4 ${getBatteryColor(device.battery)}`}>
                                    <Battery className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{device.battery}%</span>
                                    </div>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        ) : (
                        /* Device selected - Show split layout */
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Left Panel - Selected Device Details (3/5 width) */}
                            <div className="lg:col-span-3">
                            <div className="bg-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">Selected Device</h2>
                                <button
                                    onClick={() => setSelectedDevice(null)}
                                    className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                                >
                                    Clear
                                </button>
                                </div>
                                
                                <div className="space-y-6">
                                <div className="flex items-start space-x-6 pb-6 border-b border-slate-700">
                                    <div className={`p-6 rounded-xl ${
                                    selectedDevice.status === 'online' ? 'bg-green-600/20' : 'bg-slate-600/20'
                                    }`}>
                                        {getDeviceIcon(selectedDevice.type)}
                                    </div>
                                    
                                    <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="font-semibold text-2xl">{selectedDevice.device_name}</h3>
                                        <div className={`w-3 h-3 rounded-full ${
                                            selectedDevice.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`} 
                                        />
                                    </div>
                                    <p className="text-slate-400 capitalize mb-4">{selectedDevice.status}</p>
                                    {/* <p className="text-sm text-slate-500">{selectedDevice.specs}</p> */}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                    <p className="text-sm text-slate-400 mb-2">Assigned To</p>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
                                            {selectedDevice.names}
                                        </div>
                                        <div>
                                        <p className="font-medium text-lg">{selectedDevice.names}</p>
                                        <p className="text-sm text-slate-400">Employee</p>
                                        </div>
                                    </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-slate-400 mb-2">Last Active</p>
                                        <p className="font-medium text-lg">{selectedDevice.status === "online"
                                            ? "Active now"
                                            : getTimeAgo(selectedDevice.last_seen)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400 mb-3">Battery Level</p>
                                    <div className="flex items-center space-x-4">
                                    <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                                        <div 
                                        className={`h-full rounded-full transition-all ${
                                            selectedDevice.battery > 60 ? 'bg-green-500' :
                                            selectedDevice.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${selectedDevice.battery}%` }}
                                        />
                                    </div>
                                    <span className="font-semibold text-xl w-16 text-right">{selectedDevice.battery}%</span>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>

                            {/* Right Panel - All Devices List (2/5 width) */}
                            <div className="lg:col-span-2">
                            <div className="bg-slate-800 rounded-xl p-6">
                                <h2 className="text-xl font-semibold mb-4">All Devices</h2>
                                
                                <div className="space-y-3">
                                {filteredDevices.map(device => (
                                    <div
                                    key={device.device_name}
                                    onClick={() => setSelectedDevice(device)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                                        selectedDevice?.device_name === device.device_name
                                        ? 'bg-blue-600 border-2 border-blue-400'
                                        : 'bg-slate-750 hover:bg-slate-700 border-2 border-transparent'
                                    }`}
                                    >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <div className={`p-2 rounded-lg ${
                                            device.status === 'online' ? 'bg-green-600/20' : 'bg-slate-600/20'
                                        }`}>
                                            {getDeviceIcon(device.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                            <h3 className="font-medium text-sm truncate">{device.device_name}</h3>
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                device.status === 'online' ? 'bg-green-500' : 'bg-slate-500'
                                            }`} />
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400 truncate">{device.names}</span>
                                        <div className={`flex items-center space-x-1 ml-2 ${getBatteryColor(device.battery)}`}>
                                        <Battery className="w-4 h-4" />
                                        <span>{device.battery}%</span>
                                        </div>
                                    </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceMonitoring;