import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Trash, Radio, Calendar, Download, Eye, FileText, ChevronDown, Home, FileCheck, ClipboardList, BarChart, Users, Settings, Upload } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../utils/connection';
import { ref, onValue, set } from "firebase/database";
import { db } from '../utils/firebase';

const PAR_ICS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const navigate = useNavigate();
  const [parIcsItem, setParIcsItem] = useState([]);
  const [viewModal, setViewModal] = useState(false);
  const [viewNFCModal, setViewNFCModal] = useState(false);
  const [users, setUsers] = useState('');
  const [departments, setDepartments] = useState('');
  const [getDocDatas, setGetDocDatas] = useState([]);

  const [propertyNo, setPropertyNo] = useState('XXXX-XX-XXX-XXXX-XX');
  const [description, setDescription] = useState('Description');
  const [nfcId, setNfcId] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [tableType, setTableType] = useState('');
  const [errorMessage, setErrorMessage] = useState("");


  const [assignedTo, setAssignedTo] = useState('');
  const [office, setOffice] = useState('');
  const [items, setItems] = useState([
    { id: 1, propertyNo: '', description: '', model: '', serialNo: '', icsNo: '', action: '' }
  ]);

  const addItem = () => {
    setItems([...items, { 
      id: items.length + 1, 
      propertyNo: '', 
      description: '', 
      model: '', 
      serialNo: '', 
      icsNo: '', 
      action: '' 
    }]);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getItems.php`);
      console.log(response.data);

      const formatted = response.data.items.map((item, index) => ({
        id: index + 1,
        documentNo: item.documentNo,
        type: item.type,
        user: item.user,
        office: item.office,
        dateIssued: item.dateIssued,
        items: item.items,
        status: item.status || 'N/A'
      }));

      setParIcsItem(formatted);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (viewNFCModal) {
      const nfcRef = ref(db, "nfcTagging");

      const unsubscribe = onValue(nfcRef, (snapshot) => {
        const data = snapshot.val();

        if (!hasInitialized.current) {
          hasInitialized.current = true; // Ignore initial load
          return;
        }

        if (data) {
          setNfcId(data);
          setIsScanning(false);
          console.log("🔄 NFC data changed:", data);
        }
      });

      return () => {
        unsubscribe();
        hasInitialized.current = false; // reset when unmounting
      };
    }
  }, [viewNFCModal]);

  const filterOptions = ['All', 'PAR', 'ICS'];
  const statusOptions = ['All', 'For Signature', 'Complete', 'Pending'];

  const filteredDocuments = parIcsItem.filter(doc => {
    const matchesSearch = doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.office.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || doc.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return 'bg-green-100 text-green-800';
      case 'For Tagging':
        return 'bg-yellow-100 text-yellow-800';
      case 'Upload Scanned Copy':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PAR':
        return 'bg-blue-100 text-blue-800';
      case 'ICS':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleIssuePAR = () => {
    navigate('/property-assignment');
  };

  const viewData = async (user, department, docNo, types) => {
    setUsers(user);
    setDepartments(department);
    setTableType(types);
    try {
      const response = await axios.get(`${BASE_URL}/getDocsData.php`, {
        params: {
          docNo,
          types
        }
      });
      console.log(response.data);
      setGetDocDatas(response.data);
      setViewModal(true);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const handleSave = async () => {
    console.log(nfcId);
    try {
      const response = await axios.get(`${BASE_URL}/checkTagID.php`, {
        params: {
          nfcId,
          propertyNo,
          tableType
        }
      });
      console.log(response.data);
      if (response.data.success) {
        setGetDocDatas((prev) =>
          prev.map((item) =>
            item.itemNo === propertyNo ? { ...item, nfcID: nfcId } : item
          )
        );
        fetchItems();
        setErrorMessage("");
        setIsScanning(true);
        setNfcId('');
        setViewNFCModal(false);
      } else {
        setErrorMessage(response.data.message);
        setTimeout(() => {
          setIsScanning(true);
          setErrorMessage("");
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Error checking tag ID:', error);
      setErrorMessage("Something went wrong while saving.");
      setIsScanning(false);
    }
  };

  const handleCancel = () => {
    setViewNFCModal(false);
  };

  const viewNFCs = (itemNo, descrip) => {
    setPropertyNo(itemNo);
    setDescription(descrip);
    setViewNFCModal(true);
  }

  const deleteNFCs = async (itemNo) => {
    try {
      const response = await axios.post(`${BASE_URL}/updateTagID.php`, {
        itemNo,
        tableType
      });
      console.log(response.data);
      if (response.data.success) {
        setGetDocDatas((prev) =>
          prev.map((item) =>
            item.itemNo === itemNo ? { ...item, nfcID: "" } : item
          )
        );
      }
    } catch (error) {
      console.error('❌ Error checking tag ID:', error);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">
                Property Acknowledgement Receipt (PAR) and Inventory Custodian Slip (ICS)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                From Needs to Assets—Simplified PPE Requests.
              </p>
            </div>
            <button onClick={handleIssuePAR} className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <FileText className="h-4 w-4" />
              Issue PAR/ICS
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {filterOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full bg-white">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Document No.</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">User</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Office/Department</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Date Issued</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Items</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc, index) => (
                  <tr key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.documentNo}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.user}</td>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.office}</td>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.dateIssued}</td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-center">{doc.items}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {doc.status === 'For Tagging' ? (
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            onClick={async () => {
                              await viewData(doc.user, doc.office, doc.documentNo, doc.type);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors">
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      ) : doc.status === 'Uploaded Scan' ? (
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            onClick={async () => {
                              await viewData(doc.user, doc.office, doc.documentNo, doc.type);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors">
                            <FileText className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors">
                            <Upload className="h-4 w-4" />
                          </button>
                        </div>
                      ) : doc.status === 'Assigned' ? (
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            onClick={async () => {
                              await viewData(doc.user, doc.office, doc.documentNo, doc.type);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50 transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Inventory Custodian Slip (ICS)</h2>
                <p className="text-blue-100 text-sm">Tagging and Printing</p>
                <p className="text-blue-100 text-xs">Clear, professional, and reflects both viewing and tagging actions.</p>
              </div>
              <button 
                onClick={() => setViewModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                >
                  <Eye size={16} />
                  Print Property Sticker Tag
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                >
                  <FileText size={16} />
                  Print Inventory Custodian Slip (ICS)
                </button>
              </div>

              {/* Accountable Person Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Accountable Person Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To:
                    </label>
                    <input 
                      type="text"
                      value={users}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Office/Department:
                    </label>
                    <input 
                      type="text"
                      value={departments}
                      onChange={(e) => setOffice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter office/department..."
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <div className="min-w-full bg-white">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-6 font-medium text-gray-900">Property No.</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-900">Description</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-900">Model</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-900">Serial No.</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-900">NFC ID.</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getDocDatas.map((item, index) => (
                        <tr key={index}>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.itemNo}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.description}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.model}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.serialNo}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.nfcID}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">
                            {item.nfcID ? (
                              <Trash
                                onClick={() => deleteNFCs(item.itemNo)}
                              />
                            ) : (
                              <Radio
                              onClick={() => viewNFCs(item.itemNo, item.description)}
                            />
                            )}
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  onClick={() => setViewModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                {/* <button
                  className="px-6 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Confirm
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewNFCModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-white text-lg font-semibold">
                Tag Item with NFC and Property Sticker
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Property Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Property No. :
                </label>
                <input
                  type="text"
                  value={propertyNo}
                  onChange={(e) => setPropertyNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="XXXX-XX-XXX-XXXX-XX"
                  readOnly
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description :
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description"
                  readOnly
                />
              </div>

              {/* NFC ID Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  NFC ID :
                </label>
                <div className="relative">
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {isScanning ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 text-sm">Scanning NFC tag...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {nfcId}
                        </div>
                        {errorMessage ? (
                          <p className="text-red-600 text-sm">{errorMessage}</p>
                        ) : (
                          <p className="text-gray-600 text-sm">NFC tag detected</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!nfcId}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PAR_ICS;