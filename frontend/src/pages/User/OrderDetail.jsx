import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Package, MapPin, CreditCard, Truck, CheckCircle, 
  Clock, XCircle, ArrowLeft, Download, Phone, Mail, RefreshCw 
} from 'lucide-react';

/**
 * Order Detail Page with Timeline - Flipkart Style
 */
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: '',
    trackingNumber: '',
    estimatedDelivery: ''
  });
  
  // Detect if we're in manager or user context
  const isManager = window.location.pathname.includes('/manager/');
  const apiPath = isManager ? '/ecommerce/manager/orders' : '/ecommerce/orders';
  const backPath = isManager ? '/manager/ecommerce/orders' : '/user/ecommerce/orders';

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiPath}/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to load order details');
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      await api.post(`${apiPath}/${id}/cancel`, {
        reason: 'Customer request'
      });
      alert('Order cancelled successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      confirmed: 'text-blue-600 bg-blue-50',
      processing: 'text-purple-600 bg-purple-50',
      packed: 'text-indigo-600 bg-indigo-50',
      shipped: 'text-cyan-600 bg-cyan-50',
      out_for_delivery: 'text-orange-600 bg-orange-50',
      delivered: 'text-green-600 bg-green-50',
      cancelled: 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status, isCompleted) => {
    if (isCompleted) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
    
    const icons = {
      pending: <Clock className="w-6 h-6 text-yellow-600" />,
      confirmed: <CheckCircle className="w-6 h-6 text-blue-600" />,
      processing: <Package className="w-6 h-6 text-purple-600" />,
      packed: <Package className="w-6 h-6 text-indigo-600" />,
      shipped: <Truck className="w-6 h-6 text-cyan-600" />,
      out_for_delivery: <Truck className="w-6 h-6 text-orange-600" />,
      delivered: <CheckCircle className="w-6 h-6 text-green-600" />,
      cancelled: <XCircle className="w-6 h-6 text-red-600" />
    };
    return icons[status] || <Clock className="w-6 h-6 text-gray-600" />;
  };

  const canCancelOrder = () => {
    return order && ['pending', 'confirmed'].includes(order.status);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`${apiPath}/${id}/status`, {
        status: newStatus,
        note: statusNote || undefined
      });
      alert('Order status updated successfully');
      setNewStatus('');
      setStatusNote('');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!trackingInfo.carrier || !trackingInfo.trackingNumber) {
      alert('Please provide carrier and tracking number');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`${apiPath}/${id}/tracking`, trackingInfo);
      alert('Tracking information updated successfully');
      setTrackingInfo({ carrier: '', trackingNumber: '', estimatedDelivery: '' });
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating tracking:', error);
      alert(error.response?.data?.message || 'Failed to update tracking');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatuses = () => {
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['packed', 'cancelled'],
      packed: ['shipped'],
      shipped: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return statusFlow[order?.status] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'packed', label: 'Packed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Manager Status Update Section */}
        {isManager && order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Update Order Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Update */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Change Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select status...</option>
                      {getNextStatuses().map(status => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (Optional)
                    </label>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add a note about this status change..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || !newStatus}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Status'
                    )}
                  </button>
                </div>
              </div>

              {/* Tracking Update */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Add Tracking Info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carrier
                    </label>
                    <input
                      type="text"
                      value={trackingInfo.carrier}
                      onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                      placeholder="e.g., Blue Dart, Delhivery"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingInfo.trackingNumber}
                      onChange={(e) => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                      placeholder="Enter tracking number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Est. Delivery (Optional)
                    </label>
                    <input
                      type="date"
                      value={trackingInfo.estimatedDelivery}
                      onChange={(e) => setTrackingInfo({...trackingInfo, estimatedDelivery: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={handleTrackingUpdate}
                    disabled={updating || !trackingInfo.carrier || !trackingInfo.trackingNumber}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4" />
                        Add Tracking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            {order.status !== 'cancelled' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Timeline</h2>
                
                <div className="relative">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const historyItem = order.statusHistory?.find(h => h.status === step.key);
                    
                    return (
                      <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                        {/* Timeline Line */}
                        {index < statusSteps.length - 1 && (
                          <div className={`absolute left-3 top-10 w-0.5 h-16 ${
                            isCompleted ? 'bg-green-600' : 'bg-gray-200'
                          }`} style={{ marginTop: '-8px' }} />
                        )}
                        
                        {/* Icon */}
                        <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-50' : 'bg-gray-100'
                        }`}>
                          {getStatusIcon(step.key, isCompleted && !isCurrent)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <h3 className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </h3>
                          {historyItem && (
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(historyItem.timestamp).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                          {historyItem?.note && (
                            <p className="text-sm text-gray-500 mt-1">{historyItem.note}</p>
                          )}
                          {!isCompleted && index === currentStepIndex + 1 && (
                            <p className="text-sm text-gray-500 mt-1">Expected soon</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Info */}
                {order.shipping?.trackingNumber && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Tracking Information</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-800">
                        <span className="font-medium">Carrier:</span> {order.shipping.carrier}
                      </p>
                      <p className="text-blue-800">
                        <span className="font-medium">Tracking Number:</span> {order.shipping.trackingNumber}
                      </p>
                      {order.shipping.estimatedDelivery && (
                        <p className="text-blue-800">
                          <span className="font-medium">Expected Delivery:</span>{' '}
                          {new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cancelled Status */}
            {order.status === 'cancelled' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <XCircle className="w-8 h-8" />
                  <h2 className="text-xl font-semibold">Order Cancelled</h2>
                </div>
                {order.cancellation?.reason && (
                  <p className="text-gray-600">Reason: {order.cancellation.reason}</p>
                )}
                {order.cancellation?.cancelledAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Cancelled on {new Date(order.cancellation.cancelledAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
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
                        ₹{item.total?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
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
                    <span>Total</span>
                    <span>₹{order.pricing?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </h3>
                <p className="text-sm text-gray-700">{order.shippingAddress?.fullName}</p>
                <p className="text-sm text-gray-600">{order.shippingAddress?.addressLine1}</p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
                <p className="text-sm text-gray-600">{order.shippingAddress?.pincode}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <Phone className="w-3 h-3 inline mr-1" />
                  {order.shippingAddress?.phone}
                </p>
              </div>

              {/* Payment Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment
                </h3>
                <p className="text-sm text-gray-700 capitalize">
                  {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </p>
                <p className={`text-sm font-medium mt-1 ${
                  order.payment?.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.payment?.status === 'completed' ? 'Paid' : 'Pending'}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {!isManager && canCancelOrder() && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
                
                <button className="w-full bg-white border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>

                {!isManager && (
                  <Link
                    to="/user/ecommerce/shop"
                    className="block w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-center"
                  >
                    Continue Shopping
                  </Link>
                )}
              </div>

              {/* Help */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">Need Help?</h3>
                <p className="text-sm text-blue-800 mb-2">
                  Contact our support team for any queries.
                </p>
                <a
                  href="mailto:support@petcare.com"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" />
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

export default OrderDetail;
