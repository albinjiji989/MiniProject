"""
Hybrid Pet Adoption Recommender
Combines 4 algorithms for research-grade recommendations:
1. Content-Based Filtering (baseline)
2. SVD Collaborative Filtering (Netflix-style)
3. XGBoost Success Prediction (Kaggle-winning)
4. K-Means Clustering (personality matching)
"""

import numpy as np
import pandas as pd
from datetime import datetime
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class HybridRecommender:
    """
    Ensemble recommender combining multiple AI/ML algorithms
    Provides best-in-class recommendations with explainability
    """
    
    def __init__(self, collaborative_filter, success_predictor, pet_clusterer):
        """
        Initialize hybrid recommender
        
        Args:
            collaborative_filter: SVD collaborative filtering instance
            success_predictor: XGBoost success predictor instance
            pet_clusterer: K-Means clustering instance
        """
        self.cf_model = collaborative_filter
        self.xgb_model = success_predictor
        self.kmeans_model = pet_clusterer
        
        # Default algorithm weights (can be tuned)
        self.weights = {
            'content': 0.30,      # 30% - Baseline features
            'collaborative': 0.30, # 30% - User behavior patterns
            'success': 0.25,       # 25% - Success probability
            'clustering': 0.15     # 15% - Personality match
        }
        
        # Cold start weights (when user has no history)
        # SVD still contributes via global mean predictions (just lower weight)
        self.cold_start_weights = {
            'content': 0.45,       # 45% - Primary: profile matching
            'collaborative': 0.15, # 15% - SVD global patterns (not zero!)
            'success': 0.25,       # 25% - Success prediction works fully
            'clustering': 0.15     # 15% - Cluster affinity
        }
        
        self.algorithm_availability = {
            'content': True,
            'collaborative': False,
            'success': False,
            'clustering': False
        }
        
        self._check_model_availability()
    
    def _check_model_availability(self):
        """Check which algorithms are available"""
        self.algorithm_availability['collaborative'] = self.cf_model.trained if self.cf_model else False
        self.algorithm_availability['success'] = self.xgb_model.trained if self.xgb_model else False
        self.algorithm_availability['clustering'] = self.kmeans_model.trained if self.kmeans_model else False
    
    def calculate_content_score(self, user_profile, pet_profile):
        """
        Calculate content-based score (baseline algorithm)
        
        Args:
            user_profile: User's adoption profile
            pet_profile: Pet's compatibility profile
            
        Returns:
            float: Score 0-100
        """
        score = 50.0  # Base score
        
        # Safely extract numeric values
        def _num(val, default=0):
            if val is None: return float(default)
            if isinstance(val, bool): return 1.0 if val else 0.0
            if isinstance(val, (int, float)): return float(val)
            if isinstance(val, str):
                try: return float(val)
                except: return float(default)
            return float(default)
        
        # Activity level match (0-20 points)
        user_activity = _num(user_profile.get('activityLevel'), 3)
        pet_energy = _num(pet_profile.get('energyLevel'), 3)
        activity_diff = abs(user_activity - pet_energy)
        activity_score = max(0, 20 - (activity_diff * 5))
        score += activity_score
        
        # Size preference (0-15 points)
        # preferredSize can be an array in MongoDB (e.g., ['medium', 'large'])
        raw_size_pref = user_profile.get('preferredSize', 'medium')
        if isinstance(raw_size_pref, list):
            user_sizes = [str(s).lower() for s in raw_size_pref]
        else:
            user_sizes = [str(raw_size_pref).lower()]
        pet_size = str(pet_profile.get('size', 'medium')).lower()
        if pet_size in user_sizes:
            score += 15
        elif 'medium' in user_sizes or pet_size == 'medium':
            score += 7
        
        # Experience level vs trained level (0-15 points)
        user_exp = str(user_profile.get('experienceLevel', 'beginner')).lower()
        pet_trained = str(pet_profile.get('trainedLevel', 'untrained')).lower()
        
        exp_map = {'beginner': 1, 'first_time': 1, 'some_experience': 2, 'intermediate': 2, 'experienced': 3, 'advanced': 3, 'expert': 4}
        trained_map = {'untrained': 1, 'basic': 2, 'intermediate': 3, 'advanced': 4}
        
        user_exp_val = exp_map.get(user_exp, 1)
        pet_trained_val = trained_map.get(pet_trained, 1)
        
        if user_exp_val >= pet_trained_val:
            score += 15
        else:
            score += max(0, 15 - ((pet_trained_val - user_exp_val) * 5))
        
        # ===== CHILD SAFETY (CRITICAL) =====
        # Strong penalty if user has children but pet is NOT child-friendly
        child_score = _num(pet_profile.get('childFriendlyScore'), 5)
        has_children = bool(user_profile.get('hasChildren', False))
        
        if has_children:
            if child_score >= 7:
                score += 20  # Great with kids - full bonus
            elif child_score >= 5:
                score += 10  # OK with kids
            elif child_score >= 3:
                score -= 10  # Risky with kids - penalty
            else:
                score -= 25  # DANGEROUS for kids - strong penalty
        else:
            score += 10  # No children - neutral bonus
        
        # ===== PET COMPATIBILITY =====
        pet_friendly = _num(pet_profile.get('petFriendlyScore'), 5)
        has_other_pets = bool(user_profile.get('hasOtherPets', False))
        
        if has_other_pets:
            if pet_friendly >= 7:
                score += 10  # Great with other pets
            elif pet_friendly >= 5:
                score += 5
            elif pet_friendly >= 3:
                score -= 5   # Risky
            else:
                score -= 15  # Not safe with other pets
        else:
            score += 5  # No other pets - neutral
        
        # ===== AGGRESSIVE TEMPERAMENT CHECK =====
        temperament_tags = pet_profile.get('temperamentTags', [])
        if not isinstance(temperament_tags, list):
            temperament_tags = []
        aggressive_tags = {'aggressive', 'bites', 'dangerous', 'attack', 'territorial', 'reactive'}
        for tag in temperament_tags:
            if str(tag).lower() in aggressive_tags:
                score -= 20  # Aggressive pet penalty
                break
        
        # Space requirements (0-10 points)
        user_space = str(user_profile.get('livingSpace', user_profile.get('homeType', 'apartment'))).lower()
        exercise_needs = str(pet_profile.get('exerciseNeeds', 'moderate')).lower()
        
        space_scores = {
            'apartment': {'minimal': 10, 'moderate': 7, 'high': 3, 'very_high': 0},
            'house': {'minimal': 10, 'moderate': 10, 'high': 8, 'very_high': 6},
            'house_small': {'minimal': 10, 'moderate': 10, 'high': 7, 'very_high': 5},
            'house_large': {'minimal': 10, 'moderate': 10, 'high': 10, 'very_high': 10},
            'farm': {'minimal': 10, 'moderate': 10, 'high': 10, 'very_high': 10}
        }
        
        score += space_scores.get(user_space, {}).get(exercise_needs, 5)
        
        # Time commitment (0-10 points)
        user_time = str(user_profile.get('availableTime', 'moderate')).lower()
        grooming = str(pet_profile.get('groomingNeeds', 'moderate')).lower()
        
        time_scores = {
            'limited': {'low': 10, 'moderate': 5, 'high': 0},
            'moderate': {'low': 10, 'moderate': 10, 'high': 5},
            'flexible': {'low': 10, 'moderate': 10, 'high': 10}
        }
        
        score += time_scores.get(user_time, {}).get(grooming, 5)
        
        logger.debug(f"Content score breakdown: activity={activity_score:.0f}, child={child_score}, pet_friendly={pet_friendly}, has_children={has_children}, final={min(100, max(0, score)):.1f}")
        
        return min(100, max(0, score))
    
    def recommend_hybrid(
        self,
        user_id: str,
        user_profile: Dict,
        available_pets: List[Dict],
        top_n: int = 10,
        algorithm: str = 'hybrid'
    ) -> List[Dict]:
        """
        Generate hybrid recommendations combining all algorithms
        
        Args:
            user_id: User ID
            user_profile: User's adoption profile
            available_pets: List of available pets
            top_n: Number of recommendations
            algorithm: 'hybrid', 'content', 'collaborative', 'success', 'clustering'
            
        Returns:
            List of ranked recommendations
        """
        try:
            # Refresh model availability (models may have been trained after __init__)
            self._check_model_availability()
            
            logger.info(f"Generating {algorithm} recommendations for user {user_id}")
            logger.info(f"Algorithm availability: {self.algorithm_availability}")
            
            # Detect cold start
            is_cold_start = self._is_cold_start(user_id)
            
            if is_cold_start:
                logger.info("Cold start detected, using adjusted weights")
                active_weights = self.cold_start_weights.copy()
            else:
                active_weights = self.weights.copy()
            
            recommendations = []
            
            for pet in available_pets:
                try:
                    pet_id = str(pet.get('_id', pet.get('petId', '')))
                    compat_profile = pet.get('compatibilityProfile', {})
                    
                    if not compat_profile:
                        continue
                    
                    # Initialize scores
                    scores = {
                        'content': 0.0,
                        'collaborative': 0.0,
                        'success': 0.0,
                        'clustering': 0.0
                    }
                    
                    explanations = []
                    
                    # 1. Content-Based Score (always available)
                    if algorithm in ['hybrid', 'content']:
                        content_score = self.calculate_content_score(user_profile, compat_profile)
                        scores['content'] = content_score
                        
                        if content_score >= 80:
                            explanations.append(f"Excellent profile match ({content_score:.0f}%)")
                        elif content_score >= 60:
                            explanations.append(f"Good compatibility ({content_score:.0f}%)")
                    
                    # 2. Collaborative Filtering Score
                    cf_result_raw = None  # Track for per-pet weight adjustment
                    if algorithm in ['hybrid', 'collaborative'] and self.algorithm_availability['collaborative']:
                        try:
                            cf_result_raw = self.cf_model.predict_rating(user_id, pet_id)
                            # predict_rating returns dict: {predicted_rating, score, confidence, was_impossible}
                            cf_rating = cf_result_raw.get('predicted_rating', 2.5) if isinstance(cf_result_raw, dict) else float(cf_result_raw)
                            cf_score = cf_result_raw.get('score', 50.0) if isinstance(cf_result_raw, dict) else (float(cf_result_raw) / 5.0) * 100
                            scores['collaborative'] = cf_score
                            
                            if cf_rating >= 4.0:
                                explanations.append(f"Highly rated by similar users ({cf_rating:.1f}/5)")
                            elif cf_rating >= 3.0:
                                explanations.append(f"Liked by users with similar preferences ({cf_rating:.1f}/5)")
                        except Exception as e:
                            logger.debug(f"CF prediction failed: {str(e)}")
                    
                    # 3. Success Prediction Score
                    if algorithm in ['hybrid', 'success'] and self.algorithm_availability['success']:
                        try:
                            xgb_result = self.xgb_model.predict_success_probability(
                                user_profile,
                                compat_profile,
                                scores.get('content', 50)  # Pass content score as match context
                            )
                            # predict_success_probability returns dict: {successProbability, confidence, trained}
                            if isinstance(xgb_result, dict):
                                success_pct = xgb_result.get('successProbability', 50.0)
                            else:
                                success_pct = float(xgb_result) * 100
                            
                            scores['success'] = success_pct
                            
                            if success_pct >= 80:
                                explanations.append(f"Very high success probability ({success_pct:.0f}%)")
                            elif success_pct >= 60:
                                explanations.append(f"Good success probability ({success_pct:.0f}%)")
                        except Exception as e:
                            logger.debug(f"Success prediction failed: {str(e)}")
                    
                    # 4. Clustering Score
                    if algorithm in ['hybrid', 'clustering'] and self.algorithm_availability['clustering']:
                        try:
                            cluster_info = self.kmeans_model.assign_pet_to_cluster(compat_profile)
                            cluster_id = cluster_info.get('clusterId', 0)
                            cluster_affinity = self.kmeans_model.calculate_cluster_affinity(
                                user_profile,
                                cluster_id
                            )
                            scores['clustering'] = cluster_affinity
                            
                            cluster_name = cluster_info.get('clusterName', 'Unknown')
                            logger.debug(f"K-Means: pet={pet.get('name','?')}, cluster={cluster_name}({cluster_id}), affinity={cluster_affinity:.1f}")
                            if cluster_affinity >= 70:
                                explanations.append(f"Perfect match for {cluster_name}")
                            elif cluster_affinity >= 50:
                                explanations.append(f"Good fit for {cluster_name}")
                        except Exception as e:
                            logger.warning(f"Clustering prediction failed for {pet.get('name','?')}: {str(e)}")
                            scores['clustering'] = 50.0  # Neutral fallback instead of 0
                    
                    # Calculate weighted hybrid score
                    if algorithm == 'hybrid':
                        # Dynamically adjust weights per-pet based on SVD confidence
                        pet_weights = self._adjust_weights_for_pet(active_weights, cf_result_raw)
                        hybrid_score = sum(
                            scores[algo] * pet_weights[algo]
                            for algo in scores.keys()
                        )
                    else:
                        # Single algorithm mode
                        pet_weights = {algorithm: 1.0}
                        hybrid_score = scores.get(algorithm, scores['content'])
                    
                    # Calculate confidence based on algorithm agreement
                    available_scores = [s for s in scores.values() if s > 0]
                    if len(available_scores) > 1:
                        score_std = np.std(available_scores)
                        confidence = max(0, 100 - score_std)
                    else:
                        confidence = 60.0  # Lower confidence with single algorithm
                    
                    # Build recommendation object
                    recommendation = {
                        'petId': pet_id,
                        'petName': pet.get('name', 'Unknown'),
                        'species': pet.get('species', ''),
                        'breed': pet.get('breed', ''),
                        'age': pet.get('age', 0),
                        'gender': pet.get('gender', ''),
                        'color': pet.get('color', ''),
                        'weight': pet.get('weight', ''),
                        'description': pet.get('description', ''),
                        'adoptionFee': pet.get('adoptionFee', 0),
                        'vaccinationStatus': pet.get('vaccinationStatus', ''),
                        'images': pet.get('images', []),
                        'compatibilityProfile': compat_profile,
                        'temperamentTags': pet.get('temperamentTags', compat_profile.get('temperamentTags', [])),
                        'status': pet.get('status', ''),
                        'hybridScore': round(hybrid_score, 2),
                        'confidence': round(confidence, 2),
                        'algorithmScores': {
                            k: round(v, 2) for k, v in scores.items()
                        },
                        'weights': pet_weights if algorithm == 'hybrid' else {algorithm: 1.0},
                        'explanations': explanations,
                        'algorithmUsed': algorithm,
                        'isColdStart': is_cold_start
                    }
                    
                    # Add success probability if available
                    if scores['success'] > 0:
                        recommendation['successProbability'] = round(scores['success'] / 100, 3)
                    
                    # Add cluster info if available
                    if scores['clustering'] > 0:
                        try:
                            cluster_info = self.kmeans_model.assign_pet_to_cluster(compat_profile)
                            recommendation['clusterName'] = cluster_info.get('clusterName', 'Unknown')
                        except:
                            pass
                    
                    recommendations.append(recommendation)
                    
                except Exception as e:
                    logger.warning(f"Error processing pet {pet.get('name', 'Unknown')}: {str(e)}")
                    continue
            
            # Sort by hybrid score
            recommendations.sort(key=lambda x: x['hybridScore'], reverse=True)
            
            # Return top N
            top_recommendations = recommendations[:top_n]
            
            logger.info(f"Generated {len(top_recommendations)} recommendations using {algorithm}")
            
            return top_recommendations
            
        except Exception as e:
            logger.error(f"Error generating hybrid recommendations: {str(e)}")
            raise
    
    def _is_cold_start(self, user_id: str) -> bool:
        """
        Check if user is in cold start state.
        Real users (from MongoDB) are always cold start for SVD since SVD
        is trained on synthetic data. But we still use SVD's general patterns
        to provide collaborative-style scoring.
        
        Returns:
            bool: True if cold start (real user not in SVD training data)
        """
        if not self.cf_model or not self.cf_model.trained:
            return True
        
        # Check if user exists in SVD training data
        if hasattr(self.cf_model, 'user_index') and self.cf_model.user_index:
            if str(user_id) in self.cf_model.user_index:
                return False  # Known user — use normal weights
        
        return True  # Unknown user — use cold start weights

    def _adjust_weights_for_pet(self, base_weights: Dict, cf_result: Dict) -> Dict:
        """
        Dynamically adjust hybrid weights per-pet based on SVD confidence.
        
        When SVD returns was_impossible=True (pet/user not in training data),
        redistribute SVD's weight to content-based and clustering.
        This prevents meaningless global-mean predictions from dominating.
        
        Args:
            base_weights: The active weight dict (cold_start or normal)
            cf_result: SVD predict_rating result with 'was_impossible' and 'confidence'
            
        Returns:
            dict: Adjusted weights for this specific pet
        """
        if not cf_result or not isinstance(cf_result, dict):
            return base_weights
        
        was_impossible = cf_result.get('was_impossible', False)
        cf_confidence = cf_result.get('confidence', 25.0)
        
        if not was_impossible:
            return base_weights  # SVD has real data — use weights unchanged
        
        # SVD prediction was "impossible" (unknown user/pet/both)
        # Scale down collaborative weight by confidence ratio
        adjusted = base_weights.copy()
        original_cf_weight = adjusted.get('collaborative', 0.0)
        
        # confidence 85 → keep full weight, confidence 25 → keep ~30% of weight
        confidence_factor = cf_confidence / 100.0
        reduced_cf_weight = original_cf_weight * confidence_factor
        redistributed = original_cf_weight - reduced_cf_weight
        
        adjusted['collaborative'] = reduced_cf_weight
        
        # Redistribute lost weight to content + clustering (strongest for new pets)
        adjusted['content'] = adjusted.get('content', 0.0) + redistributed * 0.65
        adjusted['clustering'] = adjusted.get('clustering', 0.0) + redistributed * 0.35
        
        logger.debug(
            f"SVD was_impossible (conf={cf_confidence:.0f}%), weights adjusted: "
            f"collab {original_cf_weight:.2f}→{reduced_cf_weight:.2f}, "
            f"content +{redistributed*0.65:.2f}, cluster +{redistributed*0.35:.2f}"
        )
        
        return adjusted
    
    def compare_algorithms(
        self,
        user_id: str,
        user_profile: Dict,
        available_pets: List[Dict],
        top_n: int = 10
    ) -> Dict:
        """
        Compare all algorithms side-by-side for research analysis
        
        Args:
            user_id: User ID
            user_profile: User profile
            available_pets: Available pets
            top_n: Number of results per algorithm
            
        Returns:
            dict: Comparison results
        """
        algorithms = ['hybrid', 'content', 'collaborative', 'success', 'clustering']
        
        results = {}
        
        for algo in algorithms:
            # Skip if algorithm not available
            if algo != 'content' and algo != 'hybrid':
                if not self.algorithm_availability.get(algo, False):
                    results[algo] = {
                        'available': False,
                        'message': f'{algo} model not trained yet'
                    }
                    continue
            
            try:
                recommendations = self.recommend_hybrid(
                    user_id,
                    user_profile,
                    available_pets,
                    top_n,
                    algorithm=algo
                )
                
                results[algo] = {
                    'available': True,
                    'recommendations': recommendations,
                    'topPetIds': [r['petId'] for r in recommendations[:5]],
                    'averageScore': np.mean([r['hybridScore'] for r in recommendations]) if recommendations else 0
                }
                
            except Exception as e:
                logger.error(f"Error comparing {algo}: {str(e)}")
                results[algo] = {
                    'available': False,
                    'error': str(e)
                }
        
        # Calculate agreement between algorithms
        agreement = self._calculate_agreement(results)
        
        return {
            'userId': user_id,
            'algorithms': results,
            'agreement': agreement,
            'timestamp': datetime.now().isoformat()
        }
    
    def _calculate_agreement(self, results: Dict) -> Dict:
        """
        Calculate agreement between different algorithms
        
        Args:
            results: Results from compare_algorithms
            
        Returns:
            dict: Agreement metrics
        """
        # Get top 5 pet IDs from each algorithm
        top_5_sets = {}
        
        for algo, result in results.items():
            if result.get('available', False):
                top_5_sets[algo] = set(result.get('topPetIds', [])[:5])
        
        if len(top_5_sets) < 2:
            return {'message': 'Need at least 2 algorithms for agreement calculation'}
        
        # Calculate pairwise Jaccard similarity
        similarities = {}
        algo_list = list(top_5_sets.keys())
        
        for i in range(len(algo_list)):
            for j in range(i + 1, len(algo_list)):
                algo1, algo2 = algo_list[i], algo_list[j]
                set1, set2 = top_5_sets[algo1], top_5_sets[algo2]
                
                if len(set1) == 0 or len(set2) == 0:
                    continue
                
                intersection = len(set1.intersection(set2))
                union = len(set1.union(set2))
                
                jaccard = intersection / union if union > 0 else 0
                
                similarities[f'{algo1}_vs_{algo2}'] = {
                    'jaccard_similarity': round(jaccard, 3),
                    'common_pets': intersection,
                    'total_unique': union
                }
        
        # Overall agreement
        if similarities:
            avg_similarity = np.mean([s['jaccard_similarity'] for s in similarities.values()])
        else:
            avg_similarity = 0
        
        return {
            'pairwise_similarities': similarities,
            'average_agreement': round(avg_similarity, 3),
            'algorithms_compared': len(top_5_sets)
        }
    
    def get_algorithm_explanations(self, pet_recommendation: Dict) -> Dict:
        """
        Get detailed explanations for each algorithm's contribution
        
        Args:
            pet_recommendation: A single recommendation object
            
        Returns:
            dict: Detailed explanations
        """
        scores = pet_recommendation.get('algorithmScores', {})
        
        explanations = {
            'content': self._explain_content_score(scores.get('content', 0)),
            'collaborative': self._explain_collaborative_score(scores.get('collaborative', 0)),
            'success': self._explain_success_score(scores.get('success', 0)),
            'clustering': self._explain_clustering_score(scores.get('clustering', 0))
        }
        
        return explanations
    
    def _explain_content_score(self, score: float) -> str:
        """Explain content-based score"""
        if score >= 80:
            return "Excellent match based on your lifestyle, experience, and preferences"
        elif score >= 60:
            return "Good compatibility with your profile and living situation"
        elif score >= 40:
            return "Moderate match - some aspects align with your preferences"
        else:
            return "Lower compatibility - may require adjustments to your routine"
    
    def _explain_collaborative_score(self, score: float) -> str:
        """Explain collaborative filtering score"""
        if score >= 80:
            return "Users with similar preferences highly recommend this pet"
        elif score >= 60:
            return "Users like you have shown interest in similar pets"
        elif score >= 40:
            return "Some users with similar profiles considered this pet"
        else:
            return "Limited collaborative data for this match"
    
    def _explain_success_score(self, score: float) -> str:
        """Explain XGBoost success prediction"""
        if score >= 80:
            return "Very high probability of successful adoption based on historical data"
        elif score >= 60:
            return "Good success indicators based on similar adoption outcomes"
        elif score >= 40:
            return "Moderate success probability - consider carefully"
        else:
            return "Lower success probability - may face challenges"
    
    def _explain_clustering_score(self, score: float) -> str:
        """Explain clustering score"""
        if score >= 70:
            return "Perfect personality type match for your lifestyle"
        elif score >= 50:
            return "Good fit within the pet's personality group"
        elif score >= 30:
            return "Moderate alignment with pet personality cluster"
        else:
            return "Different personality type - may require adaptation"
    
    def get_system_stats(self) -> Dict:
        """Get hybrid recommender system statistics"""
        return {
            'algorithm': 'Hybrid Ensemble',
            'algorithms_used': {
                'content_based': 'Weighted feature matching (baseline)',
                'collaborative_filtering': 'SVD Matrix Factorization (Netflix)',
                'success_prediction': 'XGBoost Gradient Boosting (Kaggle)',
                'clustering': 'K-Means Personality Grouping'
            },
            'algorithm_availability': self.algorithm_availability,
            'default_weights': self.weights,
            'cold_start_weights': self.cold_start_weights,
            'models': {
                'collaborative': self.cf_model.get_model_info() if self.cf_model else None,
                'success': self.xgb_model.get_model_info() if self.xgb_model else None,
                'clustering': self.kmeans_model.get_model_info() if self.kmeans_model else None
            }
        }


# Global instance
_hybrid_instance = None

def get_hybrid_recommender(cf_model=None, xgb_model=None, kmeans_model=None):
    """Get singleton hybrid recommender instance"""
    global _hybrid_instance
    
    if _hybrid_instance is None:
        # Import and get model instances
        if cf_model is None:
            from .collaborative_filter import get_collaborative_filter
            cf_model = get_collaborative_filter()
        
        if xgb_model is None:
            from .success_predictor import get_success_predictor
            xgb_model = get_success_predictor()
        
        if kmeans_model is None:
            from .pet_clustering import get_pet_clusterer
            kmeans_model = get_pet_clusterer()
        
        _hybrid_instance = HybridRecommender(cf_model, xgb_model, kmeans_model)
    
    return _hybrid_instance
