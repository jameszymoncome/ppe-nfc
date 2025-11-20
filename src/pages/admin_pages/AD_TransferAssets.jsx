import React, { useState, useEffect } from "react";
import { ChevronRight, Search, Laptop, Monitor, Printer, Package, X } from "lucide-react";
import AD_Sidebar from "../../components/AD_Sidebar";
import { BASE_URL } from '../../utils/connection';
import axios from 'axios';
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

const AD_TransferAssets = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId } = location.state || {};
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);
    const [assets, setAssets] = useState([]);
    const [transferInfo, setTransferInfo] = useState(null);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [transferForm, setTransferForm] = useState({
      ptr_no: '',
      entity_name: 'LGU of Daet',
      from_officer: '',
      from_officerID: '',
      to_officer: '',
      to_officerID: '',
      transfer_type: '',
      reason_for_transfer: '',
      approved_by: '',
      released_by: '',
      received_by: '',
      transfer_date: '',
      status: 'Pending'
    });
    const [transferType, setTransferType] = useState("");
    const [autoFillAssets, setAutoFillAssets] = useState([]);
    const [assetRemarks, setAssetRemarks] = useState({});
    const [transferGroups, setTransferGroups] = useState([]);

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
            const ptr_no = await fetchPtrNo();
            try {
                const response = await axios.get(`${BASE_URL}/getNames.php`, {
                    params: {
                        usersID: userId
                    }
                });
                console.log('Transfer Name:', response.data.data);
                setTransferInfo(response.data.data);
                setTransferForm(form => ({
                    ...form,
                    ptr_no,
                    from_officer: `${localStorage.getItem("firstName")} ${localStorage.getItem("lastname")}`,
                    to_officer: response.data.data.name,
                    from_officerID: localStorage.getItem("userId"),
                    to_officerID: response.data.data.user_id,
                    // Optionally, you can combine descriptions, units, etc. if multiple assets
                }));
            } catch (error) {
                console.error('Error fetching scrapped items:', error);
            }
        }
        getPassInfo();
    }, []);

    const getItems = async () => {
        setShowTransferForm(true);
        try {
            const response = await axios.get(`${BASE_URL}/getTransferItem.php`, {
                params: {
                    user_id: localStorage.getItem("userId"),
                    selectedItem: selectedAssets
                }
            });

            const fetchedAssets = response.data.assets.map(asset => ({
                ...asset,
                property_no: asset.propertyNo, // new key
                remarks: "",
                quantity: 1
            }));

            // Group by PAR and ICS
            const PAR_assets = fetchedAssets.filter(a => a.type === "PAR");
            const ICS_assets = fetchedAssets.filter(a => a.type === "ICS");

            // Build final result
            const result = [];

            if (PAR_assets.length > 0) {
                result.push({
                    transferForm: {
                        ...transferForm,  
                        form_type: "PAR"   // override for this group
                    },
                    assets: PAR_assets
                });
            }

            if (ICS_assets.length > 0) {
                result.push({
                    transferForm: {
                        ...transferForm,
                        form_type: "ICS"
                    },
                    assets: ICS_assets
                });
            }

            console.log("FINAL GROUPED RESULT:", result);

            setTransferGroups(result);

            // setAutoFillAssets(
            //     response.data.assets.map(asset => ({
            //         ...asset,
            //         remarks: "",
            //         quantity: 1
            //     }))
            // );

            // setTransferForm(form => ({
            //     ...form,
            //     unit: firstAsset.unit || '',
            //     description: firstAsset.description || '',
            //     property_no: firstAsset.propertyNo || '',
            //     amount: firstAsset.unitCost || '',
            // }));
            // setTransferInfo(response.data.data);
        } catch (error) {
            console.error('Error fetching scrapped items:', error);
        }
    }

    const fetchPtrNo = async () => {
        try {
            const response = await fetch(`${BASE_URL}/getLatestPtrSeries.php`);
            const data = await response.json();
            return data.next_ptr_no || `${new Date().getFullYear()}-0001`;
        } catch {
            return `${new Date().getFullYear()}-0001`;
        }
    };

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
        getItems();
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleSubmit = async () => { 
        console.log(transferGroups);
        try {
            const response = await axios.post(`${BASE_URL}/transferAssets.php`, {
                transferGroups: transferGroups,
                role: localStorage.getItem('accessLevel')
            });
            console.log("📥 Response from server:", response.data);
            if (response.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Transfer Successful",
                    text: "Transfer created successfully!",
                }).then(() => {
                    navigate("/ad-profile");
                });
            }
        } catch (err) {
            console.error("💥 Error submitting transfer:", err);
        }
        // try {
        //   const firstAsset = autoFillAssets[0] || {};
      
        //   console.log("📤 Payload being sent:", payload);
      
        //   const res = await fetch(`${BASE_URL}/createAssetTransfer.php`, {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(payload),
        //   });
      
        //   const text = await res.text();
        //   console.log("📥 Raw response:", text);
      
        //   let data;
        //   try {
        //     data = JSON.parse(text);
        //   } catch (e) {
        //     throw new Error("Invalid JSON response from server");
        //   }
      
        //   if (data.success) {
        //     Swal.fire({
        //       icon: "success",
        //       title: "Transfer Successful",
        //       text: data.message || "Transfer created successfully!",
        //     }).then(() => {
        //       // ✅ Reset form & reload page
        //       setTransferForm({
        //         ptr_no: "",
        //         entity_name: "",
        //         from_officer: "",
        //         to_officer: "",
        //         transfer_type: "",
        //         reason_for_transfer: "",
        //         approved_by: "",
        //         released_by: "",
        //         received_by: "",
        //         transfer_date: "",
        //         status: "Pending",
        //       });
        //       setSelectedAssets([]);
        //       setAssetRemarks({});
        //       window.location.reload(); // full reload if needed
        //     });
        //   } else {
        //     Swal.fire({
        //       icon: "error",
        //       title: "Error",
        //       text: data.message || "Failed to create transfer",
        //     });
        //     console.error("❌ Backend error:", data.message);
        //   }
        // } catch (err) {
        //     Swal.fire({
        //         icon: "error",
        //         title: "Submission Failed",
        //         text: err.message || "An unexpected error occurred",
        //     });
        //     console.error("💥 Error submitting transfer:", err);
        // }
    };

    const handleAssetRemarkChange = (index, value) => {
        setAutoFillAssets(prev => {
            const updated = [...prev];
            updated[index].remarks = value;   // ✔ update the key
            return updated;
        });
    };

    const handleGroupTransferFormChange = (groupIndex, field, value) => {
        setTransferGroups(prevGroups =>
            prevGroups.map((group, idx) =>
                idx === groupIndex
                    ? {
                        ...group,
                        transferForm: {
                            ...group.transferForm,
                            [field]: value
                        }
                    }
                    : group
            )
        );
    };

    const handleAssetRemarksChange = (groupIndex, assetIndex, value) => {
        setTransferGroups(prevGroups =>
            prevGroups.map((group, gIdx) =>
                gIdx === groupIndex
                    ? {
                        ...group,
                        assets: group.assets.map((asset, aIdx) =>
                            aIdx === assetIndex
                                ? { ...asset, remarks: value } // update only remarks
                                : asset
                        )
                    }
                    : group
            )
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AD_Sidebar />

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

            {showTransferForm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl relative overflow-y-auto max-h-[95vh] border">
                        <div className="border-b border-black pt-6 pb-6">
                            <button
                                onClick={() => setShowTransferForm(false)}
                                className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {transferGroups.map((group, groupIndex) => (
                            <div 
                                className="p-8 m-5 border border-black"
                                key={groupIndex}
                            >
                                {/* Header */}
                                <div className="text-center mb-2">
                                    <img src="/assets/images/lgu_seal.png" alt="Logo" className="mx-auto mb-2" style={{height: 60}} />
                                    <div className="font-semibold">Republic of the Philippines</div>
                                    <div className="font-semibold">PROVINCE OF CAMARINES NORTE</div>
                                    <div className="font-semibold">MUNICIPALITY OF DAET</div>
                                    <div className="mt-2 text-lg font-bold underline">PROPERTY TRANSFER REPORT</div>
                                </div>
                                {/* Entity Name & PTR No. */}
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm">
                                        <span className="font-semibold">Entity Name:</span> {group.transferForm.entity_name}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold">PTR No.:</span> {group.transferForm.ptr_no}
                                    </div>
                                </div>
                                {/* Officers */}
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm w-1/2">
                                        <span className="font-semibold">From Accountable Officer/Agency/Fund Cluster:</span>
                                        <span className="ml-2"><br></br>{group.transferForm.from_officer}</span>
                                    </div>
                                    <div className="text-sm w-1/2 text-right">
                                        <span className="font-semibold">To Accountable Officer/Agency/Fund Cluster:</span>
                                        <span className="ml-2"><br></br>{group.transferForm.to_officer}</span>
                                    </div>
                                </div>
                                {/* Transfer Type */}
                                <div className="flex items-center mb-2 text-sm">
                                    <span className="font-semibold mr-2">Transfer Type:</span>
                                    <span className="mr-2">(check one)</span>
                                    <label className="mr-4 flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`transferType-${groupIndex}`}
                                            value="donation"
                                            checked={group.transferForm.transfer_type === 'donation'}
                                            onChange={() => handleGroupTransferFormChange(groupIndex, 'transfer_type', 'donation')}
                                            className="mr-1"
                                        />
                                        Donation
                                    </label>
                                    <label className="mr-4 flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`transferType-${groupIndex}`}
                                            value="relocate"
                                            checked={group.transferForm.transfer_type === 'relocate'}
                                            onChange={() => handleGroupTransferFormChange(groupIndex, 'transfer_type', 'relocate')}
                                            className="mr-1"
                                        />
                                        Relocate
                                    </label>
                                    <label className="mr-4 flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`transferType-${groupIndex}`}
                                            value="reassign"
                                            checked={group.transferForm.transfer_type === 'reassign'}
                                            onChange={() => handleGroupTransferFormChange(groupIndex, 'transfer_type', 'reassign')}
                                            className="mr-1"
                                        />
                                        Reassign
                                    </label>
                                    <label className="mr-2 flex items-center cursor-pointer">
                                        <input
                                        type="radio"
                                        name={`transferType-${groupIndex}`}
                                        value="others"
                                        checked={group.transferForm.transfer_type === 'others'}
                                        onChange={() => handleGroupTransferFormChange(groupIndex, 'transfer_type', 'others')}
                                        className="mr-1"
                                        />
                                        Others (Specify)
                                    </label>
                                {transferType === 'others' && (
                                    <input
                                    type="text"
                                    placeholder="Specify transfer type"
                                    value={otherTransferType}
                                    onChange={e => {
                                        setOtherTransferType(e.target.value);
                                        handleGroupTransferFormChange(groupIndex, 'transfer_type', e.target.value);
                                    }}
                                    className="ml-2 underline px-2 py-1 border rounded"
                                    required
                                    />
                                )}
                                </div>
                                {/* Assets Table */}
                                <div className="overflow-x-auto mb-2">
                                    <table className="min-w-full border border-black text-xs">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-black px-2 py-1 text-center">Quantity</th>
                                                <th className="border border-black px-2 py-1 text-center">Unit</th>
                                                <th className="border border-black px-2 py-1 text-center">Description</th>
                                                <th className="border border-black px-2 py-1 text-center">Property No.</th>
                                                <th className="border border-black px-2 py-1 text-center">Amount</th>
                                                <th className="border border-black px-2 py-1 text-center">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {group.assets.map((asset, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-black px-2 py-1 text-center">1</td>
                                                <td className="border border-black px-2 py-1 text-center">{asset.unit}</td>
                                                <td className="border border-black px-2 py-1 text-center">{asset.description}</td>
                                                <td className="border border-black px-2 py-1 text-center">{asset.propertyNo}</td>
                                                <td className="border border-black px-2 py-1 text-center">
                                                    ₱{Number(asset.unitCost).toLocaleString()}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-center">
                                                    <input
                                                        type="text"
                                                        value={asset.remarks || ""}
                                                        onChange={e => handleAssetRemarksChange(groupIndex, idx, e.target.value)}
                                                        className="w-full px-1 py-0.5 border rounded text-xs"
                                                        placeholder="Enter remarks"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Empty rows for layout */}
                                        {Array.from({length: Math.max(7 - autoFillAssets.length, 0)}).map((_, idx) => (
                                            <tr key={`empty-${idx}`}>
                                                <td className="border border-black px-2 py-1">&nbsp;</td>
                                                <td className="border border-black px-2 py-1">&nbsp;</td>
                                                <td className="border border-black px-2 py-1">&nbsp;</td>
                                                <td className="border border-black px-2 py-1">&nbsp;</td>
                                                <td className="border border-black px-2 py-1">&nbsp;</td>
                                                <td className="border border-black px-2 py-1">&nbsp;</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Reason for Transfer */}
                                <div className="mb-2 text-sm">
                                    <span className="font-semibold mb-5">Reason for Transfer:</span>
                                    <textarea
                                        value={group.transferForm.reason_for_transfer}
                                        onChange={e => handleGroupTransferFormChange(groupIndex, 'reason_for_transfer', e.target.value)}
                                        className="w-full px-3 py-2 border rounded min-h-[32px] mt-1"
                                        placeholder="Enter reason for transfer"
                                        required
                                    />
                                    <div className="border-b border-black mt-6 mb-1" />
                                </div>
                                {/* Signatories */}
                                <div className="grid grid-cols-2 gap-8 mt-6 mb-2">
                                    <div>
                                        <div className="mb-2 text-sm">
                                            <span className="font-semibold">Approved by:</span>
                                            <div className="min-h-[24px]">{group.transferForm.approved_by}</div>
                                        </div>
                                        <div className="mb-2 text-sm text-center">
                                            <div className="border-b border-black mt-1 mb-1" />
                                            <span className="font-semibold">Signature over Printed Name of Head of Agency/Entity or his/her Authorized Representative</span>
                                        </div>
                                    </div>
                                <div>
                                    <div className="mb-2 text-sm">
                                    <span className="font-semibold">Released/Issued by:</span>
                                    <div className="min-h-[24px] text-center">{group.transferForm.from_officer}</div>
                                    </div>
                                    <div className="mb-2 text-sm text-center">
                                    <div className="border-b border-black mt-1 mb-1" />
                                    <span className="font-semibold">Signature over Printed Name of Accountable Officer</span>
                                    </div>
                                </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 mt-6 mb-2">
                                <div>
                                    <div className="mb-2 text-sm">
                                    <span className="font-semibold">Received by:</span>
                                    <div className="min-h-[24px] text-center">{group.transferForm.to_officer}</div>
                                    </div>
                                    <div className="mb-2 text-sm text-center">
                                    <div className="border-b border-black mt-1 mb-1" />
                                    <span className="font-semibold ">Signature over Printed Name of Accountable Officer</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 text-sm">
                                    <span className="font-semibold">Date:</span>
                                    <input
                                        type="date"
                                        value={group.transferForm.transfer_date}
                                        onChange={e => handleGroupTransferFormChange(groupIndex, 'transfer_date', e.target.value)}
                                        className="w-full px-1 border rounded mt-1"
                                        required
                                    />
                                    <div className="border-b border-black mt-1 mb-1" />
                                    </div>
                                    {/* <div className="mb-2 text-sm">
                                    <span className="font-semibold">Status:</span>
                                    <div className="border-b border-black mt-1 mb-1" />
                                    <div className="min-h-[24px]">{transferForm.status}</div>
                                    </div> */}
                                </div>
                                </div>
                            </div>
                        ))}
                        {/* Submit Button */}
                        <div className="flex justify-end mt-4">
                        <button type="submit" className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" onClick={handleSubmit}>Submit Transfer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AD_TransferAssets;