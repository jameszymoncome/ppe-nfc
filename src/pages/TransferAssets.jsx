import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { ChevronRight, Search, Laptop, Monitor, Printer, Package, X } from "lucide-react";
import { BASE_URL } from '../utils/connection';
import axios from 'axios';
import { sendMessage, onMessage } from '../components/websocket';
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";

const TransferAssets = () => {
    const location = useLocation();
    const { userId } = location.state || {};
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);
    const [assets, setAssets] = useState([]);
    const [transferInfo, setTransferInfo] = useState(null);

    useEffect(() => {
        const getAllAssets = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/assetsofPerson.php`, {
                    params: {
                        role: localStorage.getItem("accessLevel"),
                        usersID: localStorage.getItem("userId"),
                        departments: localStorage.getItem("department")
                    }
                });
                console.log('All Items:', response.data);
                if (response.data.success && Array.isArray(response.data.data)) {
                    setAssets(response.data.data);
                } else {
                    setAssets([]);
                }
            } catch (error) {
                console.error('Error fetching scrapped items:', error);
            }
        }
        getAllAssets();
    }, []);

    useEffect(() => {
        const getPassInfo = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/getNames.php`, {
                    params: {
                        usersID: userId
                    }
                });
                console.log('Transfer Name:', response.data.data);
                setTransferInfo(response.data.data);
            } catch (error) {
                console.error('Error fetching scrapped items:', error);
            }
        }
        getPassInfo();
    }, []);

    const accountInfo = {
        name: "John Smith",
        department: localStorage.getItem("department")
    };

    // const assets = [
    //     { id: 1, name: "Dell Laptop XPS 15", type: "Laptop", code: "LAP-001", status: "Active", location: "Room 301" },
    //     { id: 2, name: "HP Monitor 27\"", type: "Monitor", code: "MON-023", status: "Active", location: "Room 301" },
    //     { id: 3, name: "Logitech Keyboard MX", type: "Keyboard", code: "KEY-045", status: "Active", location: "Room 302" },
    //     { id: 4, name: "HP Printer LaserJet", type: "Printer", code: "PRT-012", status: "Active", location: "Room 105" },
    //     { id: 5, name: "Lenovo ThinkPad", type: "Laptop", code: "LAP-034", status: "Active", location: "Room 301" },
    //     { id: 6, name: "Samsung Monitor 24\"", type: "Monitor", code: "MON-056", status: "Active", location: "Room 302" },
    //     { id: 7, name: "Wireless Mouse", type: "Mouse", code: "MSE-089", status: "Active", location: "Room 301" },
    //     { id: 8, name: "USB Hub 4-Port", type: "Accessory", code: "ACC-123", status: "Active", location: "Room 105" },
    //     { id: 9, name: "MacBook Pro 16\"", type: "Laptop", code: "LAP-067", status: "Active", location: "Room 303" },
    //     { id: 10, name: "Canon Scanner", type: "Scanner", code: "SCN-034", status: "Active", location: "Room 105" }
    // ];

    const filteredAssets = assets.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.item_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.modal.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isSelected = (assetId) => {
        return selectedAssets.some(a => a.id === assetId);
    };

    const getIcon = (type) => {
        switch(type.toLowerCase()) {
            case 'laptop': return <Laptop className="w-5 h-5" />;
            case 'monitor': return <Monitor className="w-5 h-5" />;
            case 'printer': return <Printer className="w-5 h-5" />;
            default: return <Package className="w-5 h-5" />;
        }
    };

    const toggleAsset = (asset) => {
        setSelectedAssets(prev => {
            const exists = prev.find(a => a.id === asset.id);
            if (exists) {
                return prev.filter(a => a.id !== asset.id);
            } else {
                return [...prev, asset];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedAssets([]);
            setSelectAll(false);
        } else {
            setSelectedAssets([...filteredAssets]);
            setSelectAll(true);
        }
    };

    const handleProceed = () => {
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />

            <div className="flex-1 bg-gray-50 p-4 md:p-6 lg:p-8 overflow-hidden">
                <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-blue-900">Asset Transfer</h1>
                    </div>
                    <button
                        onClick={handleProceed}
                        disabled={selectedAssets.length === 0}
                        className={`
                        flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200
                        ${selectedAssets.length > 0
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-105 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                        `}
                    >
                        Proceed to Transfer
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Accountable Person Information</h2>
                    
                    <div className="bg-gray-50 rounded-xl p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End User :
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter end user name"
                                    defaultValue={transferInfo?.name}
                                    className="w-full px-4 py-2 border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none bg-transparent"
                                />
                            </div>
                        
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Offices/Department :
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter department"
                                    defaultValue={transferInfo?.department}
                                    className="w-full px-4 py-2 border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none bg-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div className="p-6 md:p-8 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Available Assets</h2>
                                <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-semibold text-sm">
                                {selectedAssets.length} Selected
                                </div>
                            </div>
                        
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSelectAll}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                >
                                    <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center">
                                        {selectAll && (
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                            </svg>
                                        )}
                                    </div>
                                    Select All
                                </button>

                                {selectedAssets.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setSelectedAssets([]);
                                            setSelectAll(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear Selection
                                    </button>
                                )}
                                
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search assets..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none w-full md:w-64"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Item No
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Model
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Serial No
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                                    Condition
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredAssets.map(asset => (
                                <tr
                                    key={asset.id}
                                    onClick={() => toggleAsset(asset)}
                                    className={`
                                    cursor-pointer transition-all duration-200
                                    ${isSelected(asset.id) 
                                        ? 'bg-blue-50 hover:bg-blue-100' 
                                        : 'hover:bg-gray-50'
                                    }
                                    `}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isSelected(asset.id) ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                                {getIcon(asset.category)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-800">{asset.name}</span>
                                            {isSelected(asset.id) && (
                                                <div className="bg-blue-600 text-white rounded-full p-0.5">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                </svg>
                                                </div>
                                            )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-700 font-mono">{asset.item_no}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-600">{asset.model}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-600">{asset.serialNo}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-600">{asset.department}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            {asset.status || 'Edi meow'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200">
                    {filteredAssets.map(asset => (
                        <div
                            key={asset.id}
                            onClick={() => toggleAsset(asset)}
                            className={`
                            p-4 cursor-pointer transition-all duration-200
                            ${isSelected(asset.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${isSelected(asset.id) ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                    {getIcon(asset.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-800">{asset.name}</h3>
                                        {isSelected(asset.id) && (
                                            <div className="bg-blue-600 text-white rounded-full p-0.5">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                            </svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 font-mono mb-2">{asset.code}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                            {asset.type}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                            {asset.location}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                            {asset.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredAssets.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No assets found</p>
                    </div>
                )}

            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-white">Transfer Summary</h3>
                        <button 
                        onClick={closeModal}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                        <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        <div className="mb-6 bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 mb-1">Transferring to</p>
                        <p className="font-semibold text-lg">{transferInfo.name}</p>
                        <p className="text-gray-600">{transferInfo.department}</p>
                        </div>

                        <h4 className="font-semibold text-lg mb-4 text-gray-800">
                        Selected Assets ({selectedAssets.length})
                        </h4>
                        
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Asset</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Location</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {selectedAssets.map(asset => (
                                <tr key={asset.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                        {getIcon(asset.category)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">{asset.name}</p>
                                        <p className="text-xs text-gray-500 sm:hidden">{asset.modal}</p>
                                    </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <span className="font-mono text-sm text-gray-700">{asset.modal}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-sm hidden md:table-cell">{asset.category}</td>
                                <td className="px-4 py-3 text-gray-600 text-sm hidden md:table-cell">{asset.department}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <div className="border-t p-6 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={closeModal}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Confirm Transfer
                        </button>
                    </div>
                    </div>
                </div>
                )}
        </div>
    );
}

export default TransferAssets;