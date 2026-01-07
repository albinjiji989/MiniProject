import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, DollarSign, Package, TrendingUp, Activity,
  PlusCircle, Search, Filter, Download, Eye, Edit, Trash2
} from 'lucide-react';
import api from '../../services/api';

const TemporaryCareAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, servicesRes, staffRes, bookingsRes] = await Promise.all([
        api.get('/api/temporary-care/admin/bookings/stats'),
        api.get('/api/temporary-care/admin/service-types'),
        api.get('/api/temporary-care/admin/staff'),
        api.get('/api/temporary-care/admin/bookings')
      ]);
      
      setStats(statsRes.data.data);
      setServiceTypes(servicesRes.data.data);
      setStaff(staffRes.data.data);
      setBookings(bookingsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, trend, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Temporary Care Management</h1>
          <p className="text-gray-600 mt-2">Manage services, staff, and bookings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            title="Total Bookings"
            value={stats?.overview?.totalBookings || 0}
            trend={12}
            color="bg-blue-500"
          />
          <StatCard
            icon={Activity}
            title="In Progress"
            value={stats?.overview?.inProgress || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={Users}
            title="Active Staff"
            value={staff.filter(s => s.availability?.status === 'available').length || 0}
            color="bg-purple-500"
          />
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={`₹${(stats?.overview?.totalRevenue || 0).toLocaleString()}`}
            trend={8}
            color="bg-orange-500"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'services', 'staff', 'bookings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'services' && <ServicesTab services={serviceTypes} onRefresh={fetchDashboardData} />}
            {activeTab === 'staff' && <StaffTab staff={staff} onRefresh={fetchDashboardData} />}
            {activeTab === 'bookings' && <BookingsTab bookings={bookings} onRefresh={fetchDashboardData} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Category Distribution */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Bookings by Category</h3>
        <div className="space-y-3">
          {stats?.byCategory?.map((cat) => (
            <div key={cat._id} className="flex items-center justify-between">
              <span className="text-gray-700 capitalize">{cat._id}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(cat.count / stats.overview.totalBookings) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Advance Collected</span>
            <span className="font-semibold text-green-600">
              ₹{(stats?.overview?.advanceCollected || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Pending Payments</span>
            <span className="font-semibold text-orange-600">
              {stats?.overview?.pendingPayment || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Completed</span>
            <span className="font-semibold text-blue-600">
              {stats?.overview?.completed || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Services Tab Component
const ServicesTab = ({ services, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/api/temporary-care/admin/service-types/${id}`);
      onRefresh();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert(error.response?.data?.message || 'Failed to delete service');
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/api/temporary-care/admin/service-types/${id}/toggle-status`);
      onRefresh();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Service Types</h2>
        <button
          onClick={() => {
            setEditingService(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {service.code}
                </span>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {service.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Category:</span>
              <span className="text-sm font-medium capitalize">{service.category}</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Base Price:</span>
              <span className="text-lg font-bold text-blue-600">
                ₹{service.pricing.basePrice}
                <span className="text-xs text-gray-500">/{service.pricing.priceUnit.replace('_', ' ')}</span>
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingService(service);
                  setShowModal(true);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => toggleStatus(service._id)}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
              >
                {service.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(service._id)}
                className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No services added yet</p>
        </div>
      )}
    </div>
  );
};

// Staff Tab Component
const StaffTab = ({ staff, onRefresh }) => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Care Staff</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
        <PlusCircle className="w-4 h-4" />
        Add Staff
      </button>
    </div>

    <div className="bg-white rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {staff.map((member) => (
            <tr key={member._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {member.userId?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{member.userId?.name}</div>
                    <div className="text-sm text-gray-500">{member.userId?.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  member.availability?.status === 'available' 
                    ? 'bg-green-100 text-green-800'
                    : member.availability?.status === 'busy'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.availability?.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.experience?.years || 0} years
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.performance?.totalBookings || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {member.performance?.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-yellow-400 ml-1">★</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 mr-3">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  <Edit className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Bookings Tab Component
const BookingsTab = ({ bookings, onRefresh }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Bookings</h2>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search bookings..."
            className="px-4 py-2 border rounded-lg"
          />
          <button className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {booking.bookingNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.petId?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.userId?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.serviceType?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{booking.pricing?.totalAmount?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TemporaryCareAdminDashboard;
