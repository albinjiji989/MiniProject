import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { CreditCard, Wallet, Banknote, Shield, CheckCircle } from 'lucide-react';

/**
 * Payment Page - Razorpay Integration (Flipkart Style)
 */
const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, userDetails, summary, isBuyNow } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!items || !userDetails || !summary) {
      navigate('/user/ecommerce/checkout');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleOnlinePayment = async () => {
    try {
      setProcessing(true);

      // Create payment order
      const orderResponse = await api.post('/ecommerce/orders/payment/create', {
        items,
        shippingAddress: userDetails.address,
        amount: summary.total
      });

      const { orderId, amount, currency, key } = orderResponse.data.data;

      // Razorpay options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Pet Care Platform',
        description: 'Order Payment',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment and create order
            const verifyResponse = await api.post('/ecommerce/orders/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items,
              shippingAddress: {
                name: userDetails.name,
                phone: userDetails.phone,
                street: userDetails.address.street,
                city: userDetails.address.city,
                state: userDetails.address.state,
                pincode: userDetails.address.pincode,
                country: userDetails.address.country || 'India'
              },
              paymentMethod: 'online',
              amount: summary.total,
              isBuyNow
            });

            const order = verifyResponse.data.data;

            // Navigate to success page
            navigate('/user/ecommerce/order-success', {
              state: { order }
            });
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone
        },
        notes: {
          address: `${userDetails.address.street}, ${userDetails.address.city}`
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  const handleCODPayment = async () => {
    try {
      setProcessing(true);

      // Create COD order
      const response = await api.post('/ecommerce/orders/cod', {
        items,
        shippingAddress: {
          name: userDetails.name,
          phone: userDetails.phone,
          street: userDetails.address.street,
          city: userDetails.address.city,
          state: userDetails.address.state,
          pincode: userDetails.address.pincode,
          country: userDetails.address.country || 'India'
        },
        isBuyNow
      });

      const order = response.data.data;

      // Navigate to success page
      navigate('/user/ecommerce/order-success', {
        state: { order }
      });
    } catch (error) {
      console.error('Error creating COD order:', error);
      alert('Failed to place order. Please try again.');
      setProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'online') {
      handleOnlinePayment();
    } else {
      handleCODPayment();
    }
  };

  if (!items || !userDetails || !summary) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600">Choose your payment method</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Payment Method</h2>

              <div className="space-y-4">
                {/* Online Payment */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'online'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">Online Payment</span>
                      <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay securely using Credit/Debit Card, UPI, Net Banking, or Wallets
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4" />
                      <span className="text-xs text-gray-500">Powered by Razorpay</span>
                    </div>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Cash on Delivery</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay with cash when your order is delivered
                    </p>
                  </div>
                </label>
              </div>

              {/* Security Info */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Safe & Secure Payments</h3>
                    <p className="text-sm text-green-800">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({items.length})</span>
                  <span>₹{summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={summary.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {summary.shipping === 0 ? 'FREE' : `₹${summary.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST 18%)</span>
                  <span>₹{summary.tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>₹{summary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Delivering to:</h3>
                <p className="text-sm text-gray-700">{userDetails.name}</p>
                <p className="text-sm text-gray-600">
                  {userDetails.address.street}, {userDetails.address.city}
                </p>
                <p className="text-sm text-gray-600">
                  {userDetails.address.state} - {userDetails.address.pincode}
                </p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  processing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  `Place Order - ₹${summary.total.toFixed(2)}`
                )}
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                By placing your order, you agree to our Terms & Conditions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
