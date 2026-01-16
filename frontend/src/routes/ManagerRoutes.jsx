import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ManagerLayout from '../layouts/ManagerLayout'
import ManagerDashboardRedirect from '../pages/Manager/DashboardRedirect'
import StoreSetup from '../pages/Manager/StoreSetup'
import StoreNameSetup from '../pages/Manager/StoreNameSetup'
import RequestStoreNameChange from '../pages/Manager/RequestStoreNameChange'
import UserProfile from '../pages/User/Profile'

// NEW E-Commerce Manager Components
import EcommerceDashboard from '../pages/Manager/EcommerceDashboard'
import AddProduct from '../pages/Manager/AddProduct'
import ProductList from '../pages/Manager/ProductList'
import EcommerceOrders from '../pages/Manager/EcommerceOrders'
import OrderDetail from '../pages/User/OrderDetail'
import EcommerceManage from '../pages/Manager/EcommerceManage'
import CategoryManagement from '../pages/Manager/CategoryManagement'

// E-Commerce Manager Components (NEW - all using pages/Manager/)
// Old imports removed - using new components from pages/Manager/

// Admin Components
import ModuleManagement from '../modules/admin/components/ModuleManagement'
import ManagerInvite from '../modules/admin/components/ManagerInvite'
import AdoptionManagerDashboard from '../modules/managers/Adoption/AdoptionManagerDashboard'
import PetsList from '../modules/managers/Adoption/PetsList'
import PetDetailsManager from '../modules/managers/Adoption/PetDetails'
import AdoptionPetForm from '../modules/managers/Adoption/PetForm'
import ApplicationsList from '../modules/managers/Adoption/ApplicationsList'
import ApplicationDetailsImproved from '../modules/managers/Adoption/ApplicationDetails'
import ImportPets from '../modules/managers/Adoption/ImportPets'
import PostImportProcessing from '../modules/managers/Adoption/PostImportProcessing'
import Reports from '../modules/managers/Adoption/Reports'
import PetProfile from '../modules/managers/Adoption/PetProfile'
import PaymentHistory from '../modules/managers/Adoption/PaymentHistory'
import AdoptionWizardLayout from '../modules/managers/Adoption/Wizard/WizardLayout'
import AdoptionStepBasic from '../modules/managers/Adoption/Wizard/StepBasicInfo'
import AdoptionStepHealth from '../modules/managers/Adoption/Wizard/StepHealthMedia'
import AdoptionStepAvailability from '../modules/managers/Adoption/Wizard/StepAvailability'
import AdoptionStepReview from '../modules/managers/Adoption/Wizard/StepReview'
import PetShopManagerDashboard from '../modules/managers/PetShop/PetShopManagerDashboard'
import PetShopOrders from '../modules/managers/PetShop/Orders'
import PetShopInventory from '../modules/managers/PetShop/Inventory'
import PetShopInvoice from '../modules/managers/PetShop/Invoice'
import PetShopAddStock from '../modules/managers/PetShop/AddStock'
import PetShopManageInventory from '../modules/managers/PetShop/ManageInventory'
import PetShopReports from '../modules/managers/PetShop/Reports'
import GeneratePetsFromStock from '../modules/managers/PetShop/GeneratePetsFromStock'
import AvailableForSale from '../modules/managers/PetShop/AvailableForSale'
import ManageStockImages from '../modules/managers/PetShop/ManageStockImages'
import ManagerAIBreedIdentifier from '../modules/managers/PetShop/AIBreedIdentifier'
import ReservedPets from '../modules/managers/PetShop/ReservedPets'
import PurchasedPets from '../modules/managers/PetShop/PurchasedPets'
import PurchasePet from '../modules/managers/PetShop/PurchasePet'
import PurchaseApplications from '../modules/managers/PetShop/PurchaseApplications'
import PetShopPetHistory from '../modules/managers/PetShop/PetHistory'
import HandoverManagement from '../modules/managers/PetShop/HandoverManagement'
import ScheduleHandover from '../modules/managers/PetShop/ScheduleHandover'
import PetShopManageReservations from '../modules/managers/PetShop/SimpleReservations'
import WizardLayoutImproved from '../modules/managers/PetShop/Wizard/WizardLayoutImproved'
import StepBasicInfoImproved from '../modules/managers/PetShop/Wizard/StepBasicInfoImproved'
import StepClassificationImproved from '../modules/managers/PetShop/Wizard/StepClassificationImproved'
import StepPricingImproved from '../modules/managers/PetShop/Wizard/StepPricingImproved'
import StepGenderClassification from '../modules/managers/PetShop/Wizard/StepGenderClassification'
import StepReviewImproved from '../modules/managers/PetShop/Wizard/StepReviewImproved'
import StockManagement from '../modules/managers/PetShop/StockManagement'
import PharmacyManagerDashboard from '../modules/managers/Pharmacy/PharmacyManagerDashboard'
import RescueManagerDashboard from '../modules/managers/Rescue/RescueManagerDashboard'
import TemporaryCareManagerDashboard from '../modules/managers/TemporaryCare/TemporaryCareManagerDashboard'
import ApplicationManagerDashboard from '../pages/Manager/TemporaryCare/ApplicationManagerDashboard'
import ProfessionalApplicationDashboard from '../pages/Manager/TemporaryCare/ProfessionalApplicationDashboard'
import TemporaryCareManagerRequests from '../modules/managers/TemporaryCare/Requests'
import TemporaryCareManagerCaregivers from '../modules/managers/TemporaryCare/Caregivers'
import TemporaryCareBookings from '../modules/managers/TemporaryCare/Bookings'
import TemporaryCareFacilities from '../modules/managers/TemporaryCare/Facilities'
import TemporaryCarePetsInCare from '../modules/managers/TemporaryCare/PetsInCare'
import TemporaryCareReports from '../modules/managers/TemporaryCare/Reports'
import VeterinaryManagerDashboard from '../modules/managers/Veterinary/VeterinaryManagerDashboard'
import VeterinaryWorkerDashboard from '../modules/managers/Veterinary/VeterinaryWorkerDashboard'
import VeterinaryStaff from '../modules/managers/Veterinary/Staff'
import VeterinaryMedicalManage from '../modules/managers/Veterinary/Manage'
import VeterinaryAppointments from '../pages/User/Veterinary/VeterinaryAppointments'
import VeterinaryRecords from '../modules/managers/Veterinary/Records'
import VeterinaryPatients from '../modules/managers/Veterinary/Patients'
import VeterinaryServices from '../modules/managers/Veterinary/Services'
import VeterinaryReports from '../modules/managers/Veterinary/Reports'
import VeterinaryManagerOperations from '../pages/Manager/Veterinary/VeterinaryManagerOperations'
import VeterinaryManagerPatients from '../pages/Manager/Veterinary/VeterinaryManagerPatients'
import VeterinaryManagerPatientDetails from '../pages/Manager/Veterinary/VeterinaryManagerPatientDetails'
import VeterinaryManagerPatientForm from '../pages/Manager/Veterinary/VeterinaryManagerPatientForm'
import VeterinaryManagerStaff from '../pages/Manager/Veterinary/VeterinaryManagerStaff'
import VeterinaryManagerStaffDetails from '../pages/Manager/Veterinary/VeterinaryManagerStaffDetails'
import VeterinaryManagerStaffForm from '../pages/Manager/Veterinary/VeterinaryManagerStaffForm'
import VeterinaryManagerServices from '../pages/Manager/Veterinary/VeterinaryManagerServices'
import VeterinaryManagerServiceDetails from '../pages/Manager/Veterinary/VeterinaryManagerServiceDetails'
import VeterinaryManagerServiceForm from '../pages/Manager/Veterinary/VeterinaryManagerServiceForm'
import VeterinaryManagerAppointmentDetails from '../pages/Manager/Veterinary/VeterinaryManagerAppointmentDetails'
import VeterinaryManagerAppointments from '../pages/Manager/Veterinary/VeterinaryManagerAppointments'
import VeterinaryManagerNewAppointment from '../pages/Manager/Veterinary/VeterinaryManagerNewAppointment'
import VeterinaryManagerMedicalRecordForm from '../pages/Manager/Veterinary/VeterinaryManagerMedicalRecordForm'
import VeterinaryManagerMedicalRecordDetail from '../pages/Manager/Veterinary/VeterinaryManagerMedicalRecordDetail'
import VeterinaryManagerMedicalRecords from '../pages/Manager/Veterinary/VeterinaryManagerMedicalRecords'
import VetWizardLayout from '../modules/managers/Veterinary/Wizard/WizardLayout'
import VetStepBasics from '../modules/managers/Veterinary/Wizard/StepBasics'
import VetStepTests from '../modules/managers/Veterinary/Wizard/StepTestsInjections'
import VetStepMedications from '../modules/managers/Veterinary/Wizard/StepMedicationsReview'
import AdoptionManage from '../modules/managers/Adoption/Manage'
import PharmacyManage from '../modules/managers/Pharmacy/Manage'
import RescueManage from '../modules/managers/Rescue/Manage'
import PetShopManage from '../modules/managers/PetShop/Manage'
import TemporaryCareManage from '../modules/managers/TemporaryCare/Manage'
import VeterinaryManage from '../modules/managers/Veterinary/Manage'
import PetManagerDashboard from '../modules/managers/Pet/pages/PetManagerDashboard'
import PetDetails from '../modules/managers/Pet/pages/PetDetails'
import CentralizedRegistry from '../modules/managers/Pet/pages/CentralizedRegistry'
import PetRoutes from '../modules/managers/Pet/routes'

const ManagerRoutes = () => {
  return (
    <ManagerLayout>
      <Routes>
        {/* New Manager Dashboard */}
        <Route path="/dashboard" element={<ManagerDashboardRedirect />} />
        
        {/* Manager: Profile */}
        <Route path="/profile" element={<UserProfile />} />
        
        {/* Manager: Store Name Change Request */}
        <Route path="/store-name-change" element={<RequestStoreNameChange />} />
        
        {/* Unified manager dashboard redirect (backwards compatibility) */}
        <Route path="/dashboard-old" element={<ManagerDashboardRedirect />} />
        
        {/* Adoption Manager workspace */}
        <Route path="/adoption/*" element={
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
            <Route path="/applications/:id" element={<ApplicationDetailsImproved />} />
            <Route path="/payments" element={<PaymentHistory />} />
            <Route path="/import" element={<ImportPets />} />
            <Route path="/post-import-processing" element={<PostImportProcessing />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/manage" element={<AdoptionManage />} />
            <Route path="/" element={<Navigate to="/manager/adoption/dashboard" replace />} />
          </Routes>
        } />
        
        {/* Manager Store Setup */}
        <Route path="/store-setup" element={<StoreSetup />} />
        
        {/* Ecommerce Manager */}
        <Route path="/ecommerce/*" element={
          <Routes>
            <Route path="/dashboard" element={<EcommerceDashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/:id/edit" element={<AddProduct />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/orders" element={<EcommerceOrders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/manage" element={<EcommerceManage />} />
            <Route path="/" element={<Navigate to="/manager/ecommerce/dashboard" replace />} />
          </Routes>
        } />
        
        {/* Pharmacy Manager */}
        <Route path="/pharmacy/*" element={
          <Routes>
            <Route path="/dashboard" element={<PharmacyManagerDashboard />} />
            <Route path="/manage" element={<PharmacyManage />} />
            <Route path="/" element={<Navigate to="/manager/pharmacy/dashboard" replace />} />
          </Routes>
        } />
        
        {/* Rescue Manager */}
        <Route path="/rescue/*" element={
          <Routes>
            <Route path="/dashboard" element={<RescueManagerDashboard />} />
            <Route path="/manage" element={<RescueManage />} />
            <Route path="/" element={<Navigate to="/manager/rescue/dashboard" replace />} />
          </Routes>
        } />
        
        {/* PetShop Manager */}
        <Route path="/petshop/*" element={
          <Routes>
            <Route path="/dashboard" element={<PetShopManagerDashboard />} />
            <Route path="/ai-identifier" element={<ManagerAIBreedIdentifier />} />
            <Route path="/manage" element={<PetShopManage />} />
            {/* PetShop Wizard Routes */}
            <Route path="/wizard/*" element={<WizardLayoutImproved />}>
              <Route path="basic" element={<StepBasicInfoImproved />} />
              <Route path="classification" element={<StepClassificationImproved />} />
              <Route path="pricing" element={<StepPricingImproved />} />
              <Route path="gender" element={<StepGenderClassification />} />
              <Route path="review" element={<StepReviewImproved />} />
              <Route index element={<Navigate to="/manager/petshop/wizard/basic" replace />} />
            </Route>
            <Route path="/orders" element={<PetShopOrders />} />
            <Route path="/orders/:id/invoice" element={<PetShopInvoice />} />
            <Route path="/purchase-applications" element={<PurchaseApplications />} />
            <Route path="/inventory" element={<PetShopInventory />} />
            <Route path="/manage-inventory" element={<PetShopManageInventory />} />
            <Route path="/manage-stock-images/:id" element={<ManageStockImages />} />
            <Route path="/generate-pets/:id" element={<GeneratePetsFromStock />} />
            <Route path="/reserved-pets" element={<ReservedPets />} />
            <Route path="/for-sale" element={<AvailableForSale />} />
            <Route path="/reports" element={<PetShopReports />} />
            <Route path="/reservations" element={<PetShopManageReservations />} />
            <Route path="/purchased-pets" element={<PurchasedPets />} />
            <Route path="/purchase/:id" element={<PurchasePet />} />
            <Route path="/schedule-handover/:reservationId" element={<ScheduleHandover />} />
            <Route path="/pets/:petId/history" element={<PetShopPetHistory />} />
            <Route path="/handover/:reservationId" element={<HandoverManagement />} />
            {/* Stock Management Routes */}
            <Route path="/stocks" element={<StockManagement />} />
            <Route path="/stocks/add" element={<StockManagement />} />
            <Route path="/" element={<Navigate to="/manager/petshop/dashboard" replace />} />
          </Routes>
        } />
        
        {/* Temporary Care Manager */}
        <Route path="/temporary-care/*" element={
          <Routes>
            <Route path="/dashboard" element={<ProfessionalApplicationDashboard />} />
            <Route path="/applications" element={<ProfessionalApplicationDashboard />} />
            {/* Legacy routes (backward compatibility) */}
            <Route path="/manage" element={<TemporaryCareManage />} />
            <Route path="/requests" element={<TemporaryCareManagerRequests />} />
            <Route path="/caregivers" element={<TemporaryCareManagerCaregivers />} />
            <Route path="/bookings" element={<TemporaryCareBookings />} />
            <Route path="/facilities" element={<TemporaryCareFacilities />} />
            <Route path="/pets" element={<TemporaryCarePetsInCare />} />
            <Route path="/reports" element={<TemporaryCareReports />} />
            <Route path="/" element={<Navigate to="/manager/temporary-care/dashboard" replace />} />
          </Routes>
        } />
        
        {/* Veterinary Manager */}
        <Route path="/veterinary/*" element={
          <Routes>
            <Route path="/dashboard" element={<VeterinaryManagerDashboard />} />
            <Route path="/manage" element={<VeterinaryManage />} />
            <Route path="/staff-dashboard" element={<VeterinaryWorkerDashboard />} />
            <Route path="/appointments" element={<VeterinaryManagerAppointments />} />
            <Route path="/appointments/new" element={<VeterinaryManagerNewAppointment />} />
            <Route path="/appointments/:id" element={<VeterinaryManagerAppointmentDetails />} />
            <Route path="/services" element={<VeterinaryManagerServices />} />
            <Route path="/records" element={<VeterinaryManagerMedicalRecords />} />
            <Route path="/records/new" element={<VeterinaryManagerMedicalRecordForm />} />
            <Route path="/records/:id/edit" element={<VeterinaryManagerMedicalRecordForm />} />
            <Route path="/records/:id" element={<VeterinaryManagerMedicalRecordDetail />} />
            <Route path="/patients" element={<VeterinaryManagerPatients />} />
            <Route path="/patients/details" element={<VeterinaryManagerPatients />} />
            <Route path="/patients/new" element={<VeterinaryManagerPatientForm />} />
            <Route path="/patients/:id/edit" element={<VeterinaryManagerPatientForm />} />
            <Route path="/patients/:id" element={<VeterinaryManagerPatientDetails />} />
            <Route path="/services" element={<VeterinaryManagerServices />} />
            <Route path="/services/new" element={<VeterinaryManagerServiceForm />} />
            <Route path="/services/:id/edit" element={<VeterinaryManagerServiceForm />} />
            <Route path="/services/:id" element={<VeterinaryManagerServiceDetails />} />
            <Route path="/reports" element={<VeterinaryReports />} />
            <Route path="/staff" element={<VeterinaryManagerStaff />} />
            <Route path="/staff/details" element={<VeterinaryManagerStaff />} />
            <Route path="/staff/new" element={<VeterinaryManagerStaffForm />} />
            <Route path="/staff/:id/edit" element={<VeterinaryManagerStaffForm />} />
            <Route path="/staff/:id" element={<VeterinaryManagerStaffDetails />} />
            <Route path="/wizard/*">
              <Route path="basic" element={<VetStepBasics />} />
              <Route path="tests" element={<VetStepTests />} />
              <Route path="medications" element={<VetStepMedications />} />
              <Route index element={<Navigate to="/manager/veterinary/wizard/basic" replace />} />
            </Route>
            <Route path="/manage" element={<VeterinaryMedicalManage />} />
            <Route path="/" element={<Navigate to="/manager/veterinary/dashboard" replace />} />
          </Routes>
        } />
        
        {/* Pet Manager Routes */}
        <Route path="/pet/*" element={<PetRoutes />} />
        
        <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />
      </Routes>
    </ManagerLayout>
  )
}

export default ManagerRoutes