import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { FileText, Search, AlertTriangle, CheckCircle, X, AlertCircle  } from "lucide-react";
import { BASE_URL } from '../utils/connection';
import axios from 'axios';


const ReportIssue = () => {
    const [activeTab, setActiveTab] = useState("Report Issue");
    const [searchTerm, setSearchTerm] = useState("");
    const [fundFilter, setFundFilter] = useState("All Funds");
    const [dateFilter, setDateFilter] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [reportIssue, setReportIssue] = useState([]);
    const [scannedItem, setScannedItem] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const tableHeaders = ["Item No", "Description", "Model", "Serial No", "Department", "Condition"];
    const dataKeys = ["itemNo", "description", "model", "serialNo", "department", "conditions"];

    // 🔹 Dummy dataset for "Update"
    const updateData = [
        { itemNo: "101", description: "Projector", model: "Epson-789", serialNo: "SN789", department: "HR", conditions: "Needs Repair" },
        { itemNo: "102", description: "Desktop", model: "Lenovo-222", serialNo: "SN222", department: "Accounting", conditions: "Repaired" }
    ];

    useEffect(() => {
        const getReportItems = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/getReportIssue.php`);
                console.log('Report Items:', response.data);
                setReportIssue(response.data);
            } catch (error) {
                console.error('Error fetching scrapped items:', error);
            }
        }
        getReportItems();
    }, []);

    // 🔹 Pick data based on activeTab
    const currentData = activeTab === "Report Issue" ? reportIssue : updateData;

    // 🔹 Apply filters
    const filteredData = currentData.filter(item => {
        return (
        (searchTerm === "" || item.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (fundFilter === "All Funds" || item.department === fundFilter)
        );
    });

    const handleCheckboxChange = (item) => {
        setSelectedItem(item); // Replace the previous selection
    };

    const handleButtonClick = () => {
        console.log("Generate Issue Report clicked", selectedItems);
        setShowReportModal(true);
    };

    const getSubtitle = () => {
        return activeTab === "Report Issue"
        ? "Log and track reported issues with assets."
        : "View and update issue resolutions.";
    };

    const handleConfirm = async () => {
        console.log(selectedItem.tagID);
        try {
            const response = await axios.post(`${BASE_URL}/inspect.php`, {
                nfcTagID: selectedItem.tagID,
                selectedCondition: 'Repaired',
                mode: "report"
            });
            console.log(response.data);
            window.location.reload();
            // viewItem(); // Refresh item data after report submission
        } catch (error) {
            console.error('Error submitting report:', error);
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 bg-gray-50 p-4 md:p-6 lg:p-8 overflow-y-auto">
                
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-blue-900">Issue Management</h1>
                    <p className="text-sm text-gray-600 mt-1">{getSubtitle()}</p>
                </div>
                <button 
                    className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                    onClick={handleButtonClick}
                >
                    <FileText size={18} />
                    <span>Update Issue Report</span>
                </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        className={`px-4 py-2 rounded-full font-medium text-xs md:text-sm ${
                            activeTab === 'Report Issue'
                                ? 'bg-blue-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => setActiveTab('Report Issue')}
                    >
                        Report Issue
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 border rounded-lg min-w-[120px] text-sm bg-white"
                    value={fundFilter}
                    onChange={(e) => setFundFilter(e.target.value)}
                >
                    <option>All Funds</option>
                    <option>General Fund</option>
                    <option>Special Fund</option>
                </select>
                <input
                    type="date"
                    className="px-4 py-2 border rounded-lg min-w-[140px] text-sm bg-white"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
                </div>

                {/* Table View */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                        <th className="py-3 px-4 w-12"></th>
                        {tableHeaders.map((header, idx) => (
                            <th key={idx} className="py-3 px-4 text-xs font-medium text-gray-600">{header}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedItem?.itemNo === item.itemNo}
                                            onChange={() => handleCheckboxChange(item)}
                                        />
                                    </td>
                                    {dataKeys.map((key, keyIdx) => (
                                        <td key={keyIdx} className="py-3 px-4 text-sm">{item[key] || '-'}</td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={tableHeaders.length + 1} className="py-8 text-center text-gray-500 text-sm">
                                No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
                </div>

                {/* Card View - Mobile */}
                <div className="md:hidden space-y-3">
                {filteredData.length > 0 ? (
                    filteredData.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-lg shadow-sm p-4 border">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                        <input
                            type="checkbox"
                            checked={selectedItems.some((i) => i.itemNo === item.itemNo)}
                            onChange={() => handleCheckboxChange(item)}
                        />
                        <span className="text-sm font-medium">{item.itemNo}</span>
                        </div>
                        <div className="space-y-2">
                        {dataKeys.map((key, keyIdx) => (
                            <div key={keyIdx} className="flex justify-between">
                            <span className="text-xs font-medium text-gray-600">{tableHeaders[keyIdx]}:</span>
                            <span className="text-xs">{item[key] || '-'}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500 text-sm">
                    No data found
                    </div>
                )}
                </div>
            </div>

            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                {/* Modal Container */}
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                        Confirm Repair Status
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowReportModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6">
                    {/* Alert Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                        Please confirm that the repair work has been completed for the selected item.
                        </p>
                    </div>

                    {/* Selected Item Display */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                        Selected Item
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-lg font-semibold text-gray-900">
                            {selectedItem.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedItem.itemNo}
                        </p>
                        </div>
                    </div>

                    {/* Repair Status Question */}
                    <div className="space-y-3">
                        <p className="text-base font-medium text-gray-900">
                        Has the repair been completed?
                        </p>
                        <div className="bg-blue-50 rounded-lg p-4">
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>All repairs have been finished</span>
                            </li>
                            <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Item has been tested and verified</span>
                            </li>
                            <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>Ready for customer pickup</span>
                            </li>
                        </ul>
                        </div>
                    </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={() => setShowReportModal(false)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Confirm Repair
                    </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};

export default ReportIssue;
