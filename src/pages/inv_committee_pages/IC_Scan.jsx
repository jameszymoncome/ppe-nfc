import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, History, AlertTriangle, Tag, CheckCircle, Search, AlertCircle, XCircle, Clock, Package, Edit3, Wifi, WifiOff } from 'lucide-react';
import IC_Sidebar from '../../components/IC_Sidebar';
import { BASE_URL } from '../../utils/connection';
import axios from 'axios';
import DeviceListModal from '../../components/DeviceListModal';
import { onMessage, sendMessage } from '../../components/websocket';
import Swal from "sweetalert2";

const IC_Scan = () => {
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
    const [showManual, setShowManual] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [isAvailable, setIsAvailable] = useState(false);
    const [currentItemHistory, setCurrentItemHistory] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchData, setSearchData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log('Selected Device:', selectedDevice);
        console.log('Is Available:', isAvailable);
        if (selectedDevice && isAvailable) {
            setDeviceListModal(false);
            setViewNFCModal(true);
        }
    }, [selectedDevice, isAvailable]);

    useEffect(() => {
        // startNFCScan();
    }, []);

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

    useEffect(() => {
        const fetchSearch = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/getSearch.php`);
                console.log('Search data',response.data.data);
                setSearchData(response.data.data);
            } catch (error) {
                console.error('Error fetching end users:', error);
            }
        }
        fetchSearch();
    }, []);

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
        // const tag = "11223344556677";
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
                // setSelectedCondition(response.data.data[0].conditions);
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
        if (selectedCondition === '') {
            Swal.fire({
                title: "Select Condition First",
                text: "Please choose a condition before proceeding to update.",
                icon: "warning",
                confirmButtonText: "OK",
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mx-2",
                },
                buttonsStyling: false,
            });
            return;
        }
        
        Swal.fire({
            title: "Is the condition correct?",
            text: "Please confirm that the selected condition is accurate before updating.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, it's correct",
            cancelButtonText: "No, I'll check again",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mx-2",
                cancelButton: "bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded mx-2",
            },
            buttonsStyling: false,
        }).then(async (result) => {
            if (result.isConfirmed) {
                console.log("✅ User confirmed that the condition is correct.");
                setIsLoading(true);
                try {
                    const response = await axios.post(`${BASE_URL}/inspect.php`, {
                        nfcTagID,
                        selectedCondition,
                        remarks,
                        mode: "scan"
                    });
                    console.log(response.data);
                    if (showManual) {
                        startNFCScan(nfcTagID);
                        itemHistory(nfcTagID);
                        // setIsScanning(false);
                        // setScannedItem(null);
                        // setScanHistory([]);
                    }
                    else{
                        setIsScanning(true);
                    }
                    // itemHistory(nfcTagID);
                    // setIsScanning(false);
                    // setScannedItem(null);
                    // setScanHistory([]);
                } catch (error) {
                    console.error('Error updating condition:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                console.log("❌ User wants to recheck the condition.");
                return;
            }
        });

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
        setIsLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/inspect.php`, {
                nfcTagID: tagId,
                selectedCondition: reportType,
                mode: "report"
            });
            console.log(response.data);
            setIsLoading(false);
            Swal.fire({
                title: "Reporting Complete",
                text: "The inspection report has been successfully submitted.",
                icon: "success",
                confirmButtonText: "OK",
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mx-2",
                },
                buttonsStyling: false,
            }).then((result) => {
                if(result.isConfirmed){
                    if (showManual) {
                        startNFCScan(nfcTagID);
                        itemHistory(nfcTagID);
                        // setIsScanning(false);
                        // setScannedItem(null);
                        // setScanHistory([]);
                    }
                }
            })
            // viewItem(); // Refresh item data after report submission
        } catch (error) {
            console.error('Error submitting report:', error);
        }
    }

    const handleManualSearch = () => {
        if (manualCode.trim()) {
            alert(`Searching for: ${manualCode}`);
            // Your search logic here
        }
    };

    const getStatusColorSearch = (status) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'active':
                return <CheckCircle size={14} />;
            case 'inactive':
                return <XCircle size={14} />;
            case 'Maintenance':
                return <AlertCircle size={14} />;
            default:
                return null;
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setManualCode(value);

        // Filter results based on input (search across all fields)
        if (value.trim()) {
            const filtered = searchData.filter(item =>
                item.propertyNo.toLowerCase().includes(value.toLowerCase()) ||
                item.itemName.toLowerCase().includes(value.toLowerCase()) ||
                item.tagID.toLowerCase().includes(value.toLowerCase()) ||
                item.stats.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectResult = (result) => {
        // setManualCode(result.tagId);
        setManualCode('');
        setSearchResults([]);
        startNFCScan(result.tagID);
        // You can also trigger the search here or store the selected item
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <IC_Sidebar />

            <div className="flex-1 flex flex-col overflow-y-auto p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-800">NFC - Tagged Items</h1>
                        <p className="text-gray-600">Scan & Inspect items with assigned NFC tags</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-end">
                        {/* Manual Inspect Button */}
                        <div className="flex flex-wrap items-center gap-3 relative w-full lg:w-auto">
                            <button
                                onClick={() => {
                                setShowManual(!showManual);
                                setIsScanning(false);
                                setManualCode('');
                                setSearchResults([]);
                                }}
                                className="bg-blue-800 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all hover:shadow-md font-medium w-full sm:w-auto justify-center"
                            >
                                <QrCode size={20} />
                                {showManual ? 'Cancel' : 'Manual Inspect NFC Tag'}
                            </button>

                            {/* Input and Search Section */}
                            {showManual && (
                                <div className="relative flex-1 w-full lg:w-[700px] max-w-6xl transition-all">
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={handleInputChange}
                                        placeholder="Search by Tag ID, Item No, or Item Name..."
                                        className="border-2 border-gray-300 rounded-lg px-4 py-2.5 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />

                                    {/* Dropdown Results Container */}
                                    {manualCode && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50 w-full">
                                            {searchResults.map((result, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleSelectResult(result)}
                                                    className="px-5 py-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all hover:shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <Package className="text-blue-600 flex-shrink-0" size={18} />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-gray-900 truncate">
                                                                    {result.itemName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 font-medium ${getStatusColorSearch(
                                                                result.stats
                                                            )}`}
                                                        >
                                                            {getStatusIcon(result.stats)}
                                                            {result.stats}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-6">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="font-medium text-gray-700">Item No:</span>
                                                            <span className="text-gray-600">{result.propertyNo}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Tag size={14} className="text-gray-500" />
                                                            <span className="font-mono text-blue-600 font-medium">{result.tagID}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                {/* No Results Message */}
                                {manualCode && searchResults.length === 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-6 z-50 w-full">
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            <Search size={32} className="opacity-50" />
                                            <p className="text-sm font-medium">No items found</p>
                                            <p className="text-xs text-gray-400">Try searching with a different keyword</p>
                                        </div>
                                    </div>
                                )}
                                </div>
                            )}
                        </div>

                        {/* Scan NFC Button */}
                        {!showManual && (
                            <button
                                className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
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
                        )}
                    </div>
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
                                                <option value="">Select</option>
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

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
};

export default IC_Scan;