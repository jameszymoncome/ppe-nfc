import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Eye,
  Users,
  Table,
  BarChart,
  ChevronDown,
  X
} from 'lucide-react';
import AD_Sidebar from '../../components/AD_Sidebar';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {BASE_URL} from '../../utils/connection';
import Swal from "sweetalert2";

const AD_AssetTransfer3 = () => {
  const location = useLocation();
  const [assetData, setAssetData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Category');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferType, setTransferType] = useState('');
  const [otherTransferType, setOtherTransferType] = useState('');
  const [autoFillAssets, setAutoFillAssets] = useState([]);
  const [assetRemarks, setAssetRemarks] = useState({});
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [transferForm, setTransferForm] = useState({
    ptr_no: '',
    entity_name: 'LGU of Daet',
    from_officer: '',
    from_officerID: '',
    to_officer: '',
    to_officerID: '',
    transfer_type: '',
    reason_for_transfer: '',
    unit: '',
    description: '',
    property_no: '',
    amount: '',
    remarks: '',
    approved_by: '',
    released_by: '',
    received_by: '',
    transfer_date: '',
    status: 'Pending'
  });

  const handleAssetRemarkChange = (idx, value) => {
  setAssetRemarks(prev => ({
    ...prev,
    [idx]: value
  }));
};

  // Auto-generate PTR No. (format: YYYY-0001, increment as needed)
  const fetchPtrNo = async () => {
  try {
    const response = await fetch(`${BASE_URL}/getLatestPtrSeries.php`);
    const data = await response.json();
    return data.next_ptr_no || '';
  } catch {
    // fallback if backend fails
    const year = new Date().getFullYear();
    return `${year}-0001`;
  }
};

  // When opening transfer form, set PTR No. and From Officer
  const handleUserSelect = async (user) => {
  setSelectedUser(user);
  setShowUserModal(false);
  setShowTransferForm(true);
  setTransferType('');
  setOtherTransferType('');
  const ptr_no = await fetchPtrNo();

  // Fetch assigned assets for asset owner (user_id from URL)
  let autoFillAssets = [];
  try {
    const response = await fetch(`${BASE_URL}/getAssignedAssets.php?user_id=${loggedInUserId}`);
    const data = await response.json();
    // Only use the assets that are selected
    if (data.assets && selectedAssets.length > 0) { 
      autoFillAssets = selectedAssets.map(idx => data.assets[idx]);
    }
  } catch {
    autoFillAssets = [];
  }

  // If you want to show the first asset in the form fields, or combine multiple:
  const firstAsset = autoFillAssets[0] || {};
  setTransferForm(form => ({
    ...form,
    ptr_no,
    from_officer: user_firstName + ' ' + user_lastname,
    to_officer: `${user.firstname} ${user.lastname}`,
    unit: firstAsset.unit || '',
    description: firstAsset.description || '',
    property_no: firstAsset.propertyNo || '',
    amount: firstAsset.unitCost || '',
    from_officerID: firstAsset.from_officerID || '',
    to_officerID: user.user_id || '',
    // Optionally, you can combine descriptions, units, etc. if multiple assets
  }));
  setAutoFillAssets(autoFillAssets); // Save for table rendering in the form
};

const handleTransferFormChange = (field, value) => {
  setTransferForm(form => ({
    ...form,
    [field]: value
  }));
};

// const handleTransferFormSubmit = async (e) => {
//   e.preventDefault();
//   // Prepare asset data with remarks
//   const assetsToTransfer = selectedAssets.map(idx => ({
//     ...assetData[idx],
//     remark: assetRemarks[idx] || ''
//   }));

//   try {
//     const response = await fetch(`${BASE_URL}/createAssetTransfer.php`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         ...transferForm,
//         assets: assetsToTransfer,
//         to_user_id: selectedUser.user_id
//       })
//     });
//     const data = await response.json();
//     if (data.success) {
//       alert('Asset transfer recorded!');
//       setShowTransferForm(false);
//       setSelectedAssets([]);
//       setSelectedUser(null);
//       setAssetRemarks({});
//     } else {
//       alert('Failed to record transfer.');
//     }
//   } catch (error) {
//     alert('Server error.');
//   }
// };

const handleSubmit = async () => {
  try {

    const firstAsset = autoFillAssets[0] || {};

    const payload = {
      transferForm: {
        ptr_no: transferForm.ptr_no,
        entity_name: transferForm.entity_name,
        from_officer: loggedInUserId || transferForm.from_officer,
        to_officer: transferForm.to_officerID || transferForm.to_officer,
        transfer_type: transferForm.transfer_type,
        reason_for_transfer: transferForm.reason_for_transfer,
        approved_by: transferForm.approved_by,
        released_by: transferForm.released_by,
        received_by: transferForm.received_by,
        transfer_date: transferForm.transfer_date,
        status: transferForm.status || "Pending",
      },
      assets: selectedAssets.map((idx) => ({
        ...assetData[idx],
        remarks: assetRemarks[idx] || "",
        property_no: firstAsset.propertyNo || "",
        quantity: 1,
      })),
    };

    console.log("📤 Payload being sent:", payload);

    const res = await fetch(`${BASE_URL}/createAssetTransfer.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("📥 Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid JSON response from server");
    }

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Transfer Successful",
        text: data.message || "Transfer created successfully!",
      }).then(() => {
        // ✅ Reset form & reload page
        setTransferForm({
          ptr_no: "",
          entity_name: "",
          from_officer: "",
          to_officer: "",
          transfer_type: "",
          reason_for_transfer: "",
          approved_by: "",
          released_by: "",
          received_by: "",
          transfer_date: "",
          status: "Pending",
        });
        setSelectedAssets([]);
        setAssetRemarks({});
        window.location.reload(); // full reload if needed
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Failed to create transfer",
      });
      console.error("❌ Backend error:", data.message);
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Submission Failed",
      text: err.message || "An unexpected error occurred",
    });
    console.error("💥 Error submitting transfer:", err);
  }
};






  // Get user_id from query string
  const params = new URLSearchParams(location.search);
  const user_id = params.get('user_id');
  const from_officer = params.get('from_officer') || '';
  const loggedInUserId = localStorage.getItem('userId'); // adjust if you store differently
  const user_firstName = localStorage.getItem('firstName') || '';
  const user_lastname = localStorage.getItem('lastname') || '';

  useEffect(() => {
    if (!loggedInUserId) return;
    const fetchAssets = async () => {
      try {
        const response = await fetch(`${BASE_URL}/getAssetsByUser.php?user_id=${loggedInUserId}`);
        const data = await response.json();
        setAssetData(data.assets || []);
      } catch (error) {
        setAssetData([]);
      }
    };
    fetchAssets();
  }, [loggedInUserId]);

  const handleCheckboxChange = (assetId) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleCancel = () => {
    setSelectedAssets([]);
  };

  const handleTransfer = async () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to transfer.');
      return;
    }
    // Fetch users except the logged-in user
    try {
      const response = await fetch(`${BASE_URL}/getUsersExcept.php?exclude_id=${loggedInUserId}`);
      const data = await response.json();
      setUserOptions(data.users || []);
      setShowUserModal(true);
    } catch (error) {
      alert('Failed to fetch users.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AD_Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Asset Transfer</h1>
            <p className="text-sm text-gray-600 mt-1">
              Reassign or relocate assets to a different employee, department, or location.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Search and Filter Row */}
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

            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              >
                <option value="Category">Category</option>
                <option value="Laptop">Laptop</option>
                <option value="Furniture">Furniture</option>
                <option value="Equipment">Equipment</option>
                <option value="Vehicle">Vehicle</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssets(assetData.map((_, idx) => idx));
                        } else {
                          setSelectedAssets([]);
                        }
                      }}
                      checked={selectedAssets.length === assetData.length}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Article</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Model</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Serial No.</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {assetData.map((asset, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedAssets.includes(index)}
                        onChange={() => handleCheckboxChange(index)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{asset.article}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asset.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asset.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asset.serialNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asset.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{asset.unitCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Transfer
            </button>
          </div>
        </div>
      </div>
      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Select User to Transfer Assets</h2>
            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {userOptions.length === 0 ? (
                <li className="py-4 text-center text-gray-500">No users available</li>
              ) : (
                userOptions.map(user => (
                  <li
                    key={user.user_id}
                    className="py-3 px-4 cursor-pointer hover:bg-blue-50 flex flex-col"
                    onClick={() => handleUserSelect(user)}
                  >
                    <span className="font-medium text-gray-800">{user.firstname} {user.lastname}</span>
                    <span className="text-xs text-gray-500">{user.department}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-8 relative overflow-y-auto max-h-[95vh] border">
            <button
              onClick={() => setShowTransferForm(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
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
                <span className="font-semibold">Entity Name:</span> {transferForm.entity_name}
              </div>
              <div className="text-sm">
                <span className="font-semibold">PTR No.:</span> {transferForm.ptr_no}
              </div>
            </div>
            {/* Officers */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm w-1/2">
                <span className="font-semibold">From Accountable Officer/Agency/Fund Cluster:</span>
                <span className="ml-2"><br></br>{transferForm.from_officer}</span>
              </div>
              <div className="text-sm w-1/2 text-right">
                <span className="font-semibold">To Accountable Officer/Agency/Fund Cluster:</span>
                <span className="ml-2"><br></br>{transferForm.to_officer}</span>
              </div>
            </div>
            {/* Transfer Type */}
            <div className="flex items-center mb-2 text-sm">
              <span className="font-semibold mr-2">Transfer Type:</span>
              <span className="mr-2">(check one)</span>
              <label className="mr-4 flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transferType"
                  value="donation"
                  checked={transferType === 'donation'}
                  onChange={() => {
                    setTransferType('donation');
                    handleTransferFormChange('transfer_type', 'donation');
                  }}
                  className="mr-1"
                />
                Donation
              </label>
              <label className="mr-4 flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transferType"
                  value="relocate"
                  checked={transferType === 'relocate'}
                  onChange={() => {
                    setTransferType('relocate');
                    handleTransferFormChange('transfer_type', 'relocate');
                  }}
                  className="mr-1"
                />
                Relocate
              </label>
              <label className="mr-4 flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transferType"
                  value="reassign"
                  checked={transferType === 'reassign'}
                  onChange={() => {
                    setTransferType('reassign');
                    handleTransferFormChange('transfer_type', 'reassign');
                  }}
                  className="mr-1"
                />
                Reassign
              </label>
              <label className="mr-2 flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transferType"
                  value="others"
                  checked={transferType === 'others'}
                  onChange={() => {
                    setTransferType('others');
                    handleTransferFormChange('transfer_type', otherTransferType);
                  }}
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
                    handleTransferFormChange('transfer_type', e.target.value);
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
                  {autoFillAssets.map((asset, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-2 py-1 text-center">1</td>
                      <td className="border border-black px-2 py-1 text-center">{asset.unit}</td>
                      <td className="border border-black px-2 py-1 text-center">{asset.description}</td>
                      <td className="border border-black px-2 py-1 text-center">{asset.propertyNo}</td>
                      <td className="border border-black px-2 py-1 text-center">{asset.unitCost}</td>
                      <td className="border border-black px-2 py-1 text-center">
                        <input
                          type="text"
                          value={assetRemarks[idx] || ''}
                          onChange={e => handleAssetRemarkChange(idx, e.target.value)}
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
                value={transferForm.reason_for_transfer}
                onChange={e => handleTransferFormChange('reason_for_transfer', e.target.value)}
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
                  <div className="min-h-[24px]">{transferForm.approved_by}</div>
                </div>
                <div className="mb-2 text-sm text-center">
                  <div className="border-b border-black mt-1 mb-1" />
                  <span className="font-semibold">Signature over Printed Name of Head of Agency/Entity or his/her Authorized Representative</span>
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm">
                  <span className="font-semibold">Released/Issued by:</span>
                  <div className="min-h-[24px] text-center">{transferForm.from_officer}</div>
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
                  <div className="min-h-[24px] text-center">{transferForm.to_officer}</div>
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
                    value={transferForm.transfer_date}
                    onChange={e => handleTransferFormChange('transfer_date', e.target.value)}
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
            {/* Submit Button */}
            <div className="flex justify-end mt-4">
              <button type="submit" className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" onClick={handleSubmit}>Submit Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AD_AssetTransfer3;