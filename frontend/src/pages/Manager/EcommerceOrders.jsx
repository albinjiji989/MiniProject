import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Package, Search, Filter, Download, Eye, Edit, 
  TrendingUp, Clock, CheckCircle, Truck, XCircle,
  Calendar, DollarSign, ShoppingBag, AlertCircle
} from 'lucide-react';

/**
 * Manager Order Management - Professional Dashboard
 */
const EcommerceOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: 50,
        ...(filter !== 'all' && { status: filter }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await api.get(`/ecommerce/manager/orders?${params}`);
      setOrders(response.data.data || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, note = '') => {
    try {
      setUpdating(true);
      await api.patch(`/ecommerce/manager/orders/${orderId}/status`, {
        status: newStatus,
        note
      });
      alert('Order status updated successfully!');
      setShowStatusModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTracking = async (orderId, trackingData) => {
    try {
      setUpdating(true);
      await api.patch(`/ecommerce/manager/orders/${orderId}/tracking`, trackingData);
      alert('Tracking information added successfully!');
      setShowTrackingModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error adding tracking:', error);
      alert('Failed to add tracking information');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      packed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      shipped: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <Package className="w-4 h-4" />;
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">Manage and track all customer orders</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats.totalOrders || 0}
          color="#3B82F6"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₹${(stats.totalRevenue || 0).toFixed(2)}`}
          color="#10B981"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={stats.pendingOrders || 0}
          color="#F59E0B"
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={CheckCircle}
          label="Delivered"
          value={stats.deliveredOrders || 0}
          color="#059669"
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.shippingAddress?.fullName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.shippingAddress?.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
                            alt="Product"
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                        {order.items?.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        ₹{order.pricing?.total?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.payment?.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment?.method === 'cod' ? 'COD' : 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowStatusModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update Status"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowTrackingModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Add Tracking"
                        >
                          <Truck className="w-5 h-5" />
                        </button>
                        <Link
                          to={`/manager/ecommerce/orders/${order._id}`}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <StatusUpdateModal
          order={selectedOrder}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedOrder(null);
          }}
          onUpdate={handleStatusUpdate}
          updating={updating}
        />
      )}

      {/* Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <TrackingModal
          order={selectedOrder}
          onClose={() => {
            setShowTrackingModal(false);
            setSelectedOrder(null);
          }}
          onAdd={handleAddTracking}
          updating={updating}
        />
      )}
    </div>
  );
};

// Status Update Modal Component
const StatusUpdateModal = ({ order, onClose, onUpdate, updating }) => {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');

  const statusOptions = [
    { value: 'confirmed', label: 'Confirm Order', color: 'blue' },
    { value: 'processing', label: 'Start Processing', color: 'purple' },
    { value: 'packed', label: 'Mark as Packed', color: 'indigo' },
    { value: 'shipped', label: 'Mark as Shipped', color: 'cyan' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'orange' },
    { value: 'delivered', label: 'Mark as Delivered', color: 'green' },
    { value: 'cancelled', label: 'Cancel Order', color: 'red' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Update Order Status
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Order #{order.orderNumber}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this status change..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onUpdate(order._id, status, note)}
            disabled={updating}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
          <button
            onClick={onClose}
            disabled={updating}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Tracking Modal Component
const TrackingModal = ({ order, onClose, onAdd, updating }) => {
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  const carriers = [
    'BlueDart',
    'DTDC',
    'Delhivery',
    'India Post',
    'FedEx',
    'DHL',
    'Ecom Express',
    'Shadowfax',
    'Other'
  ];

  const handleSubmit = () => {
    if (!carrier || !trackingNumber) {
      alert('Please fill in all required fields');
      return;
    }
    onAdd(order._id, { carrier, trackingNumber, estimatedDelivery });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Add Tracking Information
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Order #{order.orderNumber}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carrier *
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Carrier</option>
              {carriers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Delivery Date
            </label>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={updating}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {updating ? 'Adding...' : 'Add Tracking'}
          </button>
          <button
            onClick={onClose}
            disabled={updating}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EcommerceOrders;
