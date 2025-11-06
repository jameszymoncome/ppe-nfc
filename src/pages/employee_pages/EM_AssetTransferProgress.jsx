import { useState, useEffect } from 'react';
import { useLocation, useParams } from "react-router-dom";
import { Bell } from 'lucide-react';
import EM_Sidebar from '../../components/EM_Sidebar';
import { BASE_URL } from '../../utils/connection';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import Swal from "sweetalert2";
import * as ReactDOM from 'react-dom/client'; // Add this import

const EM_AssetTransferProgress = () => {
  const { ptr_no } = useParams();
  const location = useLocation();
  const passedItem = location.state?.item;
  const user_ids = localStorage.getItem('userId');

  const [activeStep, setActiveStep] = useState(1);
  const [selectedTransfer, setSelectedTransfer] = useState(passedItem || null);
  const [showTransferReport, setShowTransferReport] = useState(false);
  const [downloadTransfer, setDownloadTransfer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isReceiver = selectedTransfer?.to_officer === user_ids;
  const isAdmin = localStorage.getItem('accessLevel') === 'SUPER ADMIN';

  // ---------- API utilities ----------
  const fetchTransferByPtr = async (ptr) => {
    if (!ptr) return null;
    try {
      const res = await fetch(`${BASE_URL}/getTransferByPtr.php?ptr_no=${encodeURIComponent(ptr)}`);
      const data = await res.json();
      return data.transfer || null;
    } catch (err) {
      console.error("fetchTransferByPtr error", err);
      return null;
    }
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

  const updateTransferStatus = async (ptrNo, status) => {
    try {
      const form = new FormData();
      form.append("ptr_no", ptrNo);
      form.append("status", status);
      const res = await fetch(`${BASE_URL}/updateTransferStatus.php`, {
        method: "POST",
        body: form
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error("updateTransferStatus error", err);
      return false;
    }
  };

  // ---------- derive step ----------
 const deriveStep = (transfer) => {
  if (!transfer) return 1;
  const status = (transfer.status || '').toLowerCase();

  if (status.includes('completed') || transfer.admin_signed_doc) return 5;
  if (status.includes('approved')) return 4;
  if (transfer.signed_doc) return 3;
  if (status.includes('accepted')) return 2;
  return 1; // default = pending / created
};

  // ---------- initial fetch + polling ----------
  useEffect(() => {
    let mounted = true;
    const doFetch = async () => {
      if (passedItem && !ptr_no) {
        setSelectedTransfer(passedItem);
        setActiveStep(deriveStep(passedItem));
        return;
      }
      const t = await fetchTransferByPtr(ptr_no || passedItem?.ptr_no);
      if (!mounted) return;
      if (t) {
        setSelectedTransfer(t);
        setActiveStep(deriveStep(t));
      } else if (passedItem) {
        setSelectedTransfer(passedItem);
        setActiveStep(deriveStep(passedItem));
      }
    };
    doFetch();
    const iv = setInterval(doFetch, 5000); // poll every 5s
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [ptr_no, passedItem]);

  // ---------- Download / PDF ----------
const handleDownload = async (transfer) => {
  try {
    // Fetch items if not present
    const items = transfer.items?.length > 0 
      ? transfer.items 
      : await fetchTransferItems(transfer.from_officerID);
    
    if (!items?.length) {
      Swal.fire('Error', 'No items found for this transfer', 'error');
      return;
    }

    // Set download transfer with items
    setDownloadTransfer({
      ...transfer,
      items: items
    });

  } catch (err) {
    console.error('Download error:', err);
    Swal.fire('Error', 'Failed to prepare download', 'error');
  }
};

useEffect(() => {
  if (!downloadTransfer) return;

  const generatePDF = async () => {
  try {
    Swal.fire({
      title: 'Generating PDF...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Create hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    document.body.appendChild(container);

    // Create a promise to handle React rendering
    await new Promise(resolve => {
      const root = ReactDOM.createRoot(container);
      root.render(
        <HiddenTransferReport 
          transfer1={downloadTransfer} 
          onRender={resolve}
        />
      );
    });

    // Wait a bit for images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const input = document.getElementById("transfer-report-hidden");
    if (!input) throw new Error('Report element not found');

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      logging: false,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        const images = clonedDoc.getElementsByTagName('img');
        return Promise.all(
          Array.from(images).map(img => 
            img.complete ? Promise.resolve() : new Promise(resolve => img.onload = resolve)
          )
        );
      }
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`Transfer-${downloadTransfer.ptr_no || 'report'}.pdf`);

    // Cleanup
    document.body.removeChild(container);
    Swal.close();

  } catch (err) {
    console.error('PDF generation error:', err);
    Swal.fire('Error', 'Failed to generate PDF', 'error');
  } finally {
    setDownloadTransfer(null);
  }
};

  generatePDF();
}, [downloadTransfer]);


  // ---------- Step handlers ----------
  // 1 -> Receiver Accept
  const handleReceiverAccept = async () => {
    if (!selectedTransfer) return;
    const ok = await Swal.fire({
      title: "Accept transfer?",
      text: "This will mark the transfer as accepted by the receiver.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, accept",
    });
    if (!ok.isConfirmed) return;
    const success = await updateTransferStatus(selectedTransfer.ptr_no, "Accepted");
    if (success) {
      Swal.fire("Accepted", "You accepted the transfer.", "success");
      const refreshed = await fetchTransferByPtr(selectedTransfer.ptr_no);
      setSelectedTransfer(refreshed);
      setActiveStep(deriveStep(refreshed));
    } else {
      Swal.fire("Error", "Failed to accept transfer", "error");
    }
  };

  // 2 -> Receiver uploads signed doc (moves to next step)
  const handleReceiverUploadSigned = async () => {
    if (!selectedTransfer) return;
    const { value: file } = await Swal.fire({
      title: "Upload Signed Document (receiver)",
      input: "file",
      inputAttributes: { accept: "application/pdf,image/*" },
      showCancelButton: true,
      confirmButtonText: "Upload",
      showLoaderOnConfirm: true,
      preConfirm: (chosenFile) => {
        if (!chosenFile) return false;
        return chosenFile;
      }
    });
    if (!file) return;

    const formData = new FormData();
    formData.append("ptr_no", selectedTransfer.ptr_no);
    formData.append("signed_doc", file);
    formData.append("status", "Receiver Uploaded Signed Copy");

    try {
      setUploading(true);
      setUploadProgress(0);
      const res = await axios.post(`${BASE_URL}/uploadReceiverSigned.php`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            setUploadProgress(pct);
          }
        }
      });
      setUploading(false);
      setUploadProgress(100);
      if (res.data?.success) {
        Swal.fire("Uploaded", "Signed document uploaded.", "success");
        const refreshed = await fetchTransferByPtr(selectedTransfer.ptr_no);
        setSelectedTransfer(refreshed);
        setActiveStep(deriveStep(refreshed));
      } else {
        Swal.fire("Error", res.data?.message || "Upload failed", "error");
      }
    } catch (err) {
      setUploading(false);
      console.error("receiver upload error", err);
      Swal.fire("Error", "Network or server error during upload", "error");
    }
  };

  // 3 -> Admin Approve
  const handleAdminApprove = async () => {
    if (!selectedTransfer) return;

    const result = await Swal.fire({
      title: "Approve transfer?",
      text: "This action will mark the transfer as Approved by admin.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, approve",
    });
    if (!result.isConfirmed) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Prepare form data for PHP
      const formData = new FormData();
      formData.append("ptr_no", selectedTransfer.ptr_no);
      formData.append("status", "Approved - Awaiting for Signed Document");
      // include both id and name if available
      formData.append("approved_by", user_ids || "");

      const res = await fetch(`${BASE_URL}/approveTransfer.php`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        // show raw response for easier debugging
        throw new Error(`Invalid JSON response from server: ${text.substring(0, 1000)}`);
      }

      if (data.success) {
        await Swal.fire("Approved", data.message || "Transfer approved by admin.", "success");
        const refreshed = await fetchTransferByPtr(selectedTransfer.ptr_no);
        setSelectedTransfer(refreshed);
        setActiveStep(deriveStep(refreshed));
      } else {
        throw new Error(data.message || "Failed to approve transfer");
      }
    } catch (err) {
      console.error("Admin approval error:", err);
      Swal.fire("Error", err.message || "Network or server error during approval", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };


  // 4 -> Admin uploads final signed doc and completes transfer (completeTransfer.php)
  const handleAdminComplete = async () => {
    if (!selectedTransfer) return;
    const { value: file } = await Swal.fire({
      title: "Upload Final Signed Document (admin)",
      input: "file",
      inputAttributes: { accept: "application/pdf" },
      showCancelButton: true,
      confirmButtonText: "Upload & Complete",
      showLoaderOnConfirm: true,
      preConfirm: (chosenFile) => {
        if (!chosenFile) return false;
        return chosenFile;
      }
    });
    if (!file) return;

    const formData = new FormData();
    formData.append("ptr_no", selectedTransfer.ptr_no);
    formData.append("signed_doc", file);
    formData.append("status", "Completed");

    try {
      setUploading(true);
      setUploadProgress(0);
      const res = await axios.post(`${BASE_URL}/completeTransfer.php`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            setUploadProgress(pct);
          }
        }
      });
      setUploading(false);
      setUploadProgress(100);
      if (res.data?.success) {
        Swal.fire("Completed", "Transfer completed successfully.", "success");
        const refreshed = await fetchTransferByPtr(selectedTransfer.ptr_no);
        setSelectedTransfer(refreshed);
        setActiveStep(deriveStep(refreshed));
      } else {
        Swal.fire("Error", res.data?.message || "Complete failed", "error");
      }
    } catch (err) {
      setUploading(false);
      console.error("completeTransfer error", err);
      Swal.fire("Error", "Network or server error while completing transfer", "error");
    }
  };

  // ---------- TransferReport & HiddenReport (kept same as your original) ----------
  const TransferReport = ({ transfer, onClose }) => {
  if (!transfer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div
        id="transfer-report"
        className="bg-white rounded-xl shadow-lg w-full max-w-5xl p-10 relative border max-h-[90vh] overflow-y-auto"
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
            <strong>Transfer Type:</strong>{' '}
            {transfer.transfer_type
              ? transfer.transfer_type.charAt(0).toUpperCase() + transfer.transfer_type.slice(1)
              : 'N/A'}
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
                <td className="border p-2 text-right">
                  ₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
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
          <span>{transfer.reason_for_transfer}</span>
          <div className="border-b border-gray-400 w-full mt-4"></div>
        </div>

        {/* Signatories */}
        <div className="grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p className='mb-4'>Approved by:</p>
            <strong>{transfer.approver_name}</strong>
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
            <div className="mt-1 border-t border-gray-400 pt-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};


  const HiddenTransferReport = ({ transfer1, onRender }) => {
  useEffect(() => {
    if (onRender) onRender();
  }, [onRender]);

  if (!transfer1) return null;

  return (
    <div
      id="transfer-report-hidden"
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "800px",
        background: "white",
        padding: "40px",
        boxSizing: "border-box"
      }}
    >
      {/* Header (same format as TransferReport) */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <img
          src="/assets/images/lgu_seal.png"
          alt="Logo"
          style={{ width: 80, height: 80, margin: "0 auto 8px" }}
        />
        <h2 style={{ fontWeight: 600, margin: 0 }}>Republic of the Philippines</h2>
        <h2 style={{ fontWeight: 600, margin: 0 }}>PROVINCE OF CAMARINES NORTE</h2>
        <h2 style={{ fontWeight: 600, margin: 0 }}>MUNICIPALITY OF DAET</h2>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginTop: 8,
            textDecoration: "underline"
          }}
        >
          PROPERTY TRANSFER REPORT
        </h1>
      </div>

      {/* Entity & PTR */}
      <div style={{ marginBottom: 16, fontSize: 14 }}>
        <p style={{ margin: 0 }}><strong>Entity Name:</strong> {transfer1.entity_name}</p>
        <p style={{ margin: 0 }}><strong>PTR No.:</strong> {transfer1.ptr_no}</p>
      </div>

      {/* Officers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 24,
          fontSize: 14
        }}
      >
        <div>
          <strong>From Accountable Officer/Agency/Fund Cluster:</strong>
          <br />
          {transfer1.from_officer_name}
        </div>
        <div>
          <strong>To Accountable Officer/Agency/Fund Cluster:</strong>
          <br />
          {transfer1.to_officer_name}
        </div>
      </div>

      {/* Transfer Type */}
      <div style={{ marginBottom: 16, fontSize: 14 }}>
        <strong>Transfer Type:</strong>{" "}
        {(transfer1.transfer_type || "N/A").toString().replace(/^\w/, (c) => c.toUpperCase())}
      </div>

      {/* Items Table — same columns and blank rows like TransferReport */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 14 }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={{ border: "1px solid #000", padding: 8 }}>Quantity</th>
            <th style={{ border: "1px solid #000", padding: 8 }}>Unit</th>
            <th style={{ border: "1px solid #000", padding: 8 }}>Description</th>
            <th style={{ border: "1px solid #000", padding: 8 }}>Property No.</th>
            <th style={{ border: "1px solid #000", padding: 8 }}>Amount</th>
            <th style={{ border: "1px solid #000", padding: 8 }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {(transfer1.items && transfer1.items.length > 0) ? (
            transfer1.items.map((item, i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #000", padding: 8, textAlign: "center" }}>{item.quantity ?? 1}</td>
                <td style={{ border: "1px solid #000", padding: 8, textAlign: "center" }}>{item.unit ?? ""}</td>
                <td style={{ border: "1px solid #000", padding: 8 }}>{item.description ?? ""}</td>
                <td style={{ border: "1px solid #000", padding: 8, textAlign: "center" }}>{item.propertyNo ?? item.property_no ?? ""}</td>
                <td style={{ border: "1px solid #000", padding: 8, textAlign: "right" }}>
                  ₱{Number(item.amount ?? item.unit_cost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: 8 }}>{item.remarks ?? ""}</td>
              </tr>
            ))
          ) : null}

          {/* Add blank rows to preserve format (same count as TransferReport) */}
          {Array.from({ length: Math.max(5, 5 - (transfer1.items?.length || 0)) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td style={{ border: "1px solid #000", padding: 8 }}>&nbsp;</td>
              <td style={{ border: "1px solid #000", padding: 8 }}></td>
              <td style={{ border: "1px solid #000", padding: 8 }}></td>
              <td style={{ border: "1px solid #000", padding: 8 }}></td>
              <td style={{ border: "1px solid #000", padding: 8 }}></td>
              <td style={{ border: "1px solid #000", padding: 8 }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Reason */}
      <div style={{ marginBottom: 32, fontSize: 14 }}>
        <p style={{ margin: 0 }}><strong>Reason for Transfer:</strong></p>
        <span>{transfer1.reason_for_transfer}</span>
        <div style={{ borderBottom: "1px solid #9ca3af", width: "100%", marginTop: 16 }}></div>
      </div>

      {/* Signatories */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, textAlign: "center", fontSize: 14 }}>
        <div>
          <p style={{ marginBottom: 16 }}>Approved by:</p>
          <strong>{transfer1.approver_name}</strong>
          <div style={{ marginTop: 4, borderTop: "1px solid #9ca3af", paddingTop: 4 }}>
            Signature over Printed Name of Head of Agency/Entity
          </div>
        </div>
        <div>
          <p style={{ marginBottom: 16 }}>Released/Issued by:</p>
          <strong>{transfer1.from_officer_name}</strong>
          <div style={{ marginTop: 4, borderTop: "1px solid #9ca3af", paddingTop: 4 }}>
            Signature over Printed Name of Accountable Officer
          </div>
        </div>
        <div>
          <p style={{ marginBottom: 16 }}>Received by:</p>
          <strong>{transfer1.to_officer_name}</strong>
          <div style={{ marginTop: 4, borderTop: "1px solid #9ca3af", paddingTop: 4 }}>
            Signature over Printed Name of Accountable Officer
          </div>
        </div>
        <div>
          <p style={{ marginBottom: 16 }}>Date:</p>
          <strong>{transfer1.transfer_date}</strong>
          <div style={{ marginTop: 4, borderTop: "1px solid #9ca3af", paddingTop: 4 }}></div>
        </div>
      </div>
    </div>
  );
};

  const steps = [
  { number: 1, label: "Waiting for Receiver’s Approval" },
  { number: 2, label: "Waiting for Receiver’s Signed Copy" },
  { number: 3, label: "Waiting for Admin’s Approval" },
  { number: 4, label: "Waiting for Admin’s Signed Copy" },
  { number: 5, label: "Transfer Completed" }
];

  return (
    <div className="flex h-screen bg-gray-50">
      <EM_Sidebar />
      <main className="flex-1 overflow-y-auto w-full pb-24">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Asset Transfer Progress</h1>
              <p className="text-xs sm:text-sm text-gray-500">Track and manage transfer process</p>
              {ptr_no && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Transfer No: <span className="font-medium">{ptr_no}</span>
                </p>
              )}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex items-center justify-between max-w-6xl mx-auto mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold text-sm lg:text-base ${
                      activeStep >= step.number ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span className={`mt-2 text-xs lg:text-sm font-medium text-center px-1 ${activeStep >= step.number ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${activeStep >= step.number + 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                )}
              </div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Transfer Details</h2>
            {selectedTransfer ? (
              <div className="text-sm space-y-2">
                <p><strong>From:</strong> {selectedTransfer.from_officer_name}</p>
                <p><strong>To:</strong> {selectedTransfer.to_officer_name}</p>
                <p><strong>PTR No:</strong> {selectedTransfer.ptr_no}</p>
                <div className="mt-3">
                  <p><strong>Status:</strong> {selectedTransfer.status}</p>
                  <p className="text-blue-600 font-medium">
                    {steps[activeStep - 1]?.label}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No transfer data available.</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {selectedTransfer && (
                <>
                  <button
                    onClick={() => setShowTransferReport(true)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    View Report
                  </button>

                  <button
                    onClick={() => handleDownload(selectedTransfer)}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    Download PDF
                  </button>

                  {/* Step actions: show buttons depending on current step */}
                  <div className="flex items-center gap-2">
                    {activeStep === 1 && (
                      <button
                        onClick={handleReceiverAccept}
                        disabled={!isReceiver}
                        className={`px-4 py-2 rounded-lg font-medium text-white 
                          ${isReceiver 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        {isReceiver ? 'Accept Transfer' : 'Waiting for Receiver'}
                      </button>
                    )}

                    {activeStep === 2 && (
                      <button
                        onClick={handleReceiverUploadSigned}
                        disabled = {!isReceiver}
                        className={`px-4 py-2 rounded-lg font-medium text-white 
                          ${isReceiver 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        {isReceiver ? 'Upload Signed Copy (Receiver)' : 'Waiting for Receiver'}
                      </button>
                    )}

                    {activeStep === 3 && (
                      <button
                        onClick={handleAdminApprove}
                        disabled = {!isAdmin}
                        className={`px-4 py-2 rounded-lg font-medium text-white 
                          ${isAdmin
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        {isAdmin ? 'Approve Transfer (Admin)' : 'Waiting for Admin'}
                      </button>
                    )}

                    {activeStep === 4 && (
                      <button
                        onClick={handleAdminComplete}
                        className="px-4 py-2 bg-emerald-700 text-white rounded"
                      >
                        Upload Final Signed & Complete
                      </button>
                    )}

                    {uploading && (
                      <div className="ml-4 text-sm">
                        Uploading: {uploadProgress}% 
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showTransferReport && selectedTransfer && (
          <TransferReport transfer={selectedTransfer} onClose={() => setShowTransferReport(false)} />
        )}

        
      </main>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          {downloadTransfer && <HiddenTransferReport transfer1={downloadTransfer} />}
        </div>
    </div>
  );
};

export default EM_AssetTransferProgress;
