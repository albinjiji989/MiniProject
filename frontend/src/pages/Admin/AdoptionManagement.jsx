import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from '../../components/Admin/AdminPageHeader';
import AdminStatCard from '../../components/Admin/AdminStatCard';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { apiClient } from '../../services/api';

const AdoptionManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [adoptions, setAdoptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, adoptionsRes, paymentsRes, analyticsRes] = await Promise.all([
        apiClient.get('/adoption/admin/stats'),
        apiClient.get('/adoption/admin/adoptions'),
        apiClient.get('/adoption/admin/payments'),
        apiClient.get('/adoption/admin/analytics')
      ]);

      setStats(statsRes.data.data);
      setAdoptions(adoptionsRes.data.data.adoptions);
      setPayments(paymentsRes.data.data.payments);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Error fetching adoption data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      payment_pending: 'bg-blue-100 text-blue-800',
      payment_completed: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Adoption Management"
        subtitle="Manage adoption system, view analytics, and monitor payments"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Total Pets"
          value={stats?.overview?.totalPets || 0}
          icon="🐾"
          color="blue"
        />
        <AdminStatCard
          title="Available Pets"
          value={stats?.overview?.availablePets || 0}
          icon="🏠"
          color="green"
        />
        <AdminStatCard
          title="Adopted Pets"
          value={stats?.overview?.adoptedPets || 0}
          icon="✅"
          color="purple"
        />
        <AdminStatCard
          title="Total Revenue"
          value={formatCurrency(stats?.overview?.totalRevenue || 0)}
          icon="💰"
          color="yellow"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'adoptions', name: 'Adoptions', icon: '📋' },
              { id: 'payments', name: 'Payments', icon: '💳' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Applications</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats?.overview?.totalApplications || 0}</p>
                  <p className="text-sm text-blue-700">Total Applications</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900">Pending</h3>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.overview?.pendingApplications || 0}</p>
                  <p className="text-sm text-yellow-700">Pending Review</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">Completed</h3>
                  <p className="text-3xl font-bold text-green-600">{stats?.overview?.completedAdoptions || 0}</p>
                  <p className="text-sm text-green-700">Successful Adoptions</p>
                </div>
              </div>

              {/* Monthly Stats Chart */}
              {stats?.monthlyStats && stats.monthlyStats.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Monthly Adoption Trends</h3>
                  <div className="space-y-2">
                    {stats.monthlyStats.map((stat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {new Date(stat._id.year, stat._id.month - 1).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">{stat.count} adoptions</span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(stat.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Adoptions Tab */}
          {activeTab === 'adoptions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">All Adoption Applications</h3>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reviewed By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adoptions.map((adoption) => (
                      <tr key={adoption._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{adoption.userId?.name}</div>
                            <div className="text-sm text-gray-500">{adoption.userId?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{adoption.petId?.name}</div>
                            <div className="text-sm text-gray-500">{adoption.petId?.breed}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(adoption.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(adoption.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {adoption.reviewedBy?.name || 'Not reviewed'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment Reports</h3>
                <div className="text-lg font-semibold text-green-600">
                  Total Revenue: {formatCurrency(payments.reduce((sum, payment) => sum + (payment.paymentDetails?.amount || 0), 0))}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payment.userId?.name}</div>
                            <div className="text-sm text-gray-500">{payment.userId?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payment.petId?.name}</div>
                            <div className="text-sm text-gray-500">{payment.petId?.breed}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(payment.paymentDetails?.amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentDetails?.paymentDate 
                            ? new Date(payment.paymentDetails.paymentDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paymentDetails?.transactionId || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Link to Detailed Analytics */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Advanced Analytics Dashboard</h3>
                    <p className="text-blue-100">
                      Get comprehensive insights with interactive charts, manager performance metrics, and detailed reports.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/adoption-analytics')}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    View Full Analytics →
                  </button>
                </div>
              </div>
              {/* Breed Popularity */}
              {analytics.breedStats && analytics.breedStats.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Most Popular Breeds</h3>
                  <div className="space-y-2">
                    {analytics.breedStats.map((breed, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{breed._id}</span>
                        <span className="text-sm text-gray-600">{breed.count} adoptions</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Distribution */}
              {analytics.ageStats && analytics.ageStats.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
                  <div className="space-y-2">
                    {analytics.ageStats.map((age, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{age._id}</span>
                        <span className="text-sm text-gray-600">{age.count} pets</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Status Distribution */}
              {analytics.applicationStats && analytics.applicationStats.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Application Status Distribution</h3>
                  <div className="space-y-2">
                    {analytics.applicationStats.map((status, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{status._id.replace('_', ' ').toUpperCase()}</span>
                        <span className="text-sm text-gray-600">{status.count} applications</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdoptionManagement;
