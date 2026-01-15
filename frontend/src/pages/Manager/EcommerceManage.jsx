import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Package, ShoppingCart, BarChart } from 'lucide-react';

const EcommerceManage = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Ecommerce Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/manager/ecommerce/products" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <Package className="w-12 h-12 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Products</h2>
          <p className="text-gray-600">Manage your product catalog</p>
        </Link>

        <Link to="/manager/ecommerce/orders" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <ShoppingCart className="w-12 h-12 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Orders</h2>
          <p className="text-gray-600">View and manage orders</p>
        </Link>

        <Link to="/manager/ecommerce/dashboard" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <BarChart className="w-12 h-12 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <p className="text-gray-600">View sales analytics</p>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow">
          <Settings className="w-12 h-12 text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p className="text-gray-600">Configure ecommerce settings</p>
        </div>
      </div>
    </div>
  );
};

export default EcommerceManage;
