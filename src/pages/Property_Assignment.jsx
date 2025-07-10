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
  const [highValue, setHighValue] = useState([]);
  const [lowValue, setLowValue] = useState([]);
  const [showModalHigh, setShowModalHigh] = useState(false);
  const [showModalLow, setShowModalLow] = useState(false);
  

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


  const handleAddItem = async () => {

    const newItem = {
      id: Date.now(),
      parNo: '',
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
    // try {
    //   const payload = {
    //     endUser,
    //     department,
    //     items: items.filter(item => item.description.trim() !== ''),
    //   };

    //   await axios.post(`${BASE_URL}/insertAirItems.php`, payload);
    //   alert('Form saved successfully!');
    // } catch (error) {
    //   console.error('Save failed:', error);
    //   alert('Failed to save.');
    // }
  };


  const handleConfirm = () => {
    const high = items.filter(item => parseFloat(item.totalAmount) >= 50000);
    const low = items.filter(item => parseFloat(item.totalAmount) < 50000);

    setHighValue(high);
    setLowValue(low);

    if (high.length > 0) {
      setShowModalHigh(true);
    } else if (low.length > 0) {
      setShowModalLow(true);
    }
  };

  const handleNextFromHighModal = () => {
    setShowModalHigh(false); // close Modal A

    if (lowValue.length > 0) {
      setShowModalLow(true); // open Modal B if needed
    }
  };

  const getValidItemCount = () => {
    return highValue.filter(item =>
      item.airNo &&
      item.airDate &&
      item.fund &&
      item.article &&
      item.description &&
      item.model &&
      item.unit &&
      item.unitCost &&
      item.totalAmount
    ).length;
  };

  const getFormattedDescriptions = () => {
    return highValue
      .filter(item =>
        item.airNo &&
        item.airDate &&
        item.fund &&
        item.article &&
        item.description &&
        item.model &&
        item.unit &&
        item.unitCost &&
        item.totalAmount
      )
      .map(item => `${item.description} ${item.model} ${item.serialNo}`)
      .join('\n');
  };

  const getCommonValue = (key) => {
    const validItems = highValue.filter(item =>
      item.airNo &&
      item.airDate &&
      item.fund &&
      item.article &&
      item.description &&
      item.model &&
      item.unit &&
      item.unitCost &&
      item.totalAmount
    );

    if (validItems.length === 0) return null;

    const firstValue = validItems[0][key];
    const allSame = validItems.every(item => item[key] === firstValue);

    return allSame ? firstValue : null;
  };

  const commonUnit = getCommonValue("unit");
  const commonAmount = getCommonValue("totalAmount");
  const commonDate = getCommonValue("airDate");

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

      {showModalHigh && (
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-black px-2 py-2 text-xs font-medium">Quantity</th>
                      <th className="border border-black px-2 py-2 text-xs font-medium">Unit</th>
                      <th className="border border-black px-2 py-2 text-xs font-medium">Description</th>
                      <th className="border border-black px-2 py-2 text-xs font-medium">Property Number</th>
                      <th className="border border-black px-2 py-2 text-xs font-medium">Date Acquired</th>
                      <th className="border border-black px-2 py-2 text-xs font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highValue.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-black px-2 py-2 text-xs">{index === 0 ? getValidItemCount() : ''}</td>
                        <td className="border border-black px-2 py-2 text-xs">{index === 0 ? (commonUnit || '-') : ''}</td>
                        <td className="border border-black px-2 py-2 text-xs whitespace-pre-line">{index === 0 ? getFormattedDescriptions() : ''}</td>
                        <td className="border border-black px-2 py-2 text-xs">{item.airNo || '-'}</td>
                        <td className="border border-black px-2 py-2 text-xs">{index === 0 ? (commonDate || '-') : ''}</td>
                        <td className="border border-black px-2 py-2 text-xs">{index === 0 ? (commonAmount || '-') : ''}</td>
                      </tr>
                    ))}
                    {/* Fill up to 15 rows if needed */}
                    {Array.from({ length: Math.max(0, 15 - highValue.length) }, (_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="border border-black px-2 py-2 text-xs">-</td>
                        <td className="border border-black px-2 py-2 text-xs">-</td>
                        <td className="border border-black px-2 py-2 text-xs">-</td>
                        <td className="border border-black px-2 py-2 text-xs">-</td>
                        <td className="border border-black px-2 py-2 text-xs">-</td>
                        <td className="border border-black px-2 py-2 text-xs">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-2 border border-black">
                <div className="text-center border-r border-black p-6">
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
                <div className="text-center border-l border-black p-6">
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
                onClick={() => setShowModalHigh(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  // await saveForm();
                  handleNextFromHighModal();
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalLow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            {/* <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Inventory Custodian Slip</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div> */}

            {/* Modal Content */}
            <div className="p-6">
              <div className="border-2 border-black bg-white">
                {/* Header */}
                <div className="text-center p-4">
                  <h1 className="text-lg font-bold">INVENTORY CUSTODIAN SLIP</h1>
                  <p className="text-sm">-Office/Department-</p>
                  <p className="text-sm">Local Government Unit of Daet</p>
                  <p className="text-sm">Daet, Camarines Norte</p>
                </div>

                {/* Fund and ICS No. */}
                <div className="flex border-b border-black">
                  <div className="flex-1 p-2 border-black">
                    <span className="text-sm font-semibold">Fund: </span>
                    <span className="border-b border-black inline-block w-40 ml-2"></span>
                  </div>
                  <div className="flex-1 p-2">
                    <span className="text-sm font-semibold">ICS No.: </span>
                    <span className="border-b border-black inline-block w-40 ml-2"></span>
                  </div>
                </div>

                {/* Table Headers */}
                <div className="grid grid-cols-7 border-b border-black text-xs font-semibold">
                  <div className="p-2 border-r border-black text-center">Quantity</div>
                  <div className="p-2 border-r border-black text-center">Unit</div>
                  <div className="p-2 border-r border-black text-center">
                    <div className="text-center">Amount</div>
                    <div className="grid grid-cols-2 border-t border-black mt-1">
                      <div className="border-r border-black p-1">Unit Cost</div>
                      <div className="p-1">Total Cost</div>
                    </div>
                  </div>
                  <div className="p-2 border-r border-black text-center">Description</div>
                  <div className="p-2 border-r border-black text-center">Inventory Item No.</div>
                  <div className="p-2 text-center">Estimated Useful Life</div>
                </div>

                {/* Table Rows */}
                {lowValue.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-7 border-b border-gray-300 text-xs min-h-[30px]">
                    <div className="p-2 border-r border-black">{item.quantity || '-'}</div>
                    <div className="p-2 border-r border-black">{item.unit || '-'}</div>
                    <div className="border-r border-black">
                      <div className="grid grid-cols-2 h-full">
                        <div className="p-2 border-r border-black">{item.unitCost || '-'}</div>
                        <div className="p-2">{item.totalAmount || '-'}</div>
                      </div>
                    </div>
                    <div className="p-2 border-r border-black">{item.description || '-'}</div>
                    <div className="p-2 border-r border-black">{item.inventoryItemNo || '-'}</div>
                    <div className="p-2">{item.estimatedLife || '-'}</div>
                  </div>
                ))}
                {/* Fill up to 20 rows if needed */}
                {Array.from({ length: Math.max(0, 15 - lowValue.length) }, (_, i) => (
                  <div key={`empty-${i}`} className="grid grid-cols-7 border-b border-gray-300 text-xs min-h-[30px]">
                    <div className="p-2 border-r border-black">-</div>
                    <div className="p-2 border-r border-black">-</div>
                    <div className="border-r border-black">
                      <div className="grid grid-cols-2 h-full">
                        <div className="p-2 border-r border-black">-</div>
                        <div className="p-2">-</div>
                      </div>
                    </div>
                    <div className="p-2 border-r border-black">-</div>
                    <div className="p-2 border-r border-black">-</div>
                    <div className="p-2">-</div>
                  </div>
                ))}

                {/* Footer */}
                <div className="grid grid-cols-2 border-t-2 border-black">
                  {/* Left Side */}
                  <div className="p-4 border-r border-black">
                    <div className="mb-4">
                      <p className="text-sm font-semibold">Received by :</p>
                    </div>
                    <div className="mt-8 mb-4">
                      <div className="border-b border-black w-full h-8 mb-2"></div>
                      <p className="text-xs text-center">Signature over Printed Name of End User</p>
                    </div>
                    <div className="mt-6 mb-4">
                      <div className="border-b border-black w-full h-8 mb-2"></div>
                      <p className="text-xs text-center">Position/Office</p>
                    </div>
                    <div className="mt-6">
                      <div className="border-b border-black w-full h-8 mb-2"></div>
                      <p className="text-xs text-center">Date</p>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-sm font-semibold">Issued by :</p>
                    </div>
                    <div className="mt-8 mb-4">
                      <div className="border-b border-black w-full h-8 mb-2"></div>
                      <p className="text-xs text-center">Signature over Printed Name of Supply</p>
                      <p className="text-xs text-center">and/or Property Custodian</p>
                    </div>
                    <div className="mt-6 mb-4">
                      <div className="border-b border-black w-full h-8 mb-2"></div>
                      <p className="text-xs text-center">Position/Office</p>
                    </div>
                    <div className="mt-6">
                      <div className="border-b border-black w-full h-8 mb-2"></div>
                      <p className="text-xs text-center">Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors mr-2"
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Property_Assignment;