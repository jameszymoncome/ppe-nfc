// filepath: src/pages/Assets.jsx
import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  Download,
  Plus,
  Printer,
  Upload,
  X,
} from "lucide-react";
import AD_Sidebar from "../../components/AD_Sidebar";
import axios from "axios";
import { BASE_URL } from "../../utils/connection";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";

const AD_Assets = () => {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [downloadAsset, setDownloadAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState(new Set());
  const [batchAction, setBatchAction] = useState(null); // 'print' | 'download' | null
  const [batchDocType, setBatchDocType] = useState(null); // 'PAR' | 'ICS' | 'MIXED' | null
  const [showDocModal, setShowDocModal] = useState(false);
  const [printGroups, setPrintGroups] = useState([]); // [{ type: 'PAR'|'ICS', dept: string, fund: string, items: [...], head: {...} }]
  const [isPreparing, setIsPreparing] = useState(false);
  const userId = localStorage.getItem("userId");

  // Fetch assets from backend
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/getAssets.php?user_id=${userId}`);
        const data = await res.json();
        setAssets(data.assets || []);
      } catch (err) {
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [userId]);

  // Filter + Search logic
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.propertyNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === "All" ||
      (asset.status || "").toLowerCase() === selectedFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "In Use":
        return "bg-blue-100 text-blue-800";
      case "Transferred":
        return "bg-purple-100 text-purple-800";
      case "Disposed":
        return "bg-red-100 text-red-800";
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

  // Download Asset PDF
  const handleDownload = async (asset) => {
    setDownloadAsset(asset);
  };

  const selectedAssets = assets.filter((_, idx) => selectedSet.has(idx));
  const allVisibleSelected = filteredAssets.length > 0 && filteredAssets.every((fa) => {
    const idx = assets.indexOf(fa);
    return selectedSet.has(idx);
  });
  const toggleSelectAllVisible = () => {
    const newSet = new Set(selectedSet);
    if (allVisibleSelected) {
      filteredAssets.forEach((fa) => newSet.delete(assets.indexOf(fa)));
    } else {
      filteredAssets.forEach((fa) => newSet.add(assets.indexOf(fa)));
    }
    setSelectedSet(newSet);
  };
  const toggleRow = (idx) => {
    const newSet = new Set(selectedSet);
    if (newSet.has(idx)) newSet.delete(idx); else newSet.add(idx);
    setSelectedSet(newSet);
  };

  // Fetch data from backend similar to PAR_ICS flow per document group
  const preparePrintData = async (docTypeHint) => {
    setIsPreparing(true);
    try {
      // group selected assets by document type + document no
      const groupsMap = new Map();
      selectedAssets.forEach((a) => {
        const type = (a.document_type || '').toUpperCase();
        const docNo = a.document_no || a.documentNo || a.item_no || '';
        const key = `${type}|${docNo}`;
        if (!groupsMap.has(key)) groupsMap.set(key, { type, docNo });
      });

      const headRes = await axios.get(`${BASE_URL}/getGSOHead.php`);
      const head = headRes.data?.head || {};

      const groupPromises = Array.from(groupsMap.values()).map(async (g) => {
        // align to PAR_ICS: printDocs.php expects docsNo and typess
        const res = await axios.get(`${BASE_URL}/printDocs.php`, {
          params: { docsNo: g.docNo, typess: g.type }
        });
        const items = Array.isArray(res.data) ? res.data : [];
        // department inferred from first item if present
        const dept = items[0]?.department || items[0]?.office || '';
        const fund = items[0]?.fund || '';
        return { ...g, items, dept, fund, head };
      });

      const loaded = await Promise.all(groupPromises);
      setPrintGroups(loaded);
      // set overall type
      const types = new Set(loaded.map(g => g.type));
      setBatchDocType(types.size > 1 ? 'MIXED' : (types.values().next().value || (docTypeHint || 'PAR')));
      setShowDocModal(true);
    } catch (e) {
      Swal.fire("Error", "Failed to prepare document for printing.", "error");
    } finally {
      setIsPreparing(false);
    }
  };

  useEffect(() => {
    if (downloadAsset) {
      const generatePDF = async () => {
        const input = document.getElementById("asset-report-hidden");
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

          pdf.save(`Asset-${downloadAsset.propertyNo}.pdf`);
          setDownloadAsset(null);
        }
      };
      generatePDF();
    }
  }, [downloadAsset]);

  // Batch print/download selected assets
  useEffect(() => {
    if (!batchAction) return;
    const generateBatchPDF = async () => {
      // allow DOM to paint off-screen content before capture
      await new Promise((resolve) => setTimeout(resolve, 0));
      const input = document.getElementById("par-ics-report-hidden");
      if (!input) return;
      const canvas = await html2canvas(input, { scale: 2, backgroundColor: "#ffffff" });
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
      if (batchAction === "download") {
        const filename = batchDocType === 'MIXED' ? 'Documents_Selected.pdf' : `${batchDocType || 'Assets'}_Selected.pdf`;
        pdf.save(filename);
      } else if (batchAction === "print") {
        if (pdf.autoPrint) pdf.autoPrint();
        const blobUrl = pdf.output("bloburl");
        window.open(blobUrl, "_blank");
      }
      setBatchAction(null);
      setBatchDocType(null);
    };
    generateBatchPDF();
  }, [batchAction]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AD_Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Assets</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage, view, and monitor organization assets.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                onClick={async () => {
                  if (selectedAssets.length === 0) {
                    Swal.fire("No selection", "Select assets to print.", "info");
                    return;
                  }
                  await preparePrintData('PAR');
                }}
                title="Print Selected"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                onClick={async () => {
                  if (selectedAssets.length === 0) {
                    Swal.fire("No selection", "Select assets to download.", "info");
                    return;
                  }
                  await preparePrintData('PAR');
                }}
                title="Download Selected"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                className="bg-blue-800 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                onClick={() => {
                  if (selectedAssets.length === 0) {
                    Swal.fire("No selection", "Select assets to transfer.", "info");
                    return;
                  }
                  Swal.fire("Feature Coming Soon!", "Transfer flow from selected assets.", "info");
                }}
                title="Transfer Selected"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Transfer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <StatusBadge status={selectedFilter} />
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute mt-1 w-full sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {["All", "Available", "In Use", "Transferred", "Disposed"].map(
                    (status) => (
                      <div
                        key={status}
                        onClick={() => {
                          setSelectedFilter(status);
                          setDropdownOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        <StatusBadge status={status} />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={toggleSelectAllVisible}
                        checked={filteredAssets.length > 0 && allVisibleSelected}
                        aria-label="Select all visible"
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item No.</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document No.</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Acquired</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center text-gray-500">No assets found.</td>
                    </tr>
                  ) : (
                    assets.map((asset, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedSet.has(idx)}
                            onChange={() => toggleRow(idx)}
                            aria-label={`Select asset ${asset.item_no || ''}`}
                          />
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.item_no}</td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={asset.description}>
                            {asset.description}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.model}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.document_type}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.document_no}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.inspection_status}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={asset.status} />
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.date_acquired}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Component for PDF */}
      {downloadAsset && (
        <div className="hidden">
          <div
            id="asset-report-hidden"
            className="bg-white p-10 w-[800px]"
          >
            <h1 className="text-lg font-bold text-center mb-4">
              Asset Report
            </h1>
            <p><strong>Property No:</strong> {downloadAsset.propertyNo}</p>
            <p><strong>Name:</strong> {downloadAsset.asset_name}</p>
            <p><strong>Description:</strong> {downloadAsset.description}</p>
            <p><strong>Status:</strong> {downloadAsset.status}</p>
          </div>
        </div>
      )}

      {/* Hidden PAR/ICS-styled batch report for selected assets */}
      {selectedAssets.length > 0 && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="par-ics-report-hidden" className="bg-white p-6 w-[900px]">
            {/* PAR Section */}
            {printGroups
            .filter(g => g.type === "PAR" || batchDocType === "MIXED")
            .map((g, gi) => (
                <div
                key={`par-modal-${gi}`}
                className="bg-white shadow-xl max-w-4xl w-full mx-auto mb-10 border border-black"
                >
                <div className="p-6">
                    {/* Header Section */}
                    <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-2">
                        PROPERTY ACKNOWLEDGMENT RECEIPT
                    </h1>
                    <p className="text-sm">{g.dept || ""}</p>
                    <p className="text-sm">Local Government Unit of Daet</p>
                    <p className="text-sm">Daet, Camarines Norte</p>
                    </div>

                    {/* Fund and PAR No. */}
                    <div className="flex gap-4 mb-3">
                    <div className="w-1/2 flex items-center gap-2 text-xs">
                        <span className="font-medium">Fund:</span>
                        <span className="border-b border-gray-400 flex-1">{g.fund || ''}</span>
                    </div>
                    <div className="w-1/2 flex items-center gap-2 text-xs">
                        <span className="font-medium">PAR No.:</span>
                        <span className="border-b border-gray-400 flex-1 italic text-gray-500">{g.docNo}</span>
                    </div>
                    </div>


                    {/* Table */}
                    <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black">
                        <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-black px-2 py-2 text-xs font-medium">
                            Quantity
                            </th>
                            <th className="border border-black px-2 py-2 text-xs font-medium">
                            Unit
                            </th>
                            <th className="border border-black px-2 py-2 text-xs font-medium">
                            Description
                            </th>
                            <th className="border border-black px-2 py-2 text-xs font-medium">
                            Property Number
                            </th>
                            <th className="border border-black px-2 py-2 text-xs font-medium">
                            Date Acquired
                            </th>
                            <th className="border border-black px-2 py-2 text-xs font-medium">
                            Amount
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {(() => {
                            // Group items
                            const map = new Map();
                            g.items.forEach(it => {
                            const key = `${it.fund}|${it.article}|${it.description}|${it.model}|${it.unit}|${it.unitCost}`;
                            if (!map.has(key)) map.set(key, []);
                            map.get(key).push(it);
                            });

                            // Build grouped rows
                            const groupedRows = Array.from(map.values()).map((group, idx) => {
                            const first = group[0];
                            return (
                                <tr key={`par-modal-row-${idx}`}>
                                <td className="border border-black px-2 py-2 text-xs text-center">
                                    {group.length}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs text-center">
                                    {first.unit || "-"}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs whitespace-pre-line">
                                    {group
                                    .map(it => `${it.description} ${it.model} ${it.serialNo}`)
                                    .join("\n")}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs text-center whitespace-pre-line">
                                    {group.map(it => `${it.itemNOs}`).join("\n")}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs text-center">
                                    {first.dateAcquired || "-"}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs text-right whitespace-pre-line">
                                    {group.map(it => parseFloat(it.unitCost).toFixed(2)).join("\n")}
                                </td>
                                </tr>
                            );
                            });

                            // Add filler rows until 20
                            const fillerRows = Array.from(
                            { length: Math.max(0, 20 - groupedRows.length) },
                            (_, i) => (
                                <tr key={`empty-${i}`}>
                                <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                                <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                                <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                                <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                                <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                                <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                                </tr>
                            )
                            );

                            return [...groupedRows, ...fillerRows];
                        })()}
                        </tbody>
                    </table>
                    </div>

                    {/* Signature Section */}
                    <div className="grid grid-cols-2 border border-black mt-6">
                    <div className="text-center border-r border-black p-6">
                        <p className="text-sm font-medium mb-2">Received by:</p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center text-sm font-semibold">
                        {g.items[0]?.enduserName || "N/A"}
                        </div>
                        <p className="text-xs">Signature over Printed Name of End User</p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center text-sm font-semibold">
                        {g.dept || "N/A"}
                        </div>
                        <p className="text-xs">Position/Office</p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center text-sm font-semibold">
                        {new Date().toLocaleDateString()}
                        </div>
                        <p className="text-xs">Date</p>
                    </div>

                    <div className="text-center border-l border-black p-6">
                        <p className="text-sm font-medium mb-2">Issued by:</p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center text-sm font-semibold">
                        {g.head?.fullname || "N/A"}
                        </div>
                        <p className="text-xs">
                        Signature over Printed Name of Supply and/or Property Custodian
                        </p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center text-sm font-semibold">
                        {g.head?.position || "N/A"}
                        </div>
                        <p className="text-xs">Position/Office</p>
                        <div className="border-b border-gray-300 mt-4 h-8 flex items-center justify-center text-sm font-semibold">
                        {new Date().toLocaleDateString()}
                        </div>
                        <p className="text-xs">Date</p>
                    </div>
                    </div>
                </div>
                </div>
            ))}


            {/* ICS Section */}
            {printGroups.filter(g => g.type === 'ICS' || batchDocType === 'MIXED').map((g, gi) => (
            <div key={`ics-modal-${gi}`} className="bg-white max-w-4xl w-full mx-auto mb-10 border border-black">
                <div className="p-6">
                {/* Header Section */}
                <div className="text-center mb-6">
                    <h1 className="text-lg font-bold">INVENTORY CUSTODIAN SLIP</h1>
                    <p className="text-sm">{g.dept || ''}</p>
                    <p className="text-sm">Local Government Unit of Daet</p>
                    <p className="text-sm">Daet, Camarines Norte</p>
                </div>

                {/* Fund and ICS No. */}
                <div className="flex gap-4 p-3 border-b border-black mb-2 text-xs">
                    <div className="w-1/2 flex items-center gap-2">
                    <span className="font-medium">Fund:</span>
                    <span className="border-b border-gray-400 flex-1">{g.fund || ''}</span>
                    </div>
                    <div className="w-1/2 flex items-center gap-2">
                    <span className="font-medium">ICS No.:</span>
                    <span className="border-b border-gray-400 flex-1">{g.docNo}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-50">
                        <th className="border border-black px-2 py-2 text-xs font-medium">Quantity</th>
                        <th className="border border-black px-2 py-2 text-xs font-medium">Unit</th>
                        <th className="border border-black px-2 py-2 text-xs font-medium">Unit Cost</th>
                        <th className="border border-black px-2 py-2 text-xs font-medium">Total Cost</th>
                        <th className="border border-black px-2 py-2 text-xs font-medium">Description</th>
                        <th className="border border-black px-2 py-2 text-xs font-medium">Inventory Item No.</th>
                        <th className="border border-black px-2 py-2 text-xs font-medium">Estimated Useful Life</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                        const map = new Map();
                        g.items.forEach(it => {
                            const key = `${it.fund}|${it.article}|${it.description}|${it.model}|${it.unit}`;
                            if (!map.has(key)) map.set(key, []);
                            map.get(key).push(it);
                        });

                        const groupedRows = Array.from(map.values()).map((group, idx) => {
                            const first = group[0];
                            const total = parseFloat(first.unitCost || 0) * group.length;
                            return (
                            <tr key={`ics-modal-row-${idx}`}>
                                <td className="border border-black px-2 py-2 text-xs text-center">{group.length}</td>
                                <td className="border border-black px-2 py-2 text-xs text-center">{first.unit || '-'}</td>
                                <td className="border border-black px-2 py-2 text-xs text-center">{first.unitCost || '-'}</td>
                                <td className="border border-black px-2 py-2 text-xs text-center">{Number.isFinite(total) ? total : '-'}</td>
                                <td className="border border-black px-2 py-2 text-xs whitespace-pre-line">
                                {group.map(it => `${it.description}`).join('\n')}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs text-center whitespace-pre-line">
                                {group.map(it => `${it.itemNOs}`).join('\n')}
                                </td>
                                <td className="border border-black px-2 py-2 text-xs text-center">{first.estimatedLife || '-'}</td>
                            </tr>
                            );
                        });

                        // Fill empty rows up to 20
                        const emptyRows = Array.from({ length: Math.max(0, 20 - groupedRows.length) }, (_, i) => (
                            <tr key={`empty-${i}`}>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            </tr>
                        ));

                        return [...groupedRows, ...emptyRows];
                        })()}
                    </tbody>
                    </table>
                </div>

                {/* Signature Section */}
                <div className="grid grid-cols-2 border-t-2 border-black mt-4 text-xs">
                    <div className="p-3 border-r border-black">
                    <p className="font-semibold mb-2">Received by :</p>
                    <div className="border-b border-black h-6 mb-1 flex items-center justify-center">{g.items[0]?.enduserName || 'N/A'}</div>
                    <p className="text-[10px] text-center">Signature over Printed Name of End User</p>
                    <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">{g.dept || 'N/A'}</div>
                    <p className="text-[10px] text-center">Position/Office</p>
                    <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">{new Date().toLocaleDateString() || 'N/A'}</div>
                    <p className="text-[10px] text-center">Date</p>
                    </div>

                    <div className="p-3">
                    <p className="font-semibold mb-2">Issued by :</p>
                    <div className="border-b border-black h-6 mb-1 flex items-center justify-center">{g.head?.fullname || 'N/A'}</div>
                    <p className="text-[10px] text-center">Signature over Printed Name of Supply</p>
                    <p className="text-[10px] text-center">and/or Property Custodian</p>
                    <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">{g.head?.position || 'N/A'}</div>
                    <p className="text-[10px] text-center">Position/Office</p>
                    <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">{new Date().toLocaleDateString() || 'N/A'}</div>
                    <p className="text-[10px] text-center">Date</p>
                    </div>
                </div>
                </div>
            </div>
            ))}

          </div>
        </div>
      )}

      {/* Visible Preview Modal following PAR/ICS formats */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl p-6 relative border max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setShowDocModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Actions */}
            <div className="flex justify-end gap-2 mb-4">
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center gap-2"
                onClick={() => { setBatchAction('print'); }}
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                onClick={() => { setBatchAction('download'); }}
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>

            {/* Content mirrors hidden content using backend grouped data */}
            <div className="bg-white p-2">
              {isPreparing && <div className="text-sm text-gray-500 mb-2">Preparing document...</div>}
              {printGroups.filter(g => g.type === 'PAR' || batchDocType === 'MIXED').map((g, gi) => (
                <div key={`parv-${gi}`} className="mb-10">
                    <h2 className="text-lg font-bold text-center">PROPERTY ACKNOWLEDGMENT RECEIPT</h2>
                    <div className="text-center text-sm">{g.dept || ''}</div>
                    <div className="text-center text-sm">Local Government Unit of Daet</div>
                    <div className="text-center text-sm mb-4">Daet, Camarines Norte</div>

                    {/* Fund and PAR No. */}
                    <div className="flex gap-4 mb-3">
                    <div className="w-1/2 flex items-center gap-2 text-xs">
                        <span className="font-medium">Fund:</span>
                        <span className="border-b border-gray-400 flex-1">{g.fund || ''}</span>
                    </div>
                    <div className="w-1/2 flex items-center gap-2 text-xs">
                        <span className="font-medium">PAR No.:</span>
                        <span className="border-b border-gray-400 flex-1 italic text-gray-500">{g.docNo}</span>
                    </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-50">
                        <th className="border border-black p-2 text-xs">Quantity</th>
                        <th className="border border-black p-2 text-xs">Unit</th>
                        <th className="border border-black p-2 text-xs">Description</th>
                        <th className="border border-black p-2 text-xs">Property Number</th>
                        <th className="border border-black p-2 text-xs">Date Acquired</th>
                        <th className="border border-black p-2 text-xs">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                        const map = new Map();
                        g.items.forEach(it => {
                            const key = `${it.fund}|${it.article}|${it.description}|${it.model}|${it.unit}|${it.unitCost}`;
                            if (!map.has(key)) map.set(key, []);
                            map.get(key).push(it);
                        });

                        const groupedRows = Array.from(map.values()).map((group, idx) => {
                            const first = group[0];
                            return (
                            <tr key={`parv-row-${idx}`}>
                                <td className="border border-black p-2 text-center text-xs">{group.length}</td>
                                <td className="border border-black p-2 text-center text-xs">{first.unit || '-'}</td>
                                <td className="border border-black p-2 whitespace-pre-line text-xs">
                                {group.map(it => `${it.description} ${it.model} ${it.serialNo}`).join('\n')}
                                </td>
                                <td className="border border-black p-2 text-center whitespace-pre-line text-xs">
                                {group.map(it => `${it.itemNOs}`).join('\n')}
                                </td>
                                <td className="border border-black p-2 text-center text-xs">{first.dateAcquired || '-'}</td>
                                <td className="border border-black p-2 text-right whitespace-pre-line text-xs">
                                {group.map(it => `${it.unitCost}`).join('\n')}
                                </td>
                            </tr>
                            );
                        });

                        // Fill empty rows up to 20
                        const emptyRows = Array.from({ length: Math.max(0, 20 - groupedRows.length) }, (_, i) => (
                            <tr key={`empty-${i}`}>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                            </tr>
                        ));

                        return [...groupedRows, ...emptyRows];
                        })()}
                    </tbody>
                    </table>

                    {/* Signature Section */}
                    <div className="grid grid-cols-2 border border-black mt-6">
                    {/* Received by */}
                    <div className="text-center border-r border-black p-4">
                        <p className="text-xs font-medium mb-2">Received by:</p>
                        <div className="border-b border-gray-400 h-6 flex items-center justify-center text-xs">
                        {g.items[0]?.enduserName || 'N/A'}
                        </div>
                        <p className="text-[10px]">Signature over Printed Name of End User</p>
                        <div className="border-b border-gray-400 h-6 mt-3 flex items-center justify-center text-xs">
                        {g.dept || 'N/A'}
                        </div>
                        <p className="text-[10px]">Position/Office</p>
                        <div className="border-b border-gray-400 h-6 mt-3 flex items-center justify-center text-xs">
                        {new Date().toLocaleDateString()}
                        </div>
                        <p className="text-[10px]">Date</p>
                    </div>

                    {/* Issued by */}
                    <div className="text-center p-4">
                        <p className="text-xs font-medium mb-2">Issued by:</p>
                        <div className="border-b border-gray-400 h-6 flex items-center justify-center text-xs">
                        {g.head?.fullname || 'N/A'}
                        </div>
                        <p className="text-[10px]">Signature over Printed Name of Supply and/or Property Custodian</p>
                        <div className="border-b border-gray-400 h-6 mt-3 flex items-center justify-center text-xs">
                        {g.head?.position || 'N/A'}
                        </div>
                        <p className="text-[10px]">Position/Office</p>
                        <div className="border-b border-gray-400 h-6 mt-3 flex items-center justify-center text-xs">
                        {new Date().toLocaleDateString()}
                        </div>
                        <p className="text-[10px]">Date</p>
                    </div>
                    </div>
                </div>
                ))}


              {printGroups.filter(g => g.type === 'ICS' || batchDocType === 'MIXED').map((g, gi) => (
                <div key={`icsv-${gi}`}>
                    <h2 className="text-lg font-bold text-center">INVENTORY CUSTODIAN SLIP</h2>
                    <div className="text-center text-sm">{g.dept || ''}</div>
                    <div className="text-center text-sm">Local Government Unit of Daet</div>
                    <div className="text-center text-sm mb-4">Daet, Camarines Norte</div>

                    {/* Fund and ICS No. with underline fix */}
                    <div className="flex gap-4 p-2 border-b border-black mb-2 text-xs">
                    <div className="w-1/2 flex items-center gap-2">
                        <span className="font-medium">Fund:</span>
                        <div className="flex-1 border-b border-gray-400">
                        <input
                            type="text"
                            value={g.fund || ""}
                            className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none"
                            readOnly
                        />
                        </div>
                    </div>
                    <div className="w-1/2 flex items-center gap-2">
                        <span className="font-medium">ICS No.:</span>
                        <div className="flex-1 border-b border-gray-400">
                        <input
                            type="text"
                            value={g.docNo || ""}
                            className="w-full bg-transparent text-xs px-1 py-0.5 focus:outline-none"
                            readOnly
                        />
                        </div>
                    </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                        <th className="border p-2">Quantity</th>
                        <th className="border p-2">Unit</th>
                        <th className="border p-2">Unit Cost</th>
                        <th className="border p-2">Total Cost</th>
                        <th className="border p-2">Description</th>
                        <th className="border p-2">Inventory Item No.</th>
                        <th className="border p-2">Estimated Useful Life</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                        const map = new Map();
                        g.items.forEach(it => {
                            const key = `${it.fund}|${it.article}|${it.description}|${it.model}|${it.unit}`;
                            if (!map.has(key)) map.set(key, []);
                            map.get(key).push(it);
                        });
                        const groupedRows = Array.from(map.values()).map((group, idx) => {
                            const first = group[0];
                            const total = parseFloat(first.unitCost || 0) * group.length;
                            return (
                            <tr key={`icsv-row-${idx}`}>
                                <td className="border p-2 text-center">{group.length}</td>
                                <td className="border p-2 text-center">{first.unit || '-'}</td>
                                <td className="border p-2 text-center">{first.unitCost || '-'}</td>
                                <td className="border p-2 text-center">{Number.isFinite(total) ? total : '-'}</td>
                                <td className="border p-2 whitespace-pre-line">
                                {group.map(it => `${it.description}`).join('\n')}
                                </td>
                                <td className="border p-2 text-center whitespace-pre-line">
                                {group.map(it => `${it.itemNOs}`).join('\n')}
                                </td>
                                <td className="border p-2 text-center">{first.estimatedLife || '-'}</td>
                            </tr>
                            );
                        });
                        // Fill empty rows up to 20
                        const emptyRows = Array.from({ length: Math.max(0, 20 - groupedRows.length) }, (_, i) => (
                            <tr key={`empty-${i}`}>
                            <td className="border p-2 text-xs">&nbsp;</td>
                            <td className="border p-2 text-xs">&nbsp;</td>
                            <td className="border p-2 text-xs">&nbsp;</td>
                            <td className="border p-2 text-xs">&nbsp;</td>
                            <td className="border p-2 text-xs">&nbsp;</td>
                            <td className="border p-2 text-xs">&nbsp;</td>
                            <td className="border p-2 text-xs">&nbsp;</td>
                            </tr>
                        ));
                        return [...groupedRows, ...emptyRows];
                        })()}
                    </tbody>
                    </table>

                    {/* Signature Section */}
                    <div className="grid grid-cols-2 border-t-2 border-black mt-4 text-xs">
                    <div className="p-3 border-r border-black">
                        <p className="font-semibold mb-2">Received by :</p>
                        <div className="border-b border-black h-6 mb-1 flex items-center justify-center">
                        {g.items[0]?.enduserName || 'N/A'}
                        </div>
                        <p className="text-[10px] text-center">Signature over Printed Name of End User</p>
                        <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">
                        {g.dept || 'N/A'}
                        </div>
                        <p className="text-[10px] text-center">Position/Office</p>
                        <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">
                        {new Date().toLocaleDateString() || 'N/A'}
                        </div>
                        <p className="text-[10px] text-center">Date</p>
                    </div>
                    <div className="p-3">
                        <p className="font-semibold mb-2">Issued by :</p>
                        <div className="border-b border-black h-6 mb-1 flex items-center justify-center">
                        {g.head?.fullname || 'N/A'}
                        </div>
                        <p className="text-[10px] text-center">Signature over Printed Name of Supply</p>
                        <p className="text-[10px] text-center">and/or Property Custodian</p>
                        <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">
                        {g.head?.position || 'N/A'}
                        </div>
                        <p className="text-[10px] text-center">Position/Office</p>
                        <div className="border-b border-black h-6 mb-1 mt-3 flex items-center justify-center">
                        {new Date().toLocaleDateString() || 'N/A'}
                        </div>
                        <p className="text-[10px] text-center">Date</p>
                    </div>
                    </div>
                </div>
                ))}

            </div>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedAsset(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Asset Details</h2>
            <p><strong>Property No:</strong> {selectedAsset.propertyNo}</p>
            <p><strong>Name:</strong> {selectedAsset.asset_name}</p>
            <p><strong>Description:</strong> {selectedAsset.description}</p>
            <p><strong>Status:</strong> {selectedAsset.status}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AD_Assets;
