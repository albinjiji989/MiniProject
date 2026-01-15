import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import UserLayout from '../components/Layout/UserLayout'
import ModernUserDashboard from '../pages/User/ModernUserDashboard'
import UserProfile from '../pages/User/Profile'
import UserPets from '../pages/User/Pets'
import UserAdoptionApplications from '../pages/User/Adoption/AdoptionApplications';
import UserAdoptionApplicationDetails from '../pages/User/Adoption/AdoptionApplications';
import UserPetDetails from '../pages/User/Pets/Details';
import PetAdoptionForm from '../pages/User/Adoption/Adoption';
import UserAdoptionWizard from '../pages/User/Adoption/ApplyWizard/ApplyLayout';
import AdoptionApplications from '../pages/User/Adoption/AdoptionApplications'
import UserAdoptionPetDetails from '../pages/User/Adoption/UserAdoptedPetDetails'
import PetDetails from '../pages/User/Adoption/PetDetails'
import AdoptionDashboard from '../pages/User/Adoption/AdoptionDashboard'
import UserVetAppointments from '../pages/User/Veterinary/VeterinaryAppointments'
import PetCareCalendar from '../pages/User/MyOwnedPets'
import PetHealthRecords from '../pages/User/MyOwnedPets'
import PetVaccinationHistory from '../pages/User/MyOwnedPets'
import PetMedicalRecords from '../pages/User/MyOwnedPets'
import PetInsurance from '../pages/User/MyOwnedPets'
import PetShopUserDashboard from '../pages/User/PetShop/PetShopUserDashboard'
import BatchDetailsPage from '../pages/User/PetShop/BatchDetailsPage'
import StockDetail from '../pages/User/PetShop/StockDetail'
import Shop from '../pages/User/PetShop/Shop'
import PetShopUserProducts from '../pages/User/PetShop/BrowsePets'
import PetShopUserCart from '../pages/User/PetShop/Payment'
import PetShopUserCheckout from '../pages/User/PetShop/PaymentGateway'
import PetShopUserOrders from '../pages/User/PetShop/MyPurchasedPets'
import PetShopUserOrderDetails from '../pages/User/PetShop/PurchasedPetDetails'
import PetShopUserWishlist from '../pages/User/PetShop/Wishlist'
import PetShopUserReviews from '../pages/User/PetShop/MyPurchasedPets'
import PetShopUserAddress from '../pages/User/PetShop/Payment'
import PetShopUserPaymentMethods from '../pages/User/PetShop/Payment'
import PetShopUserProfile from '../pages/User/PetShop/UserPetShopDashboard'
import MyApplications from '../pages/User/PetShop/MyApplications'
import TemporaryCareUserDashboard from '../pages/User/TemporaryCare/TemporaryCareDashboard'
import SubmitTemporaryCareApplication from '../pages/User/TemporaryCare/SubmitTemporaryCareApplication'
import MyTemporaryCareApplications from '../pages/User/TemporaryCare/MyApplications'
import ApplicationPayment from '../pages/User/TemporaryCare/ApplicationPayment'
import ApplicationFeedback from '../pages/User/TemporaryCare/ApplicationFeedback'
import TemporaryCareUserBookings from '../pages/User/TemporaryCare/TemporaryCare'
import TemporaryCareUserCaregivers from '../pages/User/TemporaryCare/TemporaryCare'
import TemporaryCareUserFacilities from '../pages/User/TemporaryCare/TemporaryCare'
import TemporaryCareUserBookingForm from '../pages/User/TemporaryCare/RequestForm'
import TemporaryCareUserBookingDetails from '../pages/User/TemporaryCare/TemporaryCareDetails'
import TemporaryCareUserPets from '../pages/User/TemporaryCare/TemporaryCare'
import TemporaryCareUserReviews from '../pages/User/TemporaryCare/TemporaryCare'
import TemporaryCareUserPayments from '../pages/User/TemporaryCare/Payment'
import EcommerceHome from '../pages/User/EcommerceHome'
import Shop from '../pages/User/Shop'
import ProductDetail from '../pages/User/ProductDetail'
import EcommerceUserCart from '../pages/User/Ecommerce/Cart'
import EcommerceUserCheckout from '../pages/User/Ecommerce/Checkout'
import EcommerceUserOrders from '../pages/User/Ecommerce/Orders'
import EcommerceUserProfile from '../pages/User/Profile'
import PharmacyUserDashboard from '../pages/User/Pharmacy/PharmacyDashboard'
import PharmacyUserMedications from '../pages/User/Pharmacy/Pharmacy'
import PharmacyUserPrescriptions from '../pages/User/Pharmacy/Pharmacy'
import PharmacyUserOrderHistory from '../pages/User/Pharmacy/PharmacyDashboard'
import PharmacyUserPharmacies from '../pages/User/Pharmacy/Pharmacy'
import PharmacyUserCart from '../pages/User/Pharmacy/Pharmacy'
import PharmacyUserCheckout from '../pages/User/Pharmacy/Pharmacy'
import PharmacyUserOrderDetails from '../pages/User/Pharmacy/PharmacyDashboard'

import VeterinaryUserDashboard from '../pages/User/Veterinary/VeterinaryDashboard'
import VeterinaryUserAppointments from '../pages/User/Veterinary/VeterinaryAppointments'
import VeterinaryUserSchedule from '../pages/User/Veterinary/VeterinaryDashboard'
import VeterinaryUserServices from '../pages/User/Veterinary/Veterinary'
import VeterinaryUserClinics from '../pages/User/Veterinary/Veterinary'
import VeterinaryUserBooking from '../pages/User/Veterinary/SimpleVeterinaryBooking'
import VeterinaryUserBookingForm from '../pages/User/Veterinary/VeterinaryBookAppointment'
import VeterinaryUserBookingDetails from '../pages/User/Veterinary/SimpleVeterinaryAppointmentDetails'
import VeterinaryUserMedicalRecords from '../pages/User/Veterinary/VeterinaryMedicalRecords'
import VeterinaryUserPrescriptions from '../pages/User/Veterinary/Veterinary'
import PublicUserDashboard from '../pages/User/PublicUserDashboard'

import { useAuth } from '../contexts/AuthContext'

const UserRoutes = () => {
  const { user, loading } = useAuth();
  return (
    <UserLayout>
      <Routes>
        {/* User: Dashboard */}
        <Route path="/dashboard" element={
          loading ? null : user ? <ModernUserDashboard /> : <PublicUserDashboard />
        } />
        
        {/* User: Profile */}
        <Route path="/profile" element={<UserProfile />} />
        
        {/* User: Pets */}
        <Route path="/pets" element={<UserPets />} />
        <Route path="/pets/:id" element={<UserPetDetails />} />
        <Route path="/pets/centralized/:id" element={<UserPetDetails />} />
        
        {/* User: Adoptions */}
        <Route path="/adoption/*" element={
          <Routes>
            <Route path="/" element={<AdoptionDashboard />} />
            <Route path="/applications" element={<UserAdoptionApplications />} />
            <Route path="/applications/:id" element={<UserAdoptionApplicationDetails />} />
            <Route path="/wizard/*" element={<UserAdoptionWizard />} />
            <Route path="/payment/:applicationId" element={<AdoptionApplications />} />
            <Route path="/success/:applicationId" element={<AdoptionApplications />} />
            <Route path="/history" element={<AdoptionApplications />} />
            <Route path="/pets/:id" element={<UserAdoptionPetDetails />} />
            <Route path="/detail/:id" element={<PetDetails />} />
            <Route path="/adopted" element={<AdoptionDashboard />} />
          </Routes>
        } />
        
        {/* User: Pet Care */}
        <Route path="/pet-care/*" element={
          <Routes>
            <Route path="/calendar" element={<PetCareCalendar />} />
            <Route path="/health-records" element={<PetHealthRecords />} />
            <Route path="/vaccinations" element={<PetVaccinationHistory />} />
            <Route path="/medical-records" element={<PetMedicalRecords />} />
            <Route path="/insurance" element={<PetInsurance />} />
            <Route path="/" element={<Navigate to="/user/pet-care/calendar" replace />} />
          </Routes>
        } />
        
        {/* User: Vet Services */}
        <Route path="/veterinary/*" element={
          <Routes>
            <Route path="/dashboard" element={<VeterinaryUserDashboard />} />
            <Route path="/appointments" element={<VeterinaryUserAppointments />} />
            <Route path="/appointments/schedule" element={<VeterinaryUserSchedule />} />
            <Route path="/appointments/book" element={<VeterinaryUserBooking />} />
            <Route path="/appointments/book/:clinicId" element={<VeterinaryUserBookingForm />} />
            <Route path="/appointments/:id" element={<VeterinaryUserBookingDetails />} />
            <Route path="/services" element={<VeterinaryUserServices />} />
            <Route path="/clinics" element={<VeterinaryUserClinics />} />
            <Route path="/medical-records" element={<VeterinaryUserMedicalRecords />} />
            <Route path="/prescriptions" element={<VeterinaryUserPrescriptions />} />
            <Route path="/" element={<Navigate to="/user/veterinary/dashboard" replace />} />
          </Routes>
        } />
        
        {/* User: Pet Shop */}
        <Route path="/petshop/*" element={
          <Routes>
            <Route path="/dashboard" element={<PetShopUserDashboard />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/batch/:batchId" element={<BatchDetailsPage />} />
            <Route path="/stock/:id" element={<StockDetail />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/products" element={<PetShopUserProducts />} />
            <Route path="/cart" element={<PetShopUserCart />} />
            <Route path="/checkout" element={<PetShopUserCheckout />} />
            <Route path="/orders" element={<PetShopUserOrders />} />
            <Route path="/orders/:id" element={<PetShopUserOrderDetails />} />
            <Route path="/wishlist" element={<PetShopUserWishlist />} />
            <Route path="/reviews" element={<PetShopUserReviews />} />
            <Route path="/address" element={<PetShopUserAddress />} />
            <Route path="/payment-methods" element={<PetShopUserPaymentMethods />} />
            <Route path="/profile" element={<PetShopUserProfile />} />
            <Route path="/" element={<Navigate to="/user/petshop/dashboard" replace />} />
          </Routes>
        } />
        
        {/* User: E-commerce */}
        <Route path="/ecommerce/*" element={
          <Routes>
            <Route path="/dashboard" element={<EcommerceHome />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<EcommerceUserCart />} />
            <Route path="/checkout" element={<EcommerceUserCheckout />} />
            <Route path="/orders" element={<EcommerceUserOrders />} />
            <Route path="/" element={<Navigate to="/user/ecommerce/dashboard" replace />} />
          </Routes>
        } />
        
        {/* User: Pharmacy */}
        <Route path="/pharmacy/*" element={
          <Routes>
            <Route path="/dashboard" element={<PharmacyUserDashboard />} />
            <Route path="/medications" element={<PharmacyUserMedications />} />
            <Route path="/prescriptions" element={<PharmacyUserPrescriptions />} />
            <Route path="/order-history" element={<PharmacyUserOrderHistory />} />
            <Route path="/pharmacies" element={<PharmacyUserPharmacies />} />
            <Route path="/cart" element={<PharmacyUserCart />} />
            <Route path="/checkout" element={<PharmacyUserCheckout />} />
            <Route path="/orders/:id" element={<PharmacyUserOrderDetails />} />
            <Route path="/" element={<Navigate to="/user/pharmacy/dashboard" replace />} />
          </Routes>
        } />
        
        {/* User: Temporary Care */}
        <Route path="/temporary-care/*" element={
          <Routes>
            <Route path="/dashboard" element={<TemporaryCareUserDashboard />} />
            <Route path="/apply" element={<SubmitTemporaryCareApplication />} />
            <Route path="/applications" element={<MyTemporaryCareApplications />} />
            <Route path="/applications/:id/payment" element={<ApplicationPayment />} />
            <Route path="/applications/:id/feedback" element={<ApplicationFeedback />} />
            {/* Legacy routes (backward compatibility) */}
            <Route path="/bookings" element={<TemporaryCareUserBookings />} />
            <Route path="/caregivers" element={<TemporaryCareUserCaregivers />} />
            <Route path="/facilities" element={<TemporaryCareUserFacilities />} />
            <Route path="/booking-form" element={<TemporaryCareUserBookingForm />} />
            <Route path="/booking-form/:facilityId" element={<TemporaryCareUserBookingForm />} />
            <Route path="/bookings/:id" element={<TemporaryCareUserBookingDetails />} />
            <Route path="/pets" element={<TemporaryCareUserPets />} />
            <Route path="/reviews" element={<TemporaryCareUserReviews />} />
            <Route path="/payments" element={<TemporaryCareUserPayments />} />
            <Route path="/" element={<Navigate to="/user/temporary-care/dashboard" replace />} />
          </Routes>
        } />
        
        
        
        {/* Public User Dashboard */}
        <Route path="/" element={<PublicUserDashboard />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/User/dashboard" replace />} />
      </Routes>
    </UserLayout>
  )
}

export default UserRoutes