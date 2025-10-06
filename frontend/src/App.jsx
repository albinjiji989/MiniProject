import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import UserLayout from './components/Layout/UserLayout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ForcePassword from './pages/Auth/ForcePassword'
import ModuleAdminRegister from './pages/Auth/ModuleAdminRegister'
import Landing from './pages/Landing/Landing'
import About from './pages/Static/About'
import Contact from './pages/Static/Contact'
import Dashboard from './pages/Dashboard/Dashboard'
import UserDashboard from './pages/User/Dashboard'
// Admin-named dashboards removed in favor of Manager dashboards
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ManagerManagement from './pages/Admin/ManagerManagement'
import UserManagement from './pages/Admin/UserManagement'
import RoleManagement from './pages/Admin/RoleManagement'
import ModuleManagement from './pages/Admin/ModuleManagement'
import DataTracking from './pages/Admin/DataTracking'
import PetShopAnalytics from './pages/Admin/PetShopAnalytics'
import PetShopReservations from './pages/Admin/PetShopReservations'
import PetShopShops from './pages/Admin/PetShopShops'
import PetShopListings from './pages/Admin/PetShopListings'
import PetShopSalesReport from './pages/Admin/PetShopSalesReport'
import PetSystemRequests from './pages/Admin/PetSystemRequests'
import AdoptionManagerDashboard from './modules/managers/Adoption/AdoptionManagerDashboard'
import AdoptionManagement from './pages/Admin/AdoptionManagement'
import AdoptionAnalytics from './pages/Admin/AdoptionAnalytics'
import AdminAdoptionDashboard from './pages/Admin/AdoptionDashboard'
import AdoptionApplicationsAdmin from './pages/Admin/AdoptionApplications'
import ManagerLayout from './layouts/ManagerLayout'
import PetsList from './modules/managers/Adoption/PetsList'
import AdoptionPetForm from './modules/managers/Adoption/PetForm'
import PetDetailsManager from './modules/managers/Adoption/PetDetails'
import ApplicationsList from './modules/managers/Adoption/ApplicationsList'
import ApplicationDetails from './modules/managers/Adoption/ApplicationDetails'
import ImportPets from './modules/managers/Adoption/ImportPets'
import Reports from './modules/managers/Adoption/Reports'
import ManagerDashboardRedirect from './pages/Manager/DashboardRedirect'
import RescueCases from './modules/managers/Rescue/RescueCases'
import RescueNew from './modules/managers/Rescue/RescueNew'
import PetShopManagerDashboard from './modules/managers/PetShop/PetShopManagerDashboard'
import PetShopOrders from './modules/managers/PetShop/Orders'
import PetShopInventory from './modules/managers/PetShop/Inventory'
import PetShopInvoice from './modules/managers/PetShop/Invoice'
import PetShopAddStock from './modules/managers/PetShop/AddStock'
import PetShopManageInventory from './modules/managers/PetShop/ManageInventory'
import PetShopPricingRules from './modules/managers/PetShop/PricingRules'
import PetShopReports from './modules/managers/PetShop/Reports'
import AvailableForSale from './modules/managers/PetShop/AvailableForSale'
import PetProfile from './modules/managers/Adoption/PetProfile'
import EcommerceManagerDashboard from './modules/managers/Ecommerce/EcommerceManagerDashboard'
import PharmacyManagerDashboard from './modules/managers/Pharmacy/PharmacyManagerDashboard'
import RescueManagerDashboard from './modules/managers/Rescue/RescueManagerDashboard'
import TemporaryCareManagerDashboard from './modules/managers/TemporaryCare/TemporaryCareManagerDashboard'
import VeterinaryManagerDashboard from './modules/managers/Veterinary/VeterinaryManagerDashboard'
import AdoptionManage from './modules/managers/Adoption/Manage'
import EcommerceManage from './modules/managers/Ecommerce/Manage'
import PharmacyManage from './modules/managers/Pharmacy/Manage'
import RescueManage from './modules/managers/Rescue/Manage'
import PetShopManage from './modules/managers/PetShop/Manage'
import TemporaryCareManage from './modules/managers/TemporaryCare/Manage'
import VeterinaryManage from './modules/managers/Veterinary/Manage'
import PetShopManageReservations from './modules/managers/PetShop/SimpleReservations'
import PetShopPetHistory from './modules/managers/PetShop/PetHistory'
// Adoption Manager Wizard
import AdoptionWizardLayout from './modules/managers/Adoption/Wizard/WizardLayout'
import AdoptionStepBasic from './modules/managers/Adoption/Wizard/StepBasicInfo'
import AdoptionStepHealth from './modules/managers/Adoption/Wizard/StepHealthMedia'
import AdoptionStepAvailability from './modules/managers/Adoption/Wizard/StepAvailability'
import AdoptionStepReview from './modules/managers/Adoption/Wizard/StepReview'
import UserPetsList from './pages/User/Pets/List'
import AddPet from './pages/User/Pets/AddPet'
import AddPetDetails from './pages/User/Pets/AddPetDetails'
import AddPetSuccess from './pages/User/Pets/AddPetSuccess'
import UserPetDetails from './pages/User/Pets/Details'
import UserProfile from './pages/User/Profile'
import RequestBreed from './pages/User/Pets/RequestBreed'
import MyOwnedPets from './pages/User/MyOwnedPets'
import Adoption from './pages/User/Adoption/Adoption'
import AdoptionDetails from './pages/User/Adoption/AdoptionDetails'
import AdoptionDashboard from './pages/User/Adoption/AdoptionDashboard'
import AdoptionApplications from './pages/User/Adoption/AdoptionApplications'
import UserApplicationDetails from './pages/User/Adoption/ApplicationDetails'
import MyAdoptedPets from './pages/User/Adoption/MyAdoptedPets'
// User Adoption Apply Wizard
import AdoptionApplyLayout from './pages/User/Adoption/ApplyWizard/ApplyLayout'
import ApplyStepApplicant from './pages/User/Adoption/ApplyWizard/StepApplicant'
import ApplyStepHome from './pages/User/Adoption/ApplyWizard/StepHome'
import ApplyStepExperience from './pages/User/Adoption/ApplyWizard/StepExperience'
import ApplyStepDocuments from './pages/User/Adoption/ApplyWizard/StepDocuments'
import ApplyStepReview from './pages/User/Adoption/ApplyWizard/StepReview'
import PetShop from './pages/User/PetShop/PetShop'
import PetShopDashboard from './pages/User/PetShop/PetShopDashboard'
import PetShopShop from './pages/User/PetShop/Shop'
import PetShopPetDetails from './pages/User/PetShop/PetDetails'
import PetShopMyReservations from './pages/User/PetShop/MyReservations'
import PetShopReservationDetails from './pages/User/PetShop/ReservationDetails'
import PaymentGateway from './pages/User/PetShop/PaymentGateway'
import PurchaseDecision from './pages/User/PetShop/PurchaseDecision'
import Rescue from './pages/User/Rescue/Rescue'
import RescueDashboard from './pages/User/Rescue/RescueDashboard'
import EcommerceDashboard from './pages/User/Ecommerce/EcommerceDashboard'
import Cart from './pages/User/Ecommerce/Cart'
import Orders from './pages/User/Ecommerce/Orders'
import ProductDetails from './pages/User/Ecommerce/ProductDetails'
import PharmacyDashboard from './pages/User/Pharmacy/PharmacyDashboard'
import TemporaryCareDashboard from './pages/User/TemporaryCare/TemporaryCareDashboard'
import VeterinaryDashboard from './pages/User/Veterinary/VeterinaryDashboard'
import RBACManagement from './pages/RBAC/RBACManagement'
import CoreManagement from './pages/Core/CoreManagement'
import Profile from './pages/Profile/Profile'
import AdminManagement from './pages/Admin/AdminManagement'
import StoreSetup from './pages/Manager/StoreSetup'
import RequestStoreNameChange from './pages/Manager/RequestStoreNameChange'
import AdminStoreNameChangeRequests from './pages/Admin/StoreNameChangeRequests'
// Pet Management Components
import PetManagementDashboard from './pages/Admin/PetManagement/PetManagementDashboard'
import PetManagementOverview from './pages/Admin/PetManagement/PetManagementOverview'
import PetManagement from './pages/Admin/PetManagement/PetManagement'
import PetForm from './pages/Admin/PetManagement/PetForm'
import PetDetailsAdmin from './pages/Admin/PetManagement/PetDetails'
import MedicalRecords from './pages/Admin/MedicalRecords'
import OwnershipHistory from './pages/Admin/OwnershipHistory'
import PetImport from './pages/Admin/PetManagement/PetImport'
import SpeciesManagement from './pages/Admin/SpeciesManagement'
import BreedsManagement from './pages/Admin/BreedsManagement'
import CustomBreedRequests from './pages/Admin/CustomBreedRequests'
import ProtectedRoute from './core/components/ProtectedRoute'
import PetCategories from './pages/Admin/PetManagement/PetCategories'
import OwnershipByUser from './pages/Admin/PetManagement/OwnershipByUser'

function App() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          loading
            ? null
            : (user
            ? (user.role === 'admin' || user.role === 'super_admin'
                ? <Navigate to="/admin/dashboard" replace />
                : ((typeof user.role === 'string' && user.role.endsWith('_manager') && user.needsStoreSetup)
                    ? <Navigate to="/manager/store-setup" replace />
                    : (user.role === 'adoption_manager'
                    ? <Navigate to="/manager/adoption/dashboard" replace />
                    : (user.role === 'petshop_manager'
                        ? <Navigate to="/manager/petshop/dashboard" replace />
                        : (user.role === 'ecommerce_manager'
                            ? <Navigate to="/manager/ecommerce/dashboard" replace />
                            : (user.role === 'pharmacy_manager'
                                ? <Navigate to="/manager/pharmacy/dashboard" replace />
                                : (user.role === 'rescue_manager'
                                    ? <Navigate to="/manager/rescue/dashboard" replace />
                                    : (user.role === 'veterinary_manager'
                                        ? <Navigate to="/manager/veterinary/dashboard" replace />
                                        : (user.role === 'temporary_care_manager'
                                            ? <Navigate to="/manager/temporary-care/dashboard" replace />
                                            : (typeof user.role === 'string' && user.role.endsWith('_manager')
                                                ? <Navigate to="/manager/dashboard" replace />
                                                : <Navigate to="/User/dashboard" replace />))))))))))
            : <Landing />)
        } 
      />

      {/* Manager: Profile (same profile page in manager layout) */}
      <Route
        path="/manager/profile"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <UserProfile />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Manager: Store Name Change Request */}
      <Route
        path="/manager/store-name-change"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <RequestStoreNameChange />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Unified manager dashboard redirect */}
      <Route path="/manager/dashboard" element={<ManagerDashboardRedirect />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route 
        path="/login" 
        element={
          user
            ? (user.role === 'admin' || user.role === 'super_admin'
                ? <Navigate to="/admin/dashboard" replace />
                : ((typeof user.role === 'string' && user.role.endsWith('_manager') && user.needsStoreSetup)
                    ? <Navigate to="/manager/store-setup" replace />
                    : (user.role === 'adoption_manager'
                    ? <Navigate to="/manager/adoption/dashboard" replace />
                    : (user.role === 'petshop_manager'
                        ? <Navigate to="/manager/petshop/dashboard" replace />
                        : (user.role === 'ecommerce_manager'
                            ? <Navigate to="/manager/ecommerce/dashboard" replace />
                            : (user.role === 'pharmacy_manager'
                                ? <Navigate to="/manager/pharmacy/dashboard" replace />
                                : (user.role === 'rescue_manager'
                                    ? <Navigate to="/manager/rescue/dashboard" replace />
                                    : (user.role === 'veterinary_manager'
                                        ? <Navigate to="/manager/veterinary/dashboard" replace />
                                        : (user.role === 'temporary_care_manager'
                                            ? <Navigate to="/manager/temporary-care/dashboard" replace />
                                            : (typeof user.role === 'string' && user.role.endsWith('_manager')
                                                ? <Navigate to="/manager/dashboard" replace />
                                                : <Navigate to="/User/dashboard" replace />))))))))))
            : <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          loading
            ? null
            : (user
            ? (user.role === 'admin' || user.role === 'super_admin'
                ? <Navigate to="/admin/dashboard" replace />
                : (user.role === 'adoption_manager'
                    ? <Navigate to="/manager/adoption/dashboard" replace />
                    : (user.role === 'petshop_manager'
                        ? <Navigate to="/manager/petshop/dashboard" replace />
                        : (user.role === 'ecommerce_manager'
                            ? <Navigate to="/manager/ecommerce/dashboard" replace />
                            : (user.role === 'pharmacy_manager'
                                ? <Navigate to="/manager/pharmacy/dashboard" replace />
                                : (user.role === 'rescue_manager'
                                    ? <Navigate to="/manager/rescue/dashboard" replace />
                                    : (user.role === 'veterinary_manager'
                                        ? <Navigate to="/manager/veterinary/dashboard" replace />
                                        : (user.role === 'temporary_care_manager'
                                            ? <Navigate to="/manager/temporary-care/dashboard" replace />
                                            : (typeof user.role === 'string' && user.role.endsWith('_manager')
                                                ? <Navigate to="/manager/dashboard" replace />
                                                : <Navigate to="/User/dashboard" replace />)))))))))
            : <Register />)
        } 
      />
      <Route 
        path="/forgot-password" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/User/dashboard" replace />) : <ForgotPassword />} 
      />
      <Route 
        path="/force-password" 
        element={<ForcePassword />} 
      />
      <Route 
        path="/register-module-admin" 
        element={user ? (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/User/dashboard" replace />) : <ModuleAdminRegister />} 
      />
      
      {/* Dashboard route - standalone with its own navigation */}
      <Route
        path="/User/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Back-compat redirect */}
      <Route path="/dashboard" element={<Navigate to="/User/dashboard" replace />} />
      
      {/* Admin routes with AdminLayout */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/managers" element={<ManagerManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/roles" element={<RoleManagement />} />
                <Route path="/modules" element={<ModuleManagement />} />
                <Route path="/tracking" element={<DataTracking />} />
                <Route path="/petshop-analytics" element={<PetShopAnalytics />} />
                <Route path="/petshop-reservations" element={<PetShopReservations />} />
                <Route path="/petshop-shops" element={<PetShopShops />} />
                <Route path="/petshop-listings" element={<PetShopListings />} />
                <Route path="/petshop-sales-report" element={<PetShopSalesReport />} />
                {/* System Management within Admin */}
                <Route path="/rbac" element={<RBACManagement />} />
                <Route path="/core" element={<CoreManagement />} />
                {/* Pet Management Routes */}
                <Route path="/pet-management" element={<PetManagementDashboard />} />
                <Route path="/pet-overview" element={<PetManagementOverview />} />
                <Route path="/pets" element={<PetManagement />} />
                <Route path="/pets/add" element={<PetForm />} />
                <Route path="/pets/edit/:id" element={<PetForm />} />
                <Route path="/pets/:id" element={<PetDetailsAdmin />} />
                <Route path="/pets/:petId/medical-records" element={<MedicalRecords />} />
                <Route path="/pets/:petId/ownership-history" element={<OwnershipHistory />} />
                <Route path="/pets/import" element={<PetImport />} />
                <Route path="/species" element={<SpeciesManagement />} />
                <Route path="/breeds" element={<BreedsManagement />} />
                <Route path="/pet-categories" element={<PetCategories />} />
                <Route path="/custom-breed-requests" element={<CustomBreedRequests />} />
                <Route path="/ownership-by-user" element={<OwnershipByUser />} />
                <Route path="/medical-records" element={<MedicalRecords />} />
                <Route path="/ownership-history" element={<OwnershipHistory />} />
                <Route path="/adoption-management" element={<AdoptionManagement />} />
                <Route path="/adoption-analytics" element={<AdoptionAnalytics />} />
                <Route path="/adoption-dashboard" element={<AdminAdoptionDashboard />} />
                <Route path="/adoption-applications" element={<AdoptionApplicationsAdmin />} />
                <Route path="/pet-system-requests" element={<PetSystemRequests />} />
                <Route path="/store-name-change-requests" element={<AdminStoreNameChangeRequests />} />
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      {/* User protected routes with Layout under /User */}
      <Route
        path="/User/*"
        element={
          <ProtectedRoute>
            <UserLayout>
              <Routes>
                <Route path="/pets" element={<UserPetsList />} />
                <Route path="/pets/add" element={<AddPet />} />
                <Route path="/pets/add/details" element={<AddPetDetails />} />
                <Route path="/pets/add/success" element={<AddPetSuccess />} />
                <Route path="/pets/:id" element={<UserPetDetails />} />
                <Route path="/pets/request-breed" element={<RequestBreed />} />
                <Route path="/owned-pets" element={<MyOwnedPets />} />
                <Route path="/adoption" element={<AdoptionDashboard />} />
                <Route path="/adoption/applications" element={<AdoptionApplications />} />
                <Route path="/adoption/applications/:id" element={<UserApplicationDetails />} />
                <Route path="/adoption/adopted" element={<MyAdoptedPets />} />
                <Route path="/adoption/:id" element={<AdoptionDetails />} />
                {/* Adoption Apply wizard */}
                <Route path="/adoption/apply/*" element={<AdoptionApplyLayout />}>
                  <Route index element={<Navigate to="/User/adoption/apply/applicant" replace />} />
                  <Route path="start" element={<Navigate to="/User/adoption/apply/applicant" replace />} />
                  <Route path="applicant" element={<ApplyStepApplicant />} />
                  <Route path="home" element={<ApplyStepHome />} />
                  <Route path="experience" element={<ApplyStepExperience />} />
                  <Route path="documents" element={<ApplyStepDocuments />} />
                  <Route path="review" element={<ApplyStepReview />} />
                </Route>
                <Route path="/petshop" element={<PetShopDashboard />} />
                <Route path="/petshop/shop" element={<PetShopShop />} />
                <Route path="/petshop/pet/:id" element={<PetShopPetDetails />} />
                <Route path="/petshop/reservations" element={<PetShopMyReservations />} />
                <Route path="/petshop/reservation/:reservationId" element={<PetShopReservationDetails />} />
                <Route path="/petshop/purchase-decision/:reservationId" element={<PurchaseDecision />} />
                <Route path="/petshop/payment/:reservationId" element={<PaymentGateway />} />
                <Route path="/rescue" element={<RescueDashboard />} />
                <Route path="/ecommerce" element={<EcommerceDashboard />} />
                <Route path="/ecommerce/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/pharmacy" element={<PharmacyDashboard />} />
                {false && <Route path="/boarding" element={<Boarding />} />}
                <Route path="/temporary-care" element={<TemporaryCareDashboard />} />
                <Route path="/veterinary" element={<VeterinaryDashboard />} />
                {false && <Route path="/donation" element={<DonationDashboard />} />}
                <Route path="/rbac" element={<RBACManagement />} />
                <Route path="/core" element={<CoreManagement />} />
                {false && <Route path="/users" element={<div />} />}
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/admin-management" element={<AdminManagement />} />
                
                {/* Module Dashboards (Admin and Manager aliases) */}
                <Route path="/dashboard/public" element={<UserDashboard />} />
                <Route path="/dashboard/petshop-admin" element={<PetShopManagerDashboard />} />
                <Route path="/dashboard/petshop-manager" element={<PetShopManagerDashboard />} />
                <Route path="/dashboard/temporary-care-admin" element={<TemporaryCareManagerDashboard />} />
                <Route path="/dashboard/temporary-care-manager" element={<TemporaryCareManagerDashboard />} />
                {false && <Route path="/dashboard/donation-admin" element={<div />} />}
                <Route path="/dashboard/ecommerce-admin" element={<EcommerceManagerDashboard />} />
                <Route path="/dashboard/ecommerce-manager" element={<EcommerceManagerDashboard />} />
                <Route path="/dashboard/adoption-admin" element={<AdoptionManagerDashboard />} />
                <Route path="/dashboard/adoption-manager" element={<AdoptionManagerDashboard />} />
                <Route path="/dashboard/adoption-manager/manage" element={<AdoptionManage />} />
                <Route path="/dashboard/rescue-admin" element={<RescueManagerDashboard />} />
                <Route path="/dashboard/rescue-manager" element={<RescueManagerDashboard />} />
                <Route path="/dashboard/rescue-manager/manage" element={<RescueManage />} />
                <Route path="/dashboard/pharmacy-admin" element={<PharmacyManagerDashboard />} />
                <Route path="/dashboard/pharmacy-manager" element={<PharmacyManagerDashboard />} />
                <Route path="/dashboard/pharmacy-manager/manage" element={<PharmacyManage />} />
                {false && <Route path="/dashboard/boarding-admin" element={<div />} />}
                <Route path="/dashboard/veterinary-admin" element={<VeterinaryManagerDashboard />} />
                <Route path="/dashboard/veterinary-manager" element={<VeterinaryManagerDashboard />} />
                <Route path="/dashboard/veterinary-manager/manage" element={<VeterinaryManage />} />
                <Route path="/dashboard/ecommerce-manager/manage" element={<EcommerceManage />} />
                <Route path="/dashboard/petshop-manager/manage" element={<PetShopManage />} />
                <Route path="/dashboard/temporary-care-manager/manage" element={<TemporaryCareManage />} />
              </Routes>
            </UserLayout>
          </ProtectedRoute>
        }
      />

      {/* Adoption Manager workspace with ManagerLayout (primary) */}
      <Route
        path="/manager/adoption/*"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <Routes>
                <Route path="/dashboard" element={<AdoptionManagerDashboard />} />
                <Route path="/pets" element={<PetsList />} />
                <Route path="/pets/:id" element={<PetDetailsManager />} />
                <Route path="/pets/:id/profile" element={<PetProfile />} />
                <Route path="/pets/:id/edit" element={<AdoptionPetForm />} />
                {/* Wizard routes */}
                <Route path="/wizard/*" element={<AdoptionWizardLayout />}>
                  <Route path="start" element={<Navigate to="/manager/adoption/wizard/basic" replace />} />
                  <Route path="basic" element={<AdoptionStepBasic />} />
                  <Route path="health" element={<AdoptionStepHealth />} />
                  <Route path="availability" element={<AdoptionStepAvailability />} />
                  <Route path="review" element={<AdoptionStepReview />} />
                </Route>
                <Route path="/applications" element={<ApplicationsList />} />
                <Route path="/applications/:id" element={<ApplicationDetails />} />
                <Route path="/import" element={<ImportPets />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/" element={<Navigate to="/manager/adoption/dashboard" replace />} />
              </Routes>
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Manager Store Setup */}
      <Route
        path="/manager/store-setup"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <StoreSetup />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Ecommerce Manager */}
      <Route
        path="/manager/ecommerce/*"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <Routes>
                <Route path="/dashboard" element={<EcommerceManagerDashboard />} />
                <Route path="/" element={<Navigate to="/manager/ecommerce/dashboard" replace />} />
              </Routes>
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Pharmacy Manager */}
      <Route
        path="/manager/pharmacy/*"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <Routes>
                <Route path="/dashboard" element={<PharmacyManagerDashboard />} />
                <Route path="/" element={<Navigate to="/manager/pharmacy/dashboard" replace />} />
              </Routes>
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Rescue Manager */}
      <Route
        path="/manager/rescue/*"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <Routes>
                <Route path="/dashboard" element={<RescueManagerDashboard />} />
                <Route path="/cases" element={<RescueCases />} />
                <Route path="/cases/new" element={<RescueNew />} />
                <Route path="/" element={<Navigate to="/manager/rescue/dashboard" replace />} />
              </Routes>
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* PetShop Manager */}
      <Route
        path="/manager/petshop/*"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <Routes>
                <Route path="/dashboard" element={<PetShopManagerDashboard />} />
                <Route path="/orders" element={<PetShopOrders />} />
                <Route path="/orders/:id/invoice" element={<PetShopInvoice />} />
                <Route path="/inventory" element={<PetShopInventory />} />
                <Route path="/add-stock" element={<PetShopAddStock />} />
                <Route path="/manage-inventory" element={<PetShopManageInventory />} />
                <Route path="/for-sale" element={<AvailableForSale />} />
                <Route path="/pricing-rules" element={<PetShopPricingRules />} />
                <Route path="/reports" element={<PetShopReports />} />
                <Route path="/reservations" element={<PetShopManageReservations />} />
                <Route path="/pets/:petId/history" element={<PetShopPetHistory />} />
                <Route path="/" element={<Navigate to="/manager/petshop/dashboard" replace />} />
              </Routes>
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Temporary Care Manager */}
      <Route
        path="/manager/temporary-care/*"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <Routes>
                <Route path="/dashboard" element={<TemporaryCareManagerDashboard />} />
                <Route path="/" element={<Navigate to="/manager/temporary-care/dashboard" replace />} />
              </Routes>
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Veterinary Manager */}
      <Route
        path="/manager/veterinary/*"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <Routes>
                <Route path="/dashboard" element={<VeterinaryManagerDashboard />} />
                <Route path="/" element={<Navigate to="/manager/veterinary/dashboard" replace />} />
              </Routes>
            </ManagerLayout>
          </ProtectedRoute>
        }
      />

      {/* Compatibility routes */}
      <Route path="/manager/adoptions/*" element={<Navigate to="/manager/adoption" replace />} />
      <Route path="/User/manager/adoptions/*" element={<Navigate to="/manager/adoption" replace />} />

      {/* Back-compat redirects for old user paths */}
      <Route path="/pets/*" element={<Navigate to="/User/pets" replace />} />
      <Route path="/adoption/*" element={<Navigate to="/User/adoption" replace />} />
      <Route path="/petshop/*" element={<Navigate to="/User/petshop" replace />} />
      <Route path="/rescue/*" element={<Navigate to="/User/rescue" replace />} />
      <Route path="/ecommerce/*" element={<Navigate to="/User/ecommerce" replace />} />
      <Route path="/pharmacy/*" element={<Navigate to="/User/pharmacy" replace />} />
      <Route path="/temporary-care/*" element={<Navigate to="/User/temporary-care" replace />} />
      <Route path="/veterinary/*" element={<Navigate to="/User/veterinary" replace />} />
    </Routes>
  )
}

export default App
