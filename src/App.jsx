import React, {useEffect, useRef} from 'react';
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
//Employee Routes
import EM_PAR_ICS from './pages/employee_pages/EM_PAR_ICS';
import EM_Profile from './pages/employee_pages/EM_Profile';
import EM_Dashboard from './components/EM_Dashboard';
import EM_Reports from './pages/employee_pages/EM_Reports';
import EM_AssetTransfer from './pages/employee_pages/EM_AssetTransfer';
import EM_AssetTransfer3 from './pages/employee_pages/EM_AssetTransfer3';
//Inventory Committee Routes
import IC_Dashboard from './components/IC_Dashboard';
import IC_PAR_ICS from './pages/inv_committee_pages/IC_PAR_ICS';
import IC_Nfc_Tagged from './pages/inv_committee_pages/IC_Nfc_Tagged';
import IC_Profile from './pages/inv_committee_pages/IC_Profile';
import IC_ManualInspection from './pages/inv_committee_pages/IC_Manual_Inspection';
import IC_Reports from './pages/inv_committee_pages/IC_Reports';
import IC_AssetTransfer from './pages/inv_committee_pages/IC_AssetTransfer';
import IC_AssetTransfer3 from './pages/inv_committee_pages/IC_AssetTransfer3';
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/purchase-order" element={<PurchaseOrder />} />
        <Route path="/air-report" element={<AIR />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/departments" element={<Department />} />
        <Route path="/par-ics" element={<PAR_ICS />} />
        <Route path="/property-assignment" element={<Property_Assignment />} />
        <Route path="/category" element={<Category />} />
        <Route path="/em-dashboard" element={<EM_Dashboard />} />
        <Route path="/inv-com-dashboard" element={<IC_Dashboard />} />
        <Route path="/end-user-dashboard" element={<EU_Dashboard />} />
        <Route path="/inspection/nfc-tagged" element={<Nfc_Tagged />} />
        <Route path="/ic-par-ics" element={<IC_PAR_ICS />} />
        <Route path="/inspection/ic-nfc-tagged" element={<IC_Nfc_Tagged />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/eu-profile" element={<EU_Profile />} />
        <Route path="/em-profile" element={<EM_Profile />} />
        <Route path="/em-par-ics" element={<EM_PAR_ICS />} />
        <Route path="/ic-profile" element={<IC_Profile />} />
        <Route path="/inspection/manual-untagged" element={<Manual_Inspection />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/inspection/ic-manual-untagged" element={<IC_ManualInspection />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ad-dashboard" element={<AD_Dashboard />} />
        <Route path="/ad-par-ics" element={<AD_PAR_ICS />} />
        <Route path="/ad-property-assignment" element={<AD_Property_Assignment />} />
        <Route path="/inspection/ad-nfc-tagged" element={<AD_Nfc_Tagged />} />
        <Route path="/inspection/ad-manual-untagged" element={<AD_ManualInspection />} />
        <Route path="/ad-reports" element={<AD_Reports />} />
        <Route path="/ad-accounts" element={<AD_Accounts />} />
        <Route path="/ad-profile" element={<AD_Profile />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/ic-reports" element={<IC_Reports />} />
        <Route path="/em-reports" element={<EM_Reports />} />
        <Route path="/asset-transfer" element={<AssetTransfer />} />
        <Route path="/asset-transfer-2" element={<AssetTransfer2 />} />
        <Route path="/asset-transfer-3" element={<AssetTransfer3 />} />
        <Route path="/em-asset-transfer" element={<EM_AssetTransfer />} />
        <Route path="/em-asset-transfer-3" element={<EM_AssetTransfer3 />} />
        <Route path="/ic-asset-transfer" element={<IC_AssetTransfer />} />
        <Route path="/ic-asset-transfer-3" element={<IC_AssetTransfer3 />} />
        <Route path="/ad-asset-transfer" element={<AD_AssetTransfer />} />
        <Route path="/ad-asset-transfer-2" element={<AD_AssetTransfer2 />} />
        <Route path="/ad-asset-transfer-3" element={<AD_AssetTransfer3 />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/item-info" element={<ItemInfo />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;