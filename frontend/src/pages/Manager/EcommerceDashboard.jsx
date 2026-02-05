import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ShoppingBag, Package, TrendingUp, DollarSign,
  ShoppingCart, AlertCircle, Eye, Star, Brain
} from 'lucide-react';

/**
 * Manager Ecommerce Dashboard - Overview
 */
const EcommerceDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        api.get('/ecommerce/manager/dashboard/stats'),
        api.get('/ecommerce/manager/orders?limit=5&sortBy=createdAt&sortOrder=desc'),
        api.get('/ecommerce/manager/products?inStock=false&limit=5')
      ]);

      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
      setLowStockProducts(productsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
      link: '/manager/ecommerce/products'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-green-500',
      link: '/manager/ecommerce/orders'
    },
    {
      title: 'Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      link: '/manager/ecommerce/analytics'
    },
    {
      title: 'Avg Rating',
      value: (stats?.averageRating || 0).toFixed(1),
      icon: Star,
      color: 'bg-yellow-500',
      link: '/manager/ecommerce/reviews'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ecommerce Dashboard</h1>
        <p className="text-gray-600">Manage your products, orders, and sales</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Link
          to="/manager/ecommerce/products/add"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Package className="w-8 h-8 mb-2" />
          <h3 className="font-semibold text-lg">Add Product</h3>
          <p className="text-sm text-blue-100">Create new product</p>
        </Link>

        <Link
          to="/manager/ecommerce/categories"
          className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <ShoppingBag className="w-8 h-8 mb-2" />
          <h3 className="font-semibold text-lg">Categories</h3>
          <p className="text-sm text-green-100">Manage categories</p>
        </Link>

        <Link
          to="/manager/ecommerce/orders"
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <ShoppingCart className="w-8 h-8 mb-2" />
          <h3 className="font-semibold text-lg">Orders</h3>
          <p className="text-sm text-purple-100">View all orders</p>
        </Link>

        <Link
          to="/manager/ecommerce/inventory-predictions"
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Brain className="w-8 h-8 mb-2" />
          <h3 className="font-semibold text-lg">AI Predictions</h3>
          <p className="text-sm text-indigo-100">Smart inventory</p>
        </Link>

        <Link
          to="/manager/ecommerce/analytics"
          className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <TrendingUp className="w-8 h-8 mb-2" />
          <h3 className="font-semibold text-lg">Analytics</h3>
          <p className="text-sm text-orange-100">View insights</p>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <Link
                to="/manager/ecommerce/orders"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    to={`/manager/ecommerce/orders/${order._id}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.items?.length || 0} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{order.total?.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Low Stock Products
              </h2>
              <Link
                to="/manager/ecommerce/products?inStock=false"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">All products in stock</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <Link
                    key={product._id}
                    to={`/manager/ecommerce/products/${product._id}/edit`}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-red-500 transition-colors"
                  >
                    <img
                      src={product.images?.[0]?.url || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-red-600">
                        Stock: {product.inventory?.stock || 0} units
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcommerceDashboard;
