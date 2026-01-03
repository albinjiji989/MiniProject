import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import UserLayout from '../layouts/UserLayout'
import UserDashboard from '../pages/User/Dashboard'
import UserProfile from '../pages/User/Profile'
import UserPets from '../pages/User/Pets'
import UserAdoptionApplications from '../modules/users/Adoption/Applications'
import UserAdoptionApplicationDetails from '../modules/users/Adoption/ApplicationDetails'
import UserPetDetails from '../pages/User/PetDetails'
import PetAdoptionForm from '../modules/users/Adoption/AdoptionForm'
import UserAdoptionWizard from '../modules/users/Adoption/Wizard'
import AdoptionPayment from '../modules/users/Adoption/Payment'
import AdoptionSuccess from '../modules/users/Adoption/Success'
import UserAdoptionHistory from '../modules/users/Adoption/History'
import UserAdoptionPetDetails from '../modules/users/Adoption/PetDetails'
import UserVetAppointments from '../pages/User/Veterinary/VeterinaryAppointments'
import PetCareCalendar from '../pages/User/PetCare/Calendar'
import PetHealthRecords from '../pages/User/PetCare/HealthRecords'
import PetVaccinationHistory from '../pages/User/PetCare/VaccinationHistory'
import PetMedicalRecords from '../pages/User/PetCare/MedicalRecords'
import PetInsurance from '../pages/User/PetCare/Insurance'
import PetShopUserDashboard from '../modules/users/PetShop/Dashboard'
import PetShopUserProducts from '../modules/users/PetShop/Products'
import PetShopUserCart from '../modules/users/PetShop/Cart'
import PetShopUserCheckout from '../modules/users/PetShop/Checkout'
import PetShopUserOrders from '../modules/users/PetShop/Orders'
import PetShopUserOrderDetails from '../modules/users/PetShop/OrderDetails'
import PetShopUserWishlist from '../modules/users/PetShop/Wishlist'
import PetShopUserReviews from '../modules/users/PetShop/Reviews'
import PetShopUserAddress from '../modules/users/PetShop/Address'
import PetShopUserPaymentMethods from '../modules/users/PetShop/PaymentMethods'
import PetShopUserProfile from '../modules/users/PetShop/Profile'
import TemporaryCareUserDashboard from '../modules/users/TemporaryCare/Dashboard'
import TemporaryCareUserBookings from '../modules/users/TemporaryCare/Bookings'
import TemporaryCareUserCaregivers from '../modules/users/TemporaryCare/Caregivers'
import TemporaryCareUserFacilities from '../modules/users/TemporaryCare/Facilities'
import TemporaryCareUserBookingForm from '../modules/users/TemporaryCare/BookingForm'
import TemporaryCareUserBookingDetails from '../modules/users/TemporaryCare/BookingDetails'
import TemporaryCareUserPets from '../modules/users/TemporaryCare/Pets'
import TemporaryCareUserReviews from '../modules/users/TemporaryCare/Reviews'
import TemporaryCareUserPayments from '../modules/users/TemporaryCare/Payments'
import EcommerceUserDashboard from '../modules/users/Ecommerce/Dashboard'
import EcommerceUserProducts from '../modules/users/Ecommerce/Products'
import EcommerceUserCart from '../modules/users/Ecommerce/Cart'
import EcommerceUserCheckout from '../modules/users/Ecommerce/Checkout'
import EcommerceUserOrders from '../modules/users/Ecommerce/Orders'
import EcommerceUserOrderDetails from '../modules/users/Ecommerce/OrderDetails'
import EcommerceUserWishlist from '../modules/users/Ecommerce/Wishlist'
import EcommerceUserReviews from '../modules/users/Ecommerce/Reviews'
import EcommerceUserAddress from '../modules/users/Ecommerce/Address'
import EcommerceUserPaymentMethods from '../modules/users/Ecommerce/PaymentMethods'
import EcommerceUserProfile from '../modules/users/Ecommerce/Profile'
import PharmacyUserDashboard from '../modules/users/Pharmacy/Dashboard'
import PharmacyUserMedications from '../modules/users/Pharmacy/Medications'
import PharmacyUserPrescriptions from '../modules/users/Pharmacy/Prescriptions'
import PharmacyUserOrderHistory from '../modules/users/Pharmacy/OrderHistory'
import PharmacyUserPharmacies from '../modules/users/Pharmacy/Pharmacies'
import PharmacyUserCart from '../modules/users/Pharmacy/Cart'
import PharmacyUserCheckout from '../modules/users/Pharmacy/Checkout'
import PharmacyUserOrderDetails from '../modules/users/Pharmacy/OrderDetails'
import RescueUserDashboard from '../modules/users/Rescue/Dashboard'
import RescueUserPets from '../modules/users/Rescue/Pets'
import RescueUserEvents from '../modules/users/Rescue/Events'
import RescueUserVolunteer from '../modules/users/Rescue/Volunteer'
import RescueUserDonations from '../modules/users/Rescue/Donations'
import RescueUserStories from '../modules/users/Rescue/Stories'
import RescueUserAdoptionForm from '../modules/users/Rescue/AdoptionForm'
import RescueUserPetDetails from '../modules/users/Rescue/PetDetails'
import VeterinaryUserDashboard from '../modules/users/Veterinary/Dashboard'
import VeterinaryUserAppointments from '../modules/users/Veterinary/Appointments'
import VeterinaryUserSchedule from '../modules/users/Veterinary/Schedule'
import VeterinaryUserServices from '../modules/users/Veterinary/Services'
import VeterinaryUserClinics from '../modules/users/Veterinary/Clinics'
import VeterinaryUserBooking from '../modules/users/Veterinary/Booking'
import VeterinaryUserBookingForm from '../modules/users/Veterinary/BookingForm'
import VeterinaryUserBookingDetails from '../modules/users/Veterinary/BookingDetails'
import VeterinaryUserMedicalRecords from '../modules/users/Veterinary/MedicalRecords'
import VeterinaryUserPrescriptions from '../modules/users/Veterinary/Prescriptions'
import PublicUserDashboard from '../pages/User/PublicUserDashboard'

const UserRoutes = () => {
  return (
    <UserLayout>
      <Routes>
        {/* User: Dashboard */}
        <Route path="/dashboard" element={<UserDashboard />} />
        
        {/* User: Profile */}
        <Route path="/profile" element={<UserProfile />} />
        
        {/* User: Pets */}
        <Route path="/pets" element={<UserPets />} />
        <Route path="/pets/:id" element={<UserPetDetails />} />
        
        {/* User: Adoptions */}
        <Route path="/adoption/*" element={
          <Routes>
            <Route path="/applications" element={<UserAdoptionApplications />} />
            <Route path="/applications/:id" element={<UserAdoptionApplicationDetails />} />
            <Route path="/apply/:petId" element={<PetAdoptionForm />} />
            <Route path="/wizard/*" element={<UserAdoptionWizard />} />
            <Route path="/payment/:applicationId" element={<AdoptionPayment />} />
            <Route path="/success/:applicationId" element={<AdoptionSuccess />} />
            <Route path="/history" element={<UserAdoptionHistory />} />
            <Route path="/pets/:id" element={<UserAdoptionPetDetails />} />
            <Route path="/" element={<Navigate to="/user/adoption/applications" replace />} />
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
            <Route path="/dashboard" element={<EcommerceUserDashboard />} />
            <Route path="/products" element={<EcommerceUserProducts />} />
            <Route path="/cart" element={<EcommerceUserCart />} />
            <Route path="/checkout" element={<EcommerceUserCheckout />} />
            <Route path="/orders" element={<EcommerceUserOrders />} />
            <Route path="/orders/:id" element={<EcommerceUserOrderDetails />} />
            <Route path="/wishlist" element={<EcommerceUserWishlist />} />
            <Route path="/reviews" element={<EcommerceUserReviews />} />
            <Route path="/address" element={<EcommerceUserAddress />} />
            <Route path="/payment-methods" element={<EcommerceUserPaymentMethods />} />
            <Route path="/profile" element={<EcommerceUserProfile />} />
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
        
        {/* User: Rescue */}
        <Route path="/rescue/*" element={
          <Routes>
            <Route path="/dashboard" element={<RescueUserDashboard />} />
            <Route path="/pets" element={<RescueUserPets />} />
            <Route path="/events" element={<RescueUserEvents />} />
            <Route path="/volunteer" element={<RescueUserVolunteer />} />
            <Route path="/donations" element={<RescueUserDonations />} />
            <Route path="/stories" element={<RescueUserStories />} />
            <Route path="/adopt/:petId" element={<RescueUserAdoptionForm />} />
            <Route path="/pets/:id" element={<RescueUserPetDetails />} />
            <Route path="/" element={<Navigate to="/user/rescue/dashboard" replace />} />
          </Routes>
        } />
        
        {/* Public User Dashboard */}
        <Route path="/" element={<PublicUserDashboard />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserLayout>
  )
}

export default UserRoutes