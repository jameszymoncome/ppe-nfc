import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Trash, Radio, Calendar, MoreVertical, Tag, Activity, Sticker, CloudUpload, Download, WifiOff, Wifi, Eye, FileText, ChevronDown, Home, FileCheck, ClipboardList, BarChart, Users, Settings, Upload } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../utils/connection';
import html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { onMessage, sendMessage } from '../components/websocket';
import DeviceListModal from '../components/DeviceListModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { check } from 'prettier';

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";


pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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
  const [getDocPrint, setGetDocsPrint] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [selectedDevice, setSelectedDevice] = useState('');
  const [deviceListModal, setDeviceListModal] = useState(false);
  const [propertyNo, setPropertyNo] = useState('XXXX-XX-XXX-XXXX-XX');
  const [description, setDescription] = useState('Description');
  const [nfcId, setNfcId] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [docsPrint, setDocsPrint] = useState('');
  const [tableType, setTableType] = useState('');
  const [errorMessage, setErrorMessage] = useState("");
  const [headData, setHeadData] = useState([]);
  const [uploadScannedModal, setUploadScannedModal] = useState(false);
  const [droppedFile, setDroppedFile] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [docNos, setDocNos] = useState('');
  const [docTypes, setDocTypes] = useState('');
  const [showScanningModal, setShowScanningModal] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const [deviceList, setDeviceList] = useState([]);
  const [docsNos, setDocsNos] = useState('');
  const [selectedAirNo, setSelectedAirNo] = useState('');
  const [stickerData, setStickerData] = useState([]);
  const [connected, setConnected] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [idsSelected, setIdsSelected] = useState('');
  const [highlightBTN, setHighlightBTN] = useState('');
  const [formType, setFormType] = useState('');
  const [highlightBTNDocType, setHighlightBTNDocType] = useState('');
  const [highlightBTNDocsNO, setHighlightBTNDocsNO] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});
  const buttonRefs = useRef({});

  const [office, setOffice] = useState('');
  const [items, setItems] = useState([
    { id: 1, propertyNo: '', description: '', model: '', serialNo: '', icsNo: '', action: '' }
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!openMenuId) return;

      const menuEl = menuRefs.current[openMenuId];
      const buttonEl = buttonRefs.current[openMenuId];

      // Check if click is inside menu OR button
      if (
        (menuEl && menuEl.contains(e.target)) ||
        (buttonEl && buttonEl.contains(e.target))
      ) {
        return;
      }

      // Otherwise close it
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getItems.php`, {
        params: {
          role: localStorage.getItem("accessLevel"),
          usersID: localStorage.getItem("userId"),
          departments: localStorage.getItem("department")
        }
      });
      console.log(response.data);

      const formatted = response.data.items.map((item, index) => ({
        id: index + 1,
        air_no: item.air_no,
        documentNo: item.documentNo,
        tagID: item.tagID,
        type: item.type,
        user: item.user,
        office: item.office,
        dateIssued: item.dateIssued,
        items: item.items,
        status: item.status || 'N/A',
        downloadedForm: item.downloadedForm,
      }));

      setParIcsItem(formatted);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const fetchStickerData = async (air_no) => {
    console.log("Downloading files for AIR No:", air_no);
    try {
      const response = await axios.get(`${BASE_URL}/stickerData.php`, {
        params: { ids: air_no }
      })
      console.log("Sticker data response:", response.data.data);
      setStickerData(response.data.data);
    } catch (error) {
      console.error("Error fetching sticker data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onMessage((raw) => {
      try {
        const data = JSON.parse(raw);
        if (data.type === "deviceConnection" && data.message === "Connected") {
          console.log("Connections");
          setConnected("connect");
          setViewNFCModal(true);
        }
        if (data.type === "deviceConnection" && data.message === "Not connected") {
          console.log("No Connections");
          setConnected("not connect");
          setDeviceListModal(true);
        }
        if (data.type === "nfcEvent") {
          console.log("NFC Event:", data.uid);
          checkScannedID(data.uid);
          // checkScannedID(data.uid);
        }

        if (data.type === "status" && data.ssid) {
          setDeviceList((prev) =>
            prev.map((device) =>
              device.device_name === data.ssid
                ? { ...device, status: data.status }
                : device
            )
          );
        }
      } catch (err) {
        console.error("❌ Error parsing WS message:", err);
      }
    });

    return () => unsubscribe();
  }, [])

  useEffect(() => {
    if (selectedDevice) {
      setDeviceListModal(false);
      setViewNFCModal(true);
    }
  }, [selectedDevice])

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/deviceList.php`);
        console.log(response.data.data);
        setDeviceList(
          response.data.data.map((device) => ({
            ...device,
            status: deviceStatus[device.device_name] || "offline", // overwrite with latest WS status
          }))
        );
        // const deviceNames = response.data.data.map(item => item.device_name);
        // console.log(deviceNames);
      } catch (error) {
        console.error('Error fetching end users:', error);
      }
    };

    fetchDevices();
  },[]);

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

  const handleLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const checkScannedID = async (uid) => {
    setIsScanning(false);
    try {
      const response = await axios.get(`${BASE_URL}/checkTagScanned.php`, {
        params: {
          nfcId: uid,
        }
      });
      if (response.data.exists) {
        console.log('False: ',response.data.message);
        setErrorMessage(response.data.message);
        setNfcId(uid);

        setTimeout(() => {
          console.log('Reset scanning state');
          setIsScanning(true);
          setErrorMessage("");
          setNfcId('');
        }, 2000);
      } else {
        setNfcId(uid);
        setErrorMessage(response.data.message);
        console.log('Not found: ', response.data.message);
      }

    } catch (error) {
      console.error('❌ Error checking tag ID:', error);
      setErrorMessage("Something went wrong while scanning.");
      setIsScanning(false);
    }
  }

  const filterOptions = ['All', 'PAR', 'ICS'];

  const filteredDocuments = parIcsItem.filter(doc => {
    const matchesSearch = doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.office.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || doc.type === selectedFilter;
    let selectedDateMMDDYYYY = '';
    if (selectedDate) {
      const [yyyy, mm, dd] = selectedDate.split('-');
      selectedDateMMDDYYYY = `${mm}-${dd}-${yyyy}`;
    }
    const matchesDate = selectedDate ? selectedDateMMDDYYYY === doc.dateIssued : true;

    return matchesSearch && matchesFilter && matchesDate;
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

  const checkConnection = () => {
    sendMessage({
      type: "connection",
      userID: localStorage.getItem("userId")
    });
  }

  const viewData = async (user, department, docNo, types, stats) => {
    setUsers(user);
    setDepartments(department);
    setDocsNos(docNo);
    setTableType(types);
    setViewModal(true);
    try {
      const response = await axios.get(`${BASE_URL}/getDocsData.php`, {
        params: {
          docNo,
          types
        }
      });
      console.log('Result: ',response.data);
      setGetDocDatas(response.data);
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const printDocs = async (docsNo, typess, dept, downloadedForm) => {
    setHighlightBTNDocsNO(docsNo);
    setHighlightBTNDocType(typess);
    setHighlightBTN(downloadedForm);
    setDepartments(dept);
    console.log('Types: ', downloadedForm);
    if(typess === 'PAR'){
      setDocsPrint('par');
    } else{
      setDocsPrint('ics');
    }
    try {
      const response = await axios.get(`${BASE_URL}/printDocs.php`, {
        params: {
          docsNo,
          typess
        }
      });
      console.log(response.data);
      setGetDocsPrint(response.data);
      
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const getGroupedItems = () => {
    const validItems = getDocPrint.filter(item =>
      item.air_no &&
      item.air_date &&
      item.fund &&
      item.article &&
      item.description &&
      item.model &&
      item.unit
    );

    const grouped = {};

    validItems.forEach(item => {
      const key = `${item.fund}|${item.article}|${item.description}|${item.model}|${item.unit}|${item.unitCost}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.values(grouped);
  };

  const groupedItems = getGroupedItems();

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
    checkConnection();
    // setViewNFCModal(true);
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

  const handleExportPDF = () => {
    const contentICS = `
      <div style="font-family: Arial, sans-serif; font-size: 10px; padding: 20px;">
        <div style="text-align: center; font-size: 20px; font-weight: bold;">
          INVENTORY CUSTODIAN SLIP
        </div>
        <div style="text-align: center; font-size: 11px;">
          ${departments}
        </div>
        <div style="text-align: center; font-size: 11px;">
          Local Goverment Unit of Daet
        </div>
        <div style="text-align: center; font-size: 11px;">
          Daet Camarines Norte
        </div>

        <table style="width:100%; margin-top: 30px; border-collapse: collapse; font-size: 10px; text-align: center;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Quantity</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Unit</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" colspan="2">Amount</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Description</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Inventory Item No.</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Estimated Useful Life</th>
            </tr>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; font-size: 9px; font-weight: normal;">Unit Cost</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; font-size: 9px; font-weight: normal;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${groupedItems.map(group => `
              <tr style="background-color: #fff; padding: 5px;">
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group.length || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >${group[0]?.unit || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >
                  ${group.map(item => `${item.unitCost}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >
                  ${group.map(item => (item.unitCost * group.length).toFixed(2)).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >
                  ${group.map(item => `${item.description} ${item.model} ${item.serialNo}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.itemNOs}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.unitCost}`).join('<br>')}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>

        <div style="margin-top: 90px; display: flex; justify-content: space-around;">
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Received by:</div>
            <div style="margin-top: 25px;">${groupedItems[0][0]?.enduserName || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of End User</div>
            <div style="margin-top: 25px;">${departments || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Received by:</div>
            <div style="margin-top: 25px;">${headData.fullname || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of Supply and/or Property Custodian</div>
            <div style="margin-top: 25px;">${headData.position || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
        </div>
      </div>
    `;
    const contentPAR = `
      <div style="font-family: Arial, sans-serif; font-size: 10px; padding: 20px;">
        <div style="text-align: center; font-size: 20px; font-weight: bold;">
          PROPERTY ACKNOWLEDGMENT RECEIPT
        </div>
        <div style="text-align: center; font-size: 11px;">
          ${departments}
        </div>
        <div style="text-align: center; font-size: 11px;">
          Local Goverment Unit of Daet
        </div>
        <div style="text-align: center; font-size: 11px;">
          Daet Camarines Norte
        </div>

        <table border="1" cellspacing="0" cellpadding="10" style="width:100%; margin-top: 30px; border-collapse: collapse; font-size: 10px; text-align: center;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Quantity</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Unit</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Description</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Property Number</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Date Acquired</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            ${groupedItems.map(group => `
              <tr style="background-color: #fff; padding: 5px;">
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group.length || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group[0]?.unit || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.description} ${item.model} ${item.serialNo}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.itemNOs}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group[0]?.dateAcquired || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.unitCost}`).join('<br>')}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>

        <div style="margin-top: 90px; display: flex; justify-content: space-around;">
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Received by:</div>
            <div style="margin-top: 25px;">${groupedItems[0][0]?.enduserName || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of End User</div>
            <div style="margin-top: 25px;">${departments || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Received by:</div>
            <div style="margin-top: 25px;">${headData.fullname || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of Supply and/or Property Custodian</div>
            <div style="margin-top: 25px;">${headData.position || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = (docsPrint === 'par') ? contentPAR : contentICS;

    html2pdf().set({
      margin: 0.5,
      filename: `${`${docsPrint === 'par' ? 'PAR' : 'ICS'}-${groupedItems[0][0]?.enduserName}`.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    })
    .from(element)
    .save()
    .catch((error) => {
      console.error("❌ Error generating PDF:", error);
    });
  }

  const updateHighlight = async () => {
    console.log('Updating highlight for:', highlightBTNDocsNO, highlightBTNDocType);
    try {
      const response = await axios.post(`${BASE_URL}/updateHighlight.php`, {
        docsNo: highlightBTNDocsNO,
        types: highlightBTNDocType
      });
      console.log(response.data);
      fetchItems();
      // setGetDocsPrint(response.data);
      
    } catch (error) {
      console.error('Error fetching end users:', error);
    }
  }

  const handlePrintPDF = () => {
    const contentICS = `
      <div style="font-family: Arial, sans-serif; font-size: 10px; padding: 20px;">
        <div style="text-align: center; font-size: 20px; font-weight: bold;">
          INVENTORY CUSTODIAN SLIP
        </div>
        <div style="text-align: center; font-size: 11px;">
          ${departments}
        </div>
        <div style="text-align: center; font-size: 11px;">
          Local Goverment Unit of Daet
        </div>
        <div style="text-align: center; font-size: 11px;">
          Daet Camarines Norte
        </div>

        <table style="width:100%; margin-top: 30px; border-collapse: collapse; font-size: 10px; text-align: center;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Quantity</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Unit</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" colspan="2">Amount</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Description</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Inventory Item No.</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;" rowspan="2">Estimated Useful Life</th>
            </tr>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; font-size: 9px; font-weight: normal;">Unit Cost</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; font-size: 9px; font-weight: normal;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${groupedItems.map(group => `
              <tr style="background-color: #fff; padding: 5px;">
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group.length || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >${group[0]?.unit || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >
                  ${group.map(item => `${item.unitCost}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >
                  ${group.map(item => (item.unitCost * group.length).toFixed(2)).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;" >
                  ${group.map(item => `${item.description} ${item.model} ${item.serialNo}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.itemNOs}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.unitCost}`).join('<br>')}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>

        <div style="padding-top: 50px; border: 1px solid #000; border-collapse: collapse; display: flex; justify-content: space-around;">
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Received by:</div>
            <div style="margin-top: 25px;">${groupedItems[0][0]?.enduserName || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of End User</div>
            <div style="margin-top: 25px;">${departments || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Issued by:</div>
            <div style="margin-top: 25px;">${headData.fullname || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of Supply and/or Property Custodian</div>
            <div style="margin-top: 25px;">${headData.position || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
        </div>
      </div>
    `;
    const contentPAR = `
      <div style="font-family: Arial, sans-serif; font-size: 10px; padding: 20px;">
        <div style="text-align: center; font-size: 20px; font-weight: bold;">
          PROPERTY ACKNOWLEDGMENT RECEIPT
        </div>
        <div style="text-align: center; font-size: 11px;">
          ${departments}
        </div>
        <div style="text-align: center; font-size: 11px;">
          Local Goverment Unit of Daet
        </div>
        <div style="text-align: center; font-size: 11px;">
          Daet Camarines Norte
        </div>

        <table border="1" cellspacing="0" cellpadding="10" style="width:100%; margin-top: 30px; border-collapse: collapse; font-size: 10px; text-align: center;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Quantity</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Unit</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Description</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Property Number</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Date Acquired</th>
              <th style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; background-color: #f0f0f0;">Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            ${groupedItems.map(group => `
              <tr style="background-color: #fff; padding: 5px;">
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group.length || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group[0]?.unit || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.description} ${item.model} ${item.serialNo}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.itemNOs}`).join('<br>')}
                </td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">${group[0]?.dateAcquired || '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center;">
                  ${group.map(item => `${item.unitCost}`).join('<br>')}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>

        <div style="margin-top: 90px; display: flex; justify-content: space-around;">
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Received by:</div>
            <div style="margin-top: 25px;">${groupedItems[0][0]?.enduserName || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of End User</div>
            <div style="margin-top: 25px;">${departments || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
          <div style="text-align: center; font-size: 10px; font-weight: bold;">
            <div>Issued by:</div>
            <div style="margin-top: 25px;">${headData.fullname || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Signature over Printed Name of Supply and/or Property Custodian</div>
            <div style="margin-top: 25px;">${headData.position || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Position/Office</div>
            <div style="margin-top: 25px;">${new Date().toLocaleDateString() || 'N/A'}</div>
            <div style="border-top: 1px solid black; margin-top: 5px;"></div>
            <div>Date</div>
          </div>
        </div>
      </div>
    `;
    printContent((docsPrint === 'par') ? contentPAR : contentICS);
  }

  const printContent = (html) => {
    const frame = document.createElement('iframe');
    frame.style.position = 'absolute';
    frame.style.top = '-9999px';
    frame.style.left = '-9999px';

    document.body.appendChild(frame);

    const frameDoc = frame.contentWindow || frame.contentDocument;
    const doc = frameDoc.document || frameDoc;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 10px; }
            table, th, td {
              border: 1px solid black;
              border-collapse: collapse;
            }
            th, td {
              padding: 5px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    doc.close();

    frame.onload = () => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => document.body.removeChild(frame), 1000);
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf" && file.size <= 50 * 1024 * 1024) {
      setDroppedFile(file);
      // Automatically upload after setting the file
      setTimeout(() => handleUpload(file), 0);
    } else {
      alert("Only PDF files up to 50MB are allowed.");
    }
  };

  const handleUpload = async (fileArg) => {
    const fileToUpload = fileArg || droppedFile;
    if (!fileToUpload) return alert("No file selected");

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("docNos", docNos);
    formData.append("docTypes", docTypes);
    formData.append("tagIds", idsSelected);

    try {
      setUploading(true);
      setUploadProgress(0);

      const response = await axios.post(`${BASE_URL}/uploadScannedFile.php`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      console.log(response.data);

    } catch (error) {
      console.error("Upload failed", error);
      if (error.response) {
        // ✅ Server responded with an error (e.g., 400 or 500)
        console.error("Server error:", error.response.data);

        // Show server error to user
        const serverMessage = error.response.data.error || error.response.data.warning || "Unknown error from server";
        alert("Server Error: " + serverMessage);
      } else if (error.request) {
        console.error("No response from server:", error.request);
        alert("No response from server. Please check your internet or CORS settings.");
      } else {
        // 😵 Other unknown error
        alert("Upload failed: " + error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (airNo, typeofDocs) => {
    setSelectedAirNo(airNo);
    fetchStickerData(airNo);
    setFormType(typeofDocs);
    setDownloadModal(true);
    // try {
    //   const response = await axios.get(`${BASE_URL}/downloadFile.php`, {
    //     params: { air_no: airNo },
    //     responseType: 'blob',
    //   });

    //   const fileName = response.headers['content-disposition']
    //     ?.split('filename=')[1]
    //     ?.replace(/["']/g, '') || `${airNo}.pdf`;

    //   saveAs(new Blob([response.data], { type: 'application/pdf' }), fileName);
    // } catch (error) {
    //   console.error('Download error:', error);
    //   alert('File download failed.');
    // }
  };

  const downloadDocs = async () => {
    console.log("Downloading file for ID:", selectedAirNo);
    try {
      const response = await axios.get(`${BASE_URL}/downloadFile.php`, {
        params: { air_no: selectedAirNo, formType: formType },
        responseType: 'blob',
      });

      const fileName = response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/["']/g, '') || `${selectedAirNo}.pdf`;

      saveAs(new Blob([response.data], { type: 'application/pdf' }), fileName);
    } catch (error) {
      console.error('Download error:', error);
      alert('File download failed.');
    }
  };

  const downloadViewDocs = async (airNo, typest) => {
    if (!airNo) return alert("Please enter AIR No first.");
    console.log("Viewing PDF for AIR No:", airNo);

    try {
      const response = await axios.get(`${BASE_URL}/viewPDFFile.php`, {
        params: { airNo: airNo, formType: typest },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching PDF:", error);
      alert("Failed to load PDF file.");
    }
  };

  const downloadSticker = () => {
    console.log("Printing stickers for IDs:", selectedAirNo);
    const pdf = new jsPDF("p", "mm", "a4");
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const stickerWidth = pageWidth / 2;
    const stickerHeight = 70;
    const gap = 10; // Gap between stickers
    const marginTop = 10;
    let currentY = marginTop;

    for (let i = 0; i < stickerData.length; i++) {
      const item = stickerData[i];

      if (currentY + stickerHeight > pageHeight - marginTop) {
        pdf.addPage();
        currentY = marginTop;
      }
  
      const x = (pageWidth - stickerWidth) / 2;

      const borderRadius = 1; // Adjust the border radius as needed
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, currentY, stickerWidth, stickerHeight, borderRadius, borderRadius);

      const imageUrl = "/assets/images/lgu_seal.png"; // Replace with the actual image path or base64 string
      const imageWidth = 40; // Adjust the image width
      const imageHeight = 40; // Adjust the image height
      const imageX = x + (stickerWidth - imageWidth) / 2; // Center the image horizontally within the box
      const imageY = currentY + (stickerHeight - imageHeight) / 2; // Center the image vertically within the box
      
      // Create graphics state with 30% opacity
      const gState = pdf.GState({ opacity: 0.3 });
      pdf.setGState(gState);

      pdf.addImage(imageUrl, "PNG", imageX, imageY, imageWidth, imageHeight);

      // Reset to full opacity so next drawings aren’t transparent
      pdf.setGState(new pdf.GState({ opacity: 1 }));

      // Add text at the top of the box
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "bold");
      pdf.text("LOCAL GOVERNMENT UNIT OF DAET", x + 3, currentY + 6.5);

      pdf.setFontSize(6);
      const text = "NO. " + item.item_id;
      const textWidth = pdf.getTextWidth(text);
      pdf.setFont("helvetica", "normal");
      pdf.text(text, x + stickerWidth - textWidth - 5, currentY + 6.3);

      const texts = "Inventory Tag";
      const textWidths = pdf.getTextWidth(texts);
      pdf.setFont("helvetica", "normal");
      pdf.text(texts, x + stickerWidth - textWidths - 13, currentY + 9);

      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      pdf.text("GOVERNMENT PROPERTY", x + 3, currentY + 10);


      pdf.setLineWidth(0.2);

      const departmentText = item.department || ""; // Assuming `item.department` contains the value you want to display
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const departmentTextWidth = pdf.getTextWidth(departmentText);
      const departmentTextX = x + (stickerWidth - departmentTextWidth) / 2; // Center the text horizontally
      const departmentTextY = currentY + 17; // Position the text just above the line
      pdf.text(departmentText, departmentTextX, departmentTextY);

      const lineStartX = x + 35; // Start 3mm from the left edge of the box
      const lineEndX = x + stickerWidth - 35; // End 3mm from the right edge of the box
      const lineY = currentY + 18; // Position the line just below the "GOVERNMENT PROPERTY" text
      pdf.line(lineStartX, lineY, lineEndX, lineY); // Draw the horizontal line

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const officeText = "Office / Location:";
      const officeTextWidth = pdf.getTextWidth(officeText);
      pdf.text(officeText, x + (stickerWidth - officeTextWidth) / 2, lineY + 3);

      
      const articleText = "Article:";
      const articleTextWidth = pdf.getTextWidth(articleText);
      const articleY = lineY + 11; // Position 10mm below the line
      pdf.text(articleText, x + 3, articleY); // Align "Article" to the left inside the box

      const descriptionText = item.articles || ""; // Assuming `item.articles` contains the value you want to display
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const descriptionTextWidth = pdf.getTextWidth(descriptionText);
      const descriptionTextX = x + articleTextWidth + 15;
      const descriptionTextY = articleY - 1; // Position the text just above the line
      pdf.text(descriptionText, descriptionTextX, descriptionTextY);

      // Draw a line beside "Article"
      const articleLineStartX = x + 3 + articleTextWidth + 2; // Start the line right after "Article" with a 2mm gap
      const articleLineEndX = x + stickerWidth - 3; // End the line near the right edge of the box
      pdf.line(articleLineStartX, articleY, articleLineEndX, articleY); // Draw the line

      const propertyText = "Property No.";
      const propertyTextWidth = pdf.getTextWidth(propertyText);
      const propertyY = articleY + 4.5; // Position 10mm below the "Article" line
      pdf.text(propertyText, x + 3, propertyY); // Align "Property No." to the left
      
      const itemIdText = item.item_id || ""; // Assuming `item.item_id` contains the value you want to display
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const itemIdTextWidth = pdf.getTextWidth(itemIdText);
      const itemIdTextX = x + propertyTextWidth + 10; // Align the text to the left
      const itemIdTextY = propertyY - 1; // Position the text just above the line
      pdf.text(itemIdText, itemIdTextX, itemIdTextY);

      // Draw a line beside "Property No."
      const propertyLineStartX = x + 3 + propertyTextWidth + 2; // Start the line right after "Property No." with a 2mm gap
      const propertyLineEndX = x + stickerWidth / 2 - 5; // End the line halfway through the box
      pdf.line(propertyLineStartX, propertyY, propertyLineEndX, propertyY); // Draw the line

      // Add "Serial No." next to the line
      const serialText = "Serial No.:";
      const serialTextWidth = pdf.getTextWidth(serialText);
      const serialTextX = propertyLineEndX + 5; // Start "Serial No." 5mm after the first line
      pdf.text(serialText, serialTextX, propertyY); // Position "Serial No." next to the line

      const serialNoText = item.serial_no || ""; // Assuming `item.serial_no` contains the value you want to display
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const serialNoTextWidth = pdf.getTextWidth(serialNoText);
      const serialNoTextX = serialTextX + 22; // Align the text to the same starting point as "Serial No."
      const serialNoTextY = propertyY - 1; // Position the text just above the line
      pdf.text(serialNoText, serialNoTextX, serialNoTextY);

      // Draw a line beside "Serial No."
      const serialLineStartX = serialTextX + serialTextWidth + 2; // Start the line right after "Serial No." with a 2mm gap
      const serialLineEndX = x + stickerWidth - 3; // End the line near the right edge of the box
      pdf.line(serialLineStartX, propertyY, serialLineEndX, propertyY); // Draw the line

      const serviceableText = "Serviceable";
      const serviceableTextWidth = pdf.getTextWidth(serviceableText);
      const serviceableY = propertyY + 4.5; // Position 10mm below the "Article" line
      pdf.text(serviceableText, x + 3, serviceableY); // Align "Property No." to the left
    
      // Draw a line beside "Property No."
      const serviceableLineStartX = x + 3 + serviceableTextWidth + 2; // Start the line right after "Property No." with a 2mm gap
      const serviceableLineEndX = x + stickerWidth / 2 - 5; // End the line halfway through the box
      pdf.line(serviceableLineStartX, serviceableY, serviceableLineEndX, serviceableY); // Draw the line
  
      const unserviceableText = "Unserviceable";
      const unserviceableTextWidth = pdf.getTextWidth(unserviceableText);
      const unserviceableTextX = serviceableLineEndX + 5; // Start "Serial No." 5mm after the first line
      pdf.text(unserviceableText, unserviceableTextX, serviceableY); // Position "Serial No." next to the line
  
      // Draw a line beside "Serial No."
      const unserviceableStartX = unserviceableTextX + unserviceableTextWidth + 2; // Start the line right after "Serial No." with a 2mm gap
      const unserviceableLineEndX = x + stickerWidth - 3; // End the line near the right edge of the box
      pdf.line(unserviceableStartX, serviceableY, unserviceableLineEndX, serviceableY); // Draw the line
  
      // Add "Unit / Quantity" and "Total Cost" with lines beside them
      const unitText = "Unit / Quantity:";
      const unitTextWidth = pdf.getTextWidth(unitText);
      const unitY = serviceableY + 4.5; // Position below "Serviceable" line
      pdf.text(unitText, x + 3, unitY); // Align "Unit / Quantity" to the left

      const quantityText = item.quantity ? String(item.quantity) : ""; // Assuming `item.quantity` contains the value you want to display
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const quantityTextWidth = pdf.getTextWidth(quantityText);
      const quantityTextX = x + unitTextWidth + 10; // Align the text to the left
      const quantityTextY = unitY - 1; // Position the text just above the line
      pdf.text(quantityText, quantityTextX, quantityTextY);
  
      // Draw a line beside "Unit / Quantity"
      const unitLineStartX = x + 3 + unitTextWidth + 2; // Start the line right after "Unit / Quantity" with a 2mm gap
      const unitLineEndX = x + stickerWidth / 2 - 5; // End the line halfway through the box
      pdf.line(unitLineStartX, unitY, unitLineEndX, unitY); // Draw the line
  
      // Add "Total Cost" next to the line
      const totalCostText = "Total Cost:";
      const totalCostTextWidth = pdf.getTextWidth(totalCostText);
      const totalCostX = unitLineEndX + 5; // Start "Total Cost" 5mm after the first line
      pdf.text(totalCostText, totalCostX, unitY); // Position "Total Cost" next to the line

      const unitPriceText = item.unit_price ? String(item.unit_price) : ""; // Assuming `item.unit_price` contains the value you want to display
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const unitPriceTextWidth = pdf.getTextWidth(unitPriceText);
      const unitPriceTextX = totalCostX + 23; // Align the text to the same starting point as "Total Cost"
      const unitPriceTextY = unitY - 1; // Position the text just above the line
      pdf.text(unitPriceText, unitPriceTextX, unitPriceTextY);
  
      // Draw a line beside "Total Cost"
      const totalCostLineStartX = totalCostX + totalCostTextWidth + 2; // Start the line right after "Total Cost" with a 2mm gap
      const totalCostLineEndX = x + stickerWidth - 3; // End the line near the right edge of the box
      pdf.line(totalCostLineStartX, unitY, totalCostLineEndX, unitY); // Draw the line
  
      // Add two lines and a QR code below the second line
      const line1Y = unitY + 9; // Position the first line 6mm below "Unit / Quantity"
      const line2Y = line1Y + 2; // Position the second line 6mm below the first line
  
      // Calculate the width for each line
      const lineWidth = (stickerWidth - 20) / 3; // Divide the space into three parts (two lines and QR code)
      const line1StartX = x + 8; // Start the first line from the left margin
      const line1EndX = line1StartX + lineWidth; // End the first line
      const line2StartX = line1EndX + 10; // Leave a 10mm gap and start the second line
      const line2EndX = line2StartX + lineWidth; // End the second line
  
      // Draw the first line
      pdf.line(line1StartX, line1Y, line1EndX, line1Y);
  
      // Draw the second line
      pdf.line(line2StartX, line1Y, line2EndX, line1Y);
  
      const dateAcquiredText = "Date (Acquired)";
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.text(dateAcquiredText, x + 13, line2Y + 1); // Position the label

      const dateAcquiredValue = item.date_acquisition || "";
      pdf.text(dateAcquiredValue, x + 15, line2Y - 3);

      const dateCountedText = "Date (Counted)";
      const dateAcquiredTextWidth = pdf.getTextWidth(dateAcquiredText);
      const dateCountedX = x + 8 + dateAcquiredTextWidth + 26;
      pdf.text(dateCountedText, dateCountedX, line2Y + 1);

      const dateCountedValue = item.date || "";
      pdf.text(dateCountedValue, dateCountedX + 3, line2Y - 3);
  
      const lineUnderDateY = line2Y + 1 + 7; // Position 6mm below "Date (Acquired)" and "Date (Counted)"
  
      // Calculate the width for each line
      const lineUnderDateWidth = (stickerWidth - 20) / 3; // Divide the space into two equal parts
      const lineUnderDateStartX1 = x + 8; // Start the first line from the left margin
      const lineUnderDateEndX1 = lineUnderDateStartX1 + lineUnderDateWidth; // End the first line
      const lineUnderDateStartX2 = lineUnderDateEndX1 + 10; // Leave a 10mm gap and start the second line
      const lineUnderDateEndX2 = lineUnderDateStartX2 + lineUnderDateWidth;
  
      pdf.line(lineUnderDateStartX1, lineUnderDateY, lineUnderDateEndX1, lineUnderDateY);

      // Draw the second line
      pdf.line(lineUnderDateStartX2, lineUnderDateY, lineUnderDateEndX2, lineUnderDateY);

      // Add "COA Representative" text
      const coaRepresentativeText = "COA Representative:";
      const coaRepresentativeY = lineUnderDateY + 3; // Position 6mm below the line
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.text(coaRepresentativeText, x + 11, coaRepresentativeY); // Align "COA Representative" to the left

      // Add "Property Custodian" text
      const propertyCustodianText = "Property Custodian:";
      const coaRepresentativeTextWidth = pdf.getTextWidth(coaRepresentativeText);
      const propertyCustodianX = x + 3 + coaRepresentativeTextWidth + 24; // Add a 20mm gap after "COA Representative"
      pdf.text(propertyCustodianText, propertyCustodianX, coaRepresentativeY);

      // Add item.custodian_name above the "Property Custodian" line
      const custodianName = item.custodian_name || ""; // Assuming `item.custodian_name` contains the value
      const custodianNameX = propertyCustodianX; // Align with "Property Custodian"
      const custodianNameY = lineUnderDateY - 2; // Position the text just above the line
      pdf.text(custodianName, custodianNameX, custodianNameY);

      // Add a QR code to the right of the second line
      // const qrCodeX = line2EndX + 5; // Position the QR code 10mm to the right of the second line
      // const qrCodeY = line1Y - 7; // Align the QR code vertically with the lines
      // const qrCodeSize = 25; // Set the size of the QR code
      // const qrCodeText = item.item_id; // Replace with your QR code content
      // const logoUrl = "/ppe_logo.png";

      // try {
      //   const qrCodeImage = await generateQRCode(qrCodeText); // Wait for QR code generation
      //   if (qrCodeImage) {
      //     // Add the QR code to the PDF
      //     pdf.addImage(qrCodeImage, "PNG", qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
      
      //     // Create a white square "hole" in the center of the QR code
      //     const logoSize = qrCodeSize / 5; // Set the logo size to 1/3 of the QR code size
      //     const logoX = qrCodeX + (qrCodeSize - logoSize) / 2; // Center the logo horizontally within the QR code
      //     const logoY = qrCodeY + (qrCodeSize - logoSize) / 2; // Center the logo vertically within the QR code
      //     pdf.setFillColor(255, 255, 255); // Set the fill color to white
      //     pdf.rect(logoX, logoY, logoSize, logoSize, "F"); // Draw a filled rectangle (white square)
      
      //     pdf.addImage(qrCodeImage, "PNG", qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
      //     console.log("QR Code Content:", qrCodeText);
      //   } else {
      //     console.error("Failed to generate QR code.");
      //   }
      // } catch (error) {
      //   console.error("Error generating QR code:", error);
      // }

      currentY += stickerHeight + gap;

    }

    pdf.save(`${selectedAirNo.replace(/\s+/g, '_')}Sticker.pdf`);
  }

  const getStatusColors = (status) => {
    return status === 'online' ? 'text-green-600' : 'text-red-500';
  };

  const getStatusBg = (status) => {
    return status === 'online' ? 'bg-green-100' : 'bg-red-100';
  };

  const StatusIcon = ({ status }) => {
    if (status === 'online') {
      return <Wifi className="w-4 h-4 text-green-600" />;
    }
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const goToViewItem = (airs, type, airnos) => {
    console.log("View item:", airs, type);
    navigate("/progress-item", {
      state: { air_no: airs, type: type, airnos: airnos }
    });
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
                    <td className="py-4 px-6 text-sm text-gray-900 text-center">{doc.office}</td>
                    <td className="py-4 px-6 text-sm text-gray-900">{doc.dateIssued}</td>
                    <td className="py-4 px-6 text-sm text-gray-900 text-center">{doc.items}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="relative text-center">
                      <button
                        ref={(el) => (buttonRefs.current[doc.id] = el)}
                        onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                        className="p-1 rounded hover:bg-gray-100 transition"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-700" />
                      </button>

                      {openMenuId === doc.id && (
                        <div
                          ref={(el) => (menuRefs.current[doc.id] = el)}
                          className="absolute right-0 mt-2 w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-20 text-left"
                        >
                          {doc.status === "For Tagging" && (
                            <>
                              <button
                                onClick={() => {
                                  goToViewItem(doc.documentNo, doc.type, doc.air_no);
                                  // viewData(doc.user, doc.office, doc.documentNo, doc.type, doc.status);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 text-gray-700 text-sm"
                              >
                                <Tag className="h-4 w-4 text-blue-600" />
                                <span>For Tagging</span>
                              </button>
                              <button
                                onClick={() => {
                                  printDocs(doc.documentNo, doc.type, doc.office, doc.downloadedForm);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 text-gray-700 text-sm"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span>View</span>
                              </button>
                            </>
                          )}

                          {doc.status === "Upload Scanned Copy" && (
                            <>
                              <button
                                onClick={() => {
                                  goToViewItem(doc.documentNo, doc.type, doc.air_no);
                                  // viewData(doc.user, doc.office, doc.documentNo, doc.type, doc.status);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 text-gray-700 text-sm"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span>Upload Scanned Copy</span>
                              </button>

                              <button
                                onClick={() => {
                                  printDocs(doc.documentNo, doc.type, doc.office, doc.downloadedForm);
                                  setOpenMenuId(null);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 w-full
                                  ${doc.downloadedForm === 'Not Done' ? "bg-blue-500 text-white" : "text-gray-700"} 
                                  hover:bg-blue-600 hover:text-white transition`}
                              >
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span>Download Form</span>
                              </button>

                              {/* <button
                                onClick={() => {
                                  setDocNos(doc.air_no);
                                  setDocTypes(doc.type);
                                  setIdsSelected(doc.tagID);
                                  setUploadScannedModal(true);
                                  setOpenMenuId(null);
                                }}
                                // className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 text-gray-700 text-sm"
                                className={`flex items-center gap-2 px-4 py-2 w-full rounded-md border 
                                  ${doc.downloadedForm === 'Upload Scanned Form' ? "bg-blue-500 text-white" : "text-gray-700"} 
                                  hover:bg-blue-600 hover:text-white transition text-sm`}
                                
                              >
                                <Upload className="h-4 w-4 text-green-600" />
                                <span>Upload Scanned Form</span>
                              </button> */}
                            </>
                          )}

                          {doc.status === "Assigned" && (
                            <>
                              <button
                                onClick={() => {
                                  downloadViewDocs(doc.air_no, doc.type);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 text-gray-700 text-sm"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleDownload(doc.air_no, doc.type);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 text-gray-700 text-sm"
                              >
                                <Download className="h-4 w-4 text-orange-600" />
                                <span>Download</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter name..."
                      readOnly
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

      {docsPrint === 'par' && (
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
                <p className="text-sm">{departments || ''}</p>
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
                    value={getDocPrint[0]?.fund || ''}
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
                    value={getDocPrint[0]?.docsNo || ''}
                    className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm"
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
                    {groupedItems.map((group, index) => {
                      const firstItem = group[0]; // representative item
                      const quantity = group.length;
                      const totalAmount = parseFloat(firstItem.unitCost) * quantity;

                      return (
                        <tr key={index}>
                          <td className="border border-black px-2 py-2 text-xs text-center">{quantity}</td>
                          <td className="border border-black px-2 py-2 text-xs text-center">{firstItem.unit}</td>
                          <td className="border border-black px-2 py-2 text-xs whitespace-pre-line">
                            {group.map(item => `${item.description} ${item.model} ${item.serialNo}`).join('\n')}
                          </td>
                          <td className="border border-black px-2 py-2 text-xs whitespace-pre-line text-center">{group.map(item => `${item.itemNOs}`).join('\n')}</td>
                          <td className="border border-black px-2 py-2 text-xs italic text-gray-500">Generate after</td>
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

                    {Array.from({ length: Math.max(0, 15 - groupedItems.length) }, (_, i) => (
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
                  text-sm font-semibold'> {getDocPrint[0]?.enduserName || 'N/A'}</div>
                  <p className="text-xs">Signature over Printed Name of End User</p>
                  <div className='border-b border-gray-300 mt-4 h-8 flex items-center justify-center
                  text-sm font-semibold'> {departments || 'N/A'}</div>
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
                onClick={() => setDocsPrint(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Back
              </button>
              <button
                onClick={() => {
                  handlePrintPDF();
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Print
              </button>
              <button
                onClick={() => {
                  handleExportPDF();
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {docsPrint === 'ics' && (
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
                  <p className="text-sm">{departments || ''}</p>
                  <p className="text-sm">Local Government Unit of Daet</p>
                  <p className="text-sm">Daet, Camarines Norte</p>
                </div>

                {/* Fund and ICS No. */}
                <div className="flex gap-4 p-3 border-b border-black">
                  <div className="w-1/2 flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">Fund:</label>
                    <input
                      type="text"
                      value={getDocPrint[0]?.fund || ''}
                      className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm"
                      placeholder="Enter Fund"
                      readOnly
                    />
                  </div>
                  <div className="w-1/2 flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">ICS No.:</label>
                    <input
                      type="text"
                      value={getDocPrint[0]?.docsNo || ''}
                      className="flex-1 border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent px-1 py-1 text-sm"
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
                {groupedItems.map((group, index) => {
                  const firstItem = group[0]; // representative item
                  const quantity = group.length;

                  return (
                    <div key={index} className="grid grid-cols-7 border-b border-gray-300 text-xs min-h-[30px]">
                      <div className="p-2 border-r border-black">{quantity}</div>
                      <div className="p-2 border-r border-black">{firstItem.unit || '-'}</div>
                      <div className="border-r border-black">
                        <div className="grid grid-cols-2 h-full">
                          <div className="p-2 border-r border-black">{firstItem.unitCost
                            ? `₱${new Intl.NumberFormat('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(firstItem.unitCost)}`
                            : '-'}
                          </div>
                          <div className="p-2">{firstItem.unitCost && quantity
                            ? `₱${new Intl.NumberFormat('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(parseFloat(firstItem.unitCost) * quantity)}`
                            : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="p-2 border-r border-black whitespace-pre-line">
                        {group.map(item => `${item.description} ${item.model} ${item.serialNo}`).join('\n')}
                      </div>
                      <div className="p-2 border-r border-black whitespace-pre-line text-center">{group.map(item => `${item.itemNOs}`).join('\n')}</div>
                      <div className="p-2">{firstItem.usefulness ? `${firstItem.usefulness} ${firstItem.usefulness > 1 ? 'years' : 'year'}` : '-'}</div>
                    </div>
                  );
                })}

                {Array.from({ length: Math.max(0, 15 - groupedItems.length) }, (_, i) => (
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
                  <div className="p-4 border-r border-black">
                    <div className="mb-4">
                      <p className="text-sm font-semibold">Received by :</p>
                    </div>
                    <div className="mt-8 mb-4">
                      <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center"> {getDocPrint[0]?.enduserName || 'N/A'}</div>
                      <p className="text-xs text-center">Signature over Printed Name of End User</p>
                    </div>
                    <div className="mt-6 mb-4">
                      <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center"> {departments || 'N/A'} </div>
                      <p className="text-xs text-center">Position/Office</p>
                    </div>
                    <div className="mt-6">
                      <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center"> {new Date().toLocaleDateString() || 'N/A'} </div>
                      <p className="text-xs text-center">Date</p>
                    </div>
                  </div>

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
                      <div className="border-b border-black w-full h-8 mb-2 flex items-center justify-center">{headData.position || 'N/A'}</div>
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
            <div className="flex justify-end gap-4 p-4 border-t bg-gray-50">
              <button
                onClick={() => setDocsPrint(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Back
              </button>
              <button
                onClick={() => {
                  handlePrintPDF();
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Print
              </button>
              <button
                onClick={() => {
                  handleExportPDF();
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadScannedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-gray">
              <div>
                <h2 className="text-lg font-semibold">
                  Upload Scanned Copy
                </h2>
              </div>
              <button 
                onClick={() => setUploadScannedModal(false)}
                className="hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div
              className={`mx-4 border-2 border-gray border-dotted rounded-2xl my-4 flex flex-col items-center justify-center p-8 transition-colors duration-200 ${isDragging ? "bg-blue-50 border-blue-400" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = Array.from(e.dataTransfer.files);
                const validFiles = files.filter(
                  file =>
                    (file.type === "application/pdf" || file.type.startsWith("image/")) &&
                    file.size <= 50 * 1024 * 1024
                );
                if (validFiles.length !== files.length) {
                  alert("Only PDF files up to 50MB are allowed.");
                }
                if (validFiles.length > 0) {
                  setDroppedFile(prev => [...(prev || []), ...validFiles]);
                  validFiles.forEach(file => setTimeout(() => handleUpload(file), 0));
                }
              }}
            >
              <CloudUpload className="mb-2" size={40} />
              <div className="font-bold">Choose files or drag & drop them here</div>
              <div className="text-base font-small italic text-gray-700">PDF up to 50MB only</div>
            </div>
            <div className="mx-4 border border-gray rounded-2xl my-4 flex flex-col items-center justify-center p-4">
              <div
                style={{
                  maxHeight: "100px",
                  overflowY: "auto",
                  width: "100%",
                }}
              >
                {(Array.isArray(droppedFile) ? droppedFile : droppedFile ? [droppedFile] : []).length > 0
                  ? (Array.isArray(droppedFile) ? droppedFile : [droppedFile]).map((file, idx) => (
                      <div key={idx} className="text-sm py-1 px-2 border-b last:border-b-0 border-gray-200 w-full truncate">
                        {file.name}
                      </div>
                    ))
                  : <div>file here</div>
                }
              </div>
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {!uploading && uploadProgress === 100 && (
                <div className="text-green-600 mt-2 font-medium">Upload complete</div>
              )}
              {!uploading && uploadProgress === 0 && droppedFile.length === 0 && (
                <div className="mt-2 font-medium">PDF or image files only (max 50MB).</div>
              )}
            </div>
            <div className="p-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => {
                  setUploadScannedModal(false);
                  setDroppedFile([]);
                  setUploading(false);
                  setUploadProgress(0);
                  fetchItems();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {downloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col">
              
              <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Download
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Sticker and Document Download
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDownloadModal(false)}
                  className="absolute right-4 top-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center p-8 gap-4">
                <div
                  className="flex-1 flex flex-col items-center justify-center rounded-lg p-8 border border-black cursor-pointer"
                  onClick={downloadSticker}
                >
                  <Sticker size={50} strokeWidth={1} />
                  <span className="mt-2 text-sm font-normal">Sticker</span>
                </div>
                <div
                  className="flex-1 flex flex-col items-center justify-center rounded-lg p-8 border border-black cursor-pointer"
                  onClick={downloadDocs}
                >
                  <FileText size={50} strokeWidth={1} />
                  <span className="mt-2 text-sm font-normal">Documents</span>
                </div>
              </div>
            </div>
        </div>
      )}

      <DeviceListModal
        deviceList={deviceList}
        deviceListModal={deviceListModal}
        setDeviceListModal={setDeviceListModal}
        setSelectedDevice={setSelectedDevice}
        StatusIcon={StatusIcon}
        getStatusBg={getStatusBg}
        getStatusColor={getStatusColors}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-11/12 md:w-3/4 lg:w-1/2 h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h2 className="text-lg font-semibold">Preview PDF</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }}
                className="text-gray-600 hover:text-red-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="PDF Preview"
                  className="w-full h-full"
                />
              ) : (
                <p className="text-center mt-10 text-gray-500">
                  Loading PDF...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PAR_ICS;