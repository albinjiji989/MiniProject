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
