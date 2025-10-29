import React, { useState, useEffect } from 'react';
import { Search, FileText, X, Printer } from 'lucide-react';
import IC_Sidebar from '../../components/IC_Sidebar';
import { BASE_URL } from '../../utils/connection';
import axios from 'axios';
import Swal from "sweetalert2";

const IC_WasteDisposal = () => {
    const [activeTab, setActiveTab] = useState('For Disposal');
    const [searchTerm, setSearchTerm] = useState('');
    const [fundFilter, setFundFilter] = useState('All Funds');
    const [dateFilter, setDateFilter] = useState('');
    const [scrapData, setScrapData] = useState([]);
    const [disposeData, setDisposeData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [wasteModal, setWasteModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");
    const [groupedItems, setGroupedItems] = useState([]);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

    const [inspection, setInspection] = useState({
        destroyed: false,
        soldPrivate: false,
        soldPublic: false,
        transferred: false,
    });


    // const disposedData = [
    //     {
    //         itemNo: '2022-12-001',
    //         description: 'Monitor Samsung',
    //         acquisitionDate: '2020-03-20',
    //         cost: '6,000',
    //         fund: 'General Fund',
    //         dateScrapped: '2024-09-10',
    //     },
    //     {
    //         itemNo: '2022-11-005',
    //         description: 'Keyboard Logitech',
    //         acquisitionDate: '2020-01-10',
    //         cost: '1,500',
    //         fund: 'General Fund',
    //         dateScrapped: '2024-08-05',
    //     },
    // ];

    const reportData = {
        lot: "LOT-2024-001",
        fund: "General Fund",
        placeOfStorage: "Warehouse B, Section 3",
        date: "October 02, 2025",
        items: [
        { item: 1, quantity: 5, unit: "pcs", description: "Broken office chairs", no: "OR-001", date: "Sept 15, 2025", amount: "2,500.00" },
        { item: 2, quantity: 10, unit: "units", description: "Obsolete computer monitors", no: "OR-002", date: "Sept 20, 2025", amount: "15,000.00" },
        { item: 3, quantity: 3, unit: "boxes", description: "Expired office supplies", no: "OR-003", date: "Sept 25, 2025", amount: "1,200.00" },
        { item: 4, quantity: 2, unit: "sets", description: "Damaged filing cabinets", no: "OR-004", date: "Sept 28, 2025", amount: "3,500.00" },
        ],
        total: "22,200.00",
        disposal: {
        certified: "John A. Smith",
        approved: "Maria C. Rodriguez",
        signatureSupply: "Robert Johnson",
        signatureHead: "Patricia Anderson"
        },
        inspection: {
        destroyed: ["Broken office chairs", "Expired office supplies"],
        soldPrivate: ["Damaged filing cabinets"],
        soldPublic: ["Obsolete computer monitors"],
        transferred: "",
        transferredTo: "N/A",
        witness: "Disposal: Michael Brown",
        certifiedCorrect: "David Lee",
        inspectionOfficer: "Sarah Martinez",
        witnessName: "James Wilson"
        }
    };

    useEffect(() => {
        const getScrappedItems = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/getScrapItem.php`, {
                    params: {
                        role: localStorage.getItem("accessLevel"),
                        usersID: localStorage.getItem("userId"),
                        departments: localStorage.getItem("department")
                    }
                });
                console.log('Scrapped Items:', response.data);
                setScrapData(response.data);
            } catch (error) {
                console.error('Error fetching scrapped items:', error);
            }
        }
        getScrappedItems();
    }, []);

    useEffect(() => {
        const getDisposed = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/getDisposed.php`, {
                    params: {
                        role: localStorage.getItem("accessLevel"),
                        usersID: localStorage.getItem("userId"),
                        departments: localStorage.getItem("department")
                    }
                });
                console.log('Disposed Items:', response.data);
                setDisposeData(response.data);
            } catch (error) {
                console.error('Error fetching scrapped items:', error);
            }
        }
        getDisposed();
    }, []);

    let tableData = scrapData;
    let tableHeaders = ['Item No.', 'Description', 'Acquisition Date', 'Cost', 'Fund', 'Date Scrapped', 'Custodian'];
    let dataKeys = ['itemNo', 'description', 'acquisitionDate', 'cost', 'fund', 'dateScrapped','custodian'];

    if (activeTab === 'Disposed') {
        tableData = disposeData;
    }

    const filteredData = tableData.filter((item) => {
        const searchValue = searchTerm.toLowerCase();
        return Object.values(item).some(val =>
            val.toString().toLowerCase().includes(searchValue)
        );
    });

    // Get subtitle based on active tab
    const getSubtitle = () => {
        if (activeTab === 'For Disposal') return 'List of Properties Marked for Disposal';
        if (activeTab === 'Disposed') return 'List of Disposed Assets';
        return '';
    };

    const handleCheckboxChange = (item) => {
        setSelectedItems((prev) => {
            const exists = prev.find((i) => i.tagID === item.tagID);

            if (exists) {
                return prev.filter((i) => i.tagID !== item.tagID);
            } else {
                return [...prev, { ...item, quantity: 1 }];
            }
        });
    };

    const handleButtonClick = () => {
        if (selectedItems.length === 0) {
            Swal.fire({
                title: "Please select one Iitem",
                icon: "warning",
                confirmButtonText: "OK",
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
                },
                buttonsStyling: false,
            })
            return;
        }
        const grouped = Object.values(
            selectedItems.reduce((acc, item) => {
                if (!acc[item.enduser_id]) acc[item.enduser_id] = [];
                acc[item.enduser_id].push(item);
                return acc;
            }, {})
        );
        console.log("Selected ItemNos:", grouped);
        setGroupedItems(grouped);
        setCurrentGroupIndex(0);
        setWasteModal(true);
    };

    // const handleCheckboxChanges = (field) => {
    //     setInspection((prev) => ({
    //     ...prev,
    //     [field]: !prev[field], // toggle value
    //     }));
    // };

    const handleCheckboxChanges = (option) => {
        setSelectedOption((prev) => (prev === option ? "" : option)); 
        // if clicked again, uncheck (toggle off)
    };

    const disposeItem = async () => {
        const allItems = groupedItems.flat().map(item => ({
            tagID: item.tagID,
            type: item.type
        }));

        console.log("Disposing Items:", allItems);

        try {
            const response = await axios.post(`${BASE_URL}/disposeItems.php`, {
                allItems: allItems
            });
            console.log('Scrapped Items:', response.data);
            Swal.fire({
                title: "All groups processed!",
                icon: "success",
                confirmButtonText: "OK",
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
                },
                buttonsStyling: false,
            }).then(() => {
                window.location.reload();
            });
            setWasteModal(false);
        } catch (error) {
            console.error('Error dispossing scrapped items:', error);
        }
    }

    const handleSaveAndNext = () => {
        // Perform your save logic here (e.g., send groupedItems[currentGroupIndex] to backend)
        console.log("Saving group:", groupedItems[currentGroupIndex]);

        if (currentGroupIndex < groupedItems.length - 1) {
            setCurrentGroupIndex((prev) => prev + 1);
        } else {
            disposeItem();
            // Swal.fire({
            //     title: "All groups processed!",
            //     icon: "success",
            //     confirmButtonText: "OK",
            //     customClass: {
            //         popup: "rounded-2xl",
            //         confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
            //     },
            //     buttonsStyling: false,
            // });
            // setWasteModal(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <IC_Sidebar />
            <div className="flex-1 bg-gray-50 p-4 md:p-6 lg:p-8 overflow-y-auto">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-blue-900">Waste Management</h1>
                            <p className="text-sm text-gray-600 mt-1">{getSubtitle()}</p>
                        </div>
                        {activeTab === 'For Disposal' && (
                            <button
                                className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 justify-center whitespace-nowrap"
                                onClick={handleButtonClick}
                            >
                                <FileText size={18} />
                                <span>Generate Waste Report</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {['For Disposal', 'Disposed'].map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 md:px-5 py-2 rounded-full font-medium text-xs md:text-sm transition-colors ${
                                activeTab === tab
                                    ? 'bg-blue-900 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg min-w-[120px] text-sm bg-white"
                        value={fundFilter}
                        onChange={(e) => setFundFilter(e.target.value)}
                    >
                        <option>All Funds</option>
                        <option>General Fund</option>
                        <option>Special Fund</option>
                    </select>
                    <input
                        type="date"
                        placeholder="Date"
                        className="px-4 py-2 border border-gray-300 rounded-lg min-w-[140px] text-sm bg-white"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>

                {/* Table - Desktop View */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 w-12"></th>
                                    {tableHeaders.map((header, idx) => (
                                        <th key={idx} className="py-3 px-4 text-left text-xs font-medium text-gray-600 whitespace-nowrap">
                                            {header}
                                        </th>
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
                                                    checked={selectedItems.some((i) => i.tagID === item.tagID)}
                                                    onChange={() => handleCheckboxChange(item)}
                                                    className="cursor-pointer"
                                                />
                                            </td>
                                            {dataKeys.map((key, keyIdx) => (
                                                <td key={keyIdx} className="py-3 px-4 text-sm text-gray-800">
                                                    {item[key] || '-'}
                                                </td>
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
                            <div key={idx} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                                    <input type="checkbox" className="cursor-pointer" />
                                    <span className="text-sm font-medium text-gray-900">{item[dataKeys[0]]}</span>
                                </div>
                                <div className="space-y-2">
                                    {dataKeys.map((key, keyIdx) => (
                                        <div key={keyIdx} className="flex justify-between items-start">
                                            <span className="text-xs font-medium text-gray-600">{tableHeaders[keyIdx]}:</span>
                                            <span className="text-xs text-gray-900 text-right ml-2">{item[key] || '-'}</span>
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

            {wasteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible">

                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden z-10">
                            <h2 className="text-xl font-bold text-gray-800">Waste Materials Report</h2>
                            <div className="flex gap-2">
                                <button
                                    // onClick={disposedItem}
                                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Print"
                                >
                                    <Printer size={20} />
                                </button>
                                <button
                                    onClick={() => setWasteModal(false)}
                                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className="p-6 md:p-8">
                            {/* Title */}
                            <h1 className="text-center text-lg md:text-xl font-bold mb-6 border-b-2 border-black pb-2">
                                WASTE MATERIALS REPORT
                            </h1>

                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                                <div className="flex gap-2">
                                <span className="font-semibold">LGU:</span>
                                <span className="border-b border-black flex-1">LGU Daet</span>
                                </div>
                                <div className="flex gap-2">
                                <span className="font-semibold">Fund:</span>
                                <span className="border-b border-black flex-1">{reportData.fund}</span>
                                </div>
                                <div className="flex gap-2">
                                <span className="font-semibold">Place of Storage:</span>
                                <span className="border-b border-black flex-1">Lgu Storage</span>
                                </div>
                                <div className="flex gap-2">
                                <span className="font-semibold">Date:</span>
                                <span className="border-b border-black flex-1">{reportData.date}</span>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-6">
                                <h3 className="font-bold mb-2 text-sm">ITEMS FOR DISPOSAL</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-black text-xs md:text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-black p-2">Item</th>
                                                <th className="border border-black p-2">Quantity</th>
                                                <th className="border border-black p-2">Unit</th>
                                                <th className="border border-black p-2">Description</th>
                                                <th className="border border-black p-2 text-center" colSpan="3">
                                                    Record of Sale<br />Official Receipt
                                                </th>
                                            </tr>
                                            <tr className="bg-gray-50">
                                                <th className="border border-black p-1"></th>
                                                <th className="border border-black p-1"></th>
                                                <th className="border border-black p-1"></th>
                                                <th className="border border-black p-1"></th>
                                                <th className="border border-black p-1">No.</th>
                                                <th className="border border-black p-1">Date</th>
                                                <th className="border border-black p-1">Amount</th>
                                            </tr>
                                        </thead>
                                    <tbody>
                                    {groupedItems[currentGroupIndex].map((item, idx) => (
                                        <tr key={item.tagID}>
                                            <td className="border border-black p-2 text-center">{idx + 1}</td>
                                            <td className="border border-black p-2 text-center">{item.quantity}</td>
                                            <td className="border border-black p-2 text-center">{item.unit}</td>
                                            <td className="border border-black p-2">{`${item.description} ${item.model} ${item.serialNo}`}</td>
                                            <td className="border border-black p-2 text-center">---</td>
                                            <td className="border border-black p-2 text-center">---</td>
                                            <td className="border border-black p-2 text-right">---</td>
                                        </tr>
                                    ))}
                                    {/* Empty rows for spacing */}
                                    {[...Array(Math.max(0, 10 - reportData.items.length))].map((_, i) => (
                                        <tr key={`empty-${i}`}>
                                        <td className="border border-black p-2">&nbsp;</td>
                                        <td className="border border-black p-2">&nbsp;</td>
                                        <td className="border border-black p-2">&nbsp;</td>
                                        <td className="border border-black p-2">&nbsp;</td>
                                        <td className="border border-black p-2">&nbsp;</td>
                                        <td className="border border-black p-2">&nbsp;</td>
                                        <td className="border border-black p-2">&nbsp;</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold">
                                        <td className="border border-black p-2" colSpan="4"></td>
                                        <td className="border border-black p-2 text-center" colSpan="2">TOTAL:</td>
                                        <td className="border border-black p-2 text-right">{reportData.total}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 text-xs" colSpan="4">
                                        Certified Correct:
                                        <div className="mt-8 text-center border-t border-black inline-block min-w-[200px] ml-4">
                                            {reportData.disposal.certified}
                                        </div>
                                        </td>
                                        <td className="border border-black p-2 text-xs" colSpan="3">
                                        Disposal Approved:
                                        <div className="mt-8 text-center border-t border-black inline-block min-w-[200px] ml-4">
                                            {reportData.disposal.approved}
                                        </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 text-xs text-center" colSpan="4">
                                        Signature over Printed Name of Supply<br />and/or Property Custodian
                                        </td>
                                        <td className="border border-black p-2 text-xs text-center" colSpan="3">
                                        Signature over Printed Name of Head of the<br />Agency/ Entity or his/her Authorized Representative
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                                </div>
                            </div>

                            {/* Certificate of Inspection */}
                            <div className="border border-black">
                                <h3 className="text-center font-bold bg-gray-100 p-2 text-sm border-b border-black">
                                    CERTIFICATE OF INSPECTION
                                </h3>
                                <div className="p-4">
                                    <p className="text-xs md:text-sm mb-4">
                                    I hereby certify that the property enumerated above was disposed of as follows:
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm mb-4">
                                        <div className="space-y-2">
                                            {/* Destroyed */}
                                            <div className="flex items-center gap-2">
                                                <span>Item</span>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOption === "destroyed"}
                                                    onChange={() => handleCheckboxChanges("destroyed")}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span>Destroyed</span>
                                            </div>

                                            {/* Sold Private */}
                                            <div className="flex items-center gap-2">
                                                <span>Item</span>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOption === "soldPrivate"}
                                                    onChange={() => handleCheckboxChanges("soldPrivate")}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span>Sold at private sale</span>
                                            </div>
                                
                                            {/* Sold Public */}
                                            <div className="flex items-center gap-2">
                                                <span>Item</span>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOption === "soldPublic"}
                                                    onChange={() => handleCheckboxChanges("soldPublic")}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span>Sold at public auction</span>
                                            </div>
                                        </div>

                                    {/* Transferred */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                        <span>Item</span>
                                        <input
                                            type="checkbox"
                                            checked={selectedOption === "transferred"}
                                            onChange={() => handleCheckboxChanges("transferred")}
                                            className="w-4 h-4 cursor-pointer"
                                        />
                                        <span>
                                            Transferred without cost to __(Name of the Agency/ Entity)__
                                        </span>
                                        </div>
                                    </div>
                                    </div>

                                    {/* Footer Signatures */}
                                    <div className="border-t border-black pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="mb-2 text-xs">Certified Correct:</div>
                                        <div className="mt-12 border-t border-black inline-block min-w-[200px]">
                                        {reportData.inspection.certifiedCorrect}
                                        </div>
                                        <div className="text-xs mt-1">
                                        Signature over Printed Name of Inspection<br />Officer
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="mb-2 text-xs">Witness to Disposal:</div>
                                        <div className="mt-12 border-t border-black inline-block min-w-[200px]">
                                        {reportData.inspection.witnessName}
                                        </div>
                                        <div className="text-xs mt-1">
                                        Signature over Printed Name of<br />Witness
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 print:hidden">
                            <button
                                onClick={() => setWasteModal(false)}
                                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAndNext}
                                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                            >
                                {currentGroupIndex < groupedItems.length - 1 ? 'Next' : 'Save'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default IC_WasteDisposal;
