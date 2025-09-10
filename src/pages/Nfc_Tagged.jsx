import React, { useState, useEffect, useRef } from 'react';
import { Search, QrCode, FileText, X, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { BASE_URL } from '../utils/connection';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Nfc_Tagged = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [yearFilter, setYearFilter] = useState('Year');
  const [showScanningModal, setShowScanningModal] = useState(false);
  const [showScannedModal, setShowScannedModal] = useState(false);
  const [scanningTag, setScanningTag] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nfcTagID, setNfcTagID] = useState('');
  const [mode, setMode] = useState('');
  const [totalTagItems, setTotalTagItems] = useState('');
  const [lastInspectedDate, setLastInspectedDate] = useState('');
  const [totalItemsLastYear, setTotalItemsLastYear] = useState('');
  const [totalInspectedItems, setTotalInspectedItems] = useState('');
  const [nfcChecked, setNFCChecked] = useState(true);
  const [tagAssetsModal, setTagAssetsModal] = useState(false);
  const [taggedItems, setTaggedItems] = useState([]);
  const [taggedAssetsitems, setTaggedAssetsitems] = useState([]);
  const [taggedAssetsList, setTaggedAssetsList] = useState([]);
  const [departmentModal, setDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState('');
  const [wsStatus, setWsStatus] = useState("❌ Disconnected");

  const hasInitialized = useRef(false);

  const [formData, setFormData] = useState([]);

  const conditions = [
    { label: 'Very Good', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Good Condition', color: 'bg-green-500 hover:bg-green-600' },
    { label: 'Fair Condition', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: 'Poor Condition', color: 'bg-orange-500 hover:bg-orange-600' },
    { label: 'Scrap Condition', color: 'bg-red-500 hover:bg-red-600' }
  ];

  // useEffect(() => {
  //   if (scanningTag) {
  //     const nfcRef = ref(db, "inspection");
  //     const unsubscribe = onValue(nfcRef, (snapshot) => {
  //       const data = snapshot.val();

  //       if (!hasInitialized.current) {
  //         hasInitialized.current = true;
  //         return;
  //       }
  //       if (data) {
  //         checkScannedID(data);
  //       }
  //     });

  //     return () => {
  //       unsubscribe();
  //       hasInitialized.current = false;
  //     };
  //   }
  // }, [scanningTag]);

  useEffect(() => {
    fetchInspect();
  }, []);

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      console.log("Received:", event.data);
      checkScannedID(event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => ws.close();
  }, []);

  const websock = () => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      console.log("Received:", event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => ws.close();
  }


  const getData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getTagData.php`);
      setTotalTagItems(response.data.tagItems.totalTag); // Save to state
      setTotalItemsLastYear(response.data.tagItems.sinceLastYear); // Save to state
      setTotalInspectedItems(response.data.tagItems.inspectionCount); // Save to state
      console.log(response.data.tagItems.formatted_date);
      setLastInspectedDate(response.data.tagItems.formatted_date); // Save to state
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const fetchInspect = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getInspects.php`);
      if (response.data.items && response.data.items.length > 0) {
        setTaggedItems(response.data.items.map((item, index) => ({
          id: index + 1,
          ...item
        })));
      }
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const checkScannedID = async (tag) => {
    try {
      const response = await axios.get(`${BASE_URL}/getItemTag.php`, {
        params: {
          tag
        }
      });
      console.log(response.data);
      if (response.data.success && response.data.data.length > 0) {
        setNfcTagID(tag);
        const item = response.data.data[0];
        setFormData({
          propertyNo: item.docNo || "",
          description: item.description || "",
          model: item.model || "",
          serialNo: item.serialNo || "",
          department: item.department || "",
          lastInspected: item.dateInspected || "",
          inspectionDate: "", // optional
        });

        setShowScannedModal(true);
        setMode('scan');
        setNFCChecked(true);
      } else {
        // Optional: handle the "no data found" case
        setNFCChecked(false);
        console.log(response.data.message);
      }

    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const filteredItems = taggedItems.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.docNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSave = async () => {
    console.log(nfcTagID);
    try {
      const response = await axios.post(`${BASE_URL}/inspect.php`, {
        nfcTagID,
        selectedCondition,
        remarks,
        mode
      });
      console.log(response.data);
      fetchInspect();
      setNfcTagID('');
      setSelectedCondition('');
      setRemarks('');
      setShowScannedModal(false);
      setNFCChecked(true);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  };

  const viewDetailss = (tag, docNo, descrip, model, serialNo, department, dateInspected, conditionLabel, remarks) => {
    setFormData({
      propertyNo: docNo,
      description: descrip,
      model: model,
      serialNo: serialNo,
      department: department,
      dateInspected: dateInspected
    });
    setNfcTagID(tag);
    setSelectedCondition(conditionLabel);
    setRemarks(remarks);
    setMode('view');
    setShowScannedModal(true);
  }

  const goto = (propNo) => {
    navigate('/inspection/nfc-tagged/scanned-history', {
      state: { tagID: propNo }
    });
  }

  const gotoTaggedAssets = async () => {
    setTagAssetsModal(true);
    try {
      const response = await axios.get(`${BASE_URL}/taggedAssets.php`);
      setTaggedAssetsitems(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const openDepartmentModal = async (departmentName) => {
    setSelectedDepartment(departmentName);
    try {
      const response = await axios.get(`${BASE_URL}/taggedAssetList.php`, {
        params: {departmentName}
      });
      console.log(response.data.data);
      setTaggedAssetsList(response.data.data);
      setDepartmentModal(true);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
    
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar placeholder - replace with actual Sidebar component */}
      <Sidebar />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">NFC - Tagged Items</h1>
            <p className="text-gray-600">Scan & Inspect items with assigned NFC tags</p>
          </div>
          <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            onClick={() => {
              setShowScanningModal(true)
              setScanningTag(true)
              setNfcTagID('');
              setSelectedCondition('');
              setRemarks('');
              
            }}
          >
            <QrCode size={20} />
            Scan NFC Tag to Inspect
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Tagged Items */}
          <div 
            className="bg-white rounded-lg shadow-sm p-6"
            onClick={() => {
              gotoTaggedAssets();
            }}
          >
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tagged Items</h3>
            <div className="text-3xl font-bold text-gray-800 mb-1">{totalTagItems || 0}</div>
            <p className="text-sm text-green-600">+ {totalItemsLastYear || 0} items added since Last Year</p>
          </div>

          {/* Annual Inspection Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Annual Inspection Progress (2025)</h3>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-gray-800">{totalTagItems > 0 ? ((totalInspectedItems / totalTagItems) * 100).toFixed(2) : "0.00%"}%</div>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray= {`${(totalInspectedItems / totalTagItems) * 100}, ${((totalTagItems - totalInspectedItems) / totalTagItems) * 100}`}
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ef4444" // red
                    strokeWidth="3"
                    strokeDasharray={`0, ${(totalInspectedItems / totalTagItems) * 100}, ${((totalTagItems - totalInspectedItems) / totalTagItems) * 100}, 0`}
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{totalInspectedItems || 0} of {totalTagItems || 0} tagged items inspected</p>
          </div>

          {/* Last Inspection Date */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Last Inspection Date</h3>
            <div className="text-3xl font-bold text-gray-800 mb-1">{lastInspectedDate}</div>
            <p className="text-sm text-gray-600">Most recent inspection recorded this year</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>All</option>
              <option>Very Good</option>
              <option>Good Condition</option>
              <option>Fair Condition</option>
              <option>Poor Condition</option>
              <option>Scrap Condition</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option>Year</option>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Property/Inventory No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Model</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Serial No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date Inspected</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-800">{item.docNo}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.description}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.model}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.serialNo}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.department}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{item.dateInspected}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.conditions === "Very Good"
                            ? "bg-blue-100 text-blue-800"
                            : item.conditions === "Good Condition"
                            ? "bg-green-100 text-green-800"
                            : item.conditions === "Fair Condition"
                            ? "bg-yellow-100 text-yellow-800"
                            : item.conditions === "Poor Condition"
                            ? "bg-orange-100 text-orange-800"
                            : item.conditions === "Scrap Condition"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.conditions}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => {
                          viewDetailss(item.tagID, item.docNo, item.description, item.model, item. serialNo, item.department, item.dateInspected, item.conditions, item.remarks);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No history found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {showScanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[450px] overflow-hidden flex flex-col items-center">
            <div className="pt-4">
              <h2 className=" text-lg font-semibold"
                style={{ color: "#0F1D9F" }}
              >
                Scan Property Tag for Inspection
              </h2>
            </div>
            <div className="py-11">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                {nfcChecked === false ? (
                  <p className="text-sm font-semibold italic text-red-600">
                    There are no item that is detected<br />
                    <span className="block text-sm italic text-gray-600 text-center">Scan Again.</span>
                  </p>
                ) : (
                  <p className="text-sm font-semibold italic text-gray-600">
                    Please Scan the assigned tag using the NFC reader
                  </p>
                )}
                
              </div>
              
            </div>
            <div className="pb-4 pt-4">
              <button
                onClick={() => {
                  setShowScanningModal(false)
                  setScanningTag(false)
                  
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-9 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showScannedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[550px] px-6 overflow-hidden flex flex-col">
            <div className="text-blue-800 py-3 rounded-t-lg flex items-center justify-between">
              <h2 className="text-lg font-semibold flex-1 text-left">Inspect Item</h2>
              <button
                onClick={() => goto(formData.propertyNo)}
                className="bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors ml-4"
                style={{ minWidth: '100px' }}
              >
                History
              </button>
            </div>

            <div className="pb-3 border-b-2 border-b-black space-y-4">
              <div className="space-y-2">
                <div className="flex">
                  <span className="text-sm font-medium text-blue-600 w-32 text-right pr-2 whitespace-nowrap">Property No.</span>
                  <span className="text-gray-800 text-sm">{formData.propertyNo}</span>
                </div>

                <div className="flex">
                  <span className="text-sm font-medium text-blue-600 w-32 text-right pr-2 whitespace-nowrap">Description</span>
                  <span className="text-gray-800 text-sm">{formData.description}</span>
                </div>

                <div className="flex">
                  <span className="text-sm font-medium text-blue-600 w-32 text-right pr-2 whitespace-nowrap">Model:</span>
                  <span className="text-gray-800 text-sm">{formData.model}</span>
                </div>

                <div className="flex">
                  <span className="text-sm font-medium text-blue-600 w-32 text-right pr-2 whitespace-nowrap">Serial No.:</span>
                  <span className="text-gray-800 text-sm">{formData.serialNo}</span>
                </div>

                <div className="flex">
                  <span className="text-sm font-medium text-blue-600 w-32 text-right pr-2 whitespace-nowrap">Department:</span>
                  <span className="text-gray-800 text-sm">{formData.department}</span>
                </div>

                <div className="flex">
                  <span className="text-sm font-medium text-blue-600 w-32 text-right pr-2 whitespace-nowrap">Last Inspected:</span>
                  <span className="text-gray-800 text-sm italic">{formData.lastInspected || '--No History--'}</span>
                </div>

                <div className="flex">
                  <span className="text-sm font-medium text-blue-600 w-32 text-right pr-2 whitespace-nowrap">Inspection Date:</span>
                  <span className="text-gray-800 text-sm">{formData.inspectionDate}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm mt-2 font-medium text-gray-700 mb-3">Condition</label>
              <div className="space-y-2">
                {conditions.map((condition) => {
                  const isSelected = selectedCondition === condition.label;
                  const isBeforeAnyClick = selectedCondition === '';

                  return (
                    <button
                      key={condition.label}
                      onClick={() => {
                        setSelectedCondition(condition.label);
                        console.log(condition.label);
                      }}
                      className={`w-full py-1.5 px-4 rounded-md text-sm text-white font-medium transition-colors
                        ${
                          isBeforeAnyClick || isSelected
                            ? condition.color.replace('hover:', '')
                            : 'bg-gray-400 hover:bg-gray-500'
                        }
                        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
                    >
                      {condition.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-600 mb-1">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowScannedModal(false)
                  setNfcTagID('');
                  setSelectedCondition('');
                  setRemarks('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {tagAssetsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[950px] px-6 overflow-hidden flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-blue-800">Tagged Assets Overview by Office/Department</h1>
                <p className="text-gray-600">A summary of all assets tagged with NFC, grouped by office or department.</p>
              </div>
              <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                onClick={() => {
                  setTagAssetsModal(false)
                }}
              >
                <X size={20} />
              </button>
            </div>
            {/* Table aligned with header */}
            <div className="w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-4 px-6 text-sm text-gray-700">Office/Department</th>
                    <th className="text-left py-4 px-6 text-sm text-gray-700">Tagged Items</th>
                    <th className="text-left py-4 px-6 text-sm text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {taggedAssetsitems.map((item) => (
                    <tr className="border-b border-gray-300" key={item.department}>
                      <td className="py-4 px-6 text-sm text-gray-900">{item.department}</td>
                      <td className="y-4 px-6 text-sm text-gray-900">{item.total_count}</td>
                      <td className="y-4 px-6 text-sm text-gray-900 text-center">
                        <button className="flex items-center justify-center mx-auto gap-2 group"
                          onClick={() => openDepartmentModal(item.department)}
                        >
                          <Eye className="h-5 w-5 text-blue-600 group-hover:text-blue-800" />
                          <span className="text-xs text-blue-600 group-hover:text-blue-800 font-medium">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {departmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] px-8 py-8 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-2xl font-bold text-blue-800">
                  [{selectedDepartment}] – Tagged Assets List
                </h1>
                <p className="text-gray-600">
                  Assets currently assigned and tagged under this department.
                </p>
              </div>
              <button
                className="text-black text-3xl font-bold"
                onClick={() => setDepartmentModal(false)}
              >
                <X size={32} />
              </button>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center mb-4 mt-4">
              <div className="flex-1 relative min-w-[220px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg min-w-[160px]">
                <option>All Condition</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg min-w-[120px]">
                <option>Year</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg min-w-[120px]">
                <option>All Status</option>
              </select>
            </div>
            {/* Table */}
            <div className="w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Property/Inventory No.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Model</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Serial No.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Condition</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Inspection Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {taggedAssetsList.map((item) => (
                    <tr className="border-b border-gray-300">
                      <td className="py-3 px-4 text-gray-800">{item.propertyID}</td>
                      <td className="py-3 px-4 text-gray-800">{item.description}</td>
                      <td className="py-3 px-4 text-gray-800">{item.model}</td>
                      <td className="py-3 px-4 text-gray-800">{item.serialNo}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {item.conditions
                          ? item.conditions
                          : <span className="text-gray-400 italic">N/A</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {item.dateInspected
                          ? item.dateInspected
                          : <span className="text-gray-400 italic">N/A</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {/* Example avatar for status */}
                        <img src="https://randomuser.me/api/portraits/men/33.jpg" alt="Status" className="w-8 h-8 rounded-full border-2 border-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nfc_Tagged;