import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { temporaryCareAPI } from '../../../services/api';

const Payment = () => {
  const { temporaryCareId, paymentType } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [care, setCare] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCareDetails();
  }, [temporaryCareId]);

  const loadCareDetails = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.getTemporaryCare(temporaryCareId);
      setCare(response.data.data.care);
    } catch (err) {
      setError('Failed to load care details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setError('');
      
      // Create payment order
      const orderResponse = await temporaryCareAPI.createPaymentOrder({
        temporaryCareId,
        paymentType
      });
      
      // Initialize Razorpay
      const options = {
        key: orderResponse.data.data.order.key_id,
        amount: orderResponse.data.data.order.amount,
        currency: orderResponse.data.data.order.currency,
        name: 'Temporary Care Payment',
        description: `${paymentType === 'advance' ? 'Advance' : 'Final'} payment for pet care`,
        order_id: orderResponse.data.data.order.id,
        handler: function (response) {
          // Verify payment
          temporaryCareAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }).then(() => {
            alert('Payment successful!');
            navigate('/User/temporary-care');
          }).catch(() => {
            alert('Payment verification failed');
          });
        },
        prefill: {
          name: 'Pet Owner',
          email: '',
        },
        theme: {
          color: '#5b8cff'
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!care) {
    return <div className="p-6">Care record not found</div>;
  }

  const amount = paymentType === 'advance' ? care.advanceAmount : care.finalAmount;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Make Payment</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Pet:</span>
            <span>{care.pet?.name || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Care Period:</span>
            <span>{new Date(care.startDate).toLocaleDateString()} - {new Date(care.endDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Payment Type:</span>
            <span className="capitalize">{paymentType} Payment</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Amount:</span>
            <span className="text-lg font-bold">₹{amount}</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={handlePayment}
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
        >
          {processing ? 'Processing...' : `Pay ₹${amount}`}
        </button>
        
        <button
          onClick={() => navigate('/User/temporary-care')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Payment;