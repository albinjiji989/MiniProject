import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, Clock, CheckCircle, XCircle, Activity,
  Search, Filter, Eye, UserCheck, Plus
} from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, scheduleRes, bookingsRes, staffRes] = await Promise.all([
        api.get('/api/temporary-care/manager/dashboard-stats'),
        api.get('/api/temporary-care/manager/schedule/today'),
        api.get('/api/temporary-care/manager/bookings-new'),
        api.get('/api/temporary-care/manager/staff/available')
      ]);

      setStats(statsRes.data.data);
      setTodaySchedule(scheduleRes.data.data);
      setBookings(bookingsRes.data.data);
      setAvailableStaff(staffRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDropOffOTP = async (bookingId) => {
    try {
      const response = await api.post(`/api/temporary-care/manager/bookings-new/${bookingId}/dropoff/generate-otp`);
      const { otp } = response.data.data;
      alert(`Drop-off OTP generated: ${otp}\nShare this with the customer.`);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate OTP');
    }
  };

  const verifyDropOffOTP = async (bookingId) => {
    const otp = prompt('Enter the OTP provided by customer:');
    if (!otp) return;

    try {
      await api.post(`/api/temporary-care/manager/bookings-new/${bookingId}/dropoff/verify`, { otp });
      alert('Pet checked in successfully!');
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP');
    }
  };

  const generatePickupOTP = async (bookingId) => {
    try {
      const response = await api.post(`/api/temporary-care/manager/bookings-new/${bookingId}/pickup/generate-otp`);
      const { otp } = response.data.data;
      alert(`Pickup OTP generated: ${otp}\nShare this with the customer.`);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate OTP');
    }
  };

  const verifyPickupOTP = async (bookingId) => {
    const otp = prompt('Enter the OTP provided by customer:');
    if (!otp) return;

    try {
      await api.post(`/api/temporary-care/manager/bookings-new/${bookingId}/pickup/verify`, { otp });
      alert('Pet checked out successfully!');
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP');
    }
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Temporary Care Manager</h1>
          <p className="text-gray-600 mt-2">Manage bookings and operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Check-ins</p>
                <p className="text-3xl font-bold mt-1">{stats?.today?.checkIns || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Check-outs</p>
                <p className="text-3xl font-bold mt-1">{stats?.today?.checkOuts || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Occupancy</p>
                <p className="text-3xl font-bold mt-1">{stats?.today?.currentOccupancy || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Staff</p>
                <p className="text-3xl font-bold mt-1">{stats?.staff?.available || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Today's Schedule</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Check-ins */}
              <div>
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Check-ins ({todaySchedule?.checkIns?.length || 0})
                </h3>
                <div className="space-y-3">
                  {todaySchedule?.checkIns?.map((booking) => (
                    <div key={booking._id} className="bg-blue-50 rounded-lg p-4">
                      <p className="font-medium">{booking.petId?.name}</p>
                      <p className="text-sm text-gray-600">{booking.userId?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(booking.startDate).toLocaleTimeString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {!booking.handover?.dropOff?.otp?.code && (
                          <button
                            onClick={() => generateDropOffOTP(booking._id)}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Generate OTP
                          </button>
                        )}
                        {booking.handover?.dropOff?.otp?.code && !booking.handover?.dropOff?.otp?.verified && (
                          <button
                            onClick={() => verifyDropOffOTP(booking._id)}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Verify Check-in
                          </button>
                        )}
                        {booking.handover?.dropOff?.otp?.verified && (
                          <span className="text-xs text-green-600 font-medium">✓ Checked In</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!todaySchedule?.checkIns || todaySchedule.checkIns.length === 0) && (
                    <p className="text-gray-400 text-sm">No check-ins scheduled</p>
                  )}
                </div>
              </div>

              {/* Ongoing */}
              <div>
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Ongoing ({todaySchedule?.ongoing?.length || 0})
                </h3>
                <div className="space-y-3">
                  {todaySchedule?.ongoing?.map((booking) => (
                    <div key={booking._id} className="bg-green-50 rounded-lg p-4">
                      <p className="font-medium">{booking.petId?.name}</p>
                      <p className="text-sm text-gray-600">{booking.userId?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Until {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => navigate(`/manager/temporary-care/bookings/${booking._id}`)}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                  {(!todaySchedule?.ongoing || todaySchedule.ongoing.length === 0) && (
                    <p className="text-gray-400 text-sm">No ongoing bookings</p>
                  )}
                </div>
              </div>

              {/* Check-outs */}
              <div>
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                  Check-outs ({todaySchedule?.checkOuts?.length || 0})
                </h3>
                <div className="space-y-3">
                  {todaySchedule?.checkOuts?.map((booking) => (
                    <div key={booking._id} className="bg-purple-50 rounded-lg p-4">
                      <p className="font-medium">{booking.petId?.name}</p>
                      <p className="text-sm text-gray-600">{booking.userId?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(booking.endDate).toLocaleTimeString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {!booking.handover?.pickup?.otp?.code && (
                          <button
                            onClick={() => generatePickupOTP(booking._id)}
                            className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                          >
                            Generate OTP
                          </button>
                        )}
                        {booking.handover?.pickup?.otp?.code && !booking.handover?.pickup?.otp?.verified && (
                          <button
                            onClick={() => verifyPickupOTP(booking._id)}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Verify Check-out
                          </button>
                        )}
                        {booking.handover?.pickup?.otp?.verified && (
                          <span className="text-xs text-green-600 font-medium">✓ Checked Out</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!todaySchedule?.checkOuts || todaySchedule.checkOuts.length === 0) && (
                    <p className="text-gray-400 text-sm">No check-outs scheduled</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Staff */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Available Staff</h2>
            <span className="text-sm text-gray-500">{availableStaff.length} available</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStaff.map((staff) => (
                <div key={staff._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {staff.userId?.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{staff.userId?.name}</p>
                      <p className="text-xs text-gray-500">{staff.experience?.years || 0} years exp</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium">
                        {staff.performance?.averageRating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
