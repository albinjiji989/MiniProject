import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PetManagerDashboard from './pages/PetManagerDashboard';
import PetManagement from './pages/PetManagement';
import PetDetails from './pages/PetDetails';
import CentralizedRegistry from './pages/CentralizedRegistry';

const PetRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PetManagerDashboard />} />
      <Route path="/pets" element={<PetManagement />} />
      <Route path="/pets/:id" element={<PetDetails />} />
      <Route path="/centralized-registry" element={<CentralizedRegistry />} />
    </Routes>
  );
};

export default PetRoutes;