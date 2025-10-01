import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, History, AlertTriangle, CheckCircle, XCircle, Clock, Package, Edit3, Wifi, WifiOff } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { BASE_URL } from '../utils/connection';
import axios from 'axios';
import DeviceListModal from '../components/DeviceListModal';
import { onMessage, sendMessage } from '../components/websocket';

const Scan = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [scannedItem, setScannedItem] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [selectedCondition, setSelectedCondition] = useState('');
    const [currentCondition, setCurrentCondition] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('');
    const [nfcTagID, setNfcTagID] = useState('');
    const [deviceListModal, setDeviceListModal] = useState(false);
    const [deviceList, setDeviceList] = useState([]);
    const [deviceStatus, setDeviceStatus] = useState({});
    const [selectedDevice, setSelectedDevice] = useState('');
    // Mock database of item histories
    // const itemHistoryDatabase = {
    //     'ITM-001': [
    //         { id: 1, action: 'Item Created', scanTime: '2024-09-20 10:00', condition: 'Excellent', location: 'Warehouse A', user: 'Admin' },
    //         { id: 2, action: 'NFC Tag Scanned', scanTime: '2024-09-22 14:30', condition: 'Excellent', location: 'Warehouse A', user: 'John Doe' },
    //         { id: 3, action: 'Condition Updated', scanTime: '2024-09-22 14:32', condition: 'Good', previousCondition: 'Excellent', location: 'Warehouse A', user: 'John Doe', remarks: 'Minor scratches observed' },
    //         { id: 4, action: 'NFC Tag Scanned', scanTime: '2024-09-25 11:15', condition: 'Good', location: 'Office B', user: 'Jane Smith' },
    //         { id: 5, action: 'Condition Updated', scanTime: '2024-09-25 11:17', condition: 'Fair', previousCondition: 'Good', location: 'Office B', user: 'Jane Smith', remarks: 'Wear and tear visible' }
    //     ],
    //     'ITM-002': [
    //         { id: 1, action: 'Item Created', scanTime: '2024-09-18 09:00', condition: 'Excellent', location: 'Office B', user: 'Admin' },
    //         { id: 2, action: 'NFC Tag Scanned', scanTime: '2024-09-23 16:20', condition: 'Excellent', location: 'Office B', user: 'Mike Johnson' },
    //         { id: 3, action: 'Condition Updated', scanTime: '2024-09-24 10:45', condition: 'Good', previousCondition: 'Excellent', location: 'Office B', user: 'Sarah Wilson' },
    //         { id: 4, action: 'Reported as damaged', scanTime: '2024-09-26 14:15', condition: 'Poor', location: 'Office B', user: 'Sarah Wilson', reportType: 'damaged' }
    //     ],
    //     'ITM-003': [
    //         { id: 1, action: 'Item Created', scanTime: '2024-09-19 11:30', condition: 'Excellent', location: 'Storage Room', user: 'Admin' },
    //         { id: 2, action: 'NFC Tag Scanned', scanTime: '2024-09-26 14:20', condition: 'Excellent', location: 'Storage Room', user: 'Tom Brown' }
    //     ]
    // };

    const [currentItemHistory, setCurrentItemHistory] = useState([]);

    useEffect(() => {
        if (selectedDevice) {
            setDeviceListModal(false);
            setIsScanning(true);
        }
    
    }, [selectedDevice])

    useEffect(() => {
        const unsubscribe = onMessage((raw) => {
          try {
            const data = JSON.parse(raw);
            if (data.type === "deviceConnection" && data.message === "Connected") {
            //   setShowScanningModal(true);
              setIsScanning(true);
            }
            if (data.type === "deviceConnection" && data.message === "Not connected") {
              console.log("No Connection");
              setDeviceListModal(true);
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
          } catch (err) {
            console.error("❌ Error parsing WS message:", err);
          }
        });
    
        return () => unsubscribe();
    }, [])

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
                // const deviceNames = response.data.data.map(item => item.device_name);
                // console.log(deviceNames);
            } catch (error) {
                console.error('Error fetching end users:', error);
            }
        };

        fetchDevices();
    },[]);

    // Simulate NFC scanning process
    const checkConnection = () => {
        setNfcTagID('');
        setSelectedCondition('');
        setRemarks('');
        sendMessage({
          type: "connection",
          userID: localStorage.getItem("userId")
        });
    }
    
    const startNFCScan = async (tag) => {
        // const tag = "04BF07A21F1D94";
        setIsScanning(true);
        try {
            const response = await axios.get(`${BASE_URL}/getItemTag.php`, {
                params: {
                    tag
                }
            });
            // console.log(response.data.data);
            if (response.data.success && response.data.data.length > 0) {
                const getDatas = {
                    id: response.data.data[0].itemID,
                    name: response.data.data[0].description,
                    condition: response.data.data[0].conditions,
                    location: "LGU Daet",
                    lastScanned: response.data.data[0].dateInspected,
                    category: response.data.data[0].category,
                    serialNumber: response.data.data[0].serialNo,
                    nfcTagId: response.data.data[0].tagID,
                    updates: response.data.data[0].updates,
                }
                setScannedItem(getDatas);
                setSelectedCondition(response.data.data[0].conditions);
                setCurrentCondition(response.data.data[0].conditions);
                setNfcTagID(getDatas.nfcTagId);
                itemHistory(tag);
                setIsScanning(false);
            }
            else{
                console.log("No item found");
            }
        } catch (error) {
            console.error('Error fetching item:', error);
        }
        // setTimeout(() => {
        //     const mockItem = {
        //         id: 'ITM-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
        //         name: ['Wireless Mouse', 'USB Cable', 'Monitor Stand', 'Keyboard', 'External Hard Drive', 'Webcam', 'Tablet', 'Smartphone'][Math.floor(Math.random() * 8)],
        //         condition: ['Excellent', 'Good', 'Fair', 'Poor'][Math.floor(Math.random() * 4)],
        //         location: ['Warehouse A', 'Office B', 'Storage Room', 'Conference Room'][Math.floor(Math.random() * 4)],
        //         lastScanned: new Date().toISOString().slice(0, 16).replace('T', ' '),
        //         description: 'NFC Tagged item scanned successfully',
        //         category: 'Electronics',
        //         serialNumber: 'SN' + Math.floor(Math.random() * 1000000),
        //         nfcTagId: 'NFC-' + Math.floor(Math.random() * 10000)
        //     };
        //     setScannedItem(mockItem);
        //     setSelectedCondition(mockItem.condition);
        //     setNfcTagID(mockItem.nfcTagId);
            
        //     // Get item history from database or create new
        //     const existingHistory = itemHistoryDatabase[mockItem.id] || [
        //         { 
        //             id: 1, 
        //             action: 'Item Created', 
        //             scanTime: '2024-09-26 10:00', 
        //             condition: 'Excellent', 
        //             location: mockItem.location, 
        //             user: 'Admin' 
        //         }
        //     ];
            
        //     // Add current scan to history
        //     const newScanEntry = {
        //         id: existingHistory.length + 1,
        //         action: 'NFC Tag Scanned',
        //         scanTime: mockItem.lastScanned,
        //         condition: mockItem.condition,
        //         location: mockItem.location,
        //         user: 'Current User',
        //         nfcTagId: mockItem.nfcTagId
        //     };
            
        //     const updatedHistory = [...existingHistory, newScanEntry];
        //     setCurrentItemHistory(updatedHistory);
            
        //     // Update database
        //     itemHistoryDatabase[mockItem.id] = updatedHistory;
            
        //     setIsScanning(false);
            
        //     // Show scan result
        //     alert(`📱 NFC Scan Complete!\nItem Found: ${mockItem.name}\nNFC Tag: ${mockItem.nfcTagId}\nCondition: ${mockItem.condition}\nLocation: ${mockItem.location}`);
        // }, 1500);
    };

    const itemHistory = async (tag) => {
        console.log(tag);
        try {
            const response = await axios.get(`${BASE_URL}/getItemHistory.php`, {
                params: {
                    tag
                }
            });
            console.log(response.data.data);
            if (response.data.success && response.data.data.length > 0) {
                const getDatas = response.data.data.map((row, index) => ({
                    id: index + 1,
                    itemId: row.itemID,
                    name: row.description,
                    condition: row.conditions,
                    scanTime: row.dateInspected,
                    location: "LGU Daet",
                    action: 'Item Scanned',
                    serialNumber: row.serialNo,
                    nfcTagId: row.tagID,
                    remarks: row.remarks,
                    updates: row.updates
                }));

                setScanHistory(getDatas);
            }
        } catch (error) {
            console.error('Error fetching item history:', error);
        }
    }

    const updateCondition = async () => {
        try {
            const response = await axios.post(`${BASE_URL}/inspect.php`, {
                nfcTagID,
                selectedCondition,
                remarks,
                mode: "scan"
            });
            console.log(response.data);
            // itemHistory(nfcTagID);
            setIsScanning(true);
            setScanHistory([]);
        } catch (error) {
            console.error('Error updating condition:', error);
        }
        // if (scannedItem && selectedCondition) {
        //     const updatedItem = { ...scannedItem, condition: selectedCondition, remarks: remarks };
        //     setScannedItem(updatedItem);
            
        //     // Add to current item history
        //     const newHistoryEntry = {
        //         id: currentItemHistory.length + 1,
        //         action: 'Condition Updated',
        //         scanTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        //         condition: selectedCondition,
        //         previousCondition: scannedItem.condition,
        //         location: updatedItem.location,
        //         user: 'Current User',
        //         remarks: remarks,
        //         nfcTagId: updatedItem.nfcTagId
        //     };
            
        //     const updatedHistory = [...currentItemHistory, newHistoryEntry];
        //     setCurrentItemHistory(updatedHistory);
            
        //     // Update database
        //     itemHistoryDatabase[updatedItem.id] = updatedHistory;
            
        //     // Show success message
        //     alert(`✅ Condition updated successfully!\nItem: ${updatedItem.name}\nNew Condition: ${selectedCondition}${remarks ? `\nRemarks: ${remarks}` : ''}`);
        //     setRemarks('');
        // }
    };

    const getConditionColor = (condition) => {
        switch (condition) {
            case 'Very Good': return 'text-green-600 bg-blue-100';
            case 'Good Condition': return 'text-blue-600 bg-green-100';
            case 'Fair Condition': return 'text-yellow-600 bg-yellow-100';
            case 'Poor Condition': return 'text-red-600 bg-orange-100';
            case 'Scrap Condition': return 'text-red-600 bg-orange-100';
            case 'Damaged': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getActionColor = (action) => {
        if (action.includes('Scanned')) return 'bg-blue-100 text-blue-700';
        if (action.includes('Updated')) return 'bg-orange-100 text-orange-700';
        if (action.includes('Reported')) return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };

    const getStatusColor = (status) => {
        return status === 'online' ? 'text-green-600' : 'text-red-500';
    };

    const getStatusBg = (status) => {
        return status === 'online' ? 'bg-green-100' : 'bg-red-100';
    };

    const StatusIcon = ({ status }) => {
        if (status === 'online') {
        return <Wifi className="w-4 h-4 text-green-600" />;
        }
        return <WifiOff className="w-4 h-4 text-red-500" />;
    };

    const submitReport = async (tagId, reportType) => {
        console.log('Submitting report for tag:', tagId, 'with type:', reportType);
        try {
            const response = await axios.post(`${BASE_URL}/inspect.php`, {
                nfcTagID: tagId,
                selectedCondition: reportType,
                mode: "report"
            });
            console.log(response.data);
            // viewItem(); // Refresh item data after report submission
        } catch (error) {
            console.error('Error submitting report:', error);
        }
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-y-auto p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-800">NFC - Tagged Items</h1>
                        <p className="text-gray-600">Scan & Inspect items with assigned NFC tags</p>
                    </div>
                    <button 
                        className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors self-start lg:self-auto"
                        onClick={checkConnection}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Scanning...
                            </>
                        ) : (
                            <>
                                <QrCode size={20} />
                                Scan NFC Tag to Inspect
                            </>
                        )}
                    </button>
                </div>

                <div className="flex flex-col xl:flex-row gap-4">
                    {/* Left Panel - Scanner & Item Details */}
                    <div className="xl:flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                        {/* Scanning Status */}
                        {isScanning && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-800 mx-auto mb-4"></div>
                                    <p className="text-blue-800 font-medium">Scanning NFC Tag...</p>
                                    <p className="text-gray-600 text-sm mt-2">Please hold your device close to the NFC tag</p>
                                </div>
                            </div>
                        )}

                        {/* Empty State - No Item Scanned */}
                        {!scannedItem && !isScanning && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="text-center py-12">
                                    <div className="mb-4">
                                        <QrCode size={64} className="mx-auto text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-500 mb-2">No Item Scanned</h3>
                                    <p className="text-gray-400 mb-4">Click "Scan NFC Tag to Inspect" to get started</p>
                                    <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
                                        <p className="text-sm text-gray-600">
                                            <strong>Instructions:</strong><br />
                                            1. Click the scan button above<br />
                                            2. Hold device near NFC tag<br />
                                            3. View item details & update condition<br />
                                            4. Check item history on the right
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scanned Item Details */}
                        {scannedItem && !isScanning && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <Package className="mr-2 text-green-600" size={20} />
                                    Scanned Item Details
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <span className="font-medium text-gray-700">Item ID:</span>
                                        <span className="text-blue-800 font-mono">{scannedItem.id}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <span className="font-medium text-gray-700">NFC Tag ID:</span>
                                        <span className="text-purple-600 font-mono text-sm">{scannedItem.nfcTagId}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <span className="font-medium text-gray-700">Name:</span>
                                        <span>{scannedItem.name}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <span className="font-medium text-gray-700">Location:</span>
                                        <span>{scannedItem.location}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <span className="font-medium text-gray-700">Serial Number:</span>
                                        <span className="font-mono text-sm">{scannedItem.serialNumber}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                        <span className="font-medium text-gray-700">Last Scanned:</span>
                                        <span className="text-sm text-gray-500">{scannedItem.lastScanned}</span>
                                    </div>
                                </div>

                                {/* Condition Update */}
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Edit3 className="mr-2 text-orange-600" size={16} />
                                        Update Condition & Add Remarks
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <select
                                                value={selectedCondition}
                                                onChange={(e) => setSelectedCondition(e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                                            >
                                                <option value="Very Good">Very Good</option>
                                                <option value="Good Condition">Good Condition</option>
                                                <option value="Fair Condition">Fair Condition</option>
                                                <option value="Poor Condition">Poor Condition</option>
                                                <option value="Scrap Condition">Scrap Condition</option>
                                            </select>
                                        </div>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Add remarks or notes (optional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none"
                                            rows="2"
                                        />
                                        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(currentCondition || scannedItem.updates)}`}>
                                                Current: {currentCondition || scannedItem.updates}
                                            </span>
                                            <button
                                                onClick={updateCondition}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Report Buttons */}
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-semibold mb-3 text-red-700">Report</h4>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => {setShowReportModal(true)}}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex-1"
                                        >
                                            Report Issues and Updates
                                        </button>
                                        {/* <button
                                            onClick={() => {setShowReportModal(true); setReportType('damaged');}}
                                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex-1"
                                        >
                                            Report Damage
                                        </button> */}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - History */}
                    <div className="bg-white rounded-lg shadow-md p-6 xl:w-96 flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <History className="mr-2 text-purple-600" size={20} />
                            Item History
                        </h3>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {scanHistory.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                                            <p className="text-sm text-gray-600 font-mono">{item.itemId}</p>
                                            {item.serialNumber && (
                                                <p className="text-xs text-gray-500">SN: {item.serialNumber}</p>
                                            )}
                                            {item.nfcTagId && (
                                                <p className="text-xs text-purple-600">NFC: {item.nfcTagId}</p>
                                            )}
                                            {item.remarks && (
                                                <p className="text-xs text-gray-600 mt-1 italic">"{item.remarks}"</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition || item.updates)}`}>
                                                {item.condition || item.updates}
                                            </span>
                                            {item.action === 'Condition Updated' && (
                                                <p className="text-xs text-orange-600 mt-1">
                                                    Updated from {item.previousCondition}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center text-gray-500">
                                            <Clock className="mr-1" size={12} />
                                            {item.scanTime}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">{item.location}</span>
                                            {/* <span className={`text-xs px-2 py-1 rounded-full font-medium ${getActionColor(item.action)}`}>
                                                {item.action}
                                            </span> */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {scanHistory.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <History size={48} className="mx-auto mb-2 opacity-50" />
                                <p>No scan history yet</p>
                                <p className="text-sm">Start scanning NFC tags to see history</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <AlertTriangle className="mr-2 text-red-600" size={20} />
                                Report Issue
                            </h3>
                            
                            <div className="mb-4">
                                <p className="text-gray-700 mb-2">Item: <span className="font-medium">{scannedItem?.name}</span></p>
                                <p className="text-gray-700 mb-2">ID: <span className="font-mono">{scannedItem?.id}</span></p>
                                <p className="text-gray-700 mb-4">NFC Tag: <span className="font-mono text-purple-600">{scannedItem?.nfcTagId}</span></p>
                                
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Issue Type:
                                </label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="">Select issue type</option>
                                    <option value="Missing">Missing</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Misplaced">Misplaced</option>
                                    <option value="Malfunctioning">Malfunctioning</option>
                                    <option value="Repaired">Repaired</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {setShowReportModal(false); setReportType('');}}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Handle report submission logic here
                                        console.log('Report submitted:', scannedItem?.nfcTagId, reportType);
                                        submitReport(scannedItem?.nfcTagId, reportType);
                                        setShowReportModal(false);
                                        setReportType('');
                                    }}
                                    disabled={!reportType}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <DeviceListModal
                deviceList={deviceList}
                deviceListModal={deviceListModal}
                setDeviceListModal={setDeviceListModal}
                setSelectedDevice={setSelectedDevice}
                StatusIcon={StatusIcon}
                getStatusBg={getStatusBg}
                getStatusColor={getStatusColor}
            />
        </div>
    );
};

export default Scan;