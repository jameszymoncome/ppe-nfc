import React, {useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import LandingPage from './components/LandingPage';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import PurchaseOrder from './pages/PurchaseOrder';
import AIR from './pages/AIR';
import Accounts from './pages/Accounts';
import Department from './pages/Department';
import PAR_ICS from './pages/PAR_ICS';
import Property_Assignment from './pages/Property_Assignment';
import Category from './pages/Category';
import Nfc_Tagged from './pages/Nfc_Tagged';
import Profile from './pages/Profile';
import Manual_Inspection from './pages/Manual_Inspection';
import Reports from './pages/Reports';
import Signup from './pages/Signup';
import Notification from './pages/Notification';
import AssetTransfer from './pages/AssetTransfer';
import AssetTransfer2 from './pages/AssetTransfer2';
import AssetTransfer3 from './pages/AssetTransfer3';
import Assets from './pages/Assets';
import WasteDisposal from './pages/WasteDisposal';
import ReportIssue from './pages/ReportIssue';
import AssetTransferProgress from './pages/AssetTranferProgress';
import ProgressItem from './pages/ProgressItem';
import DocumentItems from './pages/DocumentItems';
import DeviceMonitoring from './pages/DeviceMonitoring';
//Admin/Dept Head Routes
import AD_Dashboard from './components/AD_Dashboard';
import AD_PAR_ICS from './pages/admin_pages/AD_PAR_ICS';
import AD_Property_Assignment from './pages/admin_pages/AD_Property_Assignment';
import AD_Nfc_Tagged from './pages/admin_pages/AD_Nfc_Tagged';
import AD_ManualInspection from './pages/admin_pages/AD_Manual_Inspection';
import AD_Reports from './pages/admin_pages/AD_Reports';
import AD_Accounts from './pages/admin_pages/AD_Accounts';
import AD_Profile from './pages/admin_pages/AD_Profile';
import AD_AssetTransfer from './pages/admin_pages/AD_AssetTransfer';
import AD_AssetTransfer2 from './pages/admin_pages/AD_AssetTransfer2';
import AD_AssetTransfer3 from './pages/admin_pages/AD_AssetTransfer3';
import AD_Assets from './pages/admin_pages/AD_Assets';
import AD_ReportIssue from './pages/admin_pages/AD_ReportIssue';
import AD_WasteDisposal from './pages/admin_pages/AD_WasteDisposal';
import AD_DocumentItems from './pages/admin_pages/AD_DocumentItems';
//Employee Routes
import EM_PAR_ICS from './pages/employee_pages/EM_PAR_ICS';
import EM_Profile from './pages/employee_pages/EM_Profile';
import EM_Dashboard from './components/EM_Dashboard';
import EM_Reports from './pages/employee_pages/EM_Reports';
import EM_AssetTransfer from './pages/employee_pages/EM_AssetTransfer';
import EM_AssetTransfer3 from './pages/employee_pages/EM_AssetTransfer3';
import EM_Assets from './pages/employee_pages/EM_Assets';
import EM_Nfc_Tagged from './pages/employee_pages/EM_Nfc_Tagged';
import EM_ReportIssue from './pages/employee_pages/EM_ReportIssue';
import EM_WasteDisposal from './pages/employee_pages/EM_WasteDisposal';
import EM_DocumentItems from './pages/employee_pages/EM_DocumentItems';
import EM_Property_Assignment from './pages/employee_pages/EM_Property_Assignment';
//Inventory Committee Routes
import IC_Dashboard from './components/IC_Dashboard';
import IC_PAR_ICS from './pages/inv_committee_pages/IC_PAR_ICS';
import IC_Nfc_Tagged from './pages/inv_committee_pages/IC_Nfc_Tagged';
import IC_Profile from './pages/inv_committee_pages/IC_Profile';
import IC_ManualInspection from './pages/inv_committee_pages/IC_Manual_Inspection';
import IC_Reports from './pages/inv_committee_pages/IC_Reports';
import IC_AssetTransfer from './pages/inv_committee_pages/IC_AssetTransfer';
import IC_AssetTransfer3 from './pages/inv_committee_pages/IC_AssetTransfer3';
import IC_Assets from './pages/inv_committee_pages/IC_Assets';
import IC_ProgressItem from './pages/inv_committee_pages/IC_ProgressItem';
import IC_Scan from './pages/inv_committee_pages/IC_Scan';
import IC_ReportIssue from './pages/inv_committee_pages/IC_ReportIssue';
import IC_WasteDisposal from './pages/inv_committee_pages/IC_WasteDisposal';
import IC_DocumentItems from './pages/inv_committee_pages/IC_DocumentItems';
import IC_DeviceMonitoring from './pages/inv_committee_pages/IC_DeviceMonitoring';
//End User Routes
import EU_Dashboard from './components/EU_Dashboard';
import EU_Profile from './pages/end_user_pages/EU_Profile';

import { connectWebSocket } from './components/websocket';
import Scan from './pages/Scan';
import ItemInfo from './pages/ItemInfo';


const App = () => {
  useEffect(() => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        connectWebSocket(); // reconnect if not connected
      }
  }, []);

  const ProtectedRoute = ({ allowedRoles, children }) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("accessLevel");

  if (!allowedRoles.includes(userRole)) {
    navigate('/login');
    return null;
  }
  return children;
};

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Dashboard />
            </ProtectedRoute>} />
        <Route path="/purchase-order" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <PurchaseOrder />
            </ProtectedRoute>} />
        <Route path="/air-report" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <AIR />
            </ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Accounts />
            </ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Department />
            </ProtectedRoute>} />
        <Route path="/par-ics" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <PAR_ICS />
            </ProtectedRoute>} />
        <Route path="/property-assignment" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Property_Assignment />
            </ProtectedRoute>} />
        <Route path="/category" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Category />
            </ProtectedRoute>} />
        <Route path="/em-dashboard" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_Dashboard />
            </ProtectedRoute>} />
        <Route path="/inv-com-dashboard" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_Dashboard />
            </ProtectedRoute>} />
        <Route path="/end-user-dashboard" element={<ProtectedRoute allowedRoles={['END USER']}>
              <EU_Dashboard />
            </ProtectedRoute>} />
        <Route path="/inspection/nfc-tagged" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Nfc_Tagged />
            </ProtectedRoute>} />
        <Route path="/ic-par-ics" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_PAR_ICS />
            </ProtectedRoute>} />
        <Route path="/inspection/ic-nfc-tagged" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_Nfc_Tagged />
            </ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Profile />
            </ProtectedRoute>} />
        <Route path="/eu-profile" element={<ProtectedRoute allowedRoles={['END USER']}>
              <EU_Profile />
            </ProtectedRoute>} />
        <Route path="/em-profile" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_Profile />
            </ProtectedRoute>} />
        <Route path="/em-par-ics" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_PAR_ICS />
            </ProtectedRoute>} />
        <Route path="/ic-profile" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_Profile />
            </ProtectedRoute>} />
        <Route path="/inspection/manual-untagged" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Manual_Inspection />
            </ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Reports />
            </ProtectedRoute>} />
        <Route path="/inspection/ic-manual-untagged" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_ManualInspection />
            </ProtectedRoute>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ad-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_Dashboard />
            </ProtectedRoute>} />
        <Route path="/ad-par-ics" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_PAR_ICS />
            </ProtectedRoute>} />
        <Route path="/ad-property-assignment" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_Property_Assignment />
            </ProtectedRoute>} />
        <Route path="/inspection/ad-nfc-tagged" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_Nfc_Tagged />
            </ProtectedRoute>} />
        <Route path="/inspection/ad-manual-untagged" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_ManualInspection />
            </ProtectedRoute>} />
        <Route path="/ad-reports" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_Reports />
            </ProtectedRoute>} />
        <Route path="/ad-accounts" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_Accounts />
            </ProtectedRoute>} />
        <Route path="/ad-profile" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_Profile />
            </ProtectedRoute>} />
        <Route path="/notification" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Notification />
            </ProtectedRoute>} />
        <Route path="/ic-reports" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_Reports />
            </ProtectedRoute>} />
        <Route path="/em-reports" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_Reports />
            </ProtectedRoute>} />
        <Route path="/assets/assets" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <Assets />
            </ProtectedRoute>} />
        <Route path="/assets/asset-transfer" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <AssetTransfer />
            </ProtectedRoute>} />
        <Route path="/assets/asset-transfer-progress/:ptr_no" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <AssetTransferProgress />
            </ProtectedRoute>} />
        <Route path="/asset-transfer-2" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <AssetTransfer2 />
            </ProtectedRoute>} />
        <Route path="/asset-transfer-3" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <AssetTransfer3 />
            </ProtectedRoute>} />
        <Route path="/assets/em-asset-transfer" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_AssetTransfer />
            </ProtectedRoute>} />
        <Route path="/assets/em-asset-transfer-3" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_AssetTransfer3 />
            </ProtectedRoute>} />
        <Route path="/assets/ic-asset-transfer" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_AssetTransfer />
            </ProtectedRoute>} />
        <Route path="/ic-asset-transfer-3" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_AssetTransfer3 />
            </ProtectedRoute>} />
        <Route path="/assets/ad-asset-transfer" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_AssetTransfer />
            </ProtectedRoute>} />
        <Route path="/assets/ad-asset-transfer-2" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_AssetTransfer2 />
            </ProtectedRoute>} />
        <Route path="/assets/ad-asset-transfer-3" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_AssetTransfer3 />
            </ProtectedRoute>} />
        <Route path="/assets/ad-assets" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_Assets />
            </ProtectedRoute>} />
        <Route path="/assets/ic-assets" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_Assets />
            </ProtectedRoute>} />
        <Route path="/assets/em-assets" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_Assets />
            </ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute allowedRoles={['SUPER ADMIN', 'ADMIN', 'EMPLOYEE', 'INVENTORY COMMITTEE',]}>
              <Scan />
            </ProtectedRoute>} />
        <Route path="/item-info" element={<ProtectedRoute allowedRoles={['SUPER ADMIN', 'ADMIN', 'EMPLOYEE', 'INVENTORY COMMITTEE',]}>
              <ItemInfo />
            </ProtectedRoute>} />
        <Route path="/assets/waste-disposal" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <WasteDisposal />
            </ProtectedRoute>} />
        <Route path="/assets/report-issue" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <ReportIssue />
            </ProtectedRoute>} />
        <Route path="/progress-item" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <ProgressItem />
            </ProtectedRoute>} />
        <Route path="/ic-progress-item" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_ProgressItem />
            </ProtectedRoute>} />
        <Route path="/assets/document/:document_no" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <DocumentItems />
            </ProtectedRoute>} />
        <Route path="/inspection/em-nfc-tagged" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_Nfc_Tagged />
            </ProtectedRoute>} />
        <Route path="/ic-scan" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_Scan />
            </ProtectedRoute>} />
        <Route path="/ad-report-issue" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_ReportIssue />
            </ProtectedRoute>} />
        <Route path="/ad-waste-disposal" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_WasteDisposal />
            </ProtectedRoute>} />
        <Route path="/em-report-issue" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_ReportIssue />
            </ProtectedRoute>} />
        <Route path="/em-waste-disposal" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_WasteDisposal />
            </ProtectedRoute>} />
        <Route path="/ic-report-issue" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_ReportIssue />
            </ProtectedRoute>} />
        <Route path="/ic-waste-disposal" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_WasteDisposal />
            </ProtectedRoute>} />
        <Route path="/assets/ad-document/:document_no" element={<ProtectedRoute allowedRoles={['ADMIN']}>
              <AD_DocumentItems />
            </ProtectedRoute>} />
        <Route path="/assets/em-document/:document_no" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_DocumentItems />
            </ProtectedRoute>} />
        <Route path="/assets/em-document/:document_no" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_DocumentItems />
            </ProtectedRoute>} />
        <Route path="/assets/ic-document/:document_no" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_DocumentItems />
            </ProtectedRoute>} />
        <Route path="/em-property-assignment" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EM_Property_Assignment />
            </ProtectedRoute>} />
        <Route path="/device-monitoring" element={<ProtectedRoute allowedRoles={['SUPER ADMIN']}>
              <DeviceMonitoring />
            </ProtectedRoute>} />
        <Route path="/ic-device-monitoring" element={<ProtectedRoute allowedRoles={['INVENTORY COMMITTEE']}>
              <IC_DeviceMonitoring />
            </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;