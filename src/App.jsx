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
//GSO Employee Routes
import GE_Dashboard from './components/GE_Dashboard';
import GE_PAR_ICS from './pages/gso_employee_pages/GE_PAR_ICS';
import GE_Profile from './pages/gso_employee_pages/GE_Profile';
//Inventory Committee Routes
import IC_Dashboard from './components/IC_Dashboard';
import IC_PAR_ICS from './pages/inv_committee_pages/IC_PAR_ICS';
import IC_Nfc_Tagged from './pages/inv_committee_pages/IC_Nfc_Tagged';
import IC_Profile from './pages/inv_committee_pages/IC_Profile';
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
        <Route path="/gso-employee-dashboard" element={<GE_Dashboard />} />
        <Route path="/inv-com-dashboard" element={<IC_Dashboard />} />
        <Route path="/end-user-dashboard" element={<EU_Dashboard />} />
        <Route path="/inspection/nfc-tagged" element={<Nfc_Tagged />} />
        <Route path="/ic-par-ics" element={<IC_PAR_ICS />} />
        <Route path="/inspection/ic-nfc-tagged" element={<IC_Nfc_Tagged />} />
        <Route path="/ge-par-ics" element={<GE_PAR_ICS />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/eu-profile" element={<EU_Profile />} />
        <Route path="/ge-profile" element={<GE_Profile />} />
        <Route path="/ic-profile" element={<IC_Profile />} />
        <Route path="/inspection/manual-untagged" element={<Manual_Inspection />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;