import React, { useState, useEffect, useRef} from 'react';
import { Plus, ChevronRight, X, Minus, ChevronDown, FileCheck, ClipboardList, BarChart, Users, Settings, FileText } from 'lucide-react';
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
  const [showSubDetails, setShowSubDetails] = useState(false);
  const [showArticleDropdown, setShowArticleDropdown] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalItem, setModalItem] = useState({
    airNo: '',
    airDate: '',
    fund: '',
    articleCode: '',
    article: '',
    description: '',
    model: '',
    serialNo: '',
    unit: 'unit',
    unitCost: '',
    usefulness: '',
    structureType: '',
    addshowSubDetails: false
  });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedUsefulness, setSelectedUsefulness] = useState(null);
  const [rawData, setRawData] = useState([]);

  const articleList = [
    { code: 'ART-001', name: 'Office Chair' },
    { code: 'ART-002', name: 'Office Desk' },
    { code: 'ART-003', name: 'Computer Monitor' },
    { code: 'ART-004', name: 'Laptop Computer' },
    { code: 'ART-005', name: 'Printer' },
    { code: 'ART-006', name: 'Filing Cabinet' },
    { code: 'ART-007', name: 'Whiteboard' },
    { code: 'ART-008', name: 'Projector' },
  ];

  const categoryMap = {
    "04": "Building and Other Structure",
    "05": "Machinery and Equipment",
    "06": "Transportation Equipment",
    "07": "Furniture, Fixtures and Books"
  };

  const groupDataByCategory = (data) => {
    const grouped = {};
    
    data.forEach(item => {
      const prefix = item.id.substring(0, 2);
      const category = categoryMap[prefix];
      
      if (category) {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(item);
      }
    });
    
    return grouped;
  };

  const assetData = groupDataByCategory(rawData);
  
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
    if (!modalItem.article) {
      setArticleResults([]);
      return;
    }
    const fetchArticles = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getArticle.php`, {
          params: { article: modalItem.article }
        });
        setArticleResults(response.data);
      } catch (error) {
        setArticleResults([]);
      }
    };
    fetchArticles();
  }, [modalItem.article, BASE_URL]);

  const handleOpenItemModal = () => {
    setModalItem({
      airNo: '',
      airDate: '',
      fund: '',
      articleCode: '',
      article: '',
      description: '',
      model: '',
      serialNo: '',
      unit: 'unit',
      unitCost: '',
      usefulness: '',
      structureType: '',
      addshowSubDetails: false
    });
    setShowItemModal(true);
  };

  const handleSaveItemModal = () => {
    if (showSubDetails) {
      const allFilled = Object.entries(modalItem)
        .filter(([key]) => key !== 'showSubDetails' && key !== 'structureType')
        .every(([_, value]) => value !== '');

      if (!allFilled) {
        Swal.fire({
          title: "Missing Fields",
          text: "Please fill out all fields before proceeding.",
          icon: "warning",
          confirmButtonText: "OK",
          customClass: {
            popup: "rounded-2xl",
            confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
          },
          buttonsStyling: false,
        });
        return;
      }
    } else {
      const allFilled = Object.entries(modalItem)
        .filter(([key]) => key !== 'model' && key !== 'serialNo' && key !== 'showSubDetails' && key !== 'structureType')
        .every(([_, value]) => value !== '');

      if (!allFilled) {
        Swal.fire({
          title: "Missing Fields",
          text: "Please fill out all required fields before proceeding.",
          icon: "warning",
          confirmButtonText: "OK",
          customClass: {
            popup: "rounded-2xl",
            confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
          },
          buttonsStyling: false,
        });
        setShowError(true);
        return;
      }
    }

    let updatedItem = {};

    if (showSubDetails) {
      updatedItem = { ...modalItem, addshowSubDetails: true };
    } else {
      updatedItem = { ...modalItem, addshowSubDetails: false };
    }
    setItems([...items, { ...updatedItem, id: Date.now() }]);
    setShowItemModal(false);
    setArticleResults([]);
    setArticleSearchQuery('');
    if (showSubDetails){
      setShowSubDetails(!showSubDetails);
    }
  };

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

  useEffect(() => {
    const getcategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/getCategories.php`);
        console.log('Category Data:', response.data.categories);

        const formattedCategories = response.data.categories.map(cat => {
          let usefulness;

          try {
            // Try to parse usefulness if it's a JSON string
            const parsed = JSON.parse(cat.usefulness);
            usefulness = typeof parsed === 'object' ? parsed : Number(parsed);
          } catch {
            // If parsing fails, just convert to number
            usefulness = Number(cat.usefulness);
          }

          return {
            ...cat,
            usefulness
          };
        });

        console.log('Formatted Category Data:', formattedCategories);
        setRawData(formattedCategories);
      } catch (error) {
        console.error('Error fetching GSO head:', error);
      }
    };
    getcategories();
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
    Swal.fire({
      title: "Remove Item?",
      text: "Are you sure you want to remove this item? This action cannot be undone.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mx-2",
        cancelButton: "bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded mx-2",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        setItems(items.filter(item => item.id !== id));
      }
    });
  };

  const handleClear = () => {
    Swal.fire({
      title: "Clear All Inputs?",
      text: "Are you sure you want to clear all fields? This action cannot be undone.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, clear all",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mx-2",
        cancelButton: "bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded mx-2",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        setEndUser('');
        setDepartment('');
        setItems([]);
      }
      else{
        console.log('not clear');
      }
    });
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
            title: "PAR Successfully Created!",
            icon: "success",
            html: `
              <p class="mt-2 font-medium">The following PAR No(s) have been successfully created:</p>
              <div class="mt-1 text-blue-600 font-semibold text-sm">${parNos.join(', ')}</div>
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
        const data = response.data;
        if (data.success) {
          const icsNos = data.received.icsNo || [];
          Swal.fire({
            title: "ICS Successfully Created!",
            icon: "success",
            html: `
              <p class="mt-2 font-medium">The following ICS No(s) have been successfully created:</p>
              <div class="mt-1 text-blue-600 font-semibold text-sm">${icsNos.join(', ')}</div>
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
        const data = response.data;

        if (data.success) {
          const parNos = data.received.parNo || [];
          const icsNos = data.received.icsNo || [];

          Swal.fire({
            title: "PAR / ICS Successfully Created!",
            icon: "success",
            html: `
              ${parNos.length > 0 ? `
                <p class="mt-2 font-medium">The following PAR No(s) have been successfully created:</p>
                <div class="mt-1 text-blue-600 font-semibold text-sm">${parNos.join(', ')}</div>
              ` : ''}

              ${icsNos.length > 0 ? `
                <p class="mt-4 font-medium">The following ICS No(s) have been successfully created:</p>
                <div class="mt-1 text-green-600 font-semibold text-sm">${icsNos.join(', ')}</div>
              ` : ''}
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

    if (formType === 'High' && lowValue.length === 0) {
      savedDataHigh();
    } else if (formType === 'Low' && highValue.length === 0) {
      savedDataLow();
    } else if (formType === 'Low' && highValue.length > 0) {
      saveDataBoth();
    }
  };

  const requiredFields = [
    "airNo",
    "airDate",
    "fund",
    "articleCode",
    "article",
    "description",
    "model",
    "serialNo",
    "unit",
    "unitCost"
  ];

  const handleConfirm = () => {
    if (!endUser) {
      Swal.fire({
        title: "Please fill all fields",
        icon: "warning",
        confirmButtonText: "OK",
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
        },
        buttonsStyling: false,
      }).then(() => {
        return;
      });
      return;
    }
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

    const validItems = showSubDetails
      ? currentGroupItems.filter(item =>
          item.airNo &&
          item.airDate &&
          item.fund &&
          item.article &&
          item.description &&
          item.model && // required only if showSubDetails is true
          item.unit
        )
      : currentGroupItems.filter(item =>
          item.airNo &&
          item.airDate &&
          item.fund &&
          item.article &&
          item.description &&
          item.unit // model not required
        );

    const grouped = {};

    validItems.forEach(item => {
      const key = showSubDetails
        ? `${item.fund}|${item.article}|${item.description}|${item.model}|${item.unit}`
        : `${item.fund}|${item.article}|${item.description}|${item.unit}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.values(grouped);
  };

  const getGroupedLowValueItems = () => {
    const groups = groupByAirInfo(lowValue);
    const currentGroupItems = groups[currentLowIndex] || [];

    const validItems = showSubDetails
      ? currentGroupItems.filter(item =>
          item.airNo &&
          item.airDate &&
          item.fund &&
          item.article &&
          item.description &&
          item.model && // required only if showSubDetails is true
          item.unit
        )
      : currentGroupItems.filter(item =>
          item.airNo &&
          item.airDate &&
          item.fund &&
          item.article &&
          item.description &&
          item.unit // model not required
        );

    const grouped = {};

    validItems.forEach(item => {
      const key = showSubDetails
        ? `${item.fund}|${item.article}|${item.description}|${item.model}|${item.unit}`
        : `${item.fund}|${item.article}|${item.description}|${item.unit}`;

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

  const dropdownWidth = 250;

  const filteredArticles = articleResults.filter(article => 
    article.categoryName.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
    article.categoryID.toLowerCase().includes(articleSearchQuery.toLowerCase())
  );

  const handleArticleSelect = (article) => {
    setModalItem({ 
      ...modalItem, 
      article: article.categoryName,
      articleCode: article.categoryID,
      usefulness: article.usefulness
    });
    setArticleSearchQuery(article.categoryName);
    setShowArticleDropdown(false);
  };

  const handleArticleInputChange = (value) => {
    setArticleSearchQuery(value);
    setModalItem({ ...modalItem, article: value });
    setShowArticleDropdown(true);
  };

  const toggleCategory = (category) => {
    // Close all other categories when opening a new one
    setExpandedCategories({ [category]: !expandedCategories[category] });
    setExpandedItems({}); // Also close all expanded items
  };

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const selectUsefulness = (itemName, type, value, itemId) => {
    setSelectedUsefulness({ item: itemName, type, value });
    
    // Update modalItem with the selected data
    setModalItem(prev => ({
      ...prev,
      articleCode: itemId || '', // e.g., "04-010", "05-020"
      article: itemName || '', // e.g., "Buildings", "Machinery"
      usefulness: value || '', // e.g., 10, 20, 30, 5, 7
      structureType: type || '' // "Wood", "Mix", "Concrete", or empty string for non-buildings
    }));
  };
  

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

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
            {/* <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Eye className="h-4 w-4" />
              View PAR/ICS
            </button> */}
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
                      readOnly
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
                          <td className="border border-gray-300 px-3 py-2">{item.airNo}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.airDate}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.fund}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.article}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.description}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.model}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.serialNo}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.unit}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            ₱{parseFloat(item.unitCost || 0).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
                  {/* {dropdownPosition && articleResults.length > 0 && (
                    <ul
                      className="fixed bg-white border border-gray-300 rounded shadow z-[9999] max-h-40 overflow-y-auto text-xs"
                      style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left + (dropdownPosition.width / 2) - (dropdownWidth / 2),
                        width: dropdownWidth
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
                  )} */}
                </div>


                {/* Add Item Button */}
                <div className="mt-4">
                  <button
                    onClick={handleOpenItemModal}
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

      {showItemModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowArticleDropdown(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Accountable Item</h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <div 
              className="flex-1 px-6 py-5 overflow-y-auto"
              onClick={() => setShowArticleDropdown(false)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4" onClick={(e) => e.stopPropagation()}>
                {/* Left Column */}
                <div className="space-y-4">
                  {/* AIR No */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      AIR No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="airNo"
                      value={modalItem.airNo}
                      onChange={e => setModalItem({ ...modalItem, airNo: e.target.value })}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 outline-none 
                        ${showError && modalItem.airNo === '' ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="Enter AIR number"
                    />
                    {showError && modalItem.airNo === '' && (
                      <p className="text-red-500 text-sm mt-1">AIR No. is required.</p>
                    )}
                  </div>

                  {/* AIR Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      AIR Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="airDate"
                      value={modalItem.airDate}
                      onChange={e => setModalItem({ ...modalItem, airDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                    />

                    {showError && modalItem.airDate === '' && (
                      <p className="text-red-500 text-sm mt-1">AIR Date. is required.</p>
                    )}
                  </div>

                  {/* Fund */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Fund <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fund"
                      value={modalItem.fund}
                      onChange={e => setModalItem({ ...modalItem, fund: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none bg-white"
                    >
                      <option value="">-- Select Fund --</option>
                      <option value="General Fund">General Fund</option>
                      <option value="Special Education Fund">Special Education Fund</option>
                      <option value="Trust Fund">Trust Fund</option>
                    </select>
                  </div>

                  {/* Article Code */}
                  {/* <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Article Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="articleCode"
                      value={modalItem.articleCode}
                      onChange={e => setModalItem({ ...modalItem, articleCode: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="Enter article code"
                    />
                  </div> */}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={modalItem.description}
                      onChange={e => setModalItem({ ...modalItem, description: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none resize-none"
                      placeholder="Enter item description"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Article */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Article <span className="text-red-500">*</span>
                    </label>
                    
                    {selectedUsefulness && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {selectedUsefulness.item}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {selectedUsefulness.type && `Type: ${selectedUsefulness.type} • `}
                          Usefulness: <span className="font-bold text-blue-600">{selectedUsefulness.value} years</span>
                        </p>
                      </div>
                    )}

                    <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto bg-white">
                      <div className="space-y-1 p-2">
                        {Object.entries(assetData).map(([category, items]) => (
                          <div key={category} className="border border-slate-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                            >
                              {expandedCategories[category] ? (
                                <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                              )}
                              <span className="text-sm font-semibold text-slate-800">{category}</span>
                            </button>

                            {expandedCategories[category] && (
                              <div className="bg-white">
                                {items.map((item) => (
                                  <div key={item.id} className="border-t border-slate-200">
                                    {typeof item.usefulness === 'object' ? (
                                      <>
                                        <button
                                          onClick={() => toggleItem(item.id)}
                                          className="w-full flex items-center gap-2 px-3 py-2 pl-6 hover:bg-slate-50 transition-colors text-left"
                                        >
                                          {expandedItems[item.id] ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                          )}
                                          <span className="text-xs text-slate-700">
                                            <span className="font-mono text-slate-500">{item.id}</span> - {item.name}
                                          </span>
                                        </button>

                                        {expandedItems[item.id] && (
                                          <div className="pl-10 pr-3 pb-2 space-y-1.5">
                                            <div className="grid grid-cols-1 gap-1.5">
                                              {Object.entries(item.usefulness).map(([type, value]) => (
                                                <button
                                                  key={type}
                                                  onClick={() => {
                                                    selectUsefulness(item.name, type, value, item.id);
                                                    setExpandedItems({});
                                                    setExpandedCategories({});
                                                  }}
                                                  className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-left transition-colors"
                                                >
                                                  <p className="text-xs text-slate-600 font-medium">{type}</p>
                                                  <p className="text-sm font-bold text-blue-600">{value} years</p>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          selectUsefulness(item.name, null, item.usefulness, item.id);
                                          setExpandedCategories({});
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 pl-6 hover:bg-slate-50 transition-colors text-left"
                                      >
                                        <span className="text-xs text-slate-700">
                                          <span className="font-mono text-slate-500">{item.id}</span> - {item.name}
                                        </span>
                                        <span className="ml-auto mr-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                          {item.usefulness} years
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button for Additional Details */}
                  <div className="flex items-center justify-between py-2.5 border-t border-b border-gray-200 mt-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Additional Details
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubDetails(!showSubDetails)
                        setModalItem({ ...modalItem, model: "", serialNo: "" })
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 font-medium text-sm"
                    >
                      {showSubDetails ? (
                        <>
                          <Minus size={16} />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Conditional Additional Fields */}
                  {showSubDetails && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Model
                          </label>
                          <input
                            type="text"
                            name="model"
                            value={modalItem.model}
                            onChange={e => setModalItem({ ...modalItem, model: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none bg-white"
                            placeholder="Enter model"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Serial No.
                          </label>
                          <input
                            type="text"
                            name="serialNo"
                            value={modalItem.serialNo}
                            onChange={e => setModalItem({ ...modalItem, serialNo: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none bg-white"
                            placeholder="Enter serial number"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unit & Unit Cost & Usefulness (Grid) */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="unit"
                        value={modalItem.unit}
                        onChange={e => setModalItem({ ...modalItem, unit: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                        placeholder="pcs"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Unit Cost <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="unitCost"
                        value={modalItem.unitCost}
                        onChange={e => {
                          // Allow only numbers and decimals while typing
                          const raw = e.target.value.replace(/[₱,]/g, '');
                          if (/^\d*\.?\d*$/.test(raw)) {
                            setModalItem({ ...modalItem, unitCost: raw });
                          }
                        }}
                        onBlur={e => {
                          // Format when leaving the input
                          const value = parseFloat(modalItem.unitCost);
                          if (!isNaN(value)) {
                            e.target.value = `₱${value.toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`;
                          } else {
                            e.target.value = '';
                          }
                        }}
                        onFocus={e => {
                          // Show only plain number again when focused
                          if (!isNaN(parseFloat(modalItem.unitCost))) {
                            e.target.value = modalItem.unitCost;
                          } else {
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                        placeholder="₱0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Useful Life <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="usefulness"
                        value={`${modalItem.usefulness ? modalItem.usefulness : 0} years`}
                        onChange={e => setModalItem({ ...modalItem, usefulness: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                        placeholder="Usefulness"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 mt-[10px] border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItemModal}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg order-1 sm:order-2"
              >
                Save Item
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
          `}</style>
        </div>
      )}

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
                                <td className="border border-black px-2 py-2 text-xs whitespace-pre-line">
                                  {group
                                    .map(item => 
                                      `₱${new Intl.NumberFormat('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      }).format(parseFloat(item.unitCost) || 0)}`
                                    )
                                    .join('\n')}
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
                              <div className="p-2 border-r border-black flex items-center justify-center">{firstItem.unitCost
                                ? `₱${new Intl.NumberFormat('en-PH', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }).format(firstItem.unitCost)}`
                                : '-'}
                              </div>
                              <div className="p-2 flex items-center justify-center">{firstItem.unitCost && quantity
                                ? `₱${new Intl.NumberFormat('en-PH', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }).format(parseFloat(firstItem.unitCost) * quantity)}`
                                : '-'}
                              </div>
                            </div>
                          </div>
                          <div className="p-2 border-r border-black whitespace-pre-line">
                            {group.map(item =>
                              `${item.description || '-'}`
                            ).join('\n')}
                          </div>
                          <div className="p-2 border-r border-black italic text-gray-500">{'--Generated After Saving--'}</div>
                          <div className="p-2">{firstItem.usefulness ? `${firstItem.usefulness} ${firstItem.usefulness > 1 ? 'years' : 'year'}` : '-'}</div>
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