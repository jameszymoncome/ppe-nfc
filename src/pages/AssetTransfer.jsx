import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Eye,
  Calendar,
  Users,
  Table,
  BarChart,
  ChevronDown,
  Download,
  Upload,
  X,
  CheckCircle,
  FileCheck 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { NavLink, useNavigate } from 'react-router-dom';
import {BASE_URL} from '../utils/connection';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from 'sweetalert2';

const AssetTransfer = () => {
  const [transferData, setTransferData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showTransferForm1, setShowTransferForm1] = useState(false);
  const [transferForm, setTransferForm] = useState({});
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [downloadTransfer, setDownloadTransfer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  const current_user = localStorage.getItem('userId');
  const user_role = localStorage.getItem('accessLevel');
  const [officer_from, setOfficerFrom] = useState('');

const handleAccept = async (transfer, file) => {
  const formData = new FormData();
  formData.append("ptr_no", transfer.ptr_no);
  formData.append("signed_doc", file);

  try {
    const res = await fetch(`${BASE_URL}/acceptTransfer.php`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json(); // must return valid JSON
    if (result.success) {
      Swal.fire("Success!", result.message, "success");
      fetchTransfers();
    } else {
      Swal.fire("Error", result.message, "error");
    }
  } catch (err) {
    console.error("Upload error:", err);
    Swal.fire("Error", "Something went wrong", "error");
  }
};

  // add helper to update status (used by Accept button)
  const updateTransferStatus = async (ptr_no, status) => {
    try {
      const form = new FormData();
      form.append('ptr_no', ptr_no);
      form.append('status', status);
      const res = await fetch(`${BASE_URL}/updateTransferStatus.php`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        fetchTransfers();
        return true;
      } else {
        Swal.fire('Error', data.message || 'Failed to update status', 'error');
        return false;
      }
    } catch (err) {
      console.error('updateTransferStatus error', err);
      Swal.fire('Error', 'Network error', 'error');
      return false;
    }
  };

  const handleApprove = async (transfer) => {
  // SweetAlert with file input
  // const { value: file } = await Swal.fire({
  //   title: "Upload Signed Document",
  //   input: "file",
  //   inputAttributes: {
  //     accept: "application/pdf,image/*", // allow pdf and images
  //     "aria-label": "Upload your signed transfer document"
  //   },
  //   showCancelButton: true,
  //   confirmButtonText: "Approve Transfer",
  // });

  // if (!file) return; // cancelled

  const formData = new FormData();
  formData.append("ptr_no", transfer.ptr_no);
  formData.append("approved_by", current_user);
  // formData.append("signed_doc", file);
  formData.append("status", "Approved - Awaiting for Signed Document"); // send new status

  try {
    const res = await fetch(`${BASE_URL}/approveTransfer.php`, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (result.success) {
      Swal.fire("Success!", "Transfer approved and awaiting for signed document!", "success");
      fetchTransfers(); // refresh list
    } else {
      Swal.fire("Error", result.message, "error");
    }
  } catch (err) {
    console.error("Approve error:", err);
    Swal.fire("Error", "Something went wrong", "error");
  }
};
  const handleApprove2 = async (transfer) => {
  // SweetAlert with file input
  const { value: file } = await Swal.fire({
    title: "Upload Signed Document",
    input: "file",
    inputAttributes: {
      accept: "application/pdf,image/*", // allow pdf and images
      "aria-label": "Upload your signed transfer document"
    },
    showCancelButton: true,
    confirmButtonText: "Approve Transfer",
  });

  if (!file) return; // cancelled

  const formData = new FormData();
  formData.append("ptr_no", transfer.ptr_no);
  // formData.append("approved_by", current_user);
  formData.append("signed_doc", file);
  formData.append("status", "Completed"); // send new status

  try {
    const res = await fetch(`${BASE_URL}/completeTransfer.php`, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (result.success) {
      Swal.fire("Success!", "Transfer completed!", "success");
      fetchTransfers(); // refresh list
    } else {
      Swal.fire("Error", result.message, "error");
    }
  } catch (err) {
    console.error("Approve error:", err);
    Swal.fire("Error", "Something went wrong", "error");
  }
};



    const fetchTransfers = async () => {
        const user_id = localStorage.getItem('userId');
  const res = await fetch(`${BASE_URL}/getAssetTransfers.php?user_id=${user_id}`);
  const data = await res.json();
  setTransferData(data.transfers || []);
};

useEffect(() => {
  fetchTransfers();
}, []);


  const navigate = useNavigate();


  // Optional: filter logic for search/filter/date
  const filteredData = transferData.filter(item => {
    const matchesSearch = item.ptr_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.to_officer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || item.status.toLowerCase().includes(selectedFilter.toLowerCase());
    const matchesDate = !selectedDate || item.transfer_date === selectedDate;
    return matchesSearch && matchesFilter && matchesDate;
  });

const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Accepted - Awaiting for Approval":
      return "bg-blue-100 text-blue-800";
    case "Approved":
      return "bg-blue-100 text-blue-800";
    case "Approved - Awaiting for Signed Document":
      return "bg-blue-100 text-blue-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Request":
      return "bg-purple-100 text-purple-800"; // New color for "Request" status
    default:
      return "bg-gray-100 text-gray-800";
  }
};
  const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
};

  const TransferReport = ({ transfer, onClose }) => {
  if (!transfer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div
        id="transfer-report"
        className="bg-white rounded-xl shadow-lg w-full max-w-5xl p-10 relative border max-h-[95vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/assets/images/lgu_seal.png" // replace with your municipal seal path
            alt="Logo"
            className="mx-auto w-20 h-20 mb-2"
          />
          <h2 className="font-semibold">Republic of the Philippines</h2>
          <h2 className="font-semibold">PROVINCE OF CAMARINES NORTE</h2>
          <h2 className="font-semibold">MUNICIPALITY OF DAET</h2>
          <h1 className="text-xl font-bold mt-2 underline">
            PROPERTY TRANSFER REPORT
          </h1>
        </div>

        {/* Entity & PTR */}
        <div className="mb-4 text-sm">
          <p><strong>Entity Name:</strong> {transfer.entity_name}</p>
          <p><strong>PTR No.:</strong> {transfer.ptr_no}</p>
        </div>

        {/* Officers */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <p>
            <strong>From Accountable Officer/Agency/Fund Cluster:</strong><br />
            {transfer.from_officer_name}
          </p>
          <p>
            <strong>To Accountable Officer/Agency/Fund Cluster:</strong><br />
            {transfer.to_officer_name}
          </p>
        </div>

        {/* Transfer Type */}
        <div className="mb-4 text-sm">
          <p>
            <strong>Transfer Type:</strong> {transfer.transfer_type.charAt(0).toUpperCase() + transfer.transfer_type.slice(1)}
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full border border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Property No.</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {transfer.items?.map((item, i) => (
              <tr key={i}>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2 text-center">{item.unit}</td>
                <td className="border p-2">{item.description}</td>
                <td className="border p-2 text-center">{item.propertyNo}</td>
                <td className="border p-2 text-right">₱{item.amount}</td>
                <td className="border p-2">{item.remarks}</td>
              </tr>
            ))}
            {/* Extra empty rows for formatting */}
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border p-2">&nbsp;</td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Reason */}
        <div className="mb-8 text-sm">
          <p><strong>Reason for Transfer:</strong></p>
          <span>{transfer.reason_for_transfer}</span>
          <div className="border-b border-gray-400 w-full mt-4"></div>
        </div>

        {/* Signatories */}
        <div className="grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p className='mb-4'>Approved by:</p>
            <strong>{transfer.approved_by_name}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
              Signature over Printed Name of Head of Agency/Entity
            </div>
          </div>
          <div>
            <p className='mb-4'>Released/Issued by:</p>
              <strong>{transfer.from_officer_name}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
              Signature over Printed Name of Accountable Officer
            </div>
          </div>
          <div>
            <p className='mb-4'>Received by:</p>
              <strong>{transfer.to_officer_name}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
              Signature over Printed Name of Accountable Officer
            </div>
          </div>
          <div>
            <p className='mb-4'>Date:</p>
              <strong>{transfer.transfer_date}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
  const TransferReport1 = ({ transfer1, onClose }) => {
  if (!transfer1) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div
        id="transfer-report1"
        className="bg-white rounded-xl shadow-lg w-full max-w-5xl p-10 relative border"
      >
        {/* Close button */}
        {/* <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          ✕
        </button> */}

        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/assets/images/lgu_seal.png" // replace with your municipal seal path
            alt="Logo"
            className="mx-auto w-20 h-20 mb-2"
          />
          <h2 className="font-semibold">Republic of the Philippines</h2>
          <h2 className="font-semibold">PROVINCE OF CAMARINES NORTE</h2>
          <h2 className="font-semibold">MUNICIPALITY OF DAET</h2>
          <h1 className="text-xl font-bold mt-2 underline">
            PROPERTY TRANSFER REPORT
          </h1>
        </div>

        {/* Entity & PTR */}
        <div className="mb-4 text-sm">
          <p><strong>Entity Name:</strong> {transfer1.entity_name}</p>
          <p><strong>PTR No.:</strong> {transfer1.ptr_no}</p>
        </div>

        {/* Officers */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <p>
            <strong>From Accountable Officer/Agency/Fund Cluster:</strong><br />
            {transfer1.from_officer_name}
          </p>
          <p>
            <strong>To Accountable Officer/Agency/Fund Cluster:</strong><br />
            {transfer1.to_officer_name}
          </p>
        </div>

        {/* Transfer Type */}
        <div className="mb-4 text-sm">
          <p>
            <strong>Transfer Type:</strong> {transfer1.transfer_type.charAt(0).toUpperCase() + transfer1.transfer_type.slice(1)}
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full border border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Property No.</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {transfer1.items?.map((item, i) => (
              <tr key={i}>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2 text-center">{item.unit}</td>
                <td className="border p-2">{item.description}</td>
                <td className="border p-2 text-center">{item.propertyNo}</td>
                <td className="border p-2 text-right">₱{item.amount}</td>
                <td className="border p-2">{item.remarks}</td>
              </tr>
            ))}
            {/* Extra empty rows for formatting */}
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border p-2">&nbsp;</td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Reason */}
        <div className="mb-8 text-sm">
          <p><strong>Reason for Transfer:</strong></p>
          <span>{transfer1.reason_for_transfer}</span>
          <div className="border-b border-gray-400 w-full mt-4"></div>
        </div>

        {/* Signatories */}
        <div className="grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p className='mb-4'>Approved by:</p>
            <strong>{transfer1.from_officer_name}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
              Signature over Printed Name of Head of Agency/Entity
            </div>
          </div>
          <div>
            <p className='mb-4'>Released/Issued by:</p>
              <strong>{transfer1.from_officer_name}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
              Signature over Printed Name of Accountable Officer
            </div>
          </div>
          <div>
            <p className='mb-4'>Received by:</p>
              <strong>{transfer1.to_officer_name}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
              Signature over Printed Name of Accountable Officer
            </div>
          </div>
          <div>
            <p className='mb-4'>Date:</p>
              <strong>{transfer1.transfer_date}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const fetchTransferItems = async (from_officerID) => {
  try {
    const res = await fetch(`${BASE_URL}/getAssetTransferItems.php?user_id=${from_officerID}`);
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching transfer items:", error);
    return [];
  }
};

  // This is the component for generating the PDF.
const HiddenTransferReport = ({ transfer1 }) => {
  if (!transfer1) return null;

  return (
    <div
      id="transfer-report-hidden" // This is the ID html2canvas will target
      // Add ALL the Tailwind classes from your visible report's inner div here
      className="bg-white rounded-xl shadow-lg w-full max-w-5xl p-10 relative border" 
    >
      {/* Header */}
      <div className="text-center mb-6">
        <img
          src="/assets/images/lgu_seal.png"
          alt="Logo"
          className="mx-auto w-20 h-20 mb-2"
        />
        <h2 className="font-semibold">Republic of the Philippines</h2>
        <h2 className="font-semibold">PROVINCE OF CAMARINES NORTE</h2>
        <h2 className="font-semibold">MUNICIPALITY OF DAET</h2>
        <h1 className="text-xl font-bold mt-2 underline">
          PROPERTY TRANSFER REPORT
        </h1>
      </div>

      {/* Entity & PTR */}
      <div className="mb-4 text-sm">
        <p><strong>Entity Name:</strong> {transfer1.entity_name}</p>
        <p><strong>PTR No.:</strong> {transfer1.ptr_no}</p>
      </div>

      {/* Officers */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <p>
          <strong>From Accountable Officer/Agency/Fund Cluster:</strong><br />
          {transfer1.from_officer_name}
        </p>
        <p>
          <strong>To Accountable Officer/Agency/Fund Cluster:</strong><br />
          {transfer1.to_officer_name}
        </p>
      </div>

      {/* Transfer Type */}
      <div className="mb-4 text-sm">
        <p>
          <strong>Transfer Type:</strong> {transfer1.transfer_type.charAt(0).toUpperCase() + transfer1.transfer_type.slice(1)}
        </p>
      </div>

      {/* Items Table */}
      <table className="w-full border border-collapse text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Unit</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Property No.</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {transfer1.items?.map((item, i) => (
            <tr key={i}>
              <td className="border p-2 text-center">{item.quantity}</td>
              <td className="border p-2 text-center">{item.unit}</td>
              <td className="border p-2">{item.description}</td>
              <td className="border p-2 text-center">{item.propertyNo}</td>
              <td className="border p-2 text-right">₱{item.amount}</td>
              <td className="border p-2">{item.remarks}</td>
            </tr>
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border p-2">&nbsp;</td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Reason */}
      <div className="mb-8 text-sm">
        <p><strong>Reason for Transfer:</strong></p>
        <span>{transfer1.reason_for_transfer}</span>
        <div className="border-b border-gray-400 w-full mt-4"></div>
      </div>

      {/* Signatories */}
      <div className="grid grid-cols-2 gap-8 text-center text-sm">
        <div>
            <p className='mb-4'>Approved by:</p>
            <strong>{transfer1.approved_by_name}</strong>
            <div className="mt-1 border-t border-gray-400 pt-1">
              Signature over Printed Name of Head of Agency/Entity
            </div>
          </div>
        <div>
          <p className='mb-4'>Released/Issued by:</p>
          <strong>{transfer1.from_officer_name}</strong>
          <div className="mt-1 border-t border-gray-400 pt-1">
            Signature over Printed Name of Accountable Officer
          </div>
        </div>
        <div>
          <p className='mb-4'>Received by:</p>
          <strong>{transfer1.to_officer_name}</strong>
          <div className="mt-1 border-t border-gray-400 pt-1">
            Signature over Printed Name of Accountable Officer
          </div>
        </div>
        <div>
          <p className='mb-4'>Date:</p>
          <strong>{transfer1.transfer_date}</strong>
          <div className="mt-1 border-t border-gray-400 pt-1">
          </div>
        </div>
      </div>
    </div>
  );
};



  const handleDownload = async (item) => {
  // 1. Fetch items and create a complete data object
  const items = await fetchTransferItems(item.from_officerID);
  const dataForDownload = { ...item, items };

  // 2. Set the state to trigger the hidden component render and the useEffect
  setDownloadTransfer(dataForDownload);
};


useEffect(() => {
  if (downloadTransfer) {
    const generatePDF = async () => {
      // Change the ID to the one on the new hidden component
      const input = document.getElementById("transfer-report-hidden");
      if (input) {
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        pdf.save(`Transfer-${downloadTransfer.ptr_no}.pdf`);
        setDownloadTransfer(null);
      }
    };
    generatePDF();
  }
}, [downloadTransfer]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar/>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Asset Transfer</h1>
              <p className="text-sm text-gray-600 mt-1">
                Reassign or relocate assets to a different employee, department, or location.
              </p>
            </div>
            <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2" onClick={() => navigate('/asset-transfer-2')}>
              <Upload className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
              <button
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <StatusBadge status={selectedFilter} />
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {["All", "Pending", "Accepted - Awaiting for Approval", "Request", "Completed"].map(
                    (status) => (
                      <div
                        key={status}
                        onClick={() => {
                          setSelectedFilter(status);
                          setDropdownOpen(false);
                        }}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <StatusBadge status={status} />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Date"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Transfer No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Name of Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr
                      key={index}
                      onClick={() =>
                        navigate(`/assets/asset-transfer-progress/${item.ptr_no}`, { state: { item } })
                      }
                      className="cursor-pointer hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {item.ptr_no}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {(() => {
                                if (!item.to_officer_name) return '?';
                                const parts = item.to_officer_name.trim().split(' ');
                                if (parts.length === 1) return parts[0][0].toUpperCase();
                                return (
                                  parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
                                );
                              })()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.to_officer_name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                        {item.department}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                        {item.transfer_date}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={
                            item.status === 'Pending' && item.to_officerID === current_user
                              ? 'Request'
                              : item.status
                          }
                        />
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {/* View Button */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const items = await fetchTransferItems(item.from_officerID);
                              setSelectedTransfer({ ...item, items });
                              setShowTransferForm(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* Download Button */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const items = await fetchTransferItems(item.from_officerID);
                              await handleDownload({ ...item, items });
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors duration-150"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>

                          {/* Accept Button */}
                          {item.to_officerID === current_user && item.status === 'Pending' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await updateTransferStatus(item.ptr_no, 'Accepted - Awaiting for Approval');
                                if (ok) {
                                  Swal.fire('Accepted', 'You accepted the transfer request.', 'success');
                                }
                              }}
                              className="inline-flex items-center justify-center p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-150"
                              title="Accept"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Signed Document */}
                          {item.signed_doc && (
                            <a
                              href={`${BASE_URL}/${item.signed_doc}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-150"
                              title="View Signed Document"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Signed</span>
                            </a>
                          )}

                          {/* Admin Buttons */}
                          {(user_role === 'ADMIN' || user_role === 'SUPER ADMIN') && (
                            <>
                              {item.status === 'Accepted - Awaiting for Approval' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const result = await Swal.fire({
                                    title: 'Approve this transfer?',
                                    text: "This action will approve the asset transfer request.",
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#16a34a',
                                    cancelButtonColor: '#d33',
                                    confirmButtonText: 'Yes, approve it',
                                  });

                                  if (result.isConfirmed) {
                                    handleApprove(item);
                                    Swal.fire({
                                      icon: 'success',
                                      title: 'Approved!',
                                      text: 'The transfer has been approved.',
                                      timer: 1500,
                                      showConfirmButton: false,
                                    });
                                  }
                                }}
                                className="inline-flex items-center justify-center p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-150"
                                title="Approve Transfer"
                              >
                                <FileCheck className="w-4 h-4" />
                              </button>
                            )}

                            {item.status === 'Approved - Awaiting for Signed Document' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const result = await Swal.fire({
                                    title: 'Complete this transfer?',
                                    text: "This will mark the transfer as completed and finalize the records.",
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonColor: '#16a34a',
                                    cancelButtonColor: '#d33',
                                    confirmButtonText: 'Yes, complete it',
                                  });

                                  if (result.isConfirmed) {
                                    handleApprove2(item);
                                  }
                                }}
                                className="inline-flex items-center justify-center p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-150"
                                title="Complete Transfer"
                              >
                                <FileCheck className="w-4 h-4" />
                              </button>
                            )}

                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // ✅ No data message
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No assets are currently being transferred.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


        </div>
      </div>

      {showTransferForm1 && selectedTransfer && (
        <TransferReport1
          transfer1={selectedTransfer}
          onClose={() => setShowTransferForm1(false)}
        />
      )}
      {showTransferForm && selectedTransfer && (
        <TransferReport
          transfer={selectedTransfer}
          onClose={() => setShowTransferForm(false)}
        />
      )}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {downloadTransfer && (
          <HiddenTransferReport
            transfer1={downloadTransfer}
          />
        )}
      </div>
    {showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-4">Upload Signed Document</h2>

        <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            className="mb-4"
        />

        <div className="flex justify-end space-x-2">
            <button
            onClick={() => setShowModal(false)}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
            >
            Cancel
            </button>
            <button
            onClick={async () => {
                if (!pdfFile) {
                alert("Please select a PDF file.");
                return;
                }

                const formData = new FormData();
                formData.append("ptr_no", selectedTransfer.ptr_no);
                formData.append("signed_doc", pdfFile); // 🔥 use signed_doc (not pdf)

                try {
                const res = await fetch(`${BASE_URL}/acceptTransfer.php`, {
                    method: "POST",
                    body: formData,
                });

                const result = await res.json();

                if (result.success) {
                    setShowModal(false);
                    setPdfFile(null);
                    fetchTransfers(); // refresh table
                } else {
                    alert("Failed: " + result.message);
                }
                } catch (err) {
                console.error("Error uploading:", err);
                }
            }}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
            Submit
            </button>
        </div>
       </div>
    </div>
    )}
    </div>
  );
};

export default AssetTransfer;