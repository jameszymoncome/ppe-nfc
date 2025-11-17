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
import Sidebar from "../components/Sidebar";
import axios from "axios";
import {BASE_URL} from '../utils/connection';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const Assets = () => {
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
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Pagination / Infinite scroll helpers
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25); // change page size here
  const [viewMode, setViewMode] = useState("pagination"); // "pagination" | "loadmore"


  // Fetch assets from backend
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/getAssets.php?`);
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

  // ✅ NOW define selection helpers (after groupedArray exists)
  const makeGroupKey = (group) => `${group.document_no || 'NoDoc'}_${group.document_type || 'Unknown'}`;

  // compute visible groups for current page/view (used by "select all visible")
  const visibleGroups = (() => {
    const start = viewMode === "loadmore" ? 0 : page * pageSize;
    const end = viewMode === "loadmore" ? Math.min(groupedArray.length, (page + 1) * pageSize) : Math.min(groupedArray.length, (page + 1) * pageSize);
    return groupedArray.slice(start, end);
  })();

  const selectedGroups = groupedArray.filter((g) => selectedSet.has(makeGroupKey(g)));
  const selectedAssets = selectedGroups.flatMap((g) => g.items);

  const allVisibleSelected =
    visibleGroups.length > 0 && visibleGroups.every((g) => selectedSet.has(makeGroupKey(g)));

  const toggleSelectAllVisible = () => {
    const newSet = new Set(selectedSet);
    if (allVisibleSelected) {
      visibleGroups.forEach((g) => newSet.delete(makeGroupKey(g)));
    } else {
      visibleGroups.forEach((g) => newSet.add(makeGroupKey(g)));
    }
    setSelectedSet(newSet);
  };

  const toggleRow = (groupIndex) => {
    const group = groupedArray[groupIndex];
    if (!group) return;
    const key = makeGroupKey(group);
    const newSet = new Set(selectedSet);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedSet(newSet);
  };

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
      // Build groups from current selectedGroups (already grouped server-side)
      const headRes = await axios.get(`${BASE_URL}/getGSOHead.php`);
      const head = headRes.data?.head || {};

      const groupPromises = selectedGroups.map(async (g) => {
        // Fetch official print items for this document (ensures correct canonical ordering/fields)
        const res = await axios.get(`${BASE_URL}/printDocs.php`, {
          params: { docsNo: g.document_no, typess: g.document_type }
        });
        const items = Array.isArray(res.data) ? res.data : [];
        const dept = items[0]?.department || g.department || '';
        const fund = items[0]?.fund || '';
        return { type: g.document_type, docNo: g.document_no, items, dept, fund, head };
      });

      const loaded = await Promise.all(groupPromises);
      setPrintGroups(loaded);
      const types = new Set(loaded.map((g) => (g.type || '').toUpperCase()));
      setBatchDocType(types.size > 1 ? 'MIXED' : (types.values().next().value || (docTypeHint || 'PAR')));
      setShowDocModal(true);
    } catch (e) {
      Swal.fire("Error", "Failed to prepare document for printing.", "error");
    } finally {
      setIsPreparing(false);
    }
  };

  // Unified function to handle both print and download for batch operations
  const handleBatchAction = async (action) => {
    if (printGroups.length === 0) {
      Swal.fire("No documents", "No documents prepared for printing/downloading.", "info");
      return;
    }

    setIsProcessing(true);
    try {
      if (action === 'print') {
        await handleBatchPrint();
      } else if (action === 'download') {
        await handleBatchDownload();
      }
    } catch (error) {
      console.error("Error processing batch action:", error);
      Swal.fire("Error", "Failed to process documents. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle batch printing
  const handleBatchPrint = async () => {
    // Use the preview content (same as what user sees) for printing
    const previewContainer = document.querySelector('.bg-white.p-2');
    if (!previewContainer) {
      Swal.fire("Error", "Preview content not found.", "error");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire("Popup blocked", "Please allow popups to print documents.", "warning");
      return;
    }

    try {
      // Clone the preview content
      const printContent = previewContainer.cloneNode(true);
      
      // Remove page separators and preview-only styling for print
      const separators = printContent.querySelectorAll('.border-t-4.border-dashed');
      separators.forEach(sep => sep.remove());
      
      // Remove preview borders and shadows, keep content structure
      const borderedDivs = printContent.querySelectorAll('.border.border-gray-300');
      borderedDivs.forEach(div => {
        div.classList.remove('border', 'border-gray-300', 'shadow-sm');
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Documents</title>
            <style>
              @media print {
                @page { 
                  margin: 0.5cm; 
                  size: A4;
                }
                body { 
                  margin: 0; 
                  padding: 0;
                }
                .page-break-after {
                  page-break-after: always;
                }
                .page-break-avoid {
                  page-break-inside: avoid;
                }
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close window after print dialog closes (works in most browsers)
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
            }
          }, 500);
        }, 100);
      };
      
      // Fallback: if onload doesn't fire, try after a delay
      setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
          printWindow.print();
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
            }
          }, 500);
        }
      }, 500);
    } catch (error) {
      console.error("Print error:", error);
      Swal.fire("Error", "Failed to open print dialog. Please try again.", "error");
      if (!printWindow.closed) {
        printWindow.close();
      }
    }
  };

  // Handle batch downloading
  const handleBatchDownload = async () => {
    if (printGroups.length === 0) {
      Swal.fire("Error", "No documents to download. Please select documents first.", "error");
      return;
    }

    const content = document.getElementById('par-ics-report-hidden');
    if (!content) {
      Swal.fire("Error", "Document content not found. Please try refreshing the preview.", "error");
      return;
    }

    try {
      // Show progress
      Swal.fire({
        title: 'Generating PDF...',
        html: 'Please wait while we prepare your documents.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Clone the content for PDF generation (don't modify original)
      const clonedContent = content.cloneNode(true);
      
      // Create a visible container for the cloned content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.zIndex = '9999';
      tempContainer.style.overflow = 'visible';
      tempContainer.style.padding = '0';
      tempContainer.style.margin = '0';
      
      // Style the cloned content
      clonedContent.style.position = 'relative';
      clonedContent.style.left = '0';
      clonedContent.style.top = '0';
      clonedContent.style.width = '210mm';
      clonedContent.style.visibility = 'visible';
      clonedContent.style.display = 'block';
      clonedContent.style.backgroundColor = '#ffffff';
      clonedContent.style.padding = '0';
      clonedContent.style.margin = '0';
      
      // Make sure all nested elements are visible
      const allElements = clonedContent.querySelectorAll('*');
      allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.display === 'none') {
          el.style.display = '';
        }
        if (computedStyle.visibility === 'hidden') {
          el.style.visibility = 'visible';
        }
        // Fix any off-screen positioning
        if (el.style.position === 'absolute' && (el.style.left === '-9999px' || el.style.left.includes('-9999'))) {
          el.style.position = 'relative';
          el.style.left = '0';
        }
      });
      
      tempContainer.appendChild(clonedContent);
      document.body.appendChild(tempContainer);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify cloned content has children
      if (!clonedContent.children || clonedContent.children.length === 0) {
        document.body.removeChild(tempContainer);
        throw new Error("Content appears to be empty. Please ensure documents are loaded.");
      }
      
      // Verify content has text
      const hasText = clonedContent.innerText && clonedContent.innerText.trim().length > 0;
      if (!hasText) {
        document.body.removeChild(tempContainer);
        throw new Error("Content has no text. Please ensure documents are properly loaded.");
      }
      
      // Log for debugging
      console.log("PDF Content:", {
        childrenCount: clonedContent.children.length,
        hasText: hasText,
        textLength: clonedContent.innerText?.length || 0
      });

      // Generate filename based on document types
      const docTypes = [...new Set(printGroups.map(g => g.type))];
      const filename = docTypes.length === 1 
        ? `${docTypes[0]}-${printGroups[0]?.docNo || 'Documents'}.pdf`
        : `Documents-${new Date().toISOString().split('T')[0]}.pdf`;

      // Add CSS for page breaks that html2pdf can understand
      const style = document.createElement('style');
      style.textContent = `
        .page-break-after {
          page-break-after: always !important;
          break-after: page !important;
        }
        .page-break-avoid {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `;
      clonedContent.insertBefore(style, clonedContent.firstChild);

      // Use html2pdf for better quality and multi-page handling
      await html2pdf()
        .set({
          margin: [0, 0, 0, 0],
          filename: filename.replace(/\s+/g, '_'),
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
            windowHeight: 1123,
            allowTaint: true
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          },
          pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after',
            avoid: '.page-break-avoid'
          }
        })
        .from(clonedContent)
        .save();

      // Clean up temporary container
      document.body.removeChild(tempContainer);
      
      // Close loading dialog and show success
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Download Complete',
        text: 'Your documents have been downloaded successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      
      // Clean up temporary container on error
      const tempContainerEl = document.querySelector('[style*="z-index: 9999"]');
      if (tempContainerEl && tempContainerEl.parentElement === document.body) {
        document.body.removeChild(tempContainerEl);
      }
      
      Swal.close();
      Swal.fire("Error", `Failed to generate PDF: ${error.message || 'Unknown error'}. Please try again.`, "error");
    }
  };

  // Legacy single asset download (kept for backward compatibility)
  useEffect(() => {
    if (downloadAsset) {
      const generatePDF = async () => {
        const input = document.getElementById("asset-report-hidden");
        if (input) {
          try {
            const canvas = await html2canvas(input, { 
              scale: 2,
              backgroundColor: '#ffffff'
            });
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
          } catch (error) {
            console.error("PDF generation error:", error);
            Swal.fire("Error", "Failed to generate PDF.", "error");
          } finally {
            setDownloadAsset(null);
          }
        }
      };
      generatePDF();
    }
  }, [downloadAsset]);



  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

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
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={async () => {
                  if (selectedAssets.length === 0) {
                    Swal.fire("No selection", "Select assets to print.", "info");
                    return;
                  }
                  await preparePrintData('PAR');
                }}
                title="Print Selected"
                disabled={isPreparing || isProcessing}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isPreparing ? 'Preparing...' : 'Print'}
                </span>
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={async () => {
                  if (selectedAssets.length === 0) {
                    Swal.fire("No selection", "Select assets to download.", "info");
                    return;
                  }
                  await preparePrintData('PAR');
                }}
                title="Download Selected"
                disabled={isPreparing || isProcessing}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isPreparing ? 'Preparing...' : 'Download'}
                </span>
              </button>
              {/* <button
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
              </button> */}
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
                  key={`${group.user_id}-${group.document_no}`}
                  className="hover:bg-blue-50 cursor-pointer border-b border-gray-200"
                  onClick={() => {
                    navigate(
                      `/assets/document/${encodeURIComponent(group.document_no)}?user_id=${group.user_id}&from_officer=${encodeURIComponent(group.assigned_to)}&department=${encodeURIComponent(group.department)}`,
                      { state: { items: group.items } }
                    );
                  }}
                >

                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedSet.has(makeGroupKey(group))}
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
<>
  {/* Print-specific CSS to ensure exact A4 and reliable page breaks */}
  <style>
    {`
      @page { size: A4; margin: 0; }
      @media print {
        html, body { height: auto; }
        /* Remove browser default margins so A4 size is exact */
        @page { margin: 0; }
        /* Make page-break rules reliable across browsers */
        .page-break-after { page-break-after: always; break-after: page; }
        .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
        /* Ensure the hidden print container prints at the right size */
        #par-ics-report-hidden { width: 210mm; }
      }
    `}
  </style>

  {printGroups.length > 0 && (
    <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
      <div id="par-ics-report-hidden" className="bg-white" style={{ width: "210mm" }}>

        {/* ================= PAR SECTION ================= */}
        {printGroups
          .filter((g) => g.type === "PAR")
          .map((g, gi) => {
            const parGroups = printGroups.filter((p) => p.type === "PAR");
            const icsGroups = printGroups.filter((p) => p.type === "ICS");
            const isLastPAR = gi === parGroups.length - 1 && icsGroups.length === 0;

            return (
              <div
                key={`par-modal-${gi}`}
                className={`bg-white w-full border border-black page-break-avoid ${isLastPAR ? "" : "page-break-after"}`}
                style={{
                  width: "210mm",
                  minHeight: "277mm", // 297mm - 2*10mm padding
                  padding: "10mm",
                  boxSizing: "border-box",
                  overflow: "visible"
                }}
              >
                <div>

                  {/* Header */}
                  <div className="text-center mb-4">
                    <h1 className="text-base font-bold">PROPERTY ACKNOWLEDGMENT RECEIPT</h1>
                    <p className="text-xs">{g.dept || ""}</p>
                    <p className="text-xs">Local Government Unit of Daet</p>
                    <p className="text-xs">Daet, Camarines Norte</p>
                  </div>

                  {/* Fund + PAR No */}
                  <div className="flex gap-4 mb-2 text-xs">
                    <div className="w-1/2 flex items-center gap-2">
                      <span className="font-medium">Fund:</span>
                      <span className="border-b border-gray-400 flex-1">{g.fund || ""}</span>
                    </div>
                    <div className="w-1/2 flex items-center gap-2">
                      <span className="font-medium">PAR No.:</span>
                      <span className="border-b border-gray-400 flex-1">{g.docNo}</span>
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-black px-1.5 py-1.5 text-xs">Quantity</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Unit</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Description</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Property Number</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Date Acquired</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Amount</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(() => {
                          const map = new Map();
                          g.items.forEach((it) => {
                            const key = `${it.fund}|${it.article}|${it.description}|${it.model}|${it.unit}|${it.unitCost}`;
                            if (!map.has(key)) map.set(key, []);
                            map.get(key).push(it);
                          });

                          const groupedRows = Array.from(map.values()).map((group, idx) => {
                            const first = group[0];

                            return (
                              <tr key={`par-row-${idx}`}>
                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">{group.length}</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">{first.unit || "-"}</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs whitespace-pre-line">
                                  {group.map((it) => `${it.description} ${it.model} ${it.serialNo}`).join("\n")}
                                </td>
                                <td className="border border-black px-1.5 py-1.5 text-xs whitespace-pre-line text-center">
                                  {group.map((it) => it.itemNOs).join("\n")}
                                </td>
                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">{first.dateAcquired || "-"}</td>

                                {/* Peso Unit Cost */}
                                <td className="border border-black px-1.5 py-1.5 text-xs text-right whitespace-pre-line">
                                  {group
                                    .map(
                                      (it) =>
                                        "₱ " +
                                        parseFloat(it.unitCost || 0).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })
                                    )
                                    .join("\n")}
                                </td>
                              </tr>
                            );
                          });

                          const filler = Array.from(
                            { length: Math.max(0, 20 - groupedRows.length) },
                            (_, i) => (
                              <tr key={`empty-par-${i}`}>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                              </tr>
                            )
                          );

                          return [...groupedRows, ...filler];
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* SIGNATURE SECTION */}
                  <div className="grid grid-cols-2 border border-black mt-4">
                    <div className="text-center border-r border-black p-4">
                      <p className="text-xs font-medium mb-1">Received by:</p>

                      <div className="border-b border-gray-300 mt-2 h-7 flex items-center justify-center text-xs font-semibold">
                        {g.items[0]?.enduserName || "N/A"}
                      </div>

                      <p className="text-[9px]">Signature over Printed Name of End User</p>

                      <div className="border-b border-gray-300 mt-2 h-7 flex items-center justify-center text-xs font-semibold">
                        {g.dept || "N/A"}
                      </div>
                      <p className="text-[9px]">Position/Office</p>

                      <div className="border-b border-gray-300 mt-2 h-7 flex items-center justify-center text-xs font-semibold">
                        {new Date().toLocaleDateString()}
                      </div>
                      <p className="text-[9px]">Date</p>
                    </div>

                    <div className="text-center border-l border-black p-4">
                      <p className="text-xs font-medium mb-1">Issued by:</p>

                      <div className="border-b border-gray-300 mt-2 h-7 flex items-center justify-center text-xs font-semibold">
                        {g.head?.fullname || "N/A"}
                      </div>
                      <p className="text-[9px]">Signature over Printed Name of Supply and/or Property Custodian</p>

                      <div className="border-b border-gray-300 mt-2 h-7 flex items-center justify-center text-xs font-semibold">
                        {g.head?.position || "N/A"}
                      </div>
                      <p className="text-[9px]">Position/Office</p>

                      <div className="border-b border-gray-300 mt-2 h-7 flex items-center justify-center text-xs font-semibold">
                        {new Date().toLocaleDateString()}
                      </div>
                      <p className="text-[9px]">Date</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

        {/* ================= ICS SECTION ================= */}
        {printGroups
          .filter((g) => g.type === "ICS")
          .map((g, gi, arr) => {
            const isLastICS = gi === arr.length - 1;

            return (
              <div
                key={`ics-modal-${gi}`}
                className={`bg-white w-full border border-black page-break-avoid ${isLastICS ? "" : "page-break-after"}`}
                style={{
                  width: "210mm",
                  minHeight: "277mm",
                  padding: "10mm",
                  boxSizing: "border-box",
                  overflow: "visible"
                }}
              >
                <div>

                  {/* Header */}
                  <div className="text-center mb-4">
                    <h1 className="text-base font-bold">INVENTORY CUSTODIAN SLIP</h1>
                    <p className="text-xs">{g.dept || ""}</p>
                    <p className="text-xs">Local Government Unit of Daet</p>
                    <p className="text-xs">Daet, Camarines Norte</p>
                  </div>

                  {/* Fund + ICS No */}
                  <div className="flex gap-4 p-2 border-b border-black mb-2 text-xs">
                    <div className="w-1/2 flex items-center gap-2">
                      <span className="font-medium">Fund:</span>
                      <span className="border-b border-gray-400 flex-1">{g.fund || ""}</span>
                    </div>
                    <div className="w-1/2 flex items-center gap-2">
                      <span className="font-medium">ICS No.:</span>
                      <span className="border-b border-gray-400 flex-1">{g.docNo}</span>
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-black px-1.5 py-1.5 text-xs">Quantity</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Unit</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Unit Cost</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Total Cost</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Description</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Inventory Item No.</th>
                          <th className="border border-black px-1.5 py-1.5 text-xs">Estimated Useful Life</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(() => {
                          const map = new Map();

                          g.items.forEach((it) => {
                            const key = `${it.fund}|${it.article}|${it.description}|${it.model}|${it.unit}`;
                            if (!map.has(key)) map.set(key, []);
                            map.get(key).push(it);
                          });

                          const groupedRows = Array.from(map.values()).map((group, idx) => {
                            const first = group[0];
                            const total = parseFloat(first.unitCost || 0) * group.length;

                            return (
                              <tr key={`ics-row-${idx}`}>
                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">{group.length}</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">{first.unit || "-"}</td>

                                {/* UNIT COST */}
                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">
                                  {first.unitCost
                                    ? "₱ " +
                                      parseFloat(first.unitCost).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })
                                    : "-"}
                                </td>

                                {/* TOTAL COST */}
                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">
                                  {"₱ " +
                                    total.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                </td>

                                <td className="border border-black px-1.5 py-1.5 text-xs whitespace-pre-line">
                                  {group.map((it) => it.description).join("\n")}
                                </td>

                                <td className="border border-black px-1.5 py-1.5 text-xs whitespace-pre-line text-center">
                                  {group.map((it) => it.itemNOs).join("\n")}
                                </td>

                                <td className="border border-black px-1.5 py-1.5 text-xs text-center">
                                  {first.usefulness ? `${first.usefulness} years` : "-"}
                                </td>
                              </tr>
                            );
                          });

                          const filler = Array.from(
                            { length: Math.max(0, 20 - groupedRows.length) },
                            (_, i) => (
                              <tr key={`ics-empty-${i}`}>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                                <td className="border border-black px-1.5 py-1.5 text-xs">&nbsp;</td>
                              </tr>
                            )
                          );

                          return [...groupedRows, ...filler];
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* SIGNATURE SECTION */}
                  <div className="grid grid-cols-2 border border-black mt-4 text-xs">
                    <div className="p-2 border-r border-black">
                      <p className="font-semibold mb-1">Received by :</p>

                      <div className="border-b border-black h-5 mb-1 flex items-center justify-center">
                        {g.items[0]?.enduserName || "N/A"}
                      </div>
                      <p className="text-[9px] text-center">Signature over Printed Name of End User</p>

                      <div className="border-b border-black h-5 mt-2 mb-1 flex items-center justify-center">
                        {g.dept || "N/A"}
                      </div>
                      <p className="text-[9px] text-center">Position/Office</p>

                      <div className="border-b border-black h-5 mt-2 mb-1 flex items-center justify-center">
                        {new Date().toLocaleDateString()}
                      </div>
                      <p className="text-[9px] text-center">Date</p>
                    </div>

                    <div className="p-2">
                      <p className="font-semibold mb-1">Issued by :</p>

                      <div className="border-b border-black h-5 mb-1 flex items-center justify-center">
                        {g.head?.fullname || "N/A"}
                      </div>
                      <p className="text-[9px] text-center">Signature over Printed Name of Supply</p>
                      <p className="text-[9px] text-center">and/or Property Custodian</p>

                      <div className="border-b border-black h-5 mt-2 mb-1 flex items-center justify-center">
                        {g.head?.position || "N/A"}
                      </div>
                      <p className="text-[9px] text-center">Position/Office</p>

                      <div className="border-b border-black h-5 mt-2 mb-1 flex items-center justify-center">
                        {new Date().toLocaleDateString()}
                      </div>
                      <p className="text-[9px] text-center">Date</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
      </div>
    </div>
  )}
</>



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
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleBatchAction('print')}
                disabled={isProcessing || isPreparing}
              >
                <Printer className="w-4 h-4" /> 
                {isProcessing ? 'Processing...' : 'Print'}
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleBatchAction('download')}
                disabled={isProcessing || isPreparing}
              >
                <Download className="w-4 h-4" /> 
                {isProcessing ? 'Processing...' : 'Download'}
              </button>
            </div>

            {/* Content mirrors hidden content using backend grouped data */}
            <div className="bg-white p-2">
              {isPreparing && (
                <div className="text-sm text-blue-600 mb-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Preparing document...
                </div>
              )}
              {isProcessing && (
                <div className="text-sm text-blue-600 mb-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Processing your request...
                </div>
              )}
              {printGroups.filter(g => g.type === 'PAR').map((g, gi, arr) => {
                const parGroups = printGroups.filter(g => g.type === 'PAR');
                const icsGroups = printGroups.filter(g => g.type === 'ICS');
                const isLastPar = gi === parGroups.length - 1 && icsGroups.length === 0;
                const isLast = gi === arr.length - 1 && icsGroups.length === 0;
                const pageNumber = gi + 1;
                return (
                <div key={`parv-${gi}`}>
                  {gi > 0 && (
                    <div className="my-8 border-t-4 border-dashed border-blue-400 relative">
                      <div className="absolute left-1/2 transform -translate-x-1/2 -top-3 bg-white px-4 text-blue-600 font-semibold text-sm">
                        Page {pageNumber}
                      </div>
                    </div>
                  )}
                  <div className="mb-10 border border-gray-300 p-6 bg-white shadow-sm" style={{ pageBreakAfter: isLast ? 'auto' : 'always', pageBreakInside: 'avoid' }}>
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
                        <span className="border-b border-gray-400 flex-1 text-black">{g.docNo}</span>
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
                                {group.map(it => `₱${Number(it.unitCost).toLocaleString()}`).join(' | ')}
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
                </div>
                );
              })}


              {printGroups.filter(g => g.type === 'ICS').map((g, gi, arr) => {
                const parGroups = printGroups.filter(g => g.type === 'PAR');
                const icsGroups = printGroups.filter(g => g.type === 'ICS');
                const isFirstIcs = gi === 0;
                const isLast = gi === arr.length - 1;
                const pageNumber = parGroups.length + gi + 1;
                return (
                <div key={`icsv-${gi}`}>
                  {(parGroups.length > 0 || gi > 0) && (
                    <div className="my-8 border-t-4 border-dashed border-blue-400 relative">
                      <div className="absolute left-1/2 transform -translate-x-1/2 -top-3 bg-white px-4 text-blue-600 font-semibold text-sm">
                        Page {pageNumber}
                      </div>
                    </div>
                  )}
                  <div className="mb-10 border border-gray-300 p-6 bg-white shadow-sm" style={{ pageBreakAfter: isLast ? 'auto' : 'always', pageBreakInside: 'avoid' }}>
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
                                <td className="border p-2 text-center">
                                  {first.unitCost
                                    ? `₱${Number(first.unitCost).toLocaleString()}`
                                    : '-'}
                                </td>
                                <td className="border p-2 text-center">{Number.isFinite(total) ? `₱${total.toLocaleString()}` : '-'}</td>
                                <td className="border p-2 whitespace-pre-line">
                                {group.map(it => `${it.description}`).join('\n')}
                                </td>
                                <td className="border p-2 text-center whitespace-pre-line">
                                {group.map(it => `${it.itemNOs}`).join('\n')}
                                </td>
                                <td className="border p-2 text-center">{`${first.usefulness} years` || '-'}</td>
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
                </div>
                );
              })}

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

export default Assets;