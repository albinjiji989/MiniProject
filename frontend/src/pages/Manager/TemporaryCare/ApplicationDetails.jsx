import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import api from '../../../services/api';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/temporary-care/manager/applications/${id}`);
      setApplication(response.data.data);
    } catch (error) {
      console.error('Error fetching application details:', error);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const generatePickupOTP = async () => {
    try {
      const response = await api.post(`/temporary-care/manager/applications/${id}/pickup/generate-otp`);
      const otpData = response.data.data;
      
      const message = `✅ Pickup OTP Generated Successfully!

📧 Email sent to: ${application.userId?.email}
🔢 OTP: ${otpData.otp}
⏰ Expires: ${new Date(otpData.expiresAt).toLocaleString()}

The pet owner will receive this OTP via email and should provide it to you when they arrive for pickup.`;
      
      alert(message);
      fetchApplicationDetails(); // Refresh data
    } catch (error) {
      alert('❌ Failed to generate OTP: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const resendPickupOTP = async () => {
    try {
      const response = await api.post(`/temporary-care/manager/applications/${id}/pickup/resend-otp`);
      const otpData = response.data.data;
      
      const message = `✅ Pickup OTP Resent Successfully!

📧 Email sent to: ${application.userId?.email}
🔢 OTP: ${otpData.otp}
⏰ Expires: ${new Date(otpData.expiresAt).toLocaleString()}
🔄 ${otpData.isResend ? 'Existing OTP resent' : 'New OTP generated'}

The pet owner should receive the OTP in their email shortly.`;
      
      alert(message);
    } catch (error) {
      alert('❌ Failed to resend OTP: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const verifyPickupOTP = async () => {
    const otp = prompt('Please enter the 6-digit OTP provided by the pet owner:');
    if (otp && otp.length === 6) {
      try {
        await api.post(`/temporary-care/manager/applications/${id}/pickup/verify`, { otp });
        alert('✅ Pet successfully returned to owner!\n\nThe temporary care has been completed and the pet is now back with the owner.');
        fetchApplicationDetails(); // Refresh data
      } catch (error) {
        alert('❌ Invalid OTP: ' + (error.response?.data?.message || 'Please ask the pet owner to check their email and provide the correct OTP.'));
      }
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const colors = {
      'submitted': 'bg-yellow-100 text-yellow-800',
      'price_determined': 'bg-blue-100 text-blue-800',
      'advance_paid': 'bg-purple-100 text-purple-800',
      'approved': 'bg-green-100 text-green-800',
      'active_care': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <span className="text-yellow-800">Application not found</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/manager/temporary-care/dashboard')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Application Details</h1>
              <p className="text-gray-600">{application.applicationNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
              {application.status ? application.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
            </span>
            <button
              onClick={fetchApplicationDetails}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pet Owner Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Pet Owner Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{application.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {application.userId?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {application.userId?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pet Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Pet Information</h2>
              
              <div className="space-y-4">
                {application.pets?.map((pet, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pet ID</label>
                        <p className="text-gray-900 font-mono">{pet.petId}</p>
                      </div>
                      {pet.specialInstructions && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">Special Instructions</label>
                          <div className="mt-1 space-y-2">
                            {pet.specialInstructions.food && (
                              <p className="text-sm"><strong>Food:</strong> {pet.specialInstructions.food}</p>
                            )}
                            {pet.specialInstructions.medicine && (
                              <p className="text-sm"><strong>Medicine:</strong> {pet.specialInstructions.medicine}</p>
                            )}
                            {pet.specialInstructions.behavior && (
                              <p className="text-sm"><strong>Behavior:</strong> {pet.specialInstructions.behavior}</p>
                            )}
                            {pet.specialInstructions.allergies && (
                              <p className="text-sm"><strong>Allergies:</strong> {pet.specialInstructions.allergies}</p>
                            )}
                            {pet.specialInstructions.otherNotes && (
                              <p className="text-sm"><strong>Other Notes:</strong> {pet.specialInstructions.otherNotes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Care Duration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Care Duration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900">{new Date(application.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-gray-900">{new Date(application.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-gray-900">{application.numberOfDays} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Status
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Advance Payment</label>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-sm ${getPaymentStatusColor(application.paymentStatus?.advance?.status)}`}>
                      {application.paymentStatus?.advance?.status?.toUpperCase() || 'PENDING'}
                    </span>
                    {application.paymentStatus?.advance?.paidAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(application.paymentStatus.advance.paidAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Final Payment</label>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-sm ${getPaymentStatusColor(application.paymentStatus?.final?.status)}`}>
                      {application.paymentStatus?.final?.status?.toUpperCase() || 'PENDING'}
                    </span>
                    {application.paymentStatus?.final?.paidAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(application.paymentStatus.final.paidAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {application.pricing?.totalAmount && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Amount</span>
                      <span className="font-semibold">₹{application.pricing.totalAmount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pickup OTP Management */}
            {application.paymentStatus?.final?.status === 'completed' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Pickup Management
                </h2>
                
                <div className="space-y-3">
                  {!application.handover?.pickup?.otp && (
                    <button
                      onClick={generatePickupOTP}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Generate Pickup OTP
                    </button>
                  )}
                  
                  {application.handover?.pickup?.otp && !application.handover?.pickup?.otpUsed && (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">OTP Generated</span>
                          <span className="text-lg font-mono font-bold text-green-900">
                            {application.handover.pickup.otp}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Expires: {new Date(application.handover.pickup.otpExpiresAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={verifyPickupOTP}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Enter OTP from Owner
                      </button>
                      
                      <button
                        onClick={resendPickupOTP}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Resend OTP
                      </button>
                    </>
                  )}
                  
                  {application.handover?.pickup?.otpUsed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Pet Successfully Returned</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Completed: {new Date(application.handover.pickup.otpUsedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Timeline</h2>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-gray-500">{new Date(application.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {application.pricing?.pricingDeterminedAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Pricing Determined</p>
                      <p className="text-gray-500">{new Date(application.pricing.pricingDeterminedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {application.paymentStatus?.advance?.paidAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Advance Payment Completed</p>
                      <p className="text-gray-500">{new Date(application.paymentStatus.advance.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {application.approvedAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Application Approved</p>
                      <p className="text-gray-500">{new Date(application.approvedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {application.paymentStatus?.final?.paidAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Final Payment Completed</p>
                      <p className="text-gray-500">{new Date(application.paymentStatus.final.paidAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {application.handover?.pickup?.otpUsedAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium">Pet Returned to Owner</p>
                      <p className="text-gray-500">{new Date(application.handover.pickup.otpUsedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;