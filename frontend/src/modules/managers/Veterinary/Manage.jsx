import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Container, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  LocalHospital as MedicalIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Pets as PetsIcon,
  Assessment as ReportsIcon,
  Inventory2 as InventoryIcon,
  AttachMoney as ExpenseIcon,
  Vaccines as VaccinesIcon
} from '@mui/icons-material'

import VeterinaryManagerDashboard from './VeterinaryManagerDashboard'
import Appointments from './Appointments'
import Records from './Records'
import Staff from './Staff'
import Services from './Services'
import Patients from './Patients'
import Reports from './Reports'
import Inventory from './Inventory'
import Expenses from './Expenses'
import Vaccinations from './Vaccinations'

const VeterinaryManage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/manager/veterinary' },
    { label: 'Appointments', icon: <ScheduleIcon />, path: '/manager/veterinary/appointments' },
    { label: 'Medical Records', icon: <MedicalIcon />, path: '/manager/veterinary/records' },
    { label: 'Patients', icon: <PetsIcon />, path: '/manager/veterinary/patients' },
    { label: 'Staff', icon: <PeopleIcon />, path: '/manager/veterinary/staff' },
    { label: 'Services', icon: <BusinessIcon />, path: '/manager/veterinary/services' },
    { label: 'Inventory', icon: <InventoryIcon />, path: '/manager/veterinary/inventory' },
    { label: 'Vaccinations', icon: <VaccinesIcon />, path: '/manager/veterinary/vaccinations' },
    { label: 'Expenses', icon: <ExpenseIcon />, path: '/manager/veterinary/expenses' },
    { label: 'Reports', icon: <ReportsIcon />, path: '/manager/veterinary/reports' }
  ]

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 260, flexShrink: 0, borderRadius: 0 }} elevation={2}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">Veterinary Manager</Typography>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Routes>
          <Route index element={<VeterinaryManagerDashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="records" element={<Records />} />
          <Route path="patients" element={<Patients />} />
          <Route path="staff" element={<Staff />} />
          <Route path="services" element={<Services />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="vaccinations" element={<Vaccinations />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default VeterinaryManage