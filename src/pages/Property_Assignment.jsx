import React, { useState, useEffect, useRef} from 'react';
import { Plus, Eye, Home, FileCheck, ClipboardList, BarChart, Users, Settings, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar'; // Adjust the path if needed
import axios from 'axios';
import { BASE_URL } from '../utils/connection';
import Swal from "sweetalert2";

const Property_Assignment = () => {
  const [endUser, setEndUser] = useState('');
  const [endUserId, setEndUserId] = useState('');
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
  const [headData, setHeadData] = useState([]);
  const [currentHighIndex, setCurrentHighIndex] = useState(0);
  const [currentLowIndex, setCurrentLowIndex] = useState(0);
  

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
        setArticleResults(response.data);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
    };
    fetchArticles();
  }, [articleSearchQuery]);

  useEffect(() => {
    const fetchHead = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getGSOHead.php`);
        console.log('GSO Head Data:', response.data.head.fullname);
        setHeadData(response.data.head);
      } catch (error) {
        console.error('Error fetching GSO head:', error);
      }
    };
    fetchHead();
  }, []);

  const handleAddItem = async () => {
    const newItem = {
      id: Date.now(),
      airNo: '',
      airDate: '',
      fund: '',
      articleCode: '',
      article: '',
      description: '',
      model: '',
      serialNo: '',
      unit: '',
      unitCost: ''
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

  const groupByAirInfo = (items) => {
    const grouped = {};

    items.forEach(item => {
      const key = `${item.airNo}|${item.airDate}|${item.fund}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.values(grouped); // returns [ [items], [items], ... ]
  };

  const saveForm = (formType) => {
    const savedDataHigh = async () => {
      try {
        const response = await axios.post(`${BASE_URL}/saveNewItem.php`, {
          highValue,
          items,
          endUser,
          endUserId,
          formType
        });
        console.log(response.data.received.parNo);
        const data = response.data;
        if (data.success) {
          const parNos = data.received.parNo || [];

          Swal.fire({
            title: "PAR/ICS successfully created and saved.",
            icon: "success",
            html: `
              <p class="mt-2 font-semibold">Generated PAR No(s):</p>
              <div class="mt-1 text-blue-600 font-bold">${parNos.join(', ')} <br/> successfully created</div>
            `,
            confirmButtonText: "OK",
            customClass: {
              popup: "rounded-2xl",
              confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
            },
            buttonsStyling: false,
          }).then(() => {
            window.location.reload();
          });
        }
      } catch (error) {
        console.error('Error fetching GSO head:', error);
      }
    }

    const savedDataLow = async () => {
      try {
        const response = await axios.post(`${BASE_URL}/saveNewItem.php`, {
          lowValue,
          items,
          endUser,
          endUserId,
          formType
        });
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching GSO head:', error);
      }
    }

    const saveDataBoth = async () => {
      try {
        const response = await axios.post(`${BASE_URL}/saveNewItem.php`, {
          highValue,
          lowValue,
          items,
          endUser,
          endUserId,
          formType: 'Both'
        });
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching GSO head:', error);
      }
    }

    if (formType === 'High' && lowValue.length === 0) {
      savedDataHigh();
    } else if (formType === 'Low' && highValue.length === 0) {
      savedDataLow();
    } else if (formType === 'Low' && highValue.length > 0) {
      saveDataBoth();
    }
  };

  const handleConfirm = () => {
    const high = items.filter(item => parseFloat(item.unitCost) >= 50000);
    const low = items.filter(item => parseFloat(item.unitCost) < 50000);

    setHighValue(high);
    setLowValue(low);

    const highGroups = groupByAirInfo(high);
    const lowGroups = groupByAirInfo(low);

    if (highGroups.length > 0) {
      setCurrentHighIndex(0);
      setShowModalHigh(true);
    } else if (lowGroups.length > 0) {
      setCurrentLowIndex(0);
      setShowModalLow(true);
    }
  };

  const handleNextFromHighModal = () => {
    const highGroups = groupByAirInfo(highValue);
    const lowGroups = groupByAirInfo(lowValue);

    if (currentHighIndex + 1 < highGroups.length) {
      setCurrentHighIndex(prev => prev + 1);
    } else if (lowGroups.length > 0) {
      setCurrentLowIndex(0);
      setShowModalHigh(false);
      setShowModalLow(true);
    } else {
      setShowModalHigh(false);
      saveForm('High');
    }
  };

  const handleNextFromLowModal = () => {
    const lowGroups = groupByAirInfo(lowValue);

    if (currentLowIndex + 1 < lowGroups.length) {
      setCurrentLowIndex(prev => prev + 1);
    } else {
      setShowModalLow(false);
      saveForm('Low');
    }
  };

  const getGroupedItemsHigh = () => {
    const groups = groupByAirInfo(highValue);
    const currentGroupItems = groups[currentHighIndex] || [];

    const validItems = currentGroupItems.filter(item =>
      item.airNo && item.airDate && item.fund &&
      item.article && item.description && item.model && item.unit && item.unitCost
    );

    const grouped = {};

    validItems.forEach(item => {
      const key = `${item.fund}|${item.article}|${item.description}|${item.model}|${item.unit}|${item.unitCost}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.values(grouped);
  };

  const getGroupedLowValueItems = () => {
    const groups = groupByAirInfo(lowValue);
    const currentGroupItems = groups[currentLowIndex] || [];

    const validItems = currentGroupItems.filter(item =>
      item.airNo && item.airDate && item.fund &&
      item.article && item.description && item.model && item.unit && item.unitCost
    );

    const grouped = {};

    validItems.forEach(item => {
      const key = `${item.fund}|${item.article}|${item.description}|${item.model}|${item.unit}|${item.unitCost}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.values(grouped);
  };

  const handleItemChangeMultiple = (id, updates) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
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
                              setEndUserId(user.user_id);
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
                            handleItemChangeMultiple(focusedItemId, {
                              article: result.categoryName,
                              articleCode: result.categoryID
                            });
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
        <>
          {(() => {
            const highGroups = groupByAirInfo(highValue);
            const currentGroup = highGroups[currentHighIndex] || [];
            const currentItem = currentGroup[0] || {};
            return (
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
                      <p className="text-sm">{department || ''}</p>
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
                          value={currentItem.fund || ''}
                          className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm"
                          placeholder="Enter Fund"
                          readOnly
                        />
                      </div>

                      {/* PAR No. */}
                      <div className="w-1/2 flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">PAR No.:</label>
                        <input
                          type="text"
                          value={'Generated After Saving'}
                          className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm italic text-gray-500 "
                          placeholder="Enter PAR Number"
                          readOnly
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
                          {getGroupedItemsHigh().map((group, index) => {
                            const firstItem = group[0]; // all in group are the same
                            const quantity = group.length;

                            return (
                              <tr key={index}>
                                <td className="border border-black px-2 py-2 text-xs">{quantity}</td>
                                <td className="border border-black px-2 py-2 text-xs">{firstItem.unit}</td>
                                <td className="border border-black px-2 py-2 text-xs whitespace-pre-line">
                                  {group.map(item => `${item.description} ${item.model} ${item.serialNo}`).join('\n')}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs italic text-gray-500">{'--Generated After Saving--'}</td>
                                <td className="border border-black px-2 py-2 text-xs">{firstItem.airDate}</td>
                                <td className="border border-black px-2 py-2 text-xs">
                                  {parseFloat(firstItem.unitCost) * quantity}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Fill up to 15 rows if needed */}
                          {Array.from({ length: Math.max(0, 15 - getGroupedItemsHigh().length) }, (_, i) => (
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
                        text-sm font-semibold">{headData.fullname || 'N/A'}</div>
                        <p className="text-xs">Signature over Printed Name of Supply and/or Property Custodian</p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                        text-sm font-semibold">{headData.position || 'N/A'}</div>
                        <p className="text-xs">Position/Office</p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                        text-sm font-semibold">{new Date().toLocaleDateString()}</div>
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
                      onClick={() => {
                        handleNextFromHighModal();
                      }}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {showModalLow && (
        <>
          {(() => {
            const lowGroups = groupByAirInfo(lowValue);
            const currentGroup = lowGroups[currentLowIndex] || [];
            const currentItem = currentGroup[0] || {};
            return(
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
                      <p className="text-sm">{department || ''}</p>
                      <p className="text-sm">Local Government Unit of Daet</p>
                      <p className="text-sm">Daet, Camarines Norte</p>
                    </div>

                    {/* Fund and ICS No. */}
                    <div className="flex gap-4 p-3 border-b border-black">
                      <div className="w-1/2 flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">Fund:</label>
                        <input
                          type="text"
                          value={currentItem.fund || ''}
                          className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm"
                          placeholder="Enter Fund"
                          readOnly
                        />
                      </div>
                      <div className="w-1/2 flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">ICS No.:</label>
                        <input
                          type="text"
                          value={'Generated After Saving'}
                          className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm italic text-gray-500 "
                          placeholder="Enter PAR Number"
                          readOnly
                        />
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
                    {getGroupedLowValueItems().map((group, index) => {
                      const firstItem = group[0];
                      const quantity = group.length;

                      return (
                        <div key={index} className="grid grid-cols-7 border-b border-gray-300 text-xs min-h-[30px]">
                          <div className="p-2 border-r border-black">{quantity}</div>
                          <div className="p-2 border-r border-black">{firstItem.unit || '-'}</div>
                          <div className="border-r border-black">
                            <div className="grid grid-cols-2 h-full">
                              <div className="p-2 border-r border-black">{firstItem.unitCost || '-'}</div>
                              <div className="p-2">{parseFloat(firstItem.unitCost) * quantity || '-'}</div>
                            </div>
                          </div>
                          <div className="p-2 border-r border-black whitespace-pre-line">
                            {group.map(item =>
                              `${item.description || '-'}`
                            ).join('\n')}
                          </div>
                          <div className="p-2 border-r border-black italic text-gray-500">{'--Generated After Saving--'}</div>
                          <div className="p-2">{firstItem.estimatedLife || '-'}</div>
                        </div>
                      );
                    })}

                    {Array.from({ length: Math.max(0, 15 - getGroupedLowValueItems().length) }, (_, i) => (
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
                          <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center"> {endUser || 'N/A'}</div>
                          <p className="text-xs text-center">Signature over Printed Name of End User</p>
                        </div>
                        <div className="mt-6 mb-4">
                          <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center"> {department || 'N/A'} </div>
                          <p className="text-xs text-center">Position/Office</p>
                        </div>
                        <div className="mt-6">
                          <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center"> {new Date().toLocaleDateString() || 'N/A'} </div>
                          <p className="text-xs text-center">Date</p>
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="p-4">
                        <div className="mb-4">
                          <p className="text-sm font-semibold">Issued by :</p>
                        </div>
                        <div className="mt-8 mb-4">
                          <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center">{headData.fullname || 'N/A'}</div>
                          <p className="text-xs text-center">Signature over Printed Name of Supply</p>
                          <p className="text-xs text-center">and/or Property Custodian</p>
                        </div>
                        <div className="mt-6 mb-4">
                          <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center">{headData.fullname || 'N/A'}</div>
                          <p className="text-xs text-center">Position/Office</p>
                        </div>
                        <div className="mt-6">
                          <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center">{new Date().toLocaleDateString() || 'N/A'}</div>
                          <p className="text-xs text-center">Date</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-4 border-t">
                  <button
                    onClick={() => setShowModalLow(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors mr-2"
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      handleNextFromLowModal();
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
            );
        })()}
        </>
      )}
    </div>
  );
};

export default Property_Assignment;