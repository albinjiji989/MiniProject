"""
AI/ML Recommendation API Routes
"""
from flask import Blueprint, request, jsonify
from modules.ecommerce.product_recommender import ProductRecommender, BehaviorAnalyzer
import logging

logger = logging.getLogger(__name__)

recommendation_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

# Global recommender instance
recommender = ProductRecommender()
behavior_analyzer = BehaviorAnalyzer()

@recommendation_bp.route('/train', methods=['POST'])
def train_model():
    """
    Train the recommendation model with product data
    
    POST /api/recommendations/train
    Body: {
        "products": [
            {
                "id": "product_id",
                "name": "Product Name",
                "description": "Description",
                "category": "Category",
                "brand": "Brand",
                "petType": "dog",
                "breed": "Golden Retriever",
                "price": 1500,
                "rating": 4.5,
                "reviewCount": 100,
                "popularity": 85,
                "isFeatured": true,
                "isBestseller": false,
                "tags": ["food", "premium"]
            }
        ]
    }
    """
    try:
        data = request.get_json()
        products = data.get('products', [])
        
        if not products:
            return jsonify({
                'success': False,
                'error': 'No products provided'
            }), 400
        
        # Train the model
        success = recommender.train(products)
        
        if success:
            # Save model
            recommender.save_model()
            
            return jsonify({
                'success': True,
                'message': f'Model trained successfully on {len(products)} products',
                'model_info': {
                    'total_products': len(products),
                    'feature_dimensions': recommender.product_features.shape[1] if recommender.product_features is not None else 0
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to train model'
            }), 500
            
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@recommendation_bp.route('/breed-recommendations', methods=['POST'])
def get_breed_recommendations():
    """
    Get ML-based product recommendations for a breed
    
    POST /api/recommendations/breed-recommendations
    Body: {
        "breed": "Golden Retriever",
        "species": "Dog",
        "top_k": 10,
        "user_history": ["product_id_1", "product_id_2"]  // optional
    }
    """
    try:
        data = request.get_json()
        breed = data.get('breed')
        species = data.get('species')
        top_k = data.get('top_k', 10)
        user_history = data.get('user_history', [])
        
        if not breed or not species:
            return jsonify({
                'success': False,
                'error': 'Breed and species are required'
            }), 400
        
        # Load model if not trained
        if not recommender.trained:
            recommender.load_model()
        
        if not recommender.trained:
            return jsonify({
                'success': False,
                'error': 'Model not trained. Please train the model first.'
            }), 400
        
        # Get hybrid recommendations
        if user_history:
            recommendations = recommender.hybrid_recommend(
                breed, species, user_history, top_k
            )
        else:
            recommendations = recommender.recommend_by_breed(
                breed, species, top_k
            )
        
        return jsonify({
            'success': True,
            'data': {
                'breed': breed,
                'species': species,
                'recommendations': recommendations,
                'total': len(recommendations),
                'method': 'hybrid' if user_history else 'content-based'
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@recommendation_bp.route('/similar-products', methods=['POST'])
def get_similar_products():
    """
    Find similar products using ML
    
    POST /api/recommendations/similar-products
    Body: {
        "product_id": "product_id",
        "top_k": 5
    }
    """
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        top_k = data.get('top_k', 5)
        
        if not product_id:
            return jsonify({
                'success': False,
                'error': 'Product ID is required'
            }), 400
        
        # Load model if not trained
        if not recommender.trained:
            recommender.load_model()
        
        if not recommender.trained:
            return jsonify({
                'success': False,
                'error': 'Model not trained'
            }), 400
        
        # Get similar products
        similar = recommender.recommend_similar_products(product_id, top_k)
        
        return jsonify({
            'success': True,
            'data': {
                'product_id': product_id,
                'similar_products': similar,
                'total': len(similar)
            }
        })
        
    except Exception as e:
        logger.error(f"Error finding similar products: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@recommendation_bp.route('/personalized', methods=['POST'])
def get_personalized_recommendations():
    """
    Get personalized recommendations based on user behavior
    
    POST /api/recommendations/personalized
    Body: {
        "user_id": "user_id",
        "user_history": ["product_id_1", "product_id_2"],
        "top_k": 10
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        user_history = data.get('user_history', [])
        top_k = data.get('top_k', 10)
        
        if not user_id or not user_history:
            return jsonify({
                'success': False,
                'error': 'User ID and history are required'
            }), 400
        
        # Load model if not trained
        if not recommender.trained:
            recommender.load_model()
        
        if not recommender.trained:
            return jsonify({
                'success': False,
                'error': 'Model not trained'
            }), 400
        
        # Get personalized recommendations
        recommendations = recommender.recommend_personalized(user_history, top_k)
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': user_id,
                'recommendations': recommendations,
                'total': len(recommendations),
                'method': 'collaborative-filtering'
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@recommendation_bp.route('/analyze-behavior', methods=['POST'])
def analyze_user_behavior():
    """
    Analyze user behavior patterns
    
    POST /api/recommendations/analyze-behavior
    Body: {
        "user_id": "user_id",
        "interactions": [
            {
                "product_id": "id",
                "category": "Food",
                "breed": "Golden Retriever",
                "price": 1500,
                "action": "view"
            }
        ]
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        interactions = data.get('interactions', [])
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        # Analyze behavior
        profile = behavior_analyzer.analyze_user_preferences(user_id, interactions)
        
        return jsonify({
            'success': True,
            'data': {
                'user_profile': profile,
                'insights': {
                    'total_interactions': len(interactions),
                    'favorite_categories': profile.get('favorite_categories', []),
                    'favorite_breeds': profile.get('favorite_breeds', []),
                    'price_preference': profile.get('avg_price_range', {})
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error analyzing behavior: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@recommendation_bp.route('/model-status', methods=['GET'])
def get_model_status():
    """Get current model status"""
    try:
        return jsonify({
            'success': True,
            'data': {
                'trained': recommender.trained,
                'total_products': len(recommender.product_ids) if recommender.trained else 0,
                'feature_dimensions': recommender.product_features.shape[1] if recommender.product_features is not None else 0
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
