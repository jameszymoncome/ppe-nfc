import React from 'react';
import { X } from 'lucide-react';

const InspectionModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 px-2">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-auto p-8 md:p-12 overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-4 right-4 text-gray-700 hover:text-black"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-7 h-7" />
        </button>
        <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-1">
          Acceptance and Inspection Report(AIR)
        </h2>
        <p className="text-sm text-blue-700 mb-6">
          Prepared to ensure all items are received in full and inspected based on required specifications.
        </p>
        <form className="space-y-8">
          <div>
            <p className="font-semibold italic mb-2">INSPECTION SECTION</p>
            <div className="mb-4 flex items-center">
              <label className="text-sm">Inspected By :</label>
              <input
                type="text"
                className="ml-2 w-64 border-b border-gray-400 outline-none text-sm px-2 py-1"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold italic mb-2">1. Identification Information</p>
                <div className="mb-2 flex items-center">
                  <label className="w-44 text-xs text-gray-700">Local Government Unit of :</label>
                  <input className="flex-1 border-b border-gray-400 ml-2 outline-none text-xs px-2 py-1" autoComplete="off" />
                </div>
                <div className="mb-2 flex items-center">
                  <label className="w-44 text-xs text-gray-700">Fund :</label>
                  <input className="flex-1 border-b border-gray-400 ml-2 outline-none text-xs px-2 py-1" autoComplete="off" />
                </div>
                <div className="mb-2 flex items-center">
                  <label className="w-44 text-xs text-gray-700">Supplier Name :</label>
                  <input className="flex-1 border-b border-gray-400 ml-2 outline-none text-xs px-2 py-1" autoComplete="off" />
                </div>
                <div className="mb-2 flex items-center">
                  <label className="w-44 text-xs text-gray-700">Requisitioning Office/Dept :</label>
                  <input className="flex-1 border-b border-gray-400 ml-2 outline-none text-xs px-2 py-1" autoComplete="off" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold italic mb-2">2. Document References</p>
                <div className="mb-2 flex items-center">
                  <label className="w-32 text-xs text-gray-700">Invoice No. :</label>
                  <input className="flex-1 border-b border-gray-400 ml-2 outline-none text-xs px-2 py-1" autoComplete="off" />
                </div>
                <div className="mb-2 flex items-center">
                  <label className="w-32 text-xs text-gray-700">Date :</label>
                  <input type="date" className="flex-1 border-b border-gray-400 ml-2 outline-none text-xs px-2 py-1" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold italic mb-2">3. Items Table</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-gray-700 border-b border-gray-300">
                    <th className="font-medium text-left py-2">Stock/ Property No.</th>
                    <th className="font-medium text-left py-2">Description</th>
                    <th className="font-medium text-left py-2">Unit</th>
                    <th className="font-medium text-left py-2">Ordered Quantity</th>
                    <th className="font-medium text-left py-2">Accepted Quantity</th>
                    <th className="font-medium text-left py-2">Inspected Quantity</th>
                    <th className="font-medium text-left py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-4" />
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-3 mt-8">
            <button
              type="button"
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-blue-800 text-white font-medium hover:bg-blue-900 transition"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InspectionModal;