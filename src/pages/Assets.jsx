// filepath: src/pages/Assets.jsx
import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  Download,
  Plus,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { BASE_URL } from "../utils/connection";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [downloadAsset, setDownloadAsset] = useState(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Assets</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage, view, and monitor organization assets.
              </p>
            </div>
            <button
              className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              onClick={() => Swal.fire("Feature Coming Soon!", "", "info")}
            >
              <Plus className="w-4 h-4" />
              <span>Add Asset</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
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
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <StatusBadge status={selectedFilter} />
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
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
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item No.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial No.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Document No.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inspection Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date Acquired</th>
              </tr>
            </thead>
              <tbody>
                {loading ? (
                    <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                        Loading...
                    </td>
                    </tr>
                ) : assets.length === 0 ? (
                    <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                        No assets found.
                    </td>
                    </tr>
                ) : (
                    assets.map((asset, idx) => (
                    <tr key={idx}>
                        <td className="px-4 py-2">{asset.item_no}</td>
                        <td className="px-4 py-2">{asset.article}</td>
                        <td className="px-4 py-2">{asset.description}</td>
                        <td className="px-4 py-2">{asset.model}</td>
                        <td className="px-4 py-2">{asset.serial_no}</td>
                        <td className="px-4 py-2">{asset.document_type}</td>
                        <td className="px-4 py-2">{asset.document_no}</td>
                        <td className="px-4 py-2">{asset.inspection_status}</td>
                        <td className="px-4 py-2">{asset.status}</td>
                        <td className="px-4 py-2">{asset.date_acquired}</td>
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
