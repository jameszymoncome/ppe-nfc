import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Package, ChevronRight, ChevronDown, Clock, X, FileText, AlertTriangle } from 'lucide-react';
import { BASE_URL } from '../utils/connection';
import axios from 'axios';
import { useLocation } from "react-router-dom";

const ItemInfo = () => {
    const location = useLocation();
    const { air_no, type } = location.state || {};
    const [items, setItems] = useState([]);
    const [expandedItem, setExpandedItem] = useState(null);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('');
    const [scannedItem, setScannedItem] = useState(null);

    useEffect(() => {
        console.log('Viewing item with air_no:', air_no, 'and type:', type);
        viewItem();
    }, []);
    const viewItem = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/viewItem.php`, {
                params: {
                    air_no: air_no,
                    type: type
                }
            });
            console.log('Fetched item data:', response.data);
            if (response.data.success) {
                const rawData = response.data.data;

                const grouped = {};
                rawData.forEach(row => {
                    const key = `${row.air_no}-${row.itemName}-${row.category}`;

                    if (!grouped[key]) {
                        grouped[key] = {
                            id: Object.keys(grouped).length + 1,
                            name: row.itemName,
                            category: row.category,
                            instances: []
                        };
                    }

                    let instance = grouped[key].instances.find(i => i.serialno === row.serialno);

                    if (!instance) {
                        instance = {
                            instanceId: row.itemName,           // itemName
                            serialno: row.serialno,             // serial number
                            tagIds: row.tagId,
                            status: row.conditions || "Active", // only from 'latest'
                            history: [],
                            created_at: row.created_at          // keep raw created_at
                        };
                        grouped[key].instances.push(instance);
                    }

                    // ✅ Add inspection history only if there’s more than 1 row total
                    if (rawData.length > 1 && row.recordType !== "latest") {
                        instance.history.push({
                            date: row.dateInspected ? row.dateInspected.split(" ")[0] : null,
                            action: row.updates || "Inspection",
                            description: row.remarks || row.conditions || "No remarks"
                        });
                    }
                });

                // 🔹 After grouping, always add "Item added" at the end
                Object.values(grouped).forEach(item => {
                    item.instances.forEach(instance => {
                        if (instance.created_at) {
                            instance.history.push({
                                date: instance.created_at.split(" ")[0], // only date
                                action: "Added",
                                description: "Item added to inventory"
                            });
                        }
                    });
                });

                setItems(Object.values(grouped));
            }
        } catch (error) {
            console.error('Error fetching item data:', error);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Very Good': return 'text-green-600 bg-blue-100';
            case 'Good Condition': return 'text-blue-600 bg-green-100';
            case 'Fair Condition': return 'text-yellow-600 bg-yellow-100';
            case 'Poor Condition': return 'text-red-600 bg-orange-100';
            case 'Scrap Condition': return 'text-red-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getActionColor = (action) => {
        switch(action) {
            case 'Created': return 'bg-blue-500';
            case 'Updated': return 'bg-green-500';
            case 'Maintenance': return 'bg-yellow-500';
            case 'Repaired': return 'bg-purple-500';
            case 'Moved': return 'bg-indigo-500';
            case 'Cleaned': return 'bg-teal-500';
            case 'Inspection': return 'bg-orange-500';
            case 'Added': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const handleItemClick = (item) => {
        if (expandedItem?.id === item.id) {
            setExpandedItem(null);
            setSelectedInstance(null);
        } else {
            setExpandedItem(item);
            setSelectedInstance(null);
        }
    };

    const handleInstanceClick = (instance, e) => {
        e.stopPropagation();
        setSelectedInstance(instance);
        // setShowReportModal(true);
    };

    const submitReport = async (tagId, reportType) => {
        try {
            const response = await axios.post(`${BASE_URL}/inspect.php`, {
                nfcTagID: tagId,
                selectedCondition: reportType,
                mode: "report"
            });
            console.log(response.data);
            viewItem(); // Refresh item data after report submission
        } catch (error) {
            console.error('Error submitting report:', error);
        }
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-800">Item Manager</h1>
                        <p className="text-gray-600">Scan & Inspect items with assigned NFC tags</p>
                    </div>
                    <button 
                        onClick={() => {setShowReportModal(true)}}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors">
                        <FileText className="h-4 w-4" />
                        Report Issue
                    </button>
                </div>

                <div className="flex flex-col xl:flex-row gap-4">
                    {/* Left Side - Item Manager */}
                    <div className="xl:flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Package size={24} />
                                All Items
                            </h2>
                        </div>

                        <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.id}>
                                    {/* Main Item */}
                                    <div
                                        onClick={() => handleItemClick(item)}
                                        className={`p-5 cursor-pointer transition-all hover:bg-blue-50 border-b border-gray-200 ${
                                            expandedItem?.id === item.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{item.category}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-500">
                                                        {item.instances.length} instance{item.instances.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="transition-transform duration-300">
                                                {expandedItem?.id === item.id ? (
                                                    <ChevronDown className="text-blue-600" size={20} />
                                                ) : (
                                                    <ChevronRight className="text-gray-400" size={20} />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instances */}
                                    {expandedItem?.id === item.id && (
                                        <div className="bg-gray-50 border-b border-gray-200">
                                            {item.instances.map((instance, index) => (
                                            <div
                                                key={instance.serialno}
                                                onClick={(e) => handleInstanceClick(instance, e)}
                                                className={`px-5 py-3 ml-8 cursor-pointer transition-all hover:bg-blue-100 border-l-2 ${
                                                selectedInstance?.serialno === instance.serialno
                                                    ? 'bg-blue-100 border-blue-600'
                                                    : 'border-gray-300'
                                                } ${index === item.instances.length - 1 ? '' : 'border-b border-gray-200'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{instance.instanceId}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{instance.serialno}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{instance.tagIds}</p>
                                                    <span
                                                    className={`inline-block px-3 py-1 mt-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}
                                                    >
                                                    {instance.status}
                                                    </span>
                                                </div>
                                                <ChevronRight className="text-gray-400" size={16} />
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Item History */}
                    <div className="xl:w-96 flex flex-col">
                        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock size={24} />
                                    Item History
                                </h2>
                                {selectedInstance && (
                                    <button
                                        onClick={() => setSelectedInstance(null)}
                                        className="text-white hover:bg-purple-800 rounded-full p-1 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-250px)]">
                                {!selectedInstance ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Clock size={48} className="mb-4" />
                                        <p className="text-center text-sm">Select an item instance to view history</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-4 pb-4 border-b border-gray-200">
                                            <h3 className="text-xl font-bold text-gray-900">{expandedItem.name}</h3>
                                            <p className="text-gray-600 mt-1 text-sm">{selectedInstance.instanceId}</p>
                                            <p className="text-gray-500 text-xs mt-1">{selectedInstance.location}</p>
                                            {/* <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(expandedItem.status)}`}>
                                                {expandedItem.status}
                                            </span> */}
                                        </div>

                                        <div className="space-y-3">
                                            {selectedInstance.history.map((entry, index) => (
                                                <div key={index} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-3 h-3 rounded-full ${getActionColor(entry.action)}`} />
                                                        {index !== selectedInstance.history.length - 1 && (
                                                            <div className="w-0.5 flex-1 bg-gray-300 my-1" />
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1 pb-4">
                                                        <div className="flex flex-col gap-1 mb-1">
                                                            <span className="font-semibold text-gray-900 text-sm">{entry.action}</span>
                                                            <span className="text-xs text-gray-500">{entry.date}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600">{entry.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showReportModal && selectedInstance && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <AlertTriangle className="mr-2 text-red-600" size={20} />
                                Report Update and Issue
                            </h3>
                            
                            <div className="mb-4">
                                <p className="text-gray-700 mb-2">
                                    Item: <span className="font-medium">{selectedInstance.instanceId}</span>
                                </p>
                                <p className="text-gray-700 mb-2">
                                    Serial No: <span className="font-mono">{selectedInstance.serialno}</span>
                                </p>
                                <p className="text-gray-700 mb-4">
                                    Status: 
                                    <span className="font-medium text-blue-600 ml-1">{selectedInstance.status}</span>
                                </p>

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
                                    onClick={() => { setShowReportModal(false); setReportType(''); }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Handle report submission logic here
                                        console.log(`Reporting ${selectedInstance.instanceId} as ${reportType}. Tag ID: ${selectedInstance.tagIds}`);
                                        submitReport(selectedInstance.tagIds, reportType);
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
        </div>
    );
};

export default ItemInfo;