import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, CreditCard, ShoppingBag, Home } from 'lucide-react';

/**
 * Order Success Page - Flipkart Style
 */
const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { order } = location.state || {};

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center max-w-md">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-600 mb-6">Unable to load order details</p>
          <button
            onClick={() => navigate('/user/ecommerce/shop')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg">
            <span className="font-semibold">Order ID:</span>
            <span className="font-mono">{order.orderNumber || order._id}</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </h2>
              <div className="text-gray-700">
                <p className="font-medium">{order.shippingAddress?.addressLine1 || order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                <p>{order.shippingAddress?.pincode}</p>
                <p className="mt-2 text-sm text-gray-600">
                  Expected delivery: 5-7 business days
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
                      alt={item.product?.name || 'Product'}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {item.product?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Quantity: {item.quantity}
                      </p>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">
                    {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Payment Status:</span>
                  <span className={`font-medium ${
                    order.payment?.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.payment?.status === 'completed' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.payment?.transactionId && (
                  <div className="flex justify-between text-gray-700">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-sm">{order.payment.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{order.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={order.pricing?.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {order.pricing?.shipping === 0 ? 'FREE' : `₹${order.pricing?.shipping?.toFixed(2) || '0.00'}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST)</span>
                  <span>₹{order.pricing?.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Paid</span>
                    <span>₹{order.pricing?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  to="/user/ecommerce/orders"
                  className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 text-center"
                >
                  View All Orders
                </Link>
                <Link
                  to="/user/ecommerce/shop"
                  className="block w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 text-center"
                >
                  Continue Shopping
                </Link>
                <Link
                  to="/user/dashboard"
                  className="flex items-center justify-center gap-2 w-full text-gray-600 py-2 hover:text-gray-900"
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">Need Help?</h3>
                <p className="text-sm text-blue-800 mb-2">
                  Contact our support team for any queries about your order.
                </p>
                <a
                  href="mailto:support@petcare.com"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  support@petcare.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
