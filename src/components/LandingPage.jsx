import React from 'react';
import { Package, ArrowRightLeft, Target, Radio, FileText, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {

  const navigate = useNavigate();
  
  const systemFeatures = [
    {
      icon: <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />,
      title: "Asset Inventory",
      description: "Track all property, plant, and equipment in real-time to keep your inventory accurate, organized, and up to date."
    },
    {
      icon: <ArrowRightLeft className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />,
      title: "Transfer & Disposal",
      description: "Handle asset transfers, disposals, and reassignments efficiently with built-in tracking and documentation tools."
    },
    {
      icon: <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />,
      title: "Accountability Tracking",
      description: "Assign assets to users or departments and maintain PACS keys to implement and accountability records."
    },
    {
      icon: <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />,
      title: "NFC Tag Integration",
      description: "Use NFC tags for quick asset identification, fast, secure, and paperless tracking during inventory or inspections."
    },
    {
      icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />,
      title: "Reports & Audits",
      description: "Generate comprehensive audit trails, compliance reports, and physical counts to support decision-making and compliance."
    },
    {
      icon: <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />,
      title: "Repair & Maintenance Logs",
      description: "Keep detailed records of all repair and maintenance activities to ensure equipment's functional, safe, and well-maintained."
    }
  ];
  
  const handleLogin = () => {
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white-100 to-white-200">
      {/* Header with Logo */}
      <div className="flex items-center p-4 sm:p-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 flex-shrink-0">
          <img src="/assets/images/lgu_seal.png" alt="LGU Seal" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg font-semibold text-gray-800 leading-tight">Local Government Unit of Daet</h1>
          <p className="text-xs sm:text-base text-gray-600">Camarines Norte – Region V</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-normal text-gray-900 mb-3 sm:mb-4">
            Welcome to
          </h2>

          <h3 className="text-3xl sm:text-5xl font-bold text-blue-800 mb-6 sm:mb-8 leading-tight px-2">
            Property, Plant & Equipment<br />Management System
          </h3>
          
          <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto px-2">
            Simplifying the way you handle asset management with features for tracking, transfer, reporting, and NFC integration — all in one system.
          </p>
          
          <button
            onClick={handleLogin}
            className="bg-blue-800 hover:bg-blue-900 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-base sm:text-lg transition-colors inline-flex items-center"
          >
            LOGIN
            <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* System Features Section */}
      <div className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h4 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-3 sm:mb-4">System Features</h4>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              A comprehensive set of tools designed to streamline the tracking, assignment, and reporting of government assets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {systemFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-4 sm:mb-6">
                  {feature.icon}
                </div>
                <h5 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {feature.title}
                </h5>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About the System Section */}
      <div className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h4 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-6 sm:mb-8">
            About the System
          </h4>
          
          <div className="space-y-4 sm:space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed text-left sm:text-center">
            <p>
              The Property, Plant, and Equipment (PPE) Management System is a digital platform developed to assist Local Government 
              Units (LGUs) in the efficient tracking and management of government-owned assets. It aims to modernize traditional 
              manual processes by offering features such as real-time inventory monitoring, accountability assignment through PAR 
              and ICS documentation, and NFC tag integration for fast and reliable asset verification.
            </p>
            
            <p>
              Designed with transparency and accuracy in mind, the system supports the complete lifecycle of each asset — from 
              acquisition to transfer, maintenance, and disposal. It also provides comprehensive reporting tools to help in audits, 
              physical counts, and compliance with government standards. With role-based access, it ensures secure and organized 
              handling of data across departments and users.
            </p>
            
            <p>
              This system not only improves operational efficiency but also promotes accountability, sustainability, and data-driven 
              decision-making in public asset management.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 sm:py-8 text-xs sm:text-base text-gray-600">
        <p>© 2025 LGU Daet | PPE Management System v1.0</p>
      </div>
    </div>
  );
};

export default LandingPage;