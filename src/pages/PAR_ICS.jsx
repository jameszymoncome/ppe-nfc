import React, { useState, useEffect } from 'react';
import { Search, X, Trash, Radio, Calendar, Download, Eye, FileText, ChevronDown, Home, FileCheck, ClipboardList, BarChart, Users, Settings } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../utils/connection';

const PAR_ICS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const navigate = useNavigate();
  const [parIcsItem, setParIcsItem] = useState([]);
  const [viewModal, setViewModal] = useState(false);

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

    fetchItems();
  }, []);

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
    // Navigate to the Property Assignment page or handle PAR issuance logic
    navigate('/property-assignment');
  };

  const viewData = async (docNo, types) => {
    try {
      const response = await axios.get(`${BASE_URL}/getItems.php`, {
        docNo,
        types
      });
      console.log(response.data);
      setViewModal(true);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const sampleItems = [
    {
      quantity: 1,
      unit: 'pc',
      description: 'Laptop, Intel i5, 8GB RAM, 512GB SSD',
      propertyNo: '2025-0001-01',
      dateAcquired: '07-01-2025',
      amount: 55000.00
    },
    {
      quantity: 2,
      unit: 'pcs',
      description: 'Office Chair, Mesh Back, Adjustable Height',
      propertyNo: '2025-0001-02',
      dateAcquired: '07-01-2025',
      amount: 3200.00
    },
    {
      quantity: 1,
      unit: 'unit',
      description: 'Printer, All-in-One, Wireless',
      propertyNo: '2025-0001-03',
      dateAcquired: '07-01-2025',
      amount: 8700.00
    }
  ];

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
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          onClick={async () => {
                            await viewData(doc.documentNo, doc.type);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors">
                          <FileText className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
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
                      value={assignedTo}
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
                      value={office}
                      onChange={(e) => setOffice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter office/department..."
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
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
                      {sampleItems.map((item, index) => (
                        <tr key={index}>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.quantity}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.unit}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.description}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.propertyNo}</td>
                          <td className="py-4 px-6 text-sm text-gray-900">{item.dateAcquired}</td>
                          <td className="py-4 px-6 text-sm text-gray-900 flex">
                            <Radio />
                            <Trash />
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  className="px-6 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>

      )}

    </div>
  );
};

export default PAR_ICS;