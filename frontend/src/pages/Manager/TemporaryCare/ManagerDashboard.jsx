import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Activity
} from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import PickupOTPManager from './PickupOTPManager';

const ManagerDashboard = () => {

  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {

      setLoading(true);

      const [statsRes, scheduleRes, bookingsRes, staffRes] = await Promise.all([
        api.get('/temporary-care/manager/dashboard-stats'),
        api.get('/temporary-care/manager/schedule/today'),
        api.get('/temporary-care/manager/bookings-new'),
        api.get('/temporary-care/manager/staff/available')
      ]);

      setStats(statsRes.data.data);
      setTodaySchedule(scheduleRes.data.data);
      setBookings(bookingsRes.data.data);
      setAvailableStaff(staffRes.data.data);

      console.log('🔍 Today Schedule Data:', scheduleRes.data.data);
      console.log('🔍 CheckOuts data:', scheduleRes.data.data?.checkOuts);
      console.log('🔍 CheckOuts with final payment:', scheduleRes.data.data?.checkOuts?.filter(b => b.paymentStatus?.final?.status === "completed"));

    } catch (error) {

      console.error("Dashboard Error:", error);

    } finally {

      setLoading(false);

    }
  };



  const generateDropOffOTP = async (bookingId) => {

    try {

      const response = await api.post(`/temporary-care/manager/bookings-new/${bookingId}/dropoff/generate-otp`);

      alert(`Drop-off OTP generated: ${response.data.data.otp}`);

      fetchDashboardData();

    } catch (error) {

      alert("OTP generation failed");

    }

  };



  const verifyDropOffOTP = async (bookingId) => {

    const otp = prompt("Enter OTP");

    if (!otp) return;

    try {

      await api.post(`/temporary-care/manager/bookings-new/${bookingId}/dropoff/verify`, { otp });

      alert("Pet checked in");

      fetchDashboardData();

    } catch (error) {

      alert("Invalid OTP");

    }

  };



  const generatePickupOTP = async (booking) => {
    console.log('🔍 generatePickupOTP called with booking:', booking);
    console.log('🔍 Final payment status:', booking.paymentStatus?.final?.status);
    console.log('🔍 Is from application:', booking.isFromApplication);
    
    if (booking.paymentStatus?.final?.status !== "completed") {
      alert("Final payment not completed");
      return;
    }
    
    try {
      let response;
      
      if (booking.isFromApplication) {
        // For TemporaryCareApplication system, generate OTP and send to user
        response = await api.post(`/temporary-care/manager/applications/${booking._id}/pickup/generate-otp`);
        
        // Show success message with OTP details
        const otpData = response.data.data;
        const message = `✅ Pickup OTP Generated Successfully!

📧 Email sent to: ${booking.userId?.email}
🔢 OTP: ${otpData.otp}
⏰ Expires: ${new Date(otpData.expiresAt).toLocaleString()}

The pet owner will receive this OTP via email. Redirecting to OTP entry page...`;
        
        alert(message);
        
        // Navigate to OTP entry page
        navigate(`/manager/temporary-care/otp-entry/${booking._id}`);
      } else {
        // For CareBooking system, use the professional dialog
        setSelectedBooking(booking);
        setOtpDialogOpen(true);
      }
    } catch (error) {
      alert('❌ Failed to generate OTP: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const resendPickupOTP = async (booking) => {
    try {
      let response;
      if (booking.isFromApplication) {
        // Use application-specific resend route
        response = await api.post(`/temporary-care/manager/applications/${booking._id}/pickup/resend-otp`);
      } else {
        // Use booking-specific resend route
        response = await api.post(`/temporary-care/manager/bookings-new/${booking._id}/pickup/resend-otp`);
      }
      
      const otpData = response.data.data;
      const message = `✅ Pickup OTP Resent Successfully!

📧 Email sent to: ${booking.userId?.email}
🔢 OTP: ${otpData.otp}
⏰ Expires: ${new Date(otpData.expiresAt).toLocaleString()}
🔄 ${otpData.isResend ? 'Existing OTP resent' : 'New OTP generated'}

The pet owner should receive the OTP in their email shortly.`;
      
      alert(message);
    } catch (error) {
      alert('❌ Failed to resend OTP: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const viewApplicationDetails = (booking) => {
    if (booking.isFromApplication) {
      // Navigate to detailed application view
      navigate(`/manager/temporary-care/applications/${booking._id}`);
    } else {
      // Navigate to booking details
      navigate(`/manager/temporary-care/bookings/${booking._id}`);
    }
  };



  const handleOTPSuccess = () => {

    fetchDashboardData();
    setSelectedBooking(null);

  };



  if (loading) {

    return (
      <div className="flex items-center justify-center h-screen">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

      </div>
    );

  }



  return (

    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Temporary Care Manager
        </h1>



        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          <div className="bg-white p-6 rounded shadow">
            <p className="text-sm text-gray-500">Check-ins</p>
            <p className="text-3xl font-bold">{stats?.today?.checkIns || 0}</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-sm text-gray-500">Check-outs</p>
            <p className="text-3xl font-bold">{stats?.today?.checkOuts || 0}</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-sm text-gray-500">Occupancy</p>
            <p className="text-3xl font-bold">{stats?.today?.currentOccupancy || 0}</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-sm text-gray-500">Available Staff</p>
            <p className="text-3xl font-bold">{stats?.staff?.available || 0}</p>
          </div>

        </div>



        {/* Today's Schedule */}

        <div className="bg-white rounded shadow p-6 mb-8">

          <h2 className="text-xl font-semibold mb-4">
            Today's Schedule
          </h2>



          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">



            {/* Checkins */}

            <div>

              <h3 className="font-medium mb-3">
                Check-ins ({todaySchedule?.checkIns?.length || 0})
              </h3>

              {todaySchedule?.checkIns?.map((booking) => (

                <div key={booking._id} className="bg-blue-50 p-3 rounded mb-2">

                  <p className="font-medium">
                    {booking.petId?.name}
                  </p>

                  <p className="text-sm text-gray-600">
                    {booking.userId?.name}
                  </p>

                  {!booking.handover?.dropOff?.otp?.code && (

                    <button
                      onClick={() => generateDropOffOTP(booking._id)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded mt-2"
                    >
                      Generate OTP
                    </button>

                  )}

                  {booking.handover?.dropOff?.otp?.code && !booking.handover?.dropOff?.otp?.verified && (

                    <button
                      onClick={() => verifyDropOffOTP(booking._id)}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded mt-2"
                    >
                      Verify OTP
                    </button>

                  )}

                </div>

              ))}

            </div>



            <div>

              <h3 className="font-medium mb-3">
                Ready for Pickup ({todaySchedule?.checkOuts?.filter(b => b.paymentStatus?.final?.status === "completed")?.length || 0})
              </h3>

              {/* Debug info for checkout applications */}
              {todaySchedule?.checkOuts && todaySchedule.checkOuts.length > 0 && (
                <div className="mb-2 text-xs text-gray-500">
                  Total checkout items: {todaySchedule.checkOuts.length} | 
                  Final payment completed: {todaySchedule.checkOuts.filter(b => b.paymentStatus?.final?.status === "completed").length}
                </div>
              )}

              {/* Show message if no checkOuts at all */}
              {(!todaySchedule?.checkOuts || todaySchedule.checkOuts.length === 0) && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  No checkout applications found today.
                </div>
              )}

              {todaySchedule?.checkOuts
                ?.filter(b => b.paymentStatus?.final?.status === "completed")
                ?.map((booking) => (

                  <div key={booking._id} className="bg-orange-50 p-3 rounded mb-2">

                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {booking.petId?.name}
                        </p>

                        <p className="text-sm text-gray-600">
                          {booking.userId?.name}
                        </p>
                        
                        {booking.isFromApplication && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Application System
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => viewApplicationDetails(booking)}
                        className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                      >
                        View Details
                      </button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {!booking.handover?.pickup?.otp?.code && !booking.handover?.pickup?.otp && (

                        <button
                          onClick={() => generatePickupOTP(booking)}
                          className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                        >
                          Generate Pickup OTP
                        </button>

                      )}

                      {((booking.handover?.pickup?.otp?.code && !booking.handover?.pickup?.otp?.verified) || 
                        (booking.handover?.pickup?.otp && !booking.handover?.pickup?.otpUsed)) && (

                        <>
                          <button
                            onClick={() => generatePickupOTP(booking)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Enter OTP
                          </button>
                          
                          <button
                            onClick={() => resendPickupOTP(booking)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Resend OTP
                          </button>
                        </>

                      )}

                      {((booking.handover?.pickup?.otp?.verified) || 
                        (booking.handover?.pickup?.otpUsed)) && (

                        <span className="text-xs text-green-600 font-medium">
                          ✅ Completed
                        </span>

                      )}
                    </div>

                  </div>

                ))}

              {/* Show all checkout items for debugging */}
              {todaySchedule?.checkOuts && todaySchedule.checkOuts.length > 0 && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">Debug: All Checkout Items</summary>
                  <div className="mt-2 space-y-1">
                    {todaySchedule.checkOuts.map((booking, index) => (
                      <div key={booking._id} className="text-xs bg-gray-100 p-2 rounded">
                        <p><strong>#{index + 1}</strong> {booking.bookingNumber}</p>
                        <p>Pet: {booking.petId?.name || 'Unknown'}</p>
                        <p>User: {booking.userId?.name || 'Unknown'}</p>
                        <p>Final Payment: {booking.paymentStatus?.final?.status || 'pending'}</p>
                        <p>From Application: {booking.isFromApplication ? 'Yes' : 'No'}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

            </div>



          </div>

        </div>



        {/* Debug Section */}
        {/* Staff */}

        <div className="bg-white rounded shadow p-6">

          <h2 className="text-xl font-semibold mb-4">
            Available Staff
          </h2>

          <div className="grid grid-cols-3 gap-4">

            {availableStaff.map((staff) => (

              <div key={staff._id} className="border p-4 rounded">

                <p className="font-medium">
                  {staff.userId?.name}
                </p>

                <p className="text-sm text-gray-500">
                  {staff.experience?.years || 0} years exp
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>



      {/* OTP Dialog */}

      <PickupOTPManager
        bookingId={selectedBooking?._id}
        open={otpDialogOpen}
        onClose={() => {

          setOtpDialogOpen(false);
          setSelectedBooking(null);

        }}
        onSuccess={handleOTPSuccess}
      />

    </div>

  );

};

export default ManagerDashboard;