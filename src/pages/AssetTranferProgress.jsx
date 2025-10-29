import { useState, useEffect } from 'react';
import { useLocation, useParams } from "react-router-dom";
import { Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { BASE_URL } from '../utils/connection';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const AssetTransferProgress = () => {
  const { ptr_no } = useParams();
  const location = useLocation();
  const passedItem = location.state?.item;

  const [activeStep, setActiveStep] = useState(1);
  const [selectedTransfer, setSelectedTransfer] = useState(passedItem || null);
  const [showTransferReport, setShowTransferReport] = useState(false);
  const [downloadTransfer, setDownloadTransfer] = useState(null);

    // fetch full transfer by ptr_no
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

  // derive active step from transfer status / fields
  const deriveStep = (transfer) => {
    if (!transfer) return 1;
    const s = (transfer.status || '').toLowerCase();

    // Step mapping described by you:
    // 1 = created / Pending
    // 2 = receiver accepted
    // 3 = receiver uploaded signed copy
    // 4 = admin approved
    // 5 = admin uploaded signed doc (Completed)
    if (s.includes('completed') || s === 'completed') return 5;
    if (s.includes('approved') && (transfer.admin_signed_doc || transfer.approved_by)) {
      // admin approved but still waiting admin-signed doc -> step 4
      return 4;
    }
    // receiver uploaded signed copy presence (signed_doc field)
    if (transfer.signed_doc) return 3;
    if (s.includes('accepted') || s.includes('accept')) return 2;
    // default to pending / created
    return 1;
  };

  // initial fetch + polling for live progress updates
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
    const iv = setInterval(doFetch, 5000); // poll every 5s for updates
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [ptr_no, passedItem]);

  // fetch items associated with a transfer (used by download/view)
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

  // trigger download (creates full data object then sets state to generate pdf)
  const handleDownload = async (transfer) => {
    const items = transfer.items && transfer.items.length
      ? transfer.items
      : await fetchTransferItems(transfer.from_officerID);
    setDownloadTransfer({ ...transfer, items });
  };

  // generate PDF when downloadTransfer set
  useEffect(() => {
    if (!downloadTransfer) return;

    const generatePDF = async () => {
      const input = document.getElementById("transfer-report-hidden");
      if (!input) {
        console.warn("Hidden transfer report element not found");
        setDownloadTransfer(null);
        return;
      }
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
      pdf.save(`Transfer-${downloadTransfer.ptr_no || 'report'}.pdf`);
      setDownloadTransfer(null);
    };

    generatePDF();
  }, [downloadTransfer]);

  // TransferReport modal (simplified copy)
  const TransferReport = ({ transfer, onClose }) => {
    if (!transfer) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl p-8 relative border max-h-[95vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-600">✕</button>
          <div className="text-center mb-6">
            <h2 className="font-semibold">PROPERTY TRANSFER REPORT</h2>
            <p className="text-sm">{transfer.ptr_no}</p>
          </div>
          <div className="mb-4 text-sm">
            <p><strong>From:</strong> {transfer.from_officer_name}</p>
            <p><strong>To:</strong> {transfer.to_officer_name}</p>
          </div>
          <table className="w-full border border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Unit</th>
                <th className="border p-2">Description</th>
                <th className="border p-2">Property No.</th>
                <th className="border p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transfer.items?.map((it, i) => (
                <tr key={i}>
                  <td className="border p-2 text-center">{it.quantity}</td>
                  <td className="border p-2 text-center">{it.unit}</td>
                  <td className="border p-2">{it.description}</td>
                  <td className="border p-2 text-center">{it.propertyNo}</td>
                  <td className="border p-2 text-right">₱{it.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Hidden report used for PDF generation (rendered off-screen)
  const HiddenTransferReport = ({ transfer1 }) => {
    if (!transfer1) return null;
    return (
      <div id="transfer-report-hidden" className="bg-white rounded-xl shadow-lg w-full max-w-5xl p-10 relative border">
        <div className="text-center mb-6">
          <h2 className="font-semibold">PROPERTY TRANSFER REPORT</h2>
          <p className="text-sm">{transfer1.ptr_no}</p>
        </div>
        <div className="mb-4 text-sm">
          <p><strong>From:</strong> {transfer1.from_officer_name}</p>
          <p><strong>To:</strong> {transfer1.to_officer_name}</p>
        </div>
        <table className="w-full border border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Property No.</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transfer1.items?.map((it, i) => (
              <tr key={i}>
                <td className="border p-2 text-center">{it.quantity}</td>
                <td className="border p-2 text-center">{it.unit}</td>
                <td className="border p-2">{it.description}</td>
                <td className="border p-2 text-center">{it.propertyNo}</td>
                <td className="border p-2 text-right">₱{it.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const steps = [
    { number: 1, label: "Awaiting Receiver's Approval" },
    { number: 2, label: "Awaiting Receiver's Signed Copy" },
    { number: 3, label: "Awaiting Admin's Approval" },
    { number: 4, label: 'Final Document Upload' }
  ];

  const handleNext = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto w-full pb-24">
        {/* Header */}
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

        {/* Progress Steps */}
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
                  <span
                    className={`mt-2 text-xs lg:text-sm font-medium text-center px-1 ${
                      activeStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      activeStep >= step.number + 1 ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Transfer Details */}
          <div className="max-w-5xl mx-auto bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Transfer Details</h2>
            {selectedTransfer ? (
              <div className="text-sm space-y-2">
                <p><strong>From:</strong> {selectedTransfer.from_officer_name}</p>
                <p><strong>To:</strong> {selectedTransfer.to_officer_name}</p>
                <p><strong>PTR No:</strong> {selectedTransfer.ptr_no}</p>
                <p><strong>Status:</strong> {steps[activeStep - 1]?.label}</p>
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
                </>
              )}
            </div>
          </div>
        </div>

        {showTransferReport && selectedTransfer && (
          <TransferReport transfer={selectedTransfer} onClose={() => setShowTransferReport(false)} />
        )}

        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          {downloadTransfer && <HiddenTransferReport transfer1={downloadTransfer} />}
        </div>
      </main>
    </div>
  );
};

export default AssetTransferProgress;
