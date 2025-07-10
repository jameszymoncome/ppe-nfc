import React, { useState, useEffect, useRef} from 'react';
import { Plus, Eye, Home, FileCheck, ClipboardList, BarChart, Users, Settings, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar'; // Adjust the path if needed
import axios from 'axios';
import { BASE_URL } from '../utils/connection';

const Property_Assignment = () => {
  const [endUser, setEndUser] = useState('');
  const [endUserResults, setEndUserResults] = useState([]);
  const [selectedEndUser, setSelectedEndUser] = useState(null);
  const [department, setDepartment] = useState('');
  const [items, setItems] = useState([]);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleResults, setArticleResults] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [focusedItemId, setFocusedItemId] = useState(null);
  const inputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  

  useEffect(() => {
    if(!endUser || selectedEndUser && endUser === selectedEndUser.enduser) {
      setEndUserResults([]);
      return;
    }

    const fetchEndUsers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getEndUser.php`, {
          params: { user: endUser }
        });
        console.log(response.data);
        setEndUserResults(response.data);
      } catch (error) {
        console.error('Error fetching end users:', error);
        setEndUserResults([]);
      }
    };
    fetchEndUsers();
  }, [endUser]);

  useEffect(() => {
    if (!articleSearchQuery) {
      setArticleResults([]);
      return;
    }

    const fetchArticles = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getArticle.php`, {
          params: { article: articleSearchQuery }
        });
        console.log(response.data);
        setArticleResults(response.data);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
    };
    fetchArticles();
  }, [articleSearchQuery]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      airNo: '',
      airDate: '',
      fund: '',
      article: '',
      description: '',
      model: '',
      serialNo: '',
      unit: '',
      unitCost: '',
      totalAmount: ''
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleClear = () => {
    setEndUser('');
    setDepartment('');
    setItems([]);
  };

 const saveForm = async () => {
  try {
    const payload = {
      endUser,
      department,
      items: items.filter(item => item.description.trim() !== ''),
    };

    await axios.post(`${BASE_URL}/insertAirItems.php`, payload);
    alert('Form saved successfully!');
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save.');
  }
};


const handleConfirm = () => {
  // Open modal to preview current data
  openModal();
};

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Property Assignment</h1>
              <p className="text-sm text-gray-600 mt-1">
                Assigning Accountability, One Asset at a Time
              </p>
            </div>
            <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Eye className="h-4 w-4" />
              View PAR/ICS
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              {/* Accountable Person Information */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Accountable Person Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className='relative'>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End User :
                    </label>
                    <input
                      type="text"
                      value={endUser}
                      className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                      placeholder="Enter end user name"
                      onChange={e => {
                        setEndUser(e.target.value);
                        setSelectedEndUser(null);
                        if (e.target.value === "") {
                          setEndUserResults([]);
                          setSelectedEndUser(null);
                          setDepartment('');
                          setEndUser('');
                        }
                      }}
                      autoComplete="off"
                    />
                    {endUserResults.length > 0 && (
                      <ul className="absolute left-0 top-full bg-white border border-gray-200 rounded shadow z-10 w-full max-h-40 overflow-y-auto text-xs mt-1">
                        {endUserResults.map(user => (
                          <li
                            key={user.user_id}
                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              setEndUser(user.enduser);
                              setSelectedEndUser(user);
                              setDepartment(user.department || '');
                              setEndUserResults([]);
                            }}
                          >
                            {user.enduser}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offices/Department :
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                      placeholder="Enter department"
                    />
                  </div>
                </div>
              </div>

              {/* Accountable Items List */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Accountable Items List</h2>
                
                <div className="w-full overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">AIR No.</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">AIR Date</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[205px]">Fund</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Article</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Description</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Model</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Serial No.</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Unit</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Unit Cost</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Total Amount</th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={item.airNo}
                              onChange={(e) => handleItemChange(item.id, 'airNo', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="date"
                              value={item.airDate}
                              onChange={(e) => handleItemChange(item.id, 'airDate', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <select
                              value={item.fund}
                              onChange={(e) => handleItemChange(item.id, 'fund', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">-- Select Fund --</option>
                              <option value="General Fund">General Fund</option>
                              <option value="Special Education Fund">Special Education Fund</option>
                              <option value="Trust Fund">Trust Fund</option>
                            </select>
                          </td>

                          <td className="border border-gray-300 px-3 py-2 relative">
                            <input
                              ref={focusedItemId === item.id ? inputRef : null}
                              type="text"
                              value={item.article}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleItemChange(item.id, "article", value);
                                setArticleSearchQuery(value);
                                setFocusedItemId(item.id);

                                // Calculate input position
                                if (inputRef.current) {
                                  const rect = inputRef.current.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + window.scrollY,
                                    left: rect.left + window.scrollX,
                                    width: rect.width
                                  });
                                }
                              }}
                              onFocus={() => {
                                setFocusedItemId(item.id);
                                if (inputRef.current) {
                                  const rect = inputRef.current.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + window.scrollY,
                                    left: rect.left + window.scrollX,
                                    width: rect.width
                                  });
                                }
                              }}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoComplete="off"
                            />
                          </td>

                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={item.model}
                              onChange={(e) => handleItemChange(item.id, 'model', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={item.serialNo}
                              onChange={(e) => handleItemChange(item.id, 'serialNo', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              value={item.unitCost}
                              onChange={(e) => handleItemChange(item.id, 'unitCost', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              value={item.totalAmount}
                              onChange={(e) => handleItemChange(item.id, 'totalAmount', e.target.value)}
                              className="w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dropdownPosition && articleResults.length > 0 && (
                    <ul
                      className="fixed bg-white border border-gray-300 rounded shadow z-[9999] max-h-40 overflow-y-auto text-xs"
                      style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width
                      }}
                    >
                      {articleResults.map((result, index) => (
                        <li
                          key={index}
                          className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => {
                            handleItemChange(focusedItemId, "article", result.categoryName);
                            setArticleSearchQuery("");
                            setArticleResults([]);
                            setDropdownPosition(null);
                          }}
                        >
                          {result.categoryName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>


                {/* Add Item Button */}
                <div className="mt-4">
                  <button
                    onClick={handleAddItem}
                    className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  onClick={handleClear}
                  className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            {/* <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Property Acknowledgment Receipt</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div> */}

            {/* Form Content */}
            <div className="p-6">
              {/* Header Section */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold mb-2">PROPERTY ACKNOWLEDGMENT RECEIPT</h1>
                <p className="text-sm">Official / Department</p>
                <p className="text-sm">Local Government Unit of Daet</p>
                <p className="text-sm">Daet, Camarines Norte</p>
              </div>

              {/* PAR Number */}
              <div className="flex gap-4 mb-6">
                {/* Fund */}
                <div className="w-1/2 flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Fund:</label>
                  <input
                    type="text"
                    className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm"
                    placeholder="Enter Fund"
                  />
                </div>

                {/* PAR No. */}
                <div className="w-1/2 flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">PAR No.:</label>
                  <input
                    type="text"
                    className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm"
                    placeholder="Enter PAR Number"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Quantity</th>
                      <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Unit</th>
                      <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Description</th>
                      <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Property Number</th>
                      <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Date Acquired</th>
                      <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border px-2 py-2 text-xs">{item.unit || '-'}</td>
                        <td className="border px-2 py-2 text-xs">{item.unit || '-'}</td>
                        <td className="border px-2 py-2 text-xs">{item.description || '-'} {item.model || '-'} {item.serialNo || '-'}</td>
                        <td className="border px-2 py-2 text-xs">{item.airNo || '-'}</td>
                        <td className="border px-2 py-2 text-xs">{item.airDate || '-'}</td>
                        <td className="border px-2 py-2 text-xs">{item.totalAmount || '-'}</td>
                      </tr>
                    ))}
                    {/* Fill up to 15 rows if needed */}
                    {Array.from({ length: Math.max(0, 15 - items.length) }, (_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="border px-2 py-2 text-xs">-</td>
                        <td className="border px-2 py-2 text-xs">-</td>
                        <td className="border px-2 py-2 text-xs">-</td>
                        <td className="border px-2 py-2 text-xs">-</td>
                        <td className="border px-2 py-2 text-xs">-</td>
                        <td className="border px-2 py-2 text-xs">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Received by:</p>
                  <div className='border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                  text-sm font-semibold'> {endUser || 'N/A'}</div>
                  <p className="text-xs">Signature over Printed Name of End User</p>
                  <div className='border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                  text-sm font-semibold'> {department || 'N/A'}</div>
                  <p className="text-xs">Position/Office</p>
                  <p className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                  text-sm font-semibold">{new Date().toLocaleDateString()}</p>
                  <p className="text-xs">Date</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Issued by:</p>
                  <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                  text-sm font-semibold"></div>
                  <p className="text-xs">Signature over Printed Name of Supply and/or Property Custodian</p>
                  <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                  text-sm font-semibold"></div>
                  <p className="text-xs">Position/Office</p>
                  <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                  text-sm font-semibold"></div>
                  <p className="text-xs">Date</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  await saveForm();
                  closeModal();
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
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

export default Property_Assignment;