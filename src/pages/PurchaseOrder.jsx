import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, CalendarDays, ListOrdered, Eye, CheckCircle2, Edit, Truck, X } from 'lucide-react';
import AIRModal from '../components/AIRModal';
import InspectionModal from '../components/InspectionModal';
import { BASE_URL } from '../utils/connection';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const purchaseOrders = [
  {
    poNo: '001-07-2025',
    date: 'July 02, 2025',
    supplier: 'ABC Company Inc.',
    amount: '₱210,000.00',
    status: 'For Signature',
    actions: ['view', 'approve'],
  },
  {
    poNo: '002-07-2025',
    date: 'July 02, 2025',
    supplier: 'DEF Company Inc.',
    amount: '₱410,000.00',
    status: 'Approved',
    actions: ['view', 'edit'],
  },
  {
    poNo: '003-07-2025',
    date: 'July 02, 2025',
    supplier: 'XYZ Company Inc.',
    amount: '₱610,000.00',
    status: 'Partially Delivered',
    actions: ['view', 'truck'],
  },
  {
    poNo: '003-07-2025',
    date: 'July 02, 2025',
    supplier: 'XYZ Company Inc.',
    amount: '₱610,000.00',
    status: 'Delivered',
    actions: ['view'],
  },
];

const statusColors = {
  'For Signature': 'text-gray-700',
  'Approved': 'text-green-600',
  'Partially Delivered': 'text-blue-600',
  'Delivered': 'text-gray-500',
};


const PurchaseOrderModal = ({ open, onClose }) => {
  const [lguBranch, setLguBranch] = React.useState('LGU_Daet');
  const [selectedModeProcurement, setSelectedModeProcurement] = React.useState("");
  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedSupplierID, setSelectedSupplierID] = useState(null);
  const [selectedSupplierAddress, setSelectedSupplierAddress] = useState('');
  const [selectedSupplierTIN, setSelectedSupplierTIN] = useState('');
  const [selectedDeliveryTerm, setSelectedDeliveryTerm] = useState('');
  const [purchaseRequestNo, setPurchaseRequestNo] = useState('');
  const [placeOfDelivery, setPlaceOfDelivery] = useState('');
  const [dateOfDelivery, setDateOfDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  const modeProcurement = [
    { key: 1, label: "Public Bidding" },
    { key: 2, label: "Through Procurement Service" },
    { key: 3, label: "Limited Source Bidding" },
    { key: 4, label: "Direct Contracting" },
    { key: 5, label: "Repeat Order" },
    { key: 6, label: "Shopping" }
  ];

  const deliveryTerms = [
    { key: 1, label: "FOB destination" },
    { key: 2, label: "FOB shipping point" }
  ];

  const unitOptions = [
    { value: '', label: 'Unit' },
    { value: 'kg', label: 'kg' },
    { value: 'pieces', label: 'pieces' },
    { value: 'mm', label: 'mm' },
    { value: 'L', label: 'L' },
  ];

  const [items, setItems] = useState([
    { stockNo: '', unit: '', description: '', quantity: '', unitCost: '', amount: '0.00' }
  ]);

  useEffect(() => {
    if (!supplierQuery || (selectedSupplier && supplierQuery === selectedSupplier.name)) {
      setSupplierResults([]);
      return;
    }
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getSupplier.php`, {
          params: { q: supplierQuery }
        });
        setSupplierResults(response.data);
      } catch (error) {
        setSupplierResults([]);
      }
    };
    fetchSuppliers();
  }, [supplierQuery]);

  const handleConfirm = (e) => {
    e.preventDefault();
    console.log(lguBranch);
    console.log(selectedModeProcurement);
    console.log(purchaseRequestNo);
    // console.log(selectedSupplierID);
    console.log(placeOfDelivery);
    console.log(dateOfDelivery);
    console.log(selectedDeliveryTerm);
    console.log(paymentTerms);
    console.log(items);
  };

  const handleItemChange = (idx, field, value) => {
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        // Always calculate amount
        const quantity = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
        const unitCost = parseFloat(field === 'unitCost' ? value : updated.unitCost) || 0;
        updated.amount = (quantity * unitCost).toFixed(2);
        return updated;
      })
    );
  };


  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 px-2">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-auto p-8 md:p-12 overflow-y-auto max-h-[90vh]">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-700 hover:text-black"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-7 h-7" />
        </button>
        {/* Modal Content */}
        <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-1">Purchase Order</h2>
        <p className="text-sm text-gray-500 mb-6">
          From Needs to Assets—<span className="text-gray-500 ">Simplified PPE Requests.</span>
        </p>
        {/* Form Sections */}
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left */}
            <div>
              <p className="text-xs font-semibold mb-2">1. Purchase Order Info</p>
              <div className="mb-2 flex items-center">
                <label className="w-40 text-xs text-gray-700">Local Government Unit:</label>
                <input className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1"
                  value={lguBranch}
                  readOnly
                  // onChange={(e) => setLguBranch(e.target.value)}
                />
              </div>
              <div className="mb-2 flex items-center">
                <label className="w-40 text-xs text-gray-700">Mode of Procurement:</label>
                <select className="flex-1 border-b border-gray-300 outline-none text-xs px-1 py-1 bg-transparent"
                  value={selectedModeProcurement}
                  onChange={e => setSelectedModeProcurement(e.target.value)}
                >
                  <option value="">Select mode</option>
                  {modeProcurement.map((mode) => (
                    <option key={mode.key} value={mode.label}>{mode.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2 flex items-center">
                <label className="w-40 text-xs text-gray-700">Purchase Request No.:</label>
                <input 
                  className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1"
                  value={purchaseRequestNo}
                  onChange={e => setPurchaseRequestNo(e.target.value)}
                />
              </div>
              
            </div>

            {/* Right */}
            <div>
              <p className="text-xs font-semibold mb-2">2. Supplier Information</p>
              <div className="mb-2 flex items-center relative">
                <label className="w-32 text-xs text-gray-700">Supplier Name:</label>
                <input 
                  type="search"
                  className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1"
                  placeholder="Search supplier..."
                  value={supplierQuery}
                  onChange={e => {
                    setSupplierQuery(e.target.value);
                    setSelectedSupplier(null);
                    if (e.target.value === "") {
                      setSupplierResults([]);
                      setSelectedSupplierID("");
                      setSelectedSupplierAddress("");
                      setSelectedSupplierTIN("");
                    }
                  }}
                  autoComplete="off"
                />
                {supplierResults.length > 0 && (
                  <ul className="absolute left-32 top-8 bg-white border border-gray-200 rounded shadow z-10 w-[calc(100%-8rem)] max-h-40 overflow-y-auto text-xs">
                    {supplierResults.map(supplier => (
                      <li
                        key={supplier.id}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                        onClick={() => {
                          setSupplierQuery(supplier.name);
                          const address = supplier.address || '';
                          const tin = supplier.tin || '';
                          console.log(address, tin);
                          setSelectedSupplierID(supplier.id);
                          setSelectedSupplierAddress(address);
                          setSelectedSupplierTIN(tin);
                          setSelectedSupplier(supplier);
                          setSupplierResults([]);
                        }}
                      >
                        {supplier.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-2 flex items-center">
                <label className="w-32 text-xs text-gray-700">Address:</label>
                <input className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1" value={selectedSupplierAddress} readOnly />
              </div>

              <div className="mb-2 flex items-center">
                <label className="w-32 text-xs text-gray-700">TIN:</label>
                <input className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1" value={selectedSupplierTIN} readOnly />
              </div>
            </div>
          </div>
          {/* Delivery & Payment Terms */}
          <div>
            <p className="text-xs font-semibold mb-2">3. Delivery & Payment Terms</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-2 flex items-center">
                  <label className="w-40 text-xs text-gray-700">Place of Delivery:</label>
                  <input 
                    className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1"
                    value={placeOfDelivery}
                    onChange={e => setPlaceOfDelivery(e.target.value)}
                  />
                </div>
                <div className="mb-2 flex items-center">
                  <label className="w-40 text-xs text-gray-700">Date of Delivery:</label>
                  <input 
                    type="date"
                    className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1"
                    value={dateOfDelivery}
                    onChange={e => setDateOfDelivery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center">
                  <label className="w-32 text-xs text-gray-700">Delivery Term:</label>
                  <select className="flex-1 border-b border-gray-300 outline-none text-xs px-1 py-1 bg-transparent"
                    value={selectedDeliveryTerm}
                    onChange={e => setSelectedDeliveryTerm(e.target.value)}
                  >
                    <option value="">Select delivery Term</option>
                    {deliveryTerms.map((term) => (
                      <option key={term.key} value={term.label}>{term.label}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2 flex items-center">
                  <label className="w-32 text-xs text-gray-700">Payment Term:</label>
                  <input
                    className="flex-1 border-b border-gray-300 outline-none text-xs px-2 py-1"
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Items Table */}
          <div>
            <p className="text-xs font-semibold mb-2">4. Items Table</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-gray-700">
                    <th className="font-medium text-left">Stock/Property No.</th>
                    <th className="font-medium text-left">Unit</th>
                    <th className="font-medium text-left">Description</th>
                    <th className="font-medium text-left">Quantity</th>
                    <th className="font-medium text-left">Unit Cost</th>
                    <th className="font-medium text-left">Amount</th>
                    <th className="font-medium text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          className="border-b border-gray-300 outline-none px-1 py-0.5 w-full"
                          value={item.stockNo}
                          onChange={e => handleItemChange(idx, 'stockNo', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="border-b border-gray-300 outline-none px-1 py-0.5 w-full bg-transparent"
                          value={item.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                        >
                          {unitOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="border-b border-gray-300 outline-none px-1 py-0.5 w-full"
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="border-b border-gray-300 outline-none px-1 py-0.5 w-full"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="border-b border-gray-300 outline-none px-1 py-0.5 w-full"
                          value={item.unitCost}
                          onChange={e => handleItemChange(idx, 'unitCost', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="border-b border-gray-300 outline-none px-1 py-0.5 w-full"
                          value={`₱${item.amount}`}
                          onChange={e => handleItemChange(idx, 'amount', e.target.value)}
                          readOnly
                        />
                      </td>
                      <td className="align-middle text-center">
                        <button
                          type="button"
                          className="flex items-center justify-center mx-auto text-red-500 hover:text-red-700"
                          onClick={() => {
                            const newItems = items.filter((_, i) => i !== idx);
                            setItems(newItems);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="mt-3 flex items-center px-3 py-1.5 bg-blue-700 text-white text-xs rounded shadow hover:bg-blue-900 transition"
              onClick={() =>
                setItems([
                  ...items,
                  { stockNo: '', unit: '', description: '', quantity: '', unitCost: '', amount: '0.00' }
                ])
              }
            >
              + Add Item
            </button>
          </div>
          {/* Footer */}
          <div className="flex flex-col md:flex-row justify-end gap-3 mt-8">
            <button
              type="button"
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-blue-800 text-white font-medium hover:bg-blue-900 transition"
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </div>
        </form>
        {/* Notes */}
        <div className="mt-4 text-xs text-gray-500">
          <ul className="list-disc ml-5">
            <li>Purchase No. is generated after saving/confirmation – auto print</li>
            <li>also save the Date</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const PurchaseOrder = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [airModalOpen, setAirModalOpen] = useState(false);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Purchase Order</h1>
            <p className="text-sm text-gray-500">
              From Needs to Assets—<span className="text-gray-500">Simplified PPE Requests.</span>
            </p>
          </div>
          <button
            className="flex items-center px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-md shadow hover:bg-blue-900 transition"
            onClick={() => setModalOpen(true)}
          >
            <ListOrdered className="w-4 h-4 mr-2" />
            New Purchase Order
          </button>
        </div>

        {/* Filters/Search */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          {/* Dropdown */}
          <select className="min-w-[120px] px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none">
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Date Picker */}
          <div className="relative min-w-[180px]">
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none text-sm"
            />
            <CalendarDays className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-4 font-medium text-left">P.O No.</th>
                <th className="py-2 px-4 font-medium text-left">Date</th>
                <th className="py-2 px-4 font-medium text-left">Supplier</th>
                <th className="py-2 px-4 font-medium text-left">Total Amount</th>
                <th className="py-2 px-4 font-medium text-left">Status</th>
                <th className="py-2 px-4 font-medium text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po, idx) => (
                <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">{po.poNo}</td>
                  <td className="py-2 px-4">{po.date}</td>
                  <td className="py-2 px-4">{po.supplier}</td>
                  <td className="py-2 px-4">{po.amount}</td>
                  <td className={`py-2 px-4 font-medium ${statusColors[po.status] || ''}`}>{po.status}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <button title="View" className="text-gray-600 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    {po.actions.includes('approve') && (
                      <button title="Approve" className="text-green-600 hover:text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {po.actions.includes('edit') && (
                      <button
                        title="Create AIR"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => setAirModalOpen(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {po.actions.includes('truck') && (
                      <button title="Deliver" className="text-blue-600 hover:text-blue-800">
                        <Truck className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal */}
      <PurchaseOrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AIRModal
        open={airModalOpen}
        onClose={() => setAirModalOpen(false)}
        onNext={() => setInspectionModalOpen(true)}
      />
      <InspectionModal
        open={inspectionModalOpen}
        onClose={() => setInspectionModalOpen(false)}
      />
    </div>
  );
};

export default PurchaseOrder;