import React, { useState, useEffect, useRef, use } from 'react';
import { Search, Download, Printer, FileText, Building2, Users, Package, ChevronRight, ArrowLeft, LayoutGrid, List, Filter, Calendar, RefreshCw, UserCheck, Menu, X } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import { BASE_URL } from "../utils/connection";
import axios from 'axios';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer} from "recharts";


const Reports = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [viewMode, setViewMode] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [allAssets, setAllAssets] = useState([]);
  const [inspectionData, setInspectionData] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [employeesByDepartment, setEmployeesByDepartment] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);


  useEffect(() => {
    const getAllAssets = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/allAssets.php`, {
                params: {
                    role: localStorage.getItem("accessLevel"),
                    usersID: localStorage.getItem("userId"),
                    departments: localStorage.getItem("department")
                }
            });
            console.log('All Items:', response.data);
            if (response.data.success && Array.isArray(response.data.data)) {
              setAllAssets(response.data.data);
            } else {
              setAllAssets([]);
            }
        } catch (error) {
            console.error('Error fetching scrapped items:', error);
        }
    }
    getAllAssets();
  }, []);

  useEffect(() => {
    const fetchInspect = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getInspects.php`);
        if (response.data.items && response.data.items.length > 0) {
          setInspectionData(response.data.items)
        }
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching end users:', error);
      }
    }
    fetchInspect();
  }, []);


  useEffect(() => {
    const fetchDeptAssetsTotal = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/deptTotalAssets.php`);
        setDepartmentSummary(response.data.data)
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching department:', error);
      }
    }
    fetchDeptAssetsTotal();
  }, []);

  const fetchUserList = async (depts) => {
    try {
      const response = await axios.get(`${BASE_URL}/getAllUsers.php`, {
        params: {
          department: depts
        }
      });
      setEmployeesByDepartment(response.data.data)
      console.log('Employee', response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  // const allAssets = [
  //   { id: 'ITEM-001', name: 'Desktop Computer', category: 'IT Equipment', department: 'GSO', employee: 'John Doe', condition: 'Serviceable', value: '₱35,000', location: 'Room 201' },
  //   { id: 'ITEM-002', name: 'Office Printer', category: 'Office Equipment', department: 'MPDO', employee: 'Jane Smith', condition: 'Serviceable', value: '₱25,000', location: 'Room 105' },
  //   { id: 'ITEM-003', name: 'Air Conditioner', category: 'Furniture & Fixtures', department: 'GSO', employee: 'Bob Wilson', condition: 'Serviceable', value: '₱45,000', location: 'Room 201' },
  //   { id: 'ITEM-004', name: 'Filing Cabinet', category: 'Office Equipment', department: 'MPDO', employee: 'Jane Smith', condition: 'Pending', value: '₱15,000', location: 'Room 105' },
  //   { id: 'ITEM-005', name: 'Laptop', category: 'IT Equipment', department: 'GSO', employee: 'John Doe', condition: 'Serviceable', value: '₱55,000', location: 'Room 201' },
  //   { id: 'ITEM-006', name: 'Office Desk', category: 'Furniture & Fixtures', department: 'MPDO', employee: 'Maria Garcia', condition: 'Serviceable', value: '₱12,000', location: 'Room 106' },
  // ];

  const getSelectedItem = async (selectedItems, selectedTypes) => {
    console.log(selectedItems, selectedTypes)
    try {
        const response = await axios.get(`${BASE_URL}/getSelectedItem.php`, {
            params: {
                selectedItem: selectedItems,
                selectedType: selectedTypes
            }
        });
        console.log('Selected Item: ',response.data.data);
        setItemDetails(response.data.data);
    } catch (error) {
        console.error('Error fetching item:', error);
    }
  }

  // const departmentSummary = [
  //   { name: 'GSO', totalAssets: 3, totalValue: '₱135,000', employees: 2 },
  //   { name: 'MPDO', totalAssets: 3, totalValue: '₱52,000', employees: 2 },
  // ];

  // const employeesByDepartment = {
  //   'GSO': [
  //     { id: 'EMP-001', name: 'John Doe', position: 'Admin Officer', assetsCount: 2 },
  //     { id: 'EMP-002', name: 'Bob Wilson', position: 'General Services Staff', assetsCount: 1 },
  //   ],
  //   'MPDO': [
  //     { id: 'EMP-003', name: 'Jane Smith', position: 'Planning Officer', assetsCount: 2 },
  //     { id: 'EMP-004', name: 'Maria Garcia', position: 'Development Officer', assetsCount: 1 },
  //   ]
  // };

  // const inspectionData = [
  //   { id: 'ITEM-001', name: 'Desktop Computer', department: 'GSO', employee: 'John Doe', lastInspection: '2025-09-15', status: 'Pass', inspector: 'John Doe', nextDue: '2026-09-15' },
  //   { id: 'ITEM-002', name: 'Office Printer', department: 'MPDO', employee: 'Jane Smith', lastInspection: '2025-08-20', status: 'Pass', inspector: 'Jane Smith', nextDue: '2026-08-20' },
  //   { id: 'ITEM-003', name: 'Air Conditioner', department: 'GSO', employee: 'Bob Wilson', lastInspection: '2025-07-10', status: 'Pending', inspector: '-', nextDue: '2025-10-10' },
  //   { id: 'ITEM-004', name: 'Filing Cabinet', department: 'MPDO', employee: 'Jane Smith', lastInspection: '2025-06-05', status: 'Fail', inspector: 'Bob Wilson', nextDue: '2025-09-05' },
  // ];

  const transferData = [
    { 
      id: 'TRF-001', 
      itemId: 'ITEM-001',
      itemName: 'Desktop Computer',
      transferDate: '2025-10-15',
      fromDept: 'MPDO',
      toDept: 'GSO',
      fromEmployee: 'Maria Garcia',
      toEmployee: 'John Doe',
      reason: 'Office Reallocation',
      approvedBy: 'Admin Manager',
      status: 'Completed'
    },
    { 
      id: 'TRF-002', 
      itemId: 'ITEM-005',
      itemName: 'Laptop',
      transferDate: '2025-09-20',
      fromDept: 'GSO',
      toDept: 'MPDO',
      fromEmployee: 'Bob Wilson',
      toEmployee: 'Jane Smith',
      reason: 'Equipment Upgrade',
      approvedBy: 'Admin Manager',
      status: 'Completed'
    },
    { 
      id: 'TRF-003', 
      itemId: 'ITEM-002',
      itemName: 'Office Printer',
      transferDate: '2025-08-10',
      fromDept: 'GSO',
      toDept: 'MPDO',
      fromEmployee: 'John Doe',
      toEmployee: 'Maria Garcia',
      reason: 'Department Needs',
      approvedBy: 'Department Head',
      status: 'Completed'
    },
    { 
      id: 'TRF-004', 
      itemId: 'ITEM-006',
      itemName: 'Office Desk',
      transferDate: '2025-10-25',
      fromDept: 'GSO',
      toDept: 'MPDO',
      fromEmployee: 'Bob Wilson',
      toEmployee: 'Maria Garcia',
      reason: 'Office Reorganization',
      approvedBy: '-',
      status: 'Pending'
    },
  ];

  const transferDetails = {
    'TRF-001': {
      itemId: 'ITEM-001',
      itemName: 'Desktop Computer',
      category: 'IT Equipment',
      value: '₱35,000',
      serialNumber: 'DC-2023-001',
      currentOwner: {
        name: 'John Doe',
        department: 'GSO',
        position: 'Admin Officer',
        assignedDate: '2025-10-15'
      },
      transferHistory: [
        {
          date: '2025-10-15',
          fromEmployee: 'Maria Garcia',
          fromDept: 'MPDO',
          fromPosition: 'Development Officer',
          toEmployee: 'John Doe',
          toDept: 'GSO',
          toPosition: 'Admin Officer',
          reason: 'Office Reallocation',
          approvedBy: 'Admin Manager',
          notes: 'Equipment in good condition at time of transfer'
        },
        {
          date: '2024-05-10',
          fromEmployee: 'Jane Smith',
          fromDept: 'MPDO',
          fromPosition: 'Planning Officer',
          toEmployee: 'Maria Garcia',
          toDept: 'MPDO',
          toPosition: 'Development Officer',
          reason: 'Internal Reassignment',
          approvedBy: 'Department Head',
          notes: 'Transferred within same department'
        },
        {
          date: '2023-01-15',
          fromEmployee: 'Initial Acquisition',
          fromDept: '-',
          fromPosition: '-',
          toEmployee: 'Jane Smith',
          toDept: 'MPDO',
          toPosition: 'Planning Officer',
          reason: 'New Purchase',
          approvedBy: 'Procurement Officer',
          notes: 'Brand new equipment'
        }
      ]
    },
    'TRF-002': {
      itemId: 'ITEM-005',
      itemName: 'Laptop',
      category: 'IT Equipment',
      value: '₱55,000',
      serialNumber: 'LT-2023-005',
      currentOwner: {
        name: 'Jane Smith',
        department: 'MPDO',
        position: 'Planning Officer',
        assignedDate: '2025-09-20'
      },
      transferHistory: [
        {
          date: '2025-09-20',
          fromEmployee: 'Bob Wilson',
          fromDept: 'GSO',
          fromPosition: 'General Services Staff',
          toEmployee: 'Jane Smith',
          toDept: 'MPDO',
          toPosition: 'Planning Officer',
          reason: 'Equipment Upgrade',
          approvedBy: 'Admin Manager',
          notes: 'Employee requested transfer for work efficiency'
        },
        {
          date: '2024-02-01',
          fromEmployee: 'Initial Acquisition',
          fromDept: '-',
          fromPosition: '-',
          toEmployee: 'Bob Wilson',
          toDept: 'GSO',
          toPosition: 'General Services Staff',
          reason: 'New Purchase',
          approvedBy: 'Procurement Officer',
          notes: 'Brand new equipment'
        }
      ]
    }
  };

  // const itemDetails = {
  //   'ITEM-001': {
  //     name: 'Desktop Computer',
  //     category: 'IT Equipment',
  //     condition: 'Serviceable',
  //     value: '₱35,000',
  //     location: 'GSO Office - Room 201',
  //     employee: 'John Doe',
  //     department: 'GSO',
  //     acquisitionDate: '2023-01-15',
  //     serialNumber: 'DC-2023-001',
  //     inspections: [
  //       { date: '2025-09-15', status: 'Pass', inspector: 'John Doe', notes: 'All components working properly' },
  //       { date: '2024-09-15', status: 'Pass', inspector: 'Jane Smith', notes: 'Minor dust cleaning performed' },
  //       { date: '2023-09-15', status: 'Pass', inspector: 'John Doe', notes: 'Excellent condition' },
  //     ],
  //     transfers: [
  //       { date: '2023-03-10', from: 'MPDO', to: 'GSO', reason: 'Office expansion' }
  //     ]
  //   }
  // };

  const getStatusBadge = (status) => {
    const styles = {
      'Very Good': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      'Good Condition': 'text-blue-600 bg-green-100',
      'Fair Condition': 'text-yellow-600 bg-yellow-100',
      'Poor Condition': 'text-red-600 bg-orange-100',
      'Scrap Condition': 'text-red-600 bg-orange-100',
      'Fail': 'bg-rose-100 text-rose-700 border border-rose-200',
      'Pending': 'bg-amber-100 text-amber-700 border border-amber-200',
      'Serviceable': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      'Completed': 'bg-blue-100 text-blue-700 border border-blue-200',
    };
    return styles[status] || 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  const filteredAssets = allAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         asset.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment ? asset.department === selectedDepartment : true;
    const matchesEmployee = selectedEmployee ? asset.employee === selectedEmployee.name : true;
    return matchesSearch && matchesDepartment && matchesEmployee;
  });

  const handleBackNavigation = () => {
    if (selectedItem) {
      setSelectedItem(null);
    } else if (selectedEmployee) {
      setSelectedEmployee(null);
    } else if (viewMode === 'department-detail') {
      setViewMode('by-department');
      setSelectedDepartment(null);
    } else if (viewMode === 'by-department') {
      setViewMode('all');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
          {/* Modern Header with Glassmorphism */}
          <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    PPE Management System
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">Asset & Inspection Reports</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg">
                    <Printer size={16} />
                    <span className="text-sm font-medium">Print</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 transition shadow-md hover:shadow-lg">
                    <FileText size={16} />
                    <span className="text-sm font-medium">PDF</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition shadow-md hover:shadow-lg">
                    <Download size={16} />
                    <span className="text-sm font-medium">Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Modern Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <FileText size={24} className="opacity-80" />
                  <div className="text-3xl font-bold">2</div>
                </div>
                <div className="text-sm font-medium opacity-90">Total Documents</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <Package size={24} className="opacity-80" />
                  <div className="text-3xl font-bold">1</div>
                </div>
                <div className="text-sm font-medium opacity-90">Total PAR</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <LayoutGrid size={24} className="opacity-80" />
                  <div className="text-3xl font-bold">1</div>
                </div>
                <div className="text-sm font-medium opacity-90">Total ICS</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <Building2 size={24} className="opacity-80" />
                  <div className="text-3xl font-bold">{allAssets.length}</div>
                </div>
                <div className="text-sm font-medium opacity-90">Total Assets</div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl shadow-md p-4 mb-6 border border-slate-200">
              <div className="flex items-center gap-4">
                {activeTab === 'inspection' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <Calendar size={18} className="text-slate-500" />
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-medium text-slate-700"
                    >
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                )}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-3 text-slate-400" size={20} />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by item name or ID..."
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 mb-6">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => {
                    setActiveTab('assets');
                    setViewMode('all');
                    setSelectedDepartment(null);
                    setSelectedEmployee(null);
                    setSelectedItem(null);
                    setSelectedTransfer(null);
                  }}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
                    activeTab === 'assets'
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Package size={18} />
                    Assets Management
                  </div>
                  {activeTab === 'assets' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('inspection');
                    setViewMode('all');
                    setSelectedDepartment(null);
                    setSelectedEmployee(null);
                    setSelectedItem(null);
                    setSelectedTransfer(null);
                  }}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
                    activeTab === 'inspection'
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <List size={18} />
                    Inspection History
                  </div>
                  {activeTab === 'inspection' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('transfer');
                    setViewMode('all');
                    setSelectedDepartment(null);
                    setSelectedEmployee(null);
                    setSelectedItem(null);
                    setSelectedTransfer(null);
                  }}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
                    activeTab === 'transfer'
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={18} />
                    Transfer Assets
                  </div>
                  {activeTab === 'transfer' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Assets Tab */}
                {activeTab === 'assets' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        {(viewMode !== 'all' || selectedItem) && (
                          <button
                            onClick={handleBackNavigation}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm"
                          >
                            <ArrowLeft size={18} />
                            Back
                          </button>
                        )}
                        {viewMode === 'all' && !selectedItem && (
                          <button
                            onClick={() => setViewMode('by-department')}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition shadow-md hover:shadow-lg font-medium text-sm"
                          >
                            <Building2 size={18} />
                            View By Department
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                        <Filter size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          {viewMode === 'all' && !selectedItem && `${filteredAssets.length} Assets`}
                          {viewMode === 'by-department' && 'Department Overview'}
                          {viewMode === 'department-detail' && selectedDepartment}
                          {selectedEmployee && selectedEmployee.name}
                          {selectedItem && ' Asset Details'}
                        </span>
                      </div>
                    </div>

                    {/* Item Details View */}
                    {selectedItem && itemDetails ? (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-6 rounded-2xl shadow-xl text-white">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <Package size={28} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold">{itemDetails.name}</h3>
                              <p className="text-blue-100 text-sm">{selectedItem}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Category</div>
                              <div className="font-semibold text-sm">{itemDetails.article}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Department</div>
                              <div className="font-semibold text-sm">{itemDetails.department}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Assigned To</div>
                              <div className="font-semibold text-sm">{itemDetails.employee}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Value</div>
                              <div className="font-semibold text-sm">{itemDetails.unitCost}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Location</div>
                              <div className="font-semibold text-sm">{itemDetails.department}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Condition</div>
                              <div className="font-semibold text-sm">{itemDetails.conditions}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Acquisition Date</div>
                              <div className="font-semibold text-sm">{itemDetails.acquisitionDate}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-blue-100 mb-1">Serial Number</div>
                              <div className="font-semibold text-sm">{itemDetails.serialNo}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-200">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="text-blue-600" size={22} />
                            Inspection Timeline
                          </h3>
                          <div className="space-y-4">
                            {itemDetails.inspections?.length === 0 ? (
                              <div className="text-center text-slate-500 text-sm py-6">
                                No inspections recorded yet.
                              </div>
                            ) : (
                              itemDetails.inspections.map((insp, idx) => (
                                <div key={idx} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 ${
                                        insp.inspection_condition === 'Very Good'
                                          ? 'bg-emerald-500 border-emerald-300'
                                          : insp.inspection_condition === 'Good Condition'
                                          ? 'bg-blue-400 border-blue-200'
                                          : insp.inspection_condition === 'Fair'
                                          ? 'bg-yellow-400 border-yellow-200'
                                          : insp.inspection_condition === 'Poor'
                                          ? 'bg-red-500 border-red-300'
                                          : 'bg-gray-400 border-gray-200'
                                      }`}
                                    />
                                    {idx < itemDetails.inspections.length - 1 && (
                                      <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                                    )}
                                  </div>

                                  <div className="flex-1 pb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-sm font-semibold text-slate-700">
                                        {insp.dateInspected}
                                      </span>
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                                          insp.inspection_condition
                                        )}`}
                                      >
                                        {insp.inspection_condition}
                                      </span>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <div className="text-sm text-slate-700">
                                        {insp.remarks || 'No remarks'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* {itemDetails[selectedItem].transfers.length > 0 && (
                          <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Transfer History</h3>
                            {itemDetails[selectedItem].transfers.map((transfer, idx) => (
                              <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="text-sm">
                                      <span className="font-semibold text-slate-800">{transfer.date}</span>
                                      <span className="text-slate-600"> — Transferred from </span>
                                      <span className="font-semibold text-blue-600">{transfer.from}</span>
                                      <span className="text-slate-600"> to </span>
                                      <span className="font-semibold text-indigo-600">{transfer.to}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-500 italic">{transfer.reason}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )} */}
                      </div>
                    ) : viewMode === 'all' ? (
                      <div className="grid gap-4">
                        {filteredAssets.map((asset, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setSelectedItem(asset.item_no);
                              getSelectedItem(asset.item_no, asset.type);
                            }}
                            className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-slate-200 hover:border-blue-300 p-5 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-200 transition">
                                  <Package className="text-blue-600" size={24} />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-lg">{asset.name}</div>
                                  <div className="text-sm text-slate-500">{asset.item_no} • {asset.category}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <div className="text-right">
                                  <div className="text-xs text-slate-500">Department</div>
                                  <div className="font-semibold text-slate-700">{asset.department}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-500">Assigned To</div>
                                  <div className="font-semibold text-slate-700">{asset.employee}</div>
                                </div>
                                {/* <div className="text-right">
                                  <div className="text-xs text-slate-500">Location</div>
                                  <div className="font-semibold text-slate-700">{asset.location}</div>
                                </div> */}
                                <div className="text-right">
                                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadge(asset.conditions)}`}>
                                    {asset.conditions}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{asset.unitCost}</div>
                                </div>
                                <ChevronRight className="text-slate-400 group-hover:text-blue-600 transition" size={24} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : viewMode === 'by-department' ? (
                      <div className="grid grid-cols-2 gap-6">
                        {departmentSummary.map((dept) => (
                          <div 
                            key={dept.department}
                            onClick={() => {
                              setSelectedDepartment(dept.department);
                              fetchUserList(dept.department);
                              setViewMode('department-detail');
                            }}
                            className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg hover:shadow-2xl border-2 border-slate-200 hover:border-blue-400 p-8 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-3xl font-bold text-slate-800">{dept.department}</h3>
                              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                <Building2 className="text-white" size={32} />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                <span className="text-slate-600 font-medium">Total Assets</span>
                                <span className="text-2xl font-bold text-blue-600">{dept.totalAssets}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                <span className="text-slate-600 font-medium">Total Value</span>
                                <span className="text-2xl font-bold text-emerald-600">
                                  {dept.totalValue
                                    ? new Intl.NumberFormat('en-PH', {
                                        style: 'currency',
                                        currency: 'PHP',
                                      }).format(dept.totalValue)
                                    : '₱0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                                <span className="text-slate-600 font-medium">Employees</span>
                                <span className="text-2xl font-bold text-purple-600">{dept.employees}</span>
                              </div>
                            </div>
                            <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                              View Details <ChevronRight size={20} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : viewMode === 'department-detail' ? (
                      <div className="grid grid-cols-5 gap-6">
                        <div className="col-span-3">
                          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                <Package size={20} />
                                {selectedEmployee ? `${selectedEmployee.name}'s Assets` : `${selectedDepartment} Assets`}
                              </h3>
                            </div>
                            <div className="p-4 space-y-3">
                              {filteredAssets.map((asset, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => {
                                    setSelectedItem(asset.item_no);
                                    getSelectedItem(asset.item_no, asset.type);
                                  }}
                                  className="p-4 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all group"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-slate-800">{asset.name}</div>
                                    <ChevronRight className="text-slate-400 group-hover:text-blue-600 transition" size={18} />
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">{asset.item_no}</span>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(asset.conditions)}`}>
                                      {asset.conditions}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {asset.unitCost
                                      ? new Intl.NumberFormat('en-PH', {
                                          style: 'currency',
                                          currency: 'PHP',
                                        }).format(asset.unitCost)
                                      : '₱0.00'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden sticky top-24">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                <Users size={20} />
                                Team Members
                              </h3>
                            </div>
                            <div className="p-4 space-y-3">
                              {employeesByDepartment?.map((employee) => (
                                <div 
                                  key={employee.user_id}
                                  onClick={() => setSelectedEmployee(employee)}
                                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                    selectedEmployee?.user_id === employee.user_id 
                                      ? 'border-purple-500 bg-purple-50 shadow-md' 
                                      : 'border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-xl ${
                                      selectedEmployee?.user_id === employee.user_id 
                                        ? 'bg-purple-500' 
                                        : 'bg-slate-300'
                                    }`}>
                                      <Users className={selectedEmployee?.user_id === employee.user_id ? 'text-white' : 'text-slate-600'} size={20} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-bold text-slate-800 text-sm">{employee.name}</div>
                                      <div className="text-xs text-slate-500">{employee.position}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                                    <span className="text-xs text-slate-600">Assets Assigned</span>
                                    <span className={`text-lg font-bold ${
                                      selectedEmployee?.user_id === employee.user_id ? 'text-purple-600' : 'text-slate-700'
                                    }`}>
                                      {employee.assetsCount}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Inspection History Tab */}
                {activeTab === 'inspection' && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar className="text-blue-600" size={24} />
                      <h2 className="text-xl font-bold text-slate-800">Inspection Records - {selectedYear}</h2>
                    </div>
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <tr>
                              <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Item ID</th>
                              <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Asset Name</th>
                              <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Department</th>
                              <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Assigned To</th>
                              <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Last Inspection</th>
                              <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Status</th>
                              {/* <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Inspector</th> */}
                              {/* <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Next Due</th> */}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inspectionData.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition">
                                <td className="py-4 px-6">
                                  <span className="font-mono text-sm font-semibold text-blue-600">{item.docNo}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="font-medium text-slate-800">{item.description}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="text-sm text-slate-700">{item.department}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="text-sm text-slate-600">{item.assignedTo}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="text-sm text-slate-600">{item.dateInspected}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadge(item.conditions)}`}>
                                    {item.conditions}
                                  </span>
                                </td>
                                {/* <td className="py-4 px-6">
                                  <span className="text-sm text-slate-600">{item.inspector}</span>
                                </td> */}
                                {/* <td className="py-4 px-6">
                                  <span className="text-sm text-slate-600">{item.nextDue}</span>
                                </td> */}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transfer Assets Tab */}
                {activeTab === 'transfer' && (
                  <div>
                    {selectedTransfer && transferDetails[selectedTransfer] ? (
                      <div>
                        <button
                          onClick={() => setSelectedTransfer(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm mb-6"
                        >
                          <ArrowLeft size={18} />
                          Back to Transfers
                        </button>

                        {/* Transfer Item Info */}
                        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-2xl shadow-xl text-white mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <RefreshCw size={28} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold">{transferDetails[selectedTransfer].itemName}</h3>
                              <p className="text-purple-100 text-sm">{transferDetails[selectedTransfer].itemId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-purple-100 mb-1">Category</div>
                              <div className="font-semibold text-sm">{transferDetails[selectedTransfer].category}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-purple-100 mb-1">Value</div>
                              <div className="font-semibold text-sm">{transferDetails[selectedTransfer].value}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-purple-100 mb-1">Serial Number</div>
                              <div className="font-semibold text-sm">{transferDetails[selectedTransfer].serialNumber}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                              <div className="text-xs text-purple-100 mb-1">Total Transfers</div>
                              <div className="font-semibold text-sm">{transferDetails[selectedTransfer].transferHistory.length}</div>
                            </div>
                          </div>
                        </div>

                        {/* Current Owner */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 mb-6">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserCheck className="text-emerald-600" size={22} />
                            Current Owner
                          </h3>
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200">
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-slate-600 mb-1">Employee Name</div>
                                <div className="font-bold text-slate-800">{transferDetails[selectedTransfer].currentOwner.name}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-600 mb-1">Position</div>
                                <div className="font-semibold text-slate-700">{transferDetails[selectedTransfer].currentOwner.position}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-600 mb-1">Department</div>
                                <div className="font-semibold text-slate-700">{transferDetails[selectedTransfer].currentOwner.department}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-600 mb-1">Assigned Since</div>
                                <div className="font-semibold text-slate-700">{transferDetails[selectedTransfer].currentOwner.assignedDate}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Transfer History Timeline */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-200">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <RefreshCw className="text-purple-600" size={22} />
                            Transfer History Timeline
                          </h3>
                          <div className="space-y-4">
                            {transferDetails[selectedTransfer].transferHistory.map((transfer, idx) => (
                              <div key={idx} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-4 h-4 rounded-full border-2 bg-purple-500 border-purple-300"></div>
                                  {idx < transferDetails[selectedTransfer].transferHistory.length - 1 && (
                                    <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-6">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-bold text-slate-800">{transfer.date}</span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                      Transfer #{transferDetails[selectedTransfer].transferHistory.length - idx}
                                    </span>
                                  </div>
                                  <div className="bg-gradient-to-r from-slate-50 to-purple-50 p-5 rounded-xl border border-slate-200">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div>
                                        <div className="text-xs text-slate-500 mb-2 font-semibold uppercase">From</div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                          <div className="font-bold text-slate-800">{transfer.fromEmployee}</div>
                                          <div className="text-sm text-slate-600">{transfer.fromPosition}</div>
                                          <div className="text-xs text-slate-500 mt-1">{transfer.fromDept}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-slate-500 mb-2 font-semibold uppercase">To</div>
                                        <div className="bg-white p-3 rounded-lg border border-purple-200">
                                          <div className="font-bold text-purple-700">{transfer.toEmployee}</div>
                                          <div className="text-sm text-slate-600">{transfer.toPosition}</div>
                                          <div className="text-xs text-slate-500 mt-1">{transfer.toDept}</div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                                      <div>
                                        <div className="text-xs text-slate-500">Reason</div>
                                        <div className="text-sm font-medium text-slate-700">{transfer.reason}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-slate-500">Approved By</div>
                                        <div className="text-sm font-medium text-slate-700">{transfer.approvedBy}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-slate-500">Notes</div>
                                        <div className="text-sm font-medium text-slate-700 italic">{transfer.notes}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <RefreshCw className="text-purple-600" size={24} />
                          <h2 className="text-xl font-bold text-slate-800">Asset Transfer Records</h2>
                        </div>
                        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                <tr>
                                  <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Transfer ID</th>
                                  <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Item</th>
                                  <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Transfer Date</th>
                                  <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">From</th>
                                  <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">To</th>
                                  <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Reason</th>
                                  <th className="text-left py-4 px-6 font-bold text-xs text-slate-600 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {transferData.map((transfer, idx) => (
                                  <tr 
                                    key={idx} 
                                    onClick={() => transferDetails[transfer.id] && setSelectedTransfer(transfer.id)}
                                    className={`hover:bg-purple-50 transition ${transferDetails[transfer.id] ? 'cursor-pointer' : ''}`}
                                  >
                                    <td className="py-4 px-6">
                                      <span className="font-mono text-sm font-semibold text-purple-600">{transfer.id}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                      <div>
                                        <div className="font-medium text-slate-800">{transfer.itemName}</div>
                                        <div className="text-xs text-slate-500">{transfer.itemId}</div>
                                      </div>
                                    </td>
                                    <td className="py-4 px-6">
                                      <span className="text-sm text-slate-600">{transfer.transferDate}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                      <div>
                                        <div className="font-medium text-slate-700">{transfer.fromEmployee}</div>
                                        <div className="text-xs text-slate-500">{transfer.fromDept}</div>
                                      </div>
                                    </td>
                                    <td className="py-4 px-6">
                                      <div>
                                        <div className="font-medium text-slate-700">{transfer.toEmployee}</div>
                                        <div className="text-xs text-slate-500">{transfer.toDept}</div>
                                      </div>
                                    </td>
                                    <td className="py-4 px-6">
                                      <span className="text-sm text-slate-600">{transfer.reason}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadge(transfer.status)}`}>
                                        {transfer.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-slate-600 flex items-center gap-2">
                          <ChevronRight size={16} className="text-purple-600" />
                          <span>Click on a row to view detailed transfer history</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Reports;
