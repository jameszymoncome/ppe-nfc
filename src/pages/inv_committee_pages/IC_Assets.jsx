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
import IC_Sidebar from "../../components/IC_Sidebar";
import axios from "axios";
import {BASE_URL} from '../../utils/connection';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const IC_Assets = () => {
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
  const navigate = useNavigate();

  // Pagination / Infinite scroll helpers
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25); // change page size here
  const [viewMode, setViewMode] = useState("pagination"); // "pagination" | "loadmore"


  // Fetch assets from backend
  // Fetch assets from backend
useEffect(() => {
  const fetchAssets = async () => {
    if (!userId) return; // 🛑 Don't fetch if userId isn't loaded yet

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/EM_getAssets.php?user_id=${userId}`);
      const data = await res.json();

      if (data.success) {
        setAssets(data.assets || []);
      } else {
        console.error("Failed to fetch assets:", data.message);
        setAssets([]);
      }
    } catch (err) {
      console.error("Error fetching assets:", err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  fetchAssets();
}, [userId]); // ✅ Refetch if userId changes

  // Filter + Search logic
  const filteredAssets = (() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return assets.filter((asset) => {
      // normalize searchable fields to a single string safely
      const searchable = (
        (asset.asset_name || asset.propertyNo || asset.item_no || asset.description || "") + ""
      ).toLowerCase();
      const matchesSearch = term === "" ? true : searchable.includes(term);
      const matchesFilter =
        selectedFilter === "All" ||
        ((asset.status || "").toLowerCase() === selectedFilter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  })();

  // keep page valid when filter/search change
 useEffect(() => {
   const pages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
   if (page > pages - 1) setPage(pages - 1);
 }, [filteredAssets.length, pageSize]); 

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
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

  // compute displayedAssets depending on mode
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const displayedAssets =
    viewMode === "loadmore"
      ? filteredAssets.slice(0, (page + 1) * pageSize)
      : filteredAssets.slice(page * pageSize, (page + 1) * pageSize);

  const selectedAssets = assets.filter((_, idx) => selectedSet.has(idx));
  const allVisibleSelected =
    displayedAssets.length > 0 &&
    displayedAssets.every((fa) => {
      const idx = assets.indexOf(fa);
      return selectedSet.has(idx);
    });

  const toggleSelectAllVisible = () => {
    const newSet = new Set(selectedSet);
    if (allVisibleSelected) {
      displayedAssets.forEach((fa) => newSet.delete(assets.indexOf(fa)));
    } else {
      displayedAssets.forEach((fa) => newSet.add(assets.indexOf(fa)));
    }
    setSelectedSet(newSet);
  };
  const toggleRow = (idx) => {
    const newSet = new Set(selectedSet);
    if (newSet.has(idx)) newSet.delete(idx); else newSet.add(idx);
    setSelectedSet(newSet);
  };

  const goToPage = (p) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, p));
    setPage(clamped);
    // scroll to top of list in modal/page if needed
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const loadMore = () => {
    if ((page + 1) < totalPages) setPage(page + 1);
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

   // ✅ Group by both document_no and document_type
  const groupedAssets = assets.reduce((acc, asset) => {
    const key = `${asset.document_no || "NoDoc"}_${asset.document_type || "Unknown"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(asset);
    return acc;
  }, {});

  const groupedArray = Object.entries(groupedAssets).map(([key, items]) => ({
    document_no: items[0].document_no,
    document_type: items[0].document_type,
    assigned_to: items[0].assigned_to,
    user_id: items[0].user_id,
    department: items[0].department,
    status: items[0].status,
    date_acquired: items[0].date_acquired,
    itemCount: items.length,
    items,
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <IC_Sidebar />

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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="viewMode"
                  checked={viewMode === "pagination"}
                  onChange={() => { setViewMode("pagination"); setPage(0); }}
                />
                <span>Paginate</span>
              </label>
              <label className="inline-flex items-center gap-2 ml-3">
                <input
                  type="radio"
                  name="viewMode"
                  checked={viewMode === "loadmore"}
                  onChange={() => { setViewMode("loadmore"); setPage(0); }}
                />
                <span>Load more</span>
              </label>
              <span className="ml-4 text-xs text-gray-500">{filteredAssets.length} result(s)</span>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === "pagination" ? (
                <>
                  <button
                    onClick={prevPage}
                    disabled={page === 0}
                    className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="text-sm px-2">Page {page + 1} / {totalPages}</div>
                  <button
                    onClick={nextPage}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  <div className="text-sm px-2">Showing {(page + 1) * pageSize > filteredAssets.length ? filteredAssets.length : (page + 1) * pageSize} of {filteredAssets.length}</div>
                  <button
                    onClick={loadMore}
                    disabled={(page + 1) * pageSize >= filteredAssets.length}
                    className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50"
                  >
                    Load more
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Assets Table (responsive) */}
          <div className="mt-2 bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={toggleSelectAllVisible}
                    checked={displayedAssets.length > 0 && allVisibleSelected}
                    aria-label="Select all visible"
                  />
                </th>
                <th className="px-4 py-3 text-left">Document No.</th>
                <th className="px-4 py-3 text-left">Document Type</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date Acquired</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : groupedArray.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    No assets found.
                  </td>
                </tr>
              ) : (
                groupedArray.map((group, index) => (
                  <tr
                  key={group.user_id}
                  className="hover:bg-blue-50 cursor-pointer border-b border-gray-200"
                  onClick={() => {
                    navigate(
                      `/assets/ic-document/${encodeURIComponent(group.document_no)}?user_id=${group.user_id}&from_officer=${encodeURIComponent(group.assigned_to)}&department=${encodeURIComponent(group.department)}`,
                      { state: { items: group.items } }
                    );
                  }}
                >

                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedSet.has(index)}
                        onChange={() => toggleRow(index)}
                        aria-label={`Select group ${group.document_no}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {group.document_no || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {group.document_type || "Unknown"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {(() => {
                              if (!group.assigned_to) return "?";
                              const parts = group.assigned_to.trim().split(" ");
                              if (parts.length === 1) return parts[0][0].toUpperCase();
                              return (
                                parts[0][0].toUpperCase() +
                                parts[parts.length - 1][0].toUpperCase()
                              );
                            })()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {group.assigned_to || "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {group.department}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {group.itemCount} item{group.itemCount > 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={group.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {group.date_acquired}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

export default IC_Assets;
