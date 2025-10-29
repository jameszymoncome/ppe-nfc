import React, { useState, useEffect, useRef } from 'react';
import { Check, WifiOff, Wifi, X, CloudUpload, Download } from 'lucide-react';
import IC_Sidebar from "../../components/IC_Sidebar";
import { useLocation } from "react-router-dom";
import axios from 'axios';
import { BASE_URL } from '../../utils/connection';
import { sendMessage, onMessage } from '../../components/websocket';
import DeviceListModal from '../../components/DeviceListModal';
import html2pdf from 'html2pdf.js';
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const IC_ProgressItem = () => {
    const location = useLocation();
    const { air_no, type, airnos } = location.state || {};
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [taggedItems, setTaggedItems] = useState([]);
    const [getDocDatas, setGetDocDatas] = useState([]);
    const [viewNFCModal, setViewNFCModal] = useState(false);
    const [deviceListModal, setDeviceListModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [deviceList, setDeviceList] = useState([]);
    const [connected, setConnected] = useState('');
    const [deviceStatus, setDeviceStatus] = useState({});
    const [propertyNo, setPropertyNo] = useState('');
    const [description, setDescription] = useState('');
    const [isScanning, setIsScanning] = useState(true);
    const [nfcId, setNfcId] = useState('');
    const [tableType, setTableType] = useState('');
    const [droppedFile, setDroppedFile] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [docNos, setDocNos] = useState('');
    const [docTypes, setDocTypes] = useState('');
    const [serverFiles, setServerFiles] = useState([]);
    const [getDocPrint, setGetDocsPrint] = useState([]);
    const [docsPrint, setDocsPrint] = useState('');
    const [departments, setDepartments] = useState('');
    const [headData, setHeadData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isAvailable, setIsAvailable] = useState(false);

    const steps = [
        { id: 1, name: 'For Tagging', completed: currentStep > 1 },
        { id: 2, name: 'Upload Scanned Copy', completed: currentStep > 2 },
        { id: 3, name: 'Confirmation', completed: currentStep > 3 }
    ];

    useEffect(() => {
        console.log('Viewing item with air_no:', air_no, 'and type:', type);
        getDocsData();
    }, []);

    useEffect(() => {
        console.log('Selected Device:', selectedDevice);
        console.log('Is Available:', isAvailable);
        if (selectedDevice && isAvailable) {
            setDeviceListModal(false);
            setViewNFCModal(true);
        }
    }, [selectedDevice, isAvailable]);

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

                if (data.type === "deviceStatus"){
                    setIsAvailable(false);
                    Swal.fire({
                        title: "Device Already in Use",
                        text: "This device is still active. Please wait until the current session is finished.",
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
                }

                if (data.type === "command"){
                    setIsAvailable(true);
                }
            } catch (err) {
                console.error("❌ Error parsing WS message:", err);
            }
        });
    
        return () => unsubscribe();
    }, []);

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
        console.log('Fetching filenames for:', airnos, type);
        const fetchFilenames = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/getFileName.php`, {
                    params: {
                        airNo: airnos,
                        types: type
                    }
                });
                console.log('Filenames: ',response.data.data);
                const files = response.data.data || response.data;
                if(response.data.success){
                    setUploading(false);
                    setUploadProgress(100);
                    setServerFiles(files); 
                }
            } catch (error) {
                console.error('Error fetching filenames:', error);
            }
        }
        fetchFilenames();
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

    const getDocsData = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/getDocsData.php`, {
                params: {
                    docNo: air_no,
                    types: type
                }
            });
            console.log('Resultsss: ',response.data);
            const nfcIDs = response.data.map(item => item.nfcID);
            const downloadedForm = response.data.map(item => item.downloadedForm);
            const department = response.data.map(item => item.department);
            const itemss = response.data.map(item => ({
                itemNo: item.itemNo,
                userID: item.user_id,
                type: item.type,
                dateAcquired: item.dateAcquired
            }));
            let air_nos = response.data.map(item => item.air_no);
            let typesss = response.data.map(item => item.type);
            const allNotDone = downloadedForm.every(form => form === "Not Done");
            const allUploaded = downloadedForm.every(form => form === "Upload Scanned Form");
            const allConfirmed = downloadedForm.every(form => form === "Confirmation");
            air_nos = [...new Set(air_nos)];
            typesss = [...new Set(typesss)];
            console.log('NFC IDs: ', itemss);
            if (nfcIDs.every(id => id)) {
                setTaggedItems(nfcIDs);
            }
            if (allNotDone) {
                setCurrentStep(1);
            } else if (allUploaded) {
                setCurrentStep(2);
            } else if (allConfirmed) {
                setCurrentStep(3);
                downloadViewDocs(airnos, type);
            }
            else {
                setCurrentStep(1);
            }
            if (air_nos.length === 1) {
                air_nos = air_nos[0];
            }
            if (typesss.length === 1) {
                typesss = typesss[0];
            }
            setDocNos(air_nos);
            setDocTypes(typesss);
            setDepartments(department);
            setSelectedItems(itemss);
            setGetDocDatas(response.data);
        } catch (error) {
            console.error('Error fetching end users:', error);
        }
    };

    const checkConnection = () => {
        sendMessage({
            type: "connection",
            userID: localStorage.getItem("userId")
        });
    };

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
                getDocsData();
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

    const updateProgress = async () => {
        console.log('Updating progress for:', air_no);

        const confirmAndProceed = async () => {
            const { isConfirmed } = await Swal.fire({
                title: "Confirm Final Step",
                text: "Are you sure you want to proceed with this final process?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, proceed",
                cancelButtonText: "Cancel",
                customClass: {
                    popup: "rounded-2xl",
                    confirmButton: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mx-2",
                    cancelButton: "bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded mx-2",
                },
                buttonsStyling: false,
            });
            if (isConfirmed) {
                await updateProgressFunction();
                navigate('/ic-par-ics');
            }
        };

        currentStep === 3 ? confirmAndProceed() : updateProgressFunction();
    };

    const updateProgressFunction = async () => {
        try {
            const response = await axios.post(`${BASE_URL}/updateProgress.php`, {
                docsNo: air_no,
                types: type,
                currentStep: currentStep,
                selectedItems: selectedItems
            });
            console.log('Steppp: ', response.data);
            if (currentStep !== 3) getDocsData();
        } catch (error) {
            console.error('Error fetching end users:', error);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleUpload = async (fileArg) => {
        const fileToUpload = fileArg || droppedFile;
        if (!fileToUpload) return alert("No file selected");

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("docNos", docNos);
        formData.append("docTypes", docTypes);

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

    const handleDownloadForm = async () => {
        if(type === 'PAR'){
            setDocsPrint('par');
        } else{
            setDocsPrint('ics');
        }
        try {
            const response = await axios.get(`${BASE_URL}/printDocs.php`, {
                params: {
                    docsNo: air_no,
                    typess: type
                }
            });
            console.log(response.data);
            setGetDocsPrint(response.data);
        
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
    };

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
    };

    const downloadViewDocs = async (airNo, typest) => {
        if (!airNo) return alert("Please enter AIR No first.");
        console.log("Viewing PDF for AIR No:", airNo);
    
        try {
          const response = await axios.get(`${BASE_URL}/viewPDFFile.php`, {
            params: { airNo: airNo, formType: typest },
          });
    
          const { files } = response.data;
          if (!files || files.length === 0) {
            console.error("No files found for this airNo.");
            return;
          }
    
          const mergedPdf = await PDFDocument.create();
          for (const file of files) {
            const binary = atob(file.fileData);
            const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
    
            if (file.fileType === "application/pdf") {
              const pdfToMerge = await PDFDocument.load(bytes);
              const copiedPages = await mergedPdf.copyPages(
                pdfToMerge,
                pdfToMerge.getPageIndices()
              );
              copiedPages.forEach(p => mergedPdf.addPage(p));
            } else if (file.fileType.startsWith("image/")) {
              let img;
              if (file.fileType === "image/jpeg") {
                img = await mergedPdf.embedJpg(bytes);
              } else {
                img = await mergedPdf.embedPng(bytes);
              }
              const { width, height } = img.scale(1);
              const page = mergedPdf.addPage([width, height]);
              page.drawImage(img, { x: 0, y: 0, width, height });
            }
    
            const mergedBytes = await mergedPdf.save();
            const blob = new Blob([mergedBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
          }
        } catch (error) {
          console.error("Error fetching PDF:", error);
          alert("Failed to load PDF file.");
        }
    };

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

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <IC_Sidebar />

            <div className="flex-1 bg-gray-50 p-4 md:p-6 lg:p-8 overflow-y-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Item Assignment Process</h1>
                        <p className="text-sm text-gray-600 mt-1">Tag items and upload scanned documents</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-block text-sm text-gray-600">Progress:</span>
                        <span className="text-sm font-semibold text-blue-600">{taggedItems.length}/{getDocDatas.length} Tagged</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                step.completed 
                                ? 'bg-blue-800 text-white' 
                                : step.id === currentStep 
                                    ? 'bg-blue-800 text-white border-4 border-blue-200' 
                                    : 'bg-gray-200 text-gray-500'
                            }`}>
                                {step.completed ? <Check size={20} /> : step.id}
                            </div>
                            <span className={`mt-2 text-xs md:text-sm font-medium ${
                                step.completed || step.id === currentStep ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                                {step.name}
                            </span>
                            </div>
                            {index < steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 ${
                                step.completed ? 'bg-blue-400' : 'bg-gray-200'
                            }`} />
                            )}
                        </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4">
                    {/* Tagging Status Section */}
                    {currentStep === 1 && (
                        <div className="xl:flex-1 bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Tagging Status</h2>
                            <div className="space-y-3">
                                {getDocDatas.map((item) => (
                                    <div key={item.itemNo} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.itemNo}</p>
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                            </div>
                                            {item.status === 'Done Tagging' && (
                                                <div className="flex flex-col items-end">
                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                                        Tagged
                                                    </span>
                                                    <span className="text-[11px] text-gray-600 mt-1">
                                                        Tag ID: {item.nfcID || 'N/A'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {item.status === 'For Tagging' && (
                                            <button
                                                onClick={() => {
                                                    setPropertyNo(item.itemNo);
                                                    setDescription(item.description);
                                                    setTableType(item.type);
                                                    checkConnection();
                                                    // handleTagItem(item.itemNo)
                                                }}
                                                className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                Tag Item
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="xl:flex-1 bg-white rounded-lg shadow-sm py-6 px-24">
                            {/* <div className="bg-white rounded-2xl shadow-2xl w-3/4 mx-auto overflow-hidden"> */}
                            <div className="bg-white rounded-2xl border border-gray  w-3/4 mx-auto overflow-hidden">
                                <div className="p-4 flex justify-between items-center border-b border-gray">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                        Upload Scanned Copy
                                        </h2>
                                    </div>
                                </div>
                                <div
                                    className={`mx-4 border-2 border-gray-300 border-dashed rounded-2xl my-4 flex flex-col items-center justify-center p-8 transition-colors duration-200 ${isDragging ? "bg-blue-50 border-blue-400" : ""}`}
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
                                <div className="mx-4 border-2 border-gray-300 border-dashed rounded-2xl my-4 flex flex-col items-center justify-center p-4">
                                    <div
                                        style={{
                                        maxHeight: "100px",
                                        overflowY: "auto",
                                        width: "100%",
                                        }}
                                    >
                                        {(serverFiles.length > 0 || droppedFile?.length > 0) ? (
                                            <>
                                                {/* 🔹 Show server files first */}
                                                {serverFiles.map((file, idx) => (
                                                <div
                                                    key={`server-${idx}`}
                                                    className="text-sm py-1 px-2 border-b last:border-b-0 border-gray-200 w-full truncate text-blue-600 cursor-pointer hover:underline"
                                                >
                                                    {file.fileName}
                                                </div>
                                                ))}

                                                {/* 🔹 Then show newly dropped files */}
                                                {(Array.isArray(droppedFile) ? droppedFile : droppedFile ? [droppedFile] : []).map((file, idx) => (
                                                <div
                                                    key={`local-${idx}`}
                                                    className="text-sm py-1 px-2 border-b last:border-b-0 border-gray-200 w-full truncate text-gray-700"
                                                >
                                                    {file.name}
                                                </div>
                                                ))}
                                            </>
                                            ) : (
                                            <div>No files uploaded yet</div>
                                            )}
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
                                <button
                                    onClick={handleDownloadForm}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    <Download size={20} />
                                    Download Form
                                </button>
                                {/* <div className="p-4 flex justify-end border-t border-gray-200">
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
                                </div> */}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="w-full bg-white rounded-lg shadow-sm py-6 px-8">
                            <div className="bg-white rounded-2xl border border-gray-300 w-full max-w-6xl mx-auto overflow-hidden">
                                <div className="flex justify-between items-center px-4 py-2 border-b">
                                    <h2 className="text-lg font-semibold">Preview PDF</h2>
                                    <button
                                        onClick={() => {
                                        URL.revokeObjectURL(pdfUrl);
                                        setPdfUrl(null);
                                        }}
                                        className="text-gray-600 hover:text-red-600 text-xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex justify-center items-center p-4">
                                    {pdfUrl ? (
                                        <iframe
                                        src={pdfUrl}
                                        title="PDF Preview"
                                        className="w-full"
                                        style={{
                                            minHeight: "80vh", // ensures large display
                                            height: "auto",
                                            border: "none",
                                        }}
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

                <div className="fixed bottom-6 right-6">
                    <button
                        onClick={updateProgress}
                        className={`px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300
                            ${
                            currentStep === 1
                                ? taggedItems.length !== getDocDatas.length
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                : currentStep === 2
                                ? (Array.isArray(droppedFile) && droppedFile.length > 0) ||
                                (Array.isArray(serverFiles) && serverFiles.length > 0)
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-400 cursor-not-allowed"
                                : currentStep === 3
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-400 cursor-not-allowed"
                            }`}
                        disabled={
                            (currentStep === 1 && taggedItems.length !== getDocDatas.length) ||
                            (currentStep === 2 &&
                            !(
                                (Array.isArray(droppedFile) && droppedFile.length > 0) ||
                                (Array.isArray(serverFiles) && serverFiles.length > 0)
                            ))
                            // ✅ For step 3, button is always enabled, so no disable condition needed
                        }
                    >
                        Next
                    </button>
                </div>
            </div>

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
                                onClick={() => setViewNFCModal(false)}
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

            <DeviceListModal
                deviceList={deviceList}
                deviceListModal={deviceListModal}
                setDeviceListModal={setDeviceListModal}
                setSelectedDevice={setSelectedDevice}
                StatusIcon={StatusIcon}
                getStatusBg={getStatusBg}
                getStatusColor={getStatusColors}
            />

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
                                                        {group.map(item => 
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
        </div>
    )
}

export default IC_ProgressItem;