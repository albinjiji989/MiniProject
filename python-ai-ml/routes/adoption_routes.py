"""
Adoption matching routes for AI/ML service
"""
from flask import Blueprint, request, jsonify
from modules.adoption.matching_engine import matcher

adoption_bp = Blueprint('adoption', __name__, url_prefix='/api/adoption')


@adoption_bp.route('/match/calculate', methods=['POST'])
def calculate_match():
    """
    Calculate compatibility score between a user and a specific pet
    
    Request body:
    {
        "userProfile": { ... },
        "petProfile": { ... }
    }
    """
    try:
        data = request.get_json()
        user_profile = data.get('userProfile')
        pet_profile = data.get('petProfile')
        
        if not user_profile or not pet_profile:
            return jsonify({
                'success': False,
                'message': 'Both userProfile and petProfile are required'
            }), 400
        
        match_result = matcher.calculate_match_score(user_profile, pet_profile)
        
        return jsonify({
            'success': True,
            'data': match_result
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/match/rank', methods=['POST'])
def rank_pets():
    """
    Rank all pets by compatibility for a user
    
    Request body:
    {
        "userProfile": { ... },
        "pets": [ ... ]
    }
    """
    try:
        data = request.get_json()
        user_profile = data.get('userProfile')
        pets = data.get('pets', [])
        
        if not user_profile:
            return jsonify({
                'success': False,
                'message': 'userProfile is required'
            }), 400
        
        if not pets:
            return jsonify({
                'success': True,
                'data': {
                    'rankedPets': [],
                    'totalPets': 0
                }
            })
        
        ranked_pets = matcher.rank_pets_for_user(user_profile, pets)
        
        return jsonify({
            'success': True,
            'data': {
                'rankedPets': ranked_pets,
                'totalPets': len(ranked_pets)
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/match/top-matches', methods=['POST'])
def get_top_matches():
    """
    Get top N best matching pets for a user
    
    Request body:
    {
        "userProfile": { ... },
        "pets": [ ... ],
        "topN": 5  // optional, default 5
    }
    """
    try:
        data = request.get_json()
        user_profile = data.get('userProfile')
        pets = data.get('pets', [])
        top_n = data.get('topN', 5)
        
        if not user_profile:
            return jsonify({
                'success': False,
                'message': 'userProfile is required'
            }), 400
        
        if not pets:
            return jsonify({
                'success': True,
                'data': {
                    'topMatches': [],
                    'totalAvailable': 0
                }
            })
        
        top_matches = matcher.get_top_matches(user_profile, pets, top_n)
        
        return jsonify({
            'success': True,
            'data': {
                'topMatches': top_matches,
                'totalAvailable': len(pets),
                'showingTop': len(top_matches)
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Adoption matching service is running',
        'version': '1.0.0'
    })


# ===== NEW ML ENDPOINTS FOR HYBRID RECOMMENDER SYSTEM =====

@adoption_bp.route('/ml/collaborative/train', methods=['POST'])
def train_collaborative_filter():
    """
    Train SVD collaborative filtering model
    
    Request body:
    {
        "interactions": [
            {
                "userId": "...",
                "petId": "...",
                "interactionType": "viewed|favorited|applied|adopted",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        ]
    }
    """
    try:
        from modules.adoption.collaborative_filter import get_collaborative_filter
        
        data = request.get_json()
        interactions = data.get('interactions', [])
        
        if len(interactions) < 10:
            return jsonify({
                'success': False,
                'message': 'Need at least 10 interactions for training'
            }), 400
        
        cf_model = get_collaborative_filter()
        metrics = cf_model.train(interactions)
        
        return jsonify({
            'success': True,
            'message': 'Collaborative filtering model trained successfully',
            'data': metrics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/success-predictor/train', methods=['POST'])
def train_success_predictor():
    """
    Train XGBoost success prediction model
    
    Request body:
    {
        "adoptions": [
            {
                "userId": "...",
                "userProfile": { ... },
                "petId": "...",
                "petProfile": { ... },
                "interactionFeatures": { ... },
                "outcome": true|false
            }
        ]
    }
    """
    try:
        from modules.adoption.success_predictor import get_success_predictor
        
        data = request.get_json()
        adoptions = data.get('adoptions', [])
        
        if len(adoptions) < 20:
            return jsonify({
                'success': False,
                'message': 'Need at least 20 adoption records for training'
            }), 400
        
        xgb_model = get_success_predictor()
        metrics = xgb_model.train(adoptions)
        
        return jsonify({
            'success': True,
            'message': 'Success predictor model trained successfully',
            'data': metrics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/clustering/train', methods=['POST'])
def train_pet_clustering():
    """
    Train K-Means clustering model
    
    Request body:
    {
        "pets": [
            {
                "_id": "...",
                "name": "...",
                "compatibilityProfile": { ... }
            }
        ],
        "k": 5  // optional, auto-detect if not provided
    }
    """
    try:
        from modules.adoption.pet_clustering import get_pet_clusterer
        
        data = request.get_json()
        pets = data.get('pets', [])
        k = data.get('k')
        
        if len(pets) < 10:
            return jsonify({
                'success': False,
                'message': 'Need at least 10 pets for clustering'
            }), 400
        
        kmeans_model = get_pet_clusterer()
        metrics = kmeans_model.train(pets, k=k)
        
        return jsonify({
            'success': True,
            'message': 'K-Means clustering trained successfully',
            'data': metrics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/recommend/hybrid', methods=['POST'])
def get_hybrid_recommendations():
    """
    Get hybrid ML recommendations combining all algorithms
    
    Request body:
    {
        "userId": "...",
        "userProfile": { ... },
        "availablePets": [ ... ],
        "topN": 10,  // optional
        "algorithm": "hybrid|content|collaborative|success|clustering"  // optional
    }
    """
    try:
        from modules.adoption.hybrid_recommender import get_hybrid_recommender
        
        data = request.get_json()
        user_id = data.get('userId')
        user_profile = data.get('userProfile')
        available_pets = data.get('availablePets', [])
        top_n = data.get('topN', 10)
        algorithm = data.get('algorithm', 'hybrid')
        
        if not user_id or not user_profile:
            return jsonify({
                'success': False,
                'message': 'userId and userProfile are required'
            }), 400
        
        if not available_pets:
            return jsonify({
                'success': True,
                'data': {
                    'recommendations': [],
                    'algorithm': algorithm
                }
            })
        
        hybrid_model = get_hybrid_recommender()
        recommendations = hybrid_model.recommend_hybrid(
            user_id,
            user_profile,
            available_pets,
            top_n,
            algorithm
        )
        
        return jsonify({
            'success': True,
            'data': {
                'recommendations': recommendations,
                'algorithm': algorithm,
                'totalAvailable': len(available_pets),
                'showingTop': len(recommendations)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/compare-algorithms', methods=['POST'])
def compare_algorithms():
    """
    Compare all algorithms side-by-side for research analysis
    
    Request body:
    {
        "userId": "...",
        "userProfile": { ... },
        "availablePets": [ ... ],
        "topN": 10  // optional
    }
    """
    try:
        from modules.adoption.hybrid_recommender import get_hybrid_recommender
        
        data = request.get_json()
        user_id = data.get('userId')
        user_profile = data.get('userProfile')
        available_pets = data.get('availablePets', [])
        top_n = data.get('topN', 10)
        
        if not user_id or not user_profile:
            return jsonify({
                'success': False,
                'message': 'userId and userProfile are required'
            }), 400
        
        hybrid_model = get_hybrid_recommender()
        comparison = hybrid_model.compare_algorithms(
            user_id,
            user_profile,
            available_pets,
            top_n
        )
        
        return jsonify({
            'success': True,
            'data': comparison
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/models/stats', methods=['GET'])
def get_ml_stats():
    """Get statistics for all ML models"""
    try:
        from modules.adoption.hybrid_recommender import get_hybrid_recommender
        
        hybrid_model = get_hybrid_recommender()
        stats = hybrid_model.get_system_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/pet/cluster', methods=['POST'])
def assign_pet_cluster():
    """
    Assign a pet to a personality cluster
    
    Request body:
    {
        "petProfile": { ... }
    }
    """
    try:
        from modules.adoption.pet_clustering import get_pet_clusterer
        
        data = request.get_json()
        pet_profile = data.get('petProfile')
        
        if not pet_profile:
            return jsonify({
                'success': False,
                'message': 'petProfile is required'
            }), 400
        
        kmeans_model = get_pet_clusterer()
        cluster_info = kmeans_model.assign_pet_to_cluster(pet_profile)
        
        return jsonify({
            'success': True,
            'data': cluster_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/clusters/info', methods=['GET'])
def get_cluster_info():
    """Get information about all pet personality clusters"""
    try:
        from modules.adoption.pet_clustering import get_pet_clusterer
        
        kmeans_model = get_pet_clusterer()
        cluster_info = kmeans_model.get_cluster_info()
        
        return jsonify({
            'success': True,
            'data': cluster_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


# ===== INCREMENTAL LEARNING ENDPOINTS =====

@adoption_bp.route('/ml/retrain-with-real-data', methods=['POST'])
def retrain_with_real_data():
    """
    Retrain all ML models with a mix of real adoption data + synthetic data.
    Implements FIFO replacement: real data replaces synthetic data progressively.
    
    Called automatically by Node.js when adoption count hits milestones (5, 10, 25, 50, 100...).
    Can also be called manually for testing.
    
    Request body:
    {
        "realDataCount": 10,
        "svdInteractions": [...],
        "xgboostRecords": [...],
        "kmeansProfiles": [...]
    }
    """
    try:
        from modules.adoption.bootstrap_training import retrain_with_real_data as do_retrain
        
        data = request.get_json()
        real_count = data.get('realDataCount', 0)
        
        if real_count == 0:
            return jsonify({
                'success': False,
                'message': 'No real data provided for retraining'
            }), 400
        
        results = do_retrain(data)
        
        retrained_count = sum(1 for k, v in results.items() 
                            if isinstance(v, dict) and v.get('retrained', False))
        
        return jsonify({
            'success': True,
            'message': f'Incremental retrain complete: {retrained_count}/3 models updated with {real_count} real records',
            'data': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@adoption_bp.route('/ml/training-stats', methods=['GET'])
def get_training_stats():
    """
    Get statistics about training data composition (real vs synthetic).
    """
    try:
        from modules.adoption.hybrid_recommender import get_hybrid_recommender
        
        hybrid = get_hybrid_recommender()
        
        stats = {
            'algorithmAvailability': hybrid.algorithm_availability if hasattr(hybrid, 'algorithm_availability') else {},
            'currentWeights': hybrid.weights if hasattr(hybrid, 'weights') else {},
            'modelsActive': sum(1 for v in (hybrid.algorithm_availability or {}).values() if v),
            'totalModels': 4,
            'learningMode': 'incremental',
            'description': 'Models start with synthetic data and gradually incorporate real adoption outcomes (FIFO replacement)'
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
