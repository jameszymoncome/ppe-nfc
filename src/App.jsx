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
      </Routes>
    </BrowserRouter>
  );
};

export default App;