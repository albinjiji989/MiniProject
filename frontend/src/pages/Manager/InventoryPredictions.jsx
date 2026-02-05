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

      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => loadData()}
            className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">
            {dashboard?.summary?.totalProducts || 0}
          </h3>
          <p className="text-gray-600 text-sm mt-1">Products Tracked</p>
        </div>

        {/* Critical Stock */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-red-600 font-medium">Critical</span>
          </div>
          <h3 className="text-3xl font-bold text-red-600">
            {predictions?.critical_items ?? criticalItems.length}
          </h3>
          <p className="text-gray-600 text-sm mt-1">Need Immediate Restock</p>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-orange-600 font-medium">High Priority</span>
          </div>
          <h3 className="text-3xl font-bold text-orange-600">
            {predictions?.high_priority_items ?? highItems.length}
          </h3>
          <p className="text-gray-600 text-sm mt-1">Restock This Week</p>
        </div>

        {/* Healthy Stock */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">Healthy</span>
          </div>
          <h3 className="text-3xl font-bold text-green-600">
            {dashboard?.summary?.healthyStock || 0}
          </h3>
          <p className="text-gray-600 text-sm mt-1">Adequate Stock</p>
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
              </div>
            </div>

            {/* Product List */}
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {(activeTab === 'critical' ? criticalItems 
                : activeTab === 'high' ? highItems 
                : mediumItems
              ).length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No {activeTab} priority items
                  </h3>
                  <p className="text-gray-600">
                    Great! Your inventory is in good shape.
                  </p>
                </div>
              ) : (
                (activeTab === 'critical' ? criticalItems 
                  : activeTab === 'high' ? highItems 
                  : mediumItems
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

          {/* Seasonal Analysis */}
          {seasonalData && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Seasonal Insights</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-600">Current Season</span>
                  <span className="font-semibold text-purple-700 capitalize">
                    {seasonalData.seasonal_analysis?.current_season || 'Normal'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Demand Factor</span>
                  <span className={`font-semibold ${
                    (seasonalData.seasonal_analysis?.combined_adjustment_factor || 1) > 1
                      ? 'text-green-600'
                      : 'text-gray-700'
                  }`}>
                    {((seasonalData.seasonal_analysis?.combined_adjustment_factor || 1) * 100).toFixed(0)}%
                  </span>
                </div>

                {seasonalData.event_impact?.has_event && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 font-medium mb-1">
                      <Zap className="w-4 h-4" />
                      {seasonalData.event_impact.event_name}
                    </div>
                    <p className="text-sm text-yellow-700">
                      {seasonalData.event_impact.recommendation}
                    </p>
                  </div>
                )}
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
  
  // New features from critical fixes
  const isNewProduct = product.is_new_product || false;
  const isPerishable = product.restock_recommendation?.perishable_product || false;
  const shelfLifeWarning = product.restock_recommendation?.shelf_life_warning;
  const returnRate = velocity?.return_rate || 0;
  const priceAdjusted = forecast?.price_adjustment_applied || false;
  const priceImpact = forecast?.price_impact;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      {/* Main Row */}
      <div 
        className="flex items-center gap-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Urgency Icon */}
        <div className="flex-shrink-0">
          {getUrgencyIcon(urgency)}
        </div>

        {/* Product Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate">
              {product.product_name}
            </h4>
            {/* Badges for new features */}
            {isNewProduct && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                NEW
              </span>
            )}
            {isPerishable && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                ⏳ PERISHABLE
              </span>
            )}
            {priceAdjusted && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                💰 PRICE ADJUSTED
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span>Stock: <strong className={product.available_stock < 10 ? 'text-red-600' : 'text-gray-900'}>
              {product.available_stock}
            </strong></span>
            <span>Daily Avg: <strong>{velocity?.daily_avg_30d?.toFixed(1) || 0}</strong></span>
            {returnRate > 0 && (
              <span className="text-orange-600">Return: <strong>{returnRate.toFixed(1)}%</strong></span>
            )}
          </div>
        </div>

        {/* Days Until Stockout */}
        <div className="text-right flex-shrink-0">
          {stockout?.days_until_stockout ? (
            <div className={`text-lg font-bold ${
              stockout.days_until_stockout <= 3 ? 'text-red-600' 
                : stockout.days_until_stockout <= 7 ? 'text-orange-600'
                : 'text-gray-900'
            }`}>
              {Math.round(stockout.days_until_stockout)}d
            </div>
          ) : (
            <div className="text-gray-400">--</div>
          )}
          <div className="text-xs text-gray-500">until stockout</div>
        </div>

        {/* Expand Arrow */}
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* Shelf Life Warning */}
          {shelfLifeWarning && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                Perishable Product Warning
              </div>
              <p className="text-sm text-yellow-700">{shelfLifeWarning}</p>
            </div>
          )}
          
          {/* Price Impact Notice */}
          {priceImpact?.has_recent_change && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-800 font-medium mb-1">
                <TrendingUp className="w-4 h-4" />
                Price Change Detected
              </div>
              <p className="text-sm text-purple-700">{priceImpact.message}</p>
            </div>
          )}
          
          {/* New Product Notice */}
          {isNewProduct && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                <Activity className="w-4 h-4" />
                New Product
              </div>
              <p className="text-sm text-blue-700">
                Predictions based on category average. Accuracy will improve with more sales data.
              </p>
            </div>
          )}
          
          {/* Insights */}
          {product.insights && product.insights.length > 0 && (
            <div className="space-y-2">
              {product.insights.map((insight, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    insight.severity === 'critical' ? 'bg-red-50 text-red-800' 
                      : insight.severity === 'high' ? 'bg-orange-50 text-orange-800'
                      : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  <span className="mr-2">{insight.icon}</span>
                  <strong>{insight.title}:</strong> {insight.message}
                </div>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {restock?.suggested_quantity || 0}
              </div>
              <div className="text-xs text-gray-500">Suggested Restock</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {velocity?.weekly_total || 0}
              </div>
              <div className="text-xs text-gray-500">Weekly Sales</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {forecast?.total_demand || 0}
              </div>
              <div className="text-xs text-gray-500">30-Day Forecast</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {forecast?.accuracy_score || 0}%
              </div>
              <div className="text-xs text-gray-500">AI Confidence</div>
            </div>
          </div>

          {/* AI Model Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Model: {forecast?.model_used || 'N/A'}
            </span>
            <span>
              Analyzed: {new Date(product.analyzed_at).toLocaleString()}
            </span>
          </div>

          {/* Action Button */}
          {product.product_id && !product.product_id.toString().startsWith('demo') ? (
            <Link
              to={`/manager/ecommerce/products/${product.product_id}/edit`}
              className="flex items-center justify-center gap-2 w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="w-4 h-4" />
              Update Inventory
              <ExternalLink className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/manager/ecommerce/products/add"
              className="flex items-center justify-center gap-2 w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Package className="w-4 h-4" />
              Add Real Product
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPredictions;
