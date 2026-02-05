import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Package, TrendingUp, AlertTriangle, RefreshCw, 
  ArrowRight, BarChart3, Calendar, Zap, Brain,
  AlertCircle, CheckCircle, Clock, ShoppingCart,
  ChevronDown, ChevronUp, ExternalLink, Activity
} from 'lucide-react';

/**
 * Inventory Predictions Dashboard
 * 
 * AI/ML-powered inventory intelligence for ecommerce managers.
 * Features:
 * - Real-time stock predictions
 * - Demand forecasting
 * - Smart restock recommendations
 * - Seasonal analysis
 */
const InventoryPredictions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mlHealthy, setMlHealthy] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [seasonalData, setSeasonalData] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('critical');

  // Load dashboard data
  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      // Check ML service health first
      const healthRes = await api.get('/ecommerce/manager/inventory/health');
      setMlHealthy(healthRes.data.mlService?.available || false);

      // Load dashboard, predictions, and seasonal data in parallel
      const [dashboardRes, predictionsRes, seasonalRes] = await Promise.all([
        api.get('/ecommerce/manager/inventory/dashboard'),
        api.get('/ecommerce/manager/inventory/predictions').catch(() => ({ data: { data: null } })),
        api.get('/ecommerce/manager/inventory/seasonal').catch(() => ({ data: { data: null } }))
      ]);

      setDashboard(dashboardRes.data.data);
      setPredictions(predictionsRes.data.data);
      setSeasonalData(seasonalRes.data.data);

      // DEBUG: Log product urgencies
      console.log('📊 PREDICTIONS DATA:', predictionsRes.data.data);
      if (predictionsRes.data.data?.products) {
        predictionsRes.data.data.products.forEach(p => {
          console.log(`Product: ${p.product_name}, Stock: ${p.available_stock}, Urgency: ${p.restock_recommendation?.urgency}`);
        });
      }

      // Check if using fallback mode (not real ML)
      if (predictionsRes.data.fallback === true || predictionsRes.data.mlService === false) {
        console.warn('⚠️ FALLBACK MODE:', predictionsRes.data.warning || predictionsRes.data.message);
        setError(predictionsRes.data.warning || '⚠️ ML Service offline - showing basic calculations only');
      }

    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError(err.response?.data?.message || 'Failed to load inventory predictions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
      none: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[urgency] || colors.none;
  };

  // Get urgency icon
  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Brain className="w-20 h-20 text-blue-600 mx-auto mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            AI Analyzing Inventory...
          </h2>
          <p className="text-gray-600 mb-6">
            Running ML predictions on your products
          </p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Categorize products by urgency - with safety checks
  const products = predictions?.products || [];
  const criticalItems = products.filter(
    p => p && p.success && p.restock_recommendation?.urgency === 'critical'
  );
  const highItems = products.filter(
    p => p && p.success && p.restock_recommendation?.urgency === 'high'
  );
  const mediumItems = products.filter(
    p => p && p.success && p.restock_recommendation?.urgency === 'medium'
  );
  const lowItems = products.filter(
    p => p && p.success && p.restock_recommendation?.urgency === 'low'
  );
  
  // Check if we have any data to show
  const hasData = products.length > 0;
  const totalAnalyzed = predictions?.total_analyzed || products.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Inventory Predictions
              </h1>
              <p className="text-gray-600">
                ML-powered stock forecasting & restock recommendations
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* ML Status Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              mlHealthy 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <Activity className="w-4 h-4" />
              {mlHealthy ? 'AI Service Active' : 'Basic Mode'}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Data Notice */}
      {dashboard && !dashboard.hasRealData && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h3 className="text-blue-900 font-semibold mb-1">Demo Mode</h3>
              <p className="text-blue-800 text-sm">
                You're viewing demonstration data. Start by adding products to your inventory to see real AI-powered predictions based on your actual sales data.
              </p>
              <Link 
                to="/manager/ecommerce/products/add"
                className="inline-flex items-center gap-2 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Add Your First Product
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error/Warning Banner */}
      {error && (
        <div className={`mb-6 rounded-lg p-4 flex items-start gap-3 ${
          error.includes('⚠️') || error.includes('FALLBACK') || error.includes('offline')
            ? 'bg-orange-50 border border-orange-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            error.includes('⚠️') || error.includes('FALLBACK') || error.includes('offline')
              ? 'text-orange-600'
              : 'text-red-600'
          }`} />
          <div className="flex-grow">
            <p className={`font-medium mb-1 ${
              error.includes('⚠️') || error.includes('FALLBACK') || error.includes('offline')
                ? 'text-orange-900'
                : 'text-red-900'
            }`}>
              {error.includes('⚠️') || error.includes('FALLBACK') 
                ? '⚠️ Using Basic Calculations (Not AI/ML)'
                : 'Error Loading Predictions'
              }
            </p>
            <p className={`text-sm ${
              error.includes('⚠️') || error.includes('FALLBACK') || error.includes('offline')
                ? 'text-orange-800'
                : 'text-red-800'
            }`}>
              {error}
            </p>
            {(error.includes('⚠️') || error.includes('FALLBACK') || error.includes('offline')) && (
              <div className="mt-2 text-sm text-orange-700">
                <strong>To get real AI/ML predictions:</strong>
                <ol className="ml-4 mt-1 list-decimal">
                  <li>Open terminal in <code className="bg-orange-100 px-1 rounded">python-ai-ml</code> folder</li>
                  <li>Run: <code className="bg-orange-100 px-1 rounded">python app.py</code></li>
                  <li>Click "Refresh" button above</li>
                </ol>
              </div>
            )}
          </div>
          <button 
            onClick={() => loadData(true)}
            className={`ml-auto px-3 py-1 rounded text-sm font-medium transition-colors ${
              error.includes('⚠️') || error.includes('FALLBACK') || error.includes('offline')
                ? 'text-orange-600 hover:bg-orange-100'
                : 'text-red-600 hover:bg-red-100'
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Urgent Actions Required */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-red-700">
                {criticalItems.length + highItems.length}
              </h3>
              <p className="text-sm text-red-600 font-medium">Urgent Restocks Needed</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-red-700">
              <span>🚨 Critical (Stock &lt; 10)</span>
              <strong>{criticalItems.length}</strong>
            </div>
            <div className="flex justify-between text-orange-700">
              <span>⚠️ High (Stock &lt; 20)</span>
              <strong>{highItems.length}</strong>
            </div>
          </div>
        </div>

        {/* Products Monitored */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {totalAnalyzed}
              </h3>
              <p className="text-sm text-gray-600 font-medium">Total Products</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>📊 Medium Priority</span>
              <strong>{mediumItems.length}</strong>
            </div>
            <div className="flex justify-between text-green-700">
              <span>✅ Healthy Stock</span>
              <strong>{lowItems.length}</strong>
            </div>
          </div>
        </div>

        {/* Restock Value */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-700">
                {[...criticalItems, ...highItems].reduce((sum, p) => sum + (p.restock_recommendation?.suggested_quantity || 0), 0)}
              </h3>
              <p className="text-sm text-blue-600 font-medium">Units to Order</p>
            </div>
          </div>
          <p className="text-xs text-blue-600">
            Recommended for critical &amp; high priority items
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      {!hasData && !error ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Inventory Data Available
          </h3>
          <p className="text-gray-600 mb-6">
            Start adding products to see AI-powered inventory predictions.
          </p>
          <Link
            to="/manager/ecommerce/products/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            Add Your First Product
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Predictions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('critical')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'critical'
                      ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Critical ({criticalItems.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('high')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'high'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    High Priority ({highItems.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('medium')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'medium'
                      ? 'text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Medium ({mediumItems.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('low')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'low'
                      ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Low ({lowItems.length})
                  </div>
                </button>
              </div>
            </div>

            {/* Product List */}
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {(activeTab === 'critical' ? criticalItems 
                : activeTab === 'high' ? highItems 
                : activeTab === 'medium' ? mediumItems
                : lowItems
              ).length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No {activeTab} priority items
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'low' 
                      ? 'No products with healthy stock levels currently.' 
                      : 'Great! Your inventory is in good shape.'}
                  </p>
                </div>
              ) : (
                (activeTab === 'critical' ? criticalItems 
                  : activeTab === 'high' ? highItems 
                  : activeTab === 'medium' ? mediumItems
                  : lowItems
                ).map((product) => (
                  <ProductPredictionCard
                    key={product.product_id}
                    product={product}
                    expanded={expandedProduct === product.product_id}
                    onToggle={() => setExpandedProduct(
                      expandedProduct === product.product_id ? null : product.product_id
                    )}
                    getUrgencyColor={getUrgencyColor}
                    getUrgencyIcon={getUrgencyIcon}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Insights & Seasonal */}
        <div className="space-y-6">
          {/* AI Model Info */}
          {predictions && hasData && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-8 h-8" />
                <h3 className="text-lg font-semibold">AI Analysis</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-100">Products Analyzed</span>
                  <span className="font-semibold">{totalAnalyzed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Success Rate</span>
                  <span className="font-semibold">
                    {predictions.summary?.analyzed_successfully 
                      ? Math.round((predictions.summary.analyzed_successfully / totalAnalyzed) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Last Updated</span>
                  <span className="font-semibold">
                    {predictions.timestamp ? new Date(predictions.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/manager/ecommerce/products"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Manage Products</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              
              <Link
                to="/manager/ecommerce/orders"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">View Orders</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              
              <button
                onClick={() => loadData(true)}
                className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">Refresh Analysis</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

/**
 * Product Prediction Card Component
 */
const ProductPredictionCard = ({ 
  product, 
  expanded, 
  onToggle, 
  getUrgencyColor,
  getUrgencyIcon 
}) => {
  const urgency = product.restock_recommendation?.urgency || 'none';
  const stockout = product.stockout_prediction;
  const restock = product.restock_recommendation;
  const velocity = product.sales_velocity;
  const forecast = product.demand_forecast;
  const modelInfo = product.model_info || {};
  
  // New features from critical fixes
  const isNewProduct = product.is_new_product || false;
  const isPerishable = product.restock_recommendation?.perishable_product || false;
  const shelfLifeWarning = product.restock_recommendation?.shelf_life_warning;
  const returnRate = velocity?.return_rate || 0;
  const priceAdjusted = forecast?.price_adjustment_applied || false;
  const priceImpact = forecast?.price_impact;

  // AI/ML Model Details
  const mlModels = modelInfo.ml_models_used || [modelInfo.algorithm || 'unknown'];
  const confidence = modelInfo.confidence || 0;
  const anomaliesDetected = modelInfo.anomalies_detected || false;
  const modelDetails = forecast?.model_details || {};

  return (
    <div className="p-4 border-l-4 hover:bg-gray-50 transition-colors" style={{borderLeftColor: urgency === 'critical' ? '#dc2626' : urgency === 'high' ? '#ea580c' : urgency === 'medium' ? '#ca8a04' : '#16a34a'}}>
      {/* Main Row */}
      <div 
        className="flex items-center gap-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Product Info */}
        <div className="flex-grow min-w-0">
          <h4 className="font-semibold text-gray-900 text-lg mb-1">
            {product.product_name}
          </h4>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Current Stock:</span>
              <strong className={`text-lg ${product.available_stock < 10 ? 'text-red-600' : product.available_stock < 20 ? 'text-orange-600' : 'text-gray-900'}`}>
                {product.available_stock} units
              </strong>
            </div>
            {restock?.suggested_quantity > 0 && (
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Recommended:</span>
                <strong className="text-lg text-blue-600">+{restock.suggested_quantity} units</strong>
              </div>
            )}
          </div>
        </div>

        {/* Action Badge */}
        <div className={`px-4 py-2 rounded-lg font-medium text-sm ${
          urgency === 'critical' ? 'bg-red-100 text-red-800' :
          urgency === 'high' ? 'bg-orange-100 text-orange-800' :
          urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {urgency === 'critical' ? '🚨 Order Now' :
           urgency === 'high' ? '⚠️ Order Soon' :
           urgency === 'medium' ? '📋 Monitor' :
           '✅ Healthy'}
        </div>

        {/* Expand Arrow */}
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {/* Recommendation Message */}
          {restock?.message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              urgency === 'critical' ? 'bg-red-50 text-red-700' :
              urgency === 'high' ? 'bg-orange-50 text-orange-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {restock.message}
            </div>
          )}
          
          {/* Stock Details Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Average Daily Sales</div>
              <div className="text-lg font-bold text-gray-900">
                {velocity?.daily_avg_30d > 0 
                  ? <>{velocity.daily_avg_30d.toFixed(1)} {velocity.prediction_source === 'category_ai' && <span className="text-xs text-purple-600">(AI)</span>}</>
                  : <span className="text-sm text-gray-500">0.0</span>
                }
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">30-Day Forecast</div>
              <div className="text-lg font-bold text-gray-900">
                {forecast?.total_demand > 0 
                  ? <>{forecast.total_demand} units {forecast.prediction_source === 'category_ai' && <span className="text-xs text-purple-600">(AI)</span>}</>
                  : <span className="text-sm text-gray-500">0 units</span>
                }
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Ideal Stock Level</div>
              <div className="text-lg font-bold text-gray-900">
                {restock?.ideal_stock_level || 30} units
              </div>
            </div>
          </div>

          {/* Why This Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Why Order {restock?.suggested_quantity || 0} Units?
            </h5>
            <ul className="text-xs text-blue-800 space-y-1 ml-5 list-disc">
              <li>Current stock ({product.available_stock}) is below safe levels</li>
              {velocity?.prediction_source === 'category_ai' ? (
                <li>AI prediction based on {velocity.category_products_analyzed || 'similar'} products in same category ({velocity.daily_avg_30d?.toFixed(1)}/day)</li>
              ) : velocity?.daily_avg_30d > 0 ? (
                <li>Based on actual sales data ({velocity.daily_avg_30d.toFixed(1)}/day)</li>
              ) : (
                <li>Conservative baseline estimate for new products</li>
              )}
              <li>Ensures 30-day supply to prevent stockouts</li>
              {restock?.safety_stock && <li>Includes safety buffer of {restock.safety_stock} units</li>}
            </ul>
          </div>

          {/* Real Sales Analytics */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
            <h5 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Purchase Analytics (Last 30 Days)
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded p-2">
                <div className="text-xs text-gray-500">Total Sold</div>
                <div className="text-lg font-bold text-gray-900">{velocity?.monthly_total || 0}</div>
                <div className="text-xs text-gray-500">units</div>
              </div>
              <div className="bg-white rounded p-2">
                <div className="text-xs text-gray-500">Weekly Average</div>
                <div className="text-lg font-bold text-gray-900">{velocity?.weekly_total || 0}</div>
                <div className="text-xs text-gray-500">units/week</div>
              </div>
              <div className="bg-white rounded p-2">
                <div className="text-xs text-gray-500">Sales Trend</div>
                <div className={`text-sm font-bold ${
                  velocity?.trend === 'increasing' ? 'text-green-600' :
                  velocity?.trend === 'decreasing' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {velocity?.trend === 'increasing' ? '📈 Up' :
                   velocity?.trend === 'decreasing' ? '📉 Down' :
                   '➡️ Stable'}
                  {velocity?.trend_percentage ? ` ${Math.abs(velocity.trend_percentage).toFixed(0)}%` : ''}
                </div>
              </div>
              <div className="bg-white rounded p-2">
                <div className="text-xs text-gray-500">Prediction Method</div>
                <div className="text-xs font-medium text-purple-700">
                  {velocity?.prediction_source === 'actual_sales' ? '✅ Real Data' :
                   velocity?.prediction_source === 'category_ai' ? '🤖 AI Estimated' :
                   '📊 Baseline'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPredictions;
