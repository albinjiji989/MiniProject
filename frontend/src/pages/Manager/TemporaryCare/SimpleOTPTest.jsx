import React, { useState } from 'react';
import PickupOTPManager from './PickupOTPManager';

const SimpleOTPTest = () => {
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [selectedBooking] = useState({
    _id: 'test-booking-123',
    bookingNumber: 'TCB1710598800001',
    petId: { 
      name: 'Buddy', 
      species: 'Dog', 
      breed: 'Golden Retriever' 
    },
    userId: { 
      name: 'John Doe', 
      email: 'john@example.com', 
      phone: '+91 9876543210' 
    },
    paymentStatus: {
      final: { status: 'completed' }
    }
  });

  const handleOTPSuccess = (result) => {
    console.log('OTP Success:', result);
    alert('Pet handover completed successfully! Pet ownership restored to user.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🐾 Manager OTP Test Page
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-bold text-blue-800 mb-2">📋 Test Scenario</h2>
            <p className="text-blue-700">
              This page demonstrates the complete OTP flow that managers use after users complete final payment.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-green-800 mb-4">✅ Pet Ready for Pickup</h3>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl">🐕</span>
              </div>
              <div>
                <h4 className="font-bold text-lg">{selectedBooking.petId.name}</h4>
                <p className="text-gray-600">{selectedBooking.petId.species} • {selectedBooking.petId.breed}</p>
                <p className="text-sm text-gray-500">Owner: {selectedBooking.userId.name}</p>
                <p className="text-sm text-gray-500">Email: {selectedBooking.userId.email}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                ✅ Final Payment Completed
              </span>
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedBooking.bookingNumber}
              </span>
            </div>

            <button
              onClick={() => setOtpDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
            >
              🔐 Generate Pickup OTP & Send Email
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-yellow-800 mb-2">🔄 What Happens Next</h3>
            <ol className="text-yellow-700 space-y-1 text-sm">
              <li>1. Click the button above to open the OTP interface</li>
              <li>2. System generates 6-digit OTP and sends email to user</li>
              <li>3. User receives professional email with pickup instructions</li>
              <li>4. User arrives at center and provides OTP to manager</li>
              <li>5. Manager enters OTP in the verification dialog</li>
              <li>6. System completes handover and restores pet ownership</li>
              <li>7. Pet appears in user dashboard without temporary care banner</li>
              <li>8. Pet shows original tags (Adopted/Purchased)</li>
            </ol>
          </div>
        </div>
      </div>

      {/* OTP Manager Dialog */}
      <PickupOTPManager
        bookingId={selectedBooking._id}
        open={otpDialogOpen}
        onClose={() => setOtpDialogOpen(false)}
        onSuccess={handleOTPSuccess}
      />
    </div>
  );
};

export default SimpleOTPTest;