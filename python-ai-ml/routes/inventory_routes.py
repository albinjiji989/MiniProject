"""
Inventory Prediction API Routes

RESTful API endpoints for the AI/ML inventory prediction system.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
import logging

logger = logging.getLogger(__name__)

inventory_bp = Blueprint('inventory', __name__)

# Lazy initialization of predictor
_predictor = None

def get_predictor():
    """Lazy load the inventory predictor"""
    global _predictor
    if _predictor is None:
        from modules.ecommerce.inventory import InventoryPredictor
        _predictor = InventoryPredictor()
        logger.info("InventoryPredictor initialized for API routes")
    return _predictor


@inventory_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for inventory prediction service"""
    return jsonify({
        'success': True,
        'service': 'inventory-prediction',
        'status': 'healthy',
        'version': '1.0.0',
        'features': [
            'Sales Velocity Analysis',
            'AI Demand Forecasting',
            'Stockout Prediction',
            'Smart Restock Recommendations',
            'Seasonal Adjustments'
        ]
    })


@inventory_bp.route('/analyze/<product_id>', methods=['GET'])
def analyze_product(product_id):
    """
    Analyze a single product or variant for inventory predictions.
    
    Path Parameters:
        product_id: MongoDB ObjectId string
        
    Query Parameters:
        variant_id: Optional variant ObjectId for variant-specific analysis
        lead_time: Lead time in days (default: 7)
        save: Whether to save results to DB (default: false)
        
    Returns:
        Complete AI analysis with predictions and recommendations
    """
    try:
        # Validate product_id
        try:
            ObjectId(product_id)
        except InvalidId:
            return jsonify({
                'success': False,
                'error': 'Invalid product ID format'
            }), 400
        
        # Get parameters
        variant_id = request.args.get('variant_id')
        lead_time = request.args.get('lead_time', 7, type=int)
        save_to_db = request.args.get('save', 'false').lower() == 'true'
        
        # Validate variant_id if provided
        if variant_id:
            try:
                ObjectId(variant_id)
            except InvalidId:
                return jsonify({
                    'success': False,
                    'error': 'Invalid variant ID format'
                }), 400
        
        # Get predictor and run analysis
        predictor = get_predictor()
        result = predictor.analyze_product(
            product_id,
            variant_id=variant_id,
            lead_time_days=lead_time,
            save_to_db=save_to_db
        )
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'data': result
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Analysis failed')
            }), 404
            
    except Exception as e:
        logger.error(f"Error in analyze_product: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@inventory_bp.route('/analyze/all', methods=['GET'])
def analyze_all_products():
    """
    Analyze all products for inventory predictions.
    
    Query Parameters:
        store_id: Optional store filter
        save: Whether to save results to DB (default: false)
        
    Returns:
        Batch analysis results with summary
    """
    try:
        store_id = request.args.get('store_id')
        save_to_db = request.args.get('save', 'false').lower() == 'true'
        
        predictor = get_predictor()
        result = predictor.analyze_all_products(
            store_id=store_id,
            save_to_db=save_to_db
        )
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_all_products: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@inventory_bp.route('/critical-items', methods=['GET'])
def get_critical_items():
    """
    Get products needing urgent restocking.
    
    Query Parameters:
        store_id: Optional store filter
        limit: Maximum items to return (default: 20)
        
    Returns:
        List of critical and high priority items
    """
    try:
        store_id = request.args.get('store_id')
        limit = request.args.get('limit', 20, type=int)
        
        predictor = get_predictor()
        result = predictor.get_critical_items(
            store_id=store_id,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Error in get_critical_items: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@inventory_bp.route('/restock-report', methods=['GET'])
def get_restock_report():
    """
    Generate comprehensive restock report.
    
    Query Parameters:
        store_id: Optional store filter
        
    Returns:
        Detailed restock report with recommendations
    """
    try:
        store_id = request.args.get('store_id')
        
        predictor = get_predictor()
        result = predictor.get_restock_report(store_id=store_id)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Error in get_restock_report: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@inventory_bp.route('/forecast/<product_id>', methods=['GET'])
def get_demand_forecast(product_id):
    """
    Get demand forecast for a specific product.
    
    Path Parameters:
        product_id: MongoDB ObjectId string
        
    Query Parameters:
        days: Days to forecast (default: 30)
        method: Forecast method - auto, prophet, arima, linear (default: auto)
        
    Returns:
        Demand forecast with predictions
    """
    try:
        # Validate product_id
        try:
            ObjectId(product_id)
        except InvalidId:
            return jsonify({
                'success': False,
                'error': 'Invalid product ID format'
            }), 400
        
        days = request.args.get('days', 30, type=int)
        method = request.args.get('method', 'auto')
        
        predictor = get_predictor()
        
        # Get sales data
        sales_df = predictor.data_processor.get_product_sales_history(
            product_id, 
            days=90
        )
        
        # Get forecast
        forecast = predictor.forecaster.forecast_demand(
            sales_df,
            days_ahead=days,
            method=method
        )
        
        return jsonify({
            'success': True,
            'product_id': product_id,
            'forecast_days': days,
            'data': forecast
        })
        
    except Exception as e:
        logger.error(f"Error in get_demand_forecast: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@inventory_bp.route('/seasonal-analysis', methods=['GET'])
def get_seasonal_analysis():
    """
    Get current seasonal analysis and factors.
    
    Returns:
        Seasonal context, events, and adjustment factors
    """
    try:
        predictor = get_predictor()
        
        seasonal_data = predictor.seasonal_analyzer.get_adjustment_factors()
        event_impact = predictor.seasonal_analyzer.get_event_impact()
        
        return jsonify({
            'success': True,
            'data': {
                'seasonal_analysis': seasonal_data,
                'event_impact': event_impact,
                'current_season': predictor.seasonal_analyzer.get_current_season()
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_seasonal_analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@inventory_bp.route('/velocity/<product_id>', methods=['GET'])
def get_sales_velocity(product_id):
    """
    Get sales velocity for a specific product.
    
    Path Parameters:
        product_id: MongoDB ObjectId string
        
    Returns:
        Sales velocity metrics
    """
    try:
        # Validate product_id
        try:
            ObjectId(product_id)
        except InvalidId:
            return jsonify({
                'success': False,
                'error': 'Invalid product ID format'
            }), 400
        
        predictor = get_predictor()
        
        # Get sales data
        sales_df = predictor.data_processor.get_product_sales_history(
            product_id,
            days=90
        )
        
        # Calculate velocity
        velocity = predictor._calculate_sales_velocity(sales_df)
        
        # Get weekly pattern
        weekly_pattern = predictor.seasonal_analyzer.analyze_weekly_pattern(sales_df)
        
        return jsonify({
            'success': True,
            'product_id': product_id,
            'data': {
                'velocity': velocity,
                'weekly_pattern': weekly_pattern
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_sales_velocity: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@inventory_bp.route('/batch-analyze', methods=['POST'])
def batch_analyze_products():
    """
    Analyze specific products by IDs.
    
    Request Body:
        product_ids: List of product ID strings
        lead_time: Lead time in days (default: 7)
        save: Whether to save results (default: false)
        
    Returns:
        Analysis results for specified products
    """
    try:
        data = request.get_json() or {}
        product_ids = data.get('product_ids', [])
        lead_time = data.get('lead_time', 7)
        save_to_db = data.get('save', False)
        
        if not product_ids:
            return jsonify({
                'success': False,
                'error': 'product_ids array is required'
            }), 400
        
        predictor = get_predictor()
        results = []
        
        for pid in product_ids:
            try:
                result = predictor.analyze_product(
                    pid,
                    lead_time_days=lead_time,
                    save_to_db=save_to_db
                )
                results.append(result)
            except Exception as e:
                results.append({
                    'success': False,
                    'product_id': pid,
                    'error': str(e)
                })
        
        # Sort by urgency
        results.sort(
            key=lambda x: x.get('stockout_prediction', {}).get('urgency_score', 0),
            reverse=True
        )
        
        return jsonify({
            'success': True,
            'total': len(results),
            'data': results
        })
        
    except Exception as e:
        logger.error(f"Error in batch_analyze_products: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
