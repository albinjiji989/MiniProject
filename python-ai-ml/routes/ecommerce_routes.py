"""
E-commerce Recommendation API Routes
"""
from flask import Blueprint, request, jsonify
from modules.ecommerce_recommendations import EcommerceRecommendationEngine
from config.database import get_db
import logging

logger = logging.getLogger(__name__)

ecommerce_bp = Blueprint('ecommerce', __name__, url_prefix='/api/ecommerce')


@ecommerce_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """
    Get AI/ML powered product recommendations
    Query params:
        - userId: Optional user ID for personalized recommendations
    """
    try:
        user_id = request.args.get('userId')
        
        logger.info(f"📥 Recommendation request received - userId: {user_id or 'Guest'}")
        
        db = get_db()
        engine = EcommerceRecommendationEngine(db)
        
        recommendations = engine.get_all_recommendations(user_id)
        
        logger.info(f"✅ Successfully generated recommendations")
        
        return jsonify({
            'success': True,
            'data': recommendations
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Recommendations error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': str(e),
            'error': 'Failed to generate recommendations'
        }), 500


@ecommerce_bp.route('/recommendations/best-sellers', methods=['GET'])
def get_best_sellers():
    """Get best selling products"""
    try:
        limit = int(request.args.get('limit', 20))
        
        db = get_db()
        engine = EcommerceRecommendationEngine(db)
        
        products = engine._get_best_sellers(limit)
        
        return jsonify({
            'success': True,
            'data': products
        }), 200
        
    except Exception as e:
        logger.error(f"Best sellers error: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@ecommerce_bp.route('/recommendations/trending', methods=['GET'])
def get_trending():
    """Get trending products"""
    try:
        limit = int(request.args.get('limit', 20))
        
        db = get_db()
        engine = EcommerceRecommendationEngine(db)
        
        products = engine._get_trending_products(limit)
        
        return jsonify({
            'success': True,
            'data': products
        }), 200
        
    except Exception as e:
        logger.error(f"Trending error: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@ecommerce_bp.route('/recommendations/most-bought', methods=['GET'])
def get_most_bought():
    """Get most bought products"""
    try:
        limit = int(request.args.get('limit', 20))
        
        db = get_db()
        engine = EcommerceRecommendationEngine(db)
        
        products = engine._get_most_bought_products(limit)
        
        return jsonify({
            'success': True,
            'data': products
        }), 200
        
    except Exception as e:
        logger.error(f"Most bought error: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
