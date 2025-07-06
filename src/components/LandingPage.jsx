import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import lgu_seal from '/assets/images/lgu_seal.png'; // Placeholder for the LGU seal image

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Logo */}
      <div className="flex items-center p-6">
        <div className="w-16 h-16 mr-4">
          {/* Government Seal Placeholder */}
          <img src={lgu_seal} alt="LGU Seal" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Local Government Unit of Daet</h1>
          <p className="text-gray-600">Camarines Norte – Region V</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-flex-start">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to
          </h2>

          <h3 className="text-5xl font-bold text-[#0F1D9F] mb-8 leading-tight">
            Property, Plant & Equipment Management System
          </h3>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl">
            Simplifying the way you handle asset management with features for tracking, transfer, reporting, and NFC integration — all in one system.
          </p>
          
          <Link
            to="/login"
            className="bg-[#0F1D9F] hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center mx-auto"
          >
            LOGIN
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;