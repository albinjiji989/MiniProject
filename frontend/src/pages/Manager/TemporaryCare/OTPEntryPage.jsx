import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const OTPEntryPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadApplicationDetails();
  }, [applicationId]);

  const loadApplicationDetails = async () => {
    try {
      const response = await api.get(`/temporary-care/manager/applications/${applicationId}`);
      setApplication(response.data.data.application);
    } catch (error) {
      setError('Failed to load application details');
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify the pickup OTP
      await api.post('/temporary-care/user/otp/verify-pickup-application', {
        temporaryCareId: applicationId,
        otp: otp
      });

      setSuccess('✅ Pet successfully returned to owner! The temporary care banner has been removed and the pet is now back with the owner.');
      
      // Redirect back to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/manager/temporary-care/dashboard');
      }, 3000);

    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP. Please ask the pet owner to check their email and provide the correct OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/temporary-care/manager/applications/${applicationId}/pickup/resend-otp`);
      
      const otpData = response.data.data;
      setSuccess(`✅ Pickup OTP resent to ${application?.userId?.email}! New OTP: ${otpData.otp}`);
      setError('');
    } catch (error) {
      setError('Failed to resend OTP: ' + (error.response?.data?.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pet Pickup OTP</h1>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit OTP provided by the pet owner
          </p>
        </div>

        {application && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Application Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Pet:</span> {application.pets?.[0]?.petDetails?.name || 'Unknown'}</p>
              <p><span className="font-medium">Owner:</span> {application.userId?.name}</p>
              <p><span className="font-medium">Email:</span> {application.userId?.email}</p>
              <p><span className="font-medium">Phone:</span> {application.userId?.phone}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleOTPSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              maxLength={6}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ask the pet owner for the 6-digit OTP they received via email
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button
              type="button"
              onClick={resendOTP}
              disabled={loading}
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Resend
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/manager/temporary-care/dashboard')}
            className="w-full text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Instructions:</strong> The pet owner should have received an OTP via email when you generated the pickup OTP. Ask them to provide this 6-digit code to complete the pet handover process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPEntryPage;