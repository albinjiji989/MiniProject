import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import UserLayout from '../components/Layout/UserLayout'
import PublicUserDashboard from '../pages/User/PublicUserDashboard'
import ModernUserDashboard from '../pages/User/ModernUserDashboard'
import UserPetsList from '../pages/User/Pets/List'
import AddPet from '../pages/User/Pets/AddPet'
import AddPetDetails from '../pages/User/Pets/AddPetDetails'
import AddPetSuccess from '../pages/User/Pets/AddPetSuccess'
import UserPetDetails from '../pages/User/Pets/Details'
import EditPet from '../pages/User/Pets/EditPet'
import EditBasicPet from '../pages/User/Pets/EditBasicPet'
import UserPetMedicalHistory from '../pages/User/Pets/MedicalHistory'
import UserPetHistory from '../pages/User/Pets/History'
import RequestBreed from '../pages/User/Pets/RequestBreed'
import MyOwnedPets from '../pages/User/MyOwnedPets'
import AdoptionDashboard from '../pages/User/Adoption/AdoptionDashboard'
import AdoptionApplications from '../pages/User/Adoption/AdoptionApplications'
import UserApplicationDetails from '../pages/User/Adoption/ApplicationDetails'
import MyAdoptedPets from '../pages/User/Adoption/MyAdoptedPets'
import UserAdoptedPetDetails from '../pages/User/Adoption/UserAdoptedPetDetails'
import AdoptionDetails from '../pages/User/Adoption/AdoptionDetails'
import DebugPetCheck from '../pages/User/Adoption/DebugPetCheck'
import AdoptionApplyLayout from '../pages/User/Adoption/ApplyWizard/ApplyLayout'
import ApplyStepApplicant from '../pages/User/Adoption/ApplyWizard/StepApplicant'
import ApplyStepHome from '../pages/User/Adoption/ApplyWizard/StepHome'
import ApplyStepExperience from '../pages/User/Adoption/ApplyWizard/StepExperience'
import ApplyStepDocuments from '../pages/User/Adoption/ApplyWizard/StepDocuments'
import ApplyStepReview from '../pages/User/Adoption/ApplyWizard/StepReview'
import UserAdoptionAIMLDashboard from '../pages/User/Adoption/AIMLDashboard'
import PetShopDashboard from '../pages/User/PetShop/PetShopDashboard'
import BrowsePets from '../pages/User/PetShop/BrowsePets'
import NewPetDetails from '../pages/User/PetShop/NewPetDetails'
import NewReservationWizard from '../pages/User/PetShop/NewReservationWizard'
import PetShopMyReservations from '../pages/User/PetShop/MyReservations'
import PetShopReservationDetails from '../pages/User/PetShop/ReservationDetails'
import Wishlist from '../pages/User/PetShop/Wishlist'
import Payment from '../pages/User/PetShop/Payment'
import PurchaseDecision from '../pages/User/PetShop/PurchaseDecision'
import PurchaseConfirmation from '../pages/User/PetShop/PurchaseConfirmation'
import Handover from '../pages/User/PetShop/Handover'
import UserAIMLDashboard from '../pages/User/PetShop/AIMLDashboard'
import Reservations from '../pages/User/PetShop/Reservations'
import ReservationDetails from '../pages/User/PetShop/ReservationDetails'
import TemporaryCareDashboard from '../pages/User/TemporaryCare/TemporaryCareDashboard'
import TemporaryCareRequestForm from '../pages/User/TemporaryCare/RequestForm'
import VeterinaryDashboard from '../pages/User/Veterinary/VeterinaryDashboard'
import SimpleVeterinaryBooking from '../pages/User/Veterinary/SimpleVeterinaryBooking'
import SimpleVeterinaryPetSelection from '../pages/User/Veterinary/SimpleVeterinaryPetSelection'
import SimpleVeterinaryAppointments from '../pages/User/Veterinary/SimpleVeterinaryAppointments'
import SimpleVeterinaryAppointmentDetails from '../pages/User/Veterinary/SimpleVeterinaryAppointmentDetails'
import VeterinaryVaccinations from '../pages/User/Veterinary/VeterinaryVaccinations'
import VeterinaryMedicalRecords from '../pages/User/Veterinary/VeterinaryMedicalRecords'
import PetMedicalHistory from '../pages/User/Veterinary/PetMedicalHistory'
import VeterinaryPetSelection from '../pages/User/Veterinary/VeterinaryPetSelection'
import VeterinaryPetDashboard from '../pages/User/Veterinary/VeterinaryPetDashboard'
import VeterinaryAppointmentDetails from '../pages/User/Veterinary/VeterinaryAppointmentDetails'
import TestVeterinaryAPI from '../pages/User/Veterinary/TestVeterinaryAPI'
import DebugVeterinaryPets from '../pages/User/Veterinary/DebugVeterinaryPets'
import DebugAPI from '../pages/User/Veterinary/DebugAPI'
import TestAPIs from '../pages/User/Veterinary/TestAPIs'
import PetSpecificVeterinaryDashboard from '../pages/User/Veterinary/PetSpecificVeterinaryDashboard'
import TestPetSpecificFlow from '../pages/User/Veterinary/TestPetSpecificFlow'
import UserProfile from '../pages/User/Profile'
import AdminManagement from '../pages/Admin/AdminManagement'
import NotificationsPage from '../pages/User/Notifications'
import TemporaryCareDetails from '../pages/User/TemporaryCare/TemporaryCareDetails'
import OTPVerification from '../pages/User/TemporaryCare/OTPVerification'
import MyUserPets from '../pages/User/Pets/MyUserPets'
import BrowseStocks from '../pages/User/PetShop/BrowseStocks'
import StockDetail from '../pages/User/PetShop/StockDetail'
import MyPurchasedPets from '../pages/User/PetShop/MyPurchasedPets'
import PurchasedPetDetails from '../pages/User/PetShop/PurchasedPetDetails'
import BeautifulPetShopDashboard from '../pages/User/PetShop/BeautifulPetShopDashboard'
import EnhancedBrowsePets from '../pages/User/PetShop/EnhancedBrowsePets'
import EnhancedPetDetails from '../pages/User/PetShop/EnhancedPetDetails'

const UserRoutes = () => {
  return (
    <UserLayout>
      <Routes>
        <Route index element={<ModernUserDashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/pets" element={<UserPetsList />} />
        <Route path="/pets/add" element={<AddPet />} />
        <Route path="/pets/add/details" element={<AddPetDetails />} />
        <Route path="/pets/add/success" element={<AddPetSuccess />} />
        <Route path="/pets/:id" element={<UserPetDetails />} />
        <Route path="/pets/:id/edit" element={<EditPet />} />
        <Route path="/pets/:id/edit-basic" element={<EditBasicPet />} />
        <Route path="/pets/:id/medical-history" element={<UserPetMedicalHistory />} />
        <Route path="/pets/:id/history" element={<UserPetHistory />} />
        <Route path="/pets/request-breed" element={<RequestBreed />} />
        <Route path="/owned-pets" element={<MyOwnedPets />} />
        <Route path="/adoption" element={<AdoptionDashboard />} />
        <Route path="/adoption/applications" element={<AdoptionApplications />} />
        <Route path="/adoption/applications/:id" element={<UserApplicationDetails />} />
        <Route path="/adoption/adopted" element={<MyAdoptedPets />} />
        <Route path="/adoption/adopted/:id" element={<UserAdoptedPetDetails />} />
        <Route path="/adoption/detail/:id" element={<AdoptionDetails />} />
        <Route path="/adoption/debug" element={<DebugPetCheck />} />
        
        {/* Adoption Application Wizard */}
        <Route path="/adoption/apply" element={<AdoptionApplyLayout />}>
          <Route index element={<ApplyStepApplicant />} />
          <Route path="home" element={<ApplyStepHome />} />
          <Route path="experience" element={<ApplyStepExperience />} />
          <Route path="documents" element={<ApplyStepDocuments />} />
          <Route path="review" element={<ApplyStepReview />} />
        </Route>
        
        <Route path="/adoption/aiml-dashboard" element={<UserAdoptionAIMLDashboard />} />
        
        {/* User PetShop Routes */}
        <Route path="/petshop/shop" element={<BrowsePets />} />
        <Route path="/petshop/pet/:id" element={<NewPetDetails />} />
        <Route path="/petshop/reserve/:petId" element={<NewReservationWizard />} />
        <Route path="/petshop/reservations" element={<PetShopMyReservations />} />
        <Route path="/petshop/reservation/:reservationId" element={<PetShopReservationDetails />} />
        <Route path="/petshop/wishlist" element={<Wishlist />} />
        <Route path="/petshop/payment/:reservationId" element={<Payment />} />
        <Route path="/petshop/purchase-decision/:reservationId" element={<PurchaseDecision />} />
        <Route path="/petshop/purchase-confirmation/:reservationId" element={<PurchaseConfirmation />} />
        <Route path="/petshop/handover/:reservationId" element={<Handover />} />
        <Route path="/petshop/aiml-dashboard" element={<UserAIMLDashboard />} />
        <Route path="/petshop/dashboard" element={<BeautifulPetShopDashboard />} />
        <Route path="/petshop/browse" element={<EnhancedBrowsePets />} />
        <Route path="/petshop/detail/:id" element={<EnhancedPetDetails />} />
        <Route path="/petshop/my-reservations" element={<Reservations />} />
        <Route path="/petshop/reservation/:reservationId" element={<ReservationDetails />} />
        <Route path="/petshop/pay/:reservationId" element={<Payment />} />
        <Route path="/petshop/confirm/:reservationId" element={<PurchaseDecision />} />
        <Route path="/petshop/confirmed/:reservationId" element={<PurchaseConfirmation />} />
        <Route path="/petshop/handover/:reservationId" element={<Handover />} />
        <Route path="/petshop/ml-dashboard" element={<UserAIMLDashboard />} />
        {/* Stock Routes */}
        <Route path="/petshop/stocks" element={<BrowseStocks />} />
        <Route path="/petshop/stock/:id" element={<StockDetail />} />
        <Route path="/petshop/my-pets" element={<MyPurchasedPets />} />
        <Route path="/petshop/my-pet/:id" element={<PurchasedPetDetails />} />
        
        {/* Temporary Care Routes */}
        <Route path="/temporary-care" element={<TemporaryCareDashboard />} />
        <Route path="/temporary-care/request" element={<TemporaryCareRequestForm />} />
        <Route path="/temporary-care/details/:id" element={<TemporaryCareDetails />} />
        <Route path="/temporary-care/verify-otp" element={<OTPVerification />} />
        
        {/* Veterinary Routes */}
        <Route path="/veterinary" element={<VeterinaryDashboard />} />
        <Route path="/veterinary/book" element={<SimpleVeterinaryBooking />} />
        <Route path="/veterinary/select-pet" element={<SimpleVeterinaryPetSelection />} />
        <Route path="/veterinary/appointments" element={<SimpleVeterinaryAppointments />} />
        <Route path="/veterinary/appointment/:id" element={<SimpleVeterinaryAppointmentDetails />} />
        <Route path="/veterinary/vaccinations" element={<VeterinaryVaccinations />} />
        <Route path="/veterinary/records" element={<VeterinaryMedicalRecords />} />
        <Route path="/veterinary/pet/:petId/history" element={<PetMedicalHistory />} />
        <Route path="/veterinary/select-pet-full" element={<VeterinaryPetSelection />} />
        <Route path="/veterinary/pet/:petId/dashboard" element={<VeterinaryPetDashboard />} />
        <Route path="/veterinary/full-appointment/:id" element={<VeterinaryAppointmentDetails />} />
        <Route path="/veterinary/test-api" element={<TestVeterinaryAPI />} />
        <Route path="/veterinary/debug-pets" element={<DebugVeterinaryPets />} />
        <Route path="/veterinary/debug-api" element={<DebugAPI />} />
        <Route path="/veterinary/test-apis" element={<TestAPIs />} />
        <Route path="/veterinary/pet-specific/:petId" element={<PetSpecificVeterinaryDashboard />} />
        <Route path="/veterinary/test-pet-flow/:petId" element={<TestPetSpecificFlow />} />
        
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin-management" element={<AdminManagement />} />
        
        {/* Module Dashboards (Admin and Manager aliases) */}
        <Route path="/dashboard/public" element={<PublicUserDashboard />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserLayout>
  )
}

export default UserRoutes