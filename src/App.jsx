import React from 'react';
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
//Admin/Dept Head Routes
import AD_Dashboard from './components/AD_Dashboard';
import AD_PAR_ICS from './pages/admin_pages/AD_PAR_ICS';
import AD_Property_Assignment from './pages/admin_pages/AD_Property_Assignment';
import AD_Nfc_Tagged from './pages/admin_pages/AD_Nfc_Tagged';
import AD_ManualInspection from './pages/admin_pages/AD_Manual_Inspection';
import AD_Reports from './pages/admin_pages/AD_Reports';
import AD_Accounts from './pages/admin_pages/AD_Accounts';
import AD_Profile from './pages/admin_pages/AD_Profile';
//Employee Routes
import EM_PAR_ICS from './pages/employee_pages/EM_PAR_ICS';
import EM_Profile from './pages/employee_pages/EM_Profile';
import EM_Dashboard from './components/EM_Dashboard';
//Inventory Committee Routes
import IC_Dashboard from './components/IC_Dashboard';
import IC_PAR_ICS from './pages/inv_committee_pages/IC_PAR_ICS';
import IC_Nfc_Tagged from './pages/inv_committee_pages/IC_Nfc_Tagged';
import IC_Profile from './pages/inv_committee_pages/IC_Profile';
import IC_ManualInspection from './pages/inv_committee_pages/IC_Manual_Inspection';
//End User Routes
import EU_Dashboard from './components/EU_Dashboard';
import EU_Profile from './pages/end_user_pages/EU_Profile';


const App = () => {
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;