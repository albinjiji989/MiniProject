/**
 * Inventory Prediction Controller
 * 
 * API endpoints for AI/ML-powered inventory predictions.
 * Integrates with Python ML service for intelligent analysis.
 */

const InventoryMLService = require('../services/inventoryMLService');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Get AI predictions for a single product
 * 
 * GET /api/ecommerce/manager/inventory/predict/:productId
 */
exports.getProductPrediction = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId, leadTime = 7, save = false } = req.query;

    // Verify product exists and belongs to user
    const product = await Product.findById(productId).select('name seller storeId hasVariants variants');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate variant if provided
    if (variantId && product.hasVariants) {
      const variantExists = product.variants?.some(v => v._id.toString() === variantId);
      if (!variantExists) {
        return res.status(404).json({
          success: false,
          message: 'Variant not found'
        });
      }
    }

    // Call ML service
    const result = await InventoryMLService.analyzeProduct(productId, {
      variantId: variantId,
      leadTime: parseInt(leadTime),
      save: save === 'true'
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      // Return fallback data if ML service unavailable
      res.json({
        success: true,
        data: await this._getFallbackAnalysis(productId),
        fallback: true,
        message: result.error || 'Using fallback analysis'
      });
    }
  } catch (error) {
    console.error('Error in getProductPrediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting predictions',
      error: error.message
    });
  }
};

/**
 * Get AI predictions for all products
 * 
 * GET /api/ecommerce/manager/inventory/predictions
 */
exports.getAllPredictions = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const sellerId = req.user.id;
    const { save = false } = req.query;

    console.log(`[Inventory Predictions] Analyzing products for user ${sellerId}, storeId: ${storeId}`);

    const result = await InventoryMLService.analyzeAllProducts(storeId, save === 'true');

    if (result.success) {
      console.log(`✅ [Inventory Predictions] ML service SUCCESS - returned ${result.data?.total_analyzed || 0} products`);
      return res.json({
        success: true,
        data: result.data,
        mlService: true,
        message: 'Real AI/ML predictions'
      });
    }

    console.log('⚠️ [Inventory Predictions] ML service FAILED:', result.error);
    
    // Fallback: Get products from DB and create mock predictions
    const products = await Product.find({ 
      seller: sellerId, 
      status: { $in: ['active', 'out_of_stock'] } 
    })
      .select('name inventory pricing')
      .limit(50)
      .lean();

    console.log(`[Inventory Predictions] Found ${products.length} products in database`);

    // ⚠️ FALLBACK: Generate basic predictions from database (NOT using ML)
    console.warn('⚠️ Using FALLBACK mode - predictions are basic calculations, NOT real AI/ML');
    
    const mockProducts = products.length > 0 ? products.map(p => {
      const availStock = (p.inventory?.stock || 0) - (p.inventory?.reserved || 0);
      const urgency = availStock < 10 ? 'critical' : availStock < 20 ? 'high' : availStock < 40 ? 'medium' : 'low';
      
      // Simple calculations based on current stock only
      const dailyAvg = Math.max(1, availStock / 30); // Rough estimate
      const daysUntilStockout = availStock > 0 ? Math.floor(availStock / dailyAvg) : 0;
      
      return {
        product_id: p._id,
        product_name: p.name,
        current_stock: p.inventory?.stock || 0,
        available_stock: availStock,
        success: true,
        sales_velocity: {
          daily_avg_30d: dailyAvg,
          weekly_total: Math.floor(dailyAvg * 7),
          monthly_total: Math.floor(dailyAvg * 30),
          return_rate: 0
        },
        stockout_prediction: {
          days_until_stockout: daysUntilStockout,
          confidence_score: 50, // Low confidence for basic calc
          urgency: urgency
        },
        restock_recommendation: {
          suggested_quantity: Math.floor(dailyAvg * 30), // 30 days worth
          urgency: urgency,
          message: urgency === 'critical' 
            ? '⚠️ BASIC CALCULATION - Start Python ML service for accurate predictions' 
            : 'Basic calculation - ML service offline',
          perishable_product: false
        },
        demand_forecast: {
          next_7_days: Math.floor(dailyAvg * 7),
          next_30_days: Math.floor(dailyAvg * 30),
          total_demand: Math.floor(dailyAvg * 30),
          accuracy_score: 50, // Low accuracy warning
          model_used: 'Simple Division (Fallback)',
          price_adjustment_applied: false
        },
        is_new_product: false,
        analyzed_at: new Date().toISOString(),
        model_info: {
          version: '0.0.1',
          algorithm: 'fallback_basic_calc',
          confidence: 50,
          data_points_used: 0,
          ml_models_used: ['none'],
          anomalies_detected: false
        },
        insights: [{
          severity: 'warning',
          icon: '⚠️',
          title: 'ML Service Offline',
          message: 'These are basic calculations only. Start Python ML service for real AI predictions.'
        }]
      };
    }) : exports._generateDemoProducts();

    console.log(`[Inventory Predictions] Generated ${mockProducts.length} predictions`);

    const responseData = {
      total_analyzed: mockProducts.length,
      critical_items: mockProducts.filter(p => p.restock_recommendation?.urgency === 'critical').length,
      high_priority_items: mockProducts.filter(p => p.restock_recommendation?.urgency === 'high').length,
      products: mockProducts,
      summary: {
        analyzed_successfully: mockProducts.length,
        failed_analyses: 0
      },
      timestamp: new Date().toISOString(),
      fallback: true
    };

    res.json({
      success: true,
      data: responseData,
      fallback: true,
      mlService: false,
      warning: '⚠️ ML SERVICE OFFLINE - Showing basic calculations only. Start Python service for real AI predictions.',
      message: products.length > 0 
        ? '⚠️ FALLBACK: Basic calculations from database (NOT AI/ML)' 
        : '⚠️ DEMO DATA: No products found and ML service offline'
    });
  } catch (error) {
    console.error('Error in getAllPredictions:', error);
    // Return demo data even on complete failure
    const demoProducts = exports._generateDemoProducts();
    res.json({
      success: true,
      data: {
        total_analyzed: demoProducts.length,
        critical_items: demoProducts.filter(p => p.restock_recommendation?.urgency === 'critical').length,
        high_priority_items: demoProducts.filter(p => p.restock_recommendation?.urgency === 'high').length,
        products: demoProducts,
        summary: {
          analyzed_successfully: demoProducts.length,
          failed_analyses: 0
        },
        timestamp: new Date().toISOString(),
        fallback: true
      },
      fallback: true,
      message: 'Using demo data due to error',
      error: error.message
    });
  }
};

/**
 * Get critical items needing restock
 * 
 * GET /api/ecommerce/manager/inventory/critical
 */
exports.getCriticalItems = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { limit = 20 } = req.query;

    const result = await InventoryMLService.getCriticalItems(storeId, parseInt(limit));

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      // Fallback: Get low stock items from DB directly
      const lowStockItems = await Product.find({
        seller: req.user.id,
        status: 'active',
        $expr: {
          $lte: [
            { $subtract: ['$inventory.stock', '$inventory.reserved'] },
            '$inventory.lowStockThreshold'
          ]
        }
      })
        .select('name inventory pricing status')
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: {
          count: lowStockItems.length,
          items: lowStockItems.map(p => ({
            product_id: p._id,
            product_name: p.name,
            current_stock: p.inventory?.stock || 0,
            available_stock: (p.inventory?.stock || 0) - (p.inventory?.reserved || 0),
            low_threshold: p.inventory?.lowStockThreshold || 10,
            restock_recommendation: {
              urgency: 'high',
              message: 'Stock below threshold'
            }
          }))
        },
        fallback: true,
        message: 'Using database fallback'
      });
    }
  } catch (error) {
    console.error('Error in getCriticalItems:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting critical items',
      error: error.message
    });
  }
};

/**
 * Get restock report
 * 
 * GET /api/ecommerce/manager/inventory/restock-report
 */
exports.getRestockReport = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    const result = await InventoryMLService.getRestockReport(storeId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'ML Service unavailable',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getRestockReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
};

/**
 * Get demand forecast for a product
 * 
 * GET /api/ecommerce/manager/inventory/forecast/:productId
 */
exports.getDemandForecast = async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30, method = 'auto' } = req.query;

    // Verify product ownership
    const product = await Product.findById(productId).select('seller');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await InventoryMLService.getDemandForecast(
      productId,
      parseInt(days),
      method
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Forecast unavailable',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getDemandForecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting forecast',
      error: error.message
    });
  }
};

/**
 * Get seasonal analysis
 * 
 * GET /api/ecommerce/manager/inventory/seasonal
 */
exports.getSeasonalAnalysis = async (req, res) => {
  try {
    const result = await InventoryMLService.getSeasonalAnalysis();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      // Return comprehensive seasonal info as fallback
      const month = new Date().getMonth() + 1;
      const day = new Date().getDate();
      let season = 'normal';
      let factor = 1.0;
      let eventInfo = null;
      
      if ([3, 4, 5].includes(month)) {
        season = 'spring';
        factor = 1.1;
      } else if ([6, 7, 8].includes(month)) {
        season = 'summer';
        factor = 1.15;
      } else if ([9, 10, 11].includes(month)) {
        season = 'fall';
        factor = 1.2;
      } else {
        season = 'winter';
        factor = 1.05;
      }

      // Check for major events
      if (month === 11 || month === 12) {
        eventInfo = {
          has_event: true,
          event_name: 'Holiday Season',
          event_impact: 1.3,
          recommendation: 'Increase inventory by 30% for holiday demand surge'
        };
      } else if (month === 2 && day >= 10 && day <= 16) {
        eventInfo = {
          has_event: true,
          event_name: 'Valentine\'s Day',
          event_impact: 1.15,
          recommendation: 'Stock up on pet gifts and accessories'
        };
      }

      res.json({
        success: true,
        data: {
          seasonal_analysis: {
            current_season: season,
            combined_adjustment_factor: factor,
            message: `Current ${season} season with ${Math.round(factor * 100)}% demand factor`
          },
          event_impact: eventInfo || {
            has_event: false
          },
          timestamp: new Date().toISOString()
        },
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error in getSeasonalAnalysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting seasonal analysis',
      error: error.message
    });
  }
};

/**
 * Get sales velocity for a product
 * 
 * GET /api/ecommerce/manager/inventory/velocity/:productId
 */
exports.getSalesVelocity = async (req, res) => {
  try {
    const { productId } = req.params;

    // Verify product ownership
    const product = await Product.findById(productId).select('seller name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.seller?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await InventoryMLService.getSalesVelocity(productId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      // Calculate basic velocity from orders
      const velocity = await this._calculateBasicVelocity(productId);
      res.json({
        success: true,
        data: velocity,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error in getSalesVelocity:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating velocity',
      error: error.message
    });
  }
};

/**
 * Get dashboard stats for inventory intelligence
 * 
 * GET /api/ecommerce/manager/inventory/dashboard
 */
exports.getInventoryDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get product counts
    const [totalProducts, lowStockCount, outOfStockCount] = await Promise.all([
      Product.countDocuments({ seller: sellerId, status: { $in: ['active', 'out_of_stock'] } }),
      Product.countDocuments({
        seller: sellerId,
        status: 'active',
        $expr: {
          $lte: [
            { $subtract: ['$inventory.stock', '$inventory.reserved'] },
            '$inventory.lowStockThreshold'
          ]
        }
      }),
      Product.countDocuments({ seller: sellerId, status: 'out_of_stock' })
    ]);

    console.log(`[Inventory Dashboard] User ${sellerId}: ${totalProducts} products, ${lowStockCount} low stock`);

    // Try to get ML predictions
    let mlData = null;
    const mlResult = await InventoryMLService.getCriticalItems(req.user.storeId, 5);
    
    if (mlResult.success) {
      mlData = mlResult.data;
      console.log(`[Inventory Dashboard] ML data available: ${mlData?.items?.length || 0} critical items`);
    } else {
      console.log('[Inventory Dashboard] ML service unavailable, using fallback');
    }

    // Provide meaningful data even if no products exist
    const summary = {
      totalProducts: totalProducts > 0 ? totalProducts : 12,
      lowStockCount: totalProducts > 0 ? lowStockCount : 3,
      outOfStockCount: totalProducts > 0 ? outOfStockCount : 1,
      healthyStock: totalProducts > 0 ? (totalProducts - lowStockCount - outOfStockCount) : 8
    };

    res.json({
      success: true,
      data: {
        summary,
        criticalItems: mlData?.items || [],
        mlServiceAvailable: mlResult.success,
        lastUpdated: new Date().toISOString(),
        hasRealData: totalProducts > 0
      }
    });
  } catch (error) {
    console.error('Error in getInventoryDashboard:', error);
    // Return safe fallback even on error
    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: 12,
          lowStockCount: 3,
          outOfStockCount: 1,
          healthyStock: 8
        },
        criticalItems: [],
        mlServiceAvailable: false,
        lastUpdated: new Date().toISOString(),
        hasRealData: false,
        error: error.message
      }
    });
  }
};

/**
 * ML Service health check
 * 
 * GET /api/ecommerce/manager/inventory/health
 */
exports.checkMLHealth = async (req, res) => {
  try {
    const health = await InventoryMLService.healthCheck();
    
    res.json({
      success: true,
      mlService: {
        available: health.available || false,
        status: health.available ? 'healthy' : 'unavailable',
        ...health.data
      }
    });
  } catch (error) {
    console.error('ML health check error:', error);
    res.json({
      success: true, // Still return success to prevent frontend errors
      mlService: {
        available: false,
        status: 'error',
        error: error.message
      }
    });
  }
};

/**
 * Private: Get fallback analysis using basic calculations
 */
exports._getFallbackAnalysis = async (productId) => {
  try {
    const product = await Product.findById(productId).lean();
    
    if (!product) return null;

    // Calculate basic 30-day sales
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['confirmed', 'shipped', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $match: { 'items.product': product._id }
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const totalSold = salesData[0]?.totalSold || 0;
    const dailyAvg = totalSold / 30;
    const currentStock = (product.inventory?.stock || 0) - (product.inventory?.reserved || 0);
    const daysRemaining = dailyAvg > 0 ? currentStock / dailyAvg : null;

    return {
      product_id: productId,
      product_name: product.name,
      current_stock: currentStock,
      sales_velocity: {
        daily_avg_30d: Math.round(dailyAvg * 100) / 100,
        monthly_total: totalSold
      },
      stockout_prediction: {
        days_until_stockout: daysRemaining ? Math.round(daysRemaining) : null,
        urgency: daysRemaining && daysRemaining < 7 ? 'high' : 'normal'
      },
      restock_recommendation: {
        suggested_quantity: Math.max(0, Math.round((dailyAvg * 30) - currentStock)),
        urgency: daysRemaining && daysRemaining < 7 ? 'high' : 'low'
      },
      fallback: true,
      message: 'Basic analysis (ML service unavailable)'
    };
  } catch (error) {
    console.error('Error in fallback analysis:', error);
    return null;
  }
};

/**
 * Private: Calculate basic velocity from orders
 */
exports._calculateBasicVelocity = async (productId) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [last30Days, last7Days] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: { $in: ['confirmed', 'shipped', 'delivered'] }
          }
        },
        { $unwind: '$items' },
        { $match: { 'items.product': mongoose.Types.ObjectId(productId) } },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            status: { $in: ['confirmed', 'shipped', 'delivered'] }
          }
        },
        { $unwind: '$items' },
        { $match: { 'items.product': mongoose.Types.ObjectId(productId) } },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } }
      ])
    ]);

    return {
      velocity: {
        daily_avg_7d: Math.round(((last7Days[0]?.total || 0) / 7) * 100) / 100,
        daily_avg_30d: Math.round(((last30Days[0]?.total || 0) / 30) * 100) / 100,
        weekly_total: last7Days[0]?.total || 0,
        monthly_total: last30Days[0]?.total || 0
      }
    };
  } catch (error) {
    console.error('Error calculating basic velocity:', error);
    return { velocity: { daily_avg_7d: 0, daily_avg_30d: 0 } };
  }
};

/**
 * Generate demo products for demonstration purposes
 */
exports._generateDemoProducts = () => {
  const demoNames = [
    'Premium Dog Food 5kg',
    'Cat Litter Box',
    'Fish Tank Filter System',
    'Bird Cage Large',
    'Hamster Exercise Wheel',
    'Premium Dog Leash',
    'Cat Scratching Post',
    'Aquarium LED Light',
    'Pet Grooming Kit Pro',
    'Dog Bed Orthopedic Large',
    'Parrot Food Mix 2kg',
    'Rabbit Hutch Indoor'
  ];

  return demoNames.map((name, idx) => {
    const stock = idx === 0 ? 8 : idx === 1 ? 15 : idx === 2 ? 12 : Math.floor(Math.random() * 80) + 20;
    const availStock = stock;
    const urgency = stock < 15 ? 'critical' : stock < 30 ? 'high' : stock < 50 ? 'medium' : 'low';
    const dailyAvg = 2 + Math.random() * 3;
    const daysUntil = stock / dailyAvg;
    
    return {
      product_id: `demo-${idx}`,
      product_name: name,
      current_stock: stock,
      available_stock: availStock,
      success: true,
      sales_velocity: {
        daily_avg_30d: Math.round(dailyAvg * 100) / 100,
        weekly_total: Math.floor(dailyAvg * 7),
        monthly_total: Math.floor(dailyAvg * 30),
        return_rate: Math.random() * 2
      },
      stockout_prediction: {
        days_until_stockout: Math.round(daysUntil),
        confidence_score: 75 + Math.random() * 20,
        urgency: urgency
      },
      restock_recommendation: {
        suggested_quantity: Math.floor(dailyAvg * 30),
        urgency: urgency,
        message: urgency === 'critical' ? 'Immediate restock needed' : 
                urgency === 'high' ? 'Restock within 7 days' : 'Stock level adequate',
        perishable_product: false
      },
      demand_forecast: {
        next_7_days: Math.floor(dailyAvg * 7),
        next_30_days: Math.floor(dailyAvg * 30),
        total_demand: Math.floor(dailyAvg * 30 * 1.1),
        accuracy_score: 78 + Math.floor(Math.random() * 18),
        model_used: 'Linear Regression',
        price_adjustment_applied: false
      },
      is_new_product: idx > 9,
      analyzed_at: new Date().toISOString(),
      insights: urgency === 'critical' ? [{
        severity: 'critical',
        icon: '⚠️',
        title: 'Low Stock Alert',
        message: 'Current stock level is critically low. Consider immediate restock.'
      }] : urgency === 'high' ? [{
        severity: 'high',
        icon: '📊',
        title: 'Stock Running Low',
        message: 'Restock recommended within the next week to avoid stockout.'
      }] : []
    };
  });
};
