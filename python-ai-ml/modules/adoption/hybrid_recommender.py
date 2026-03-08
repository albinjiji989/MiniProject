"""
Hybrid Pet Adoption Recommender
Combines 4 algorithms for research-grade recommendations:
1. Content-Based Filtering (baseline)
2. SVD Collaborative Filtering (Netflix-style)
3. XGBoost Success Prediction (Kaggle-winning)
4. K-Means Clustering (personality matching)
"""

import json
import os
import numpy as np
import pandas as pd
from datetime import datetime
import logging
import json
import os
from typing import List, Dict, Optional

# Path for persisting adapted weights so they survive Flask restarts
_WEIGHTS_STATE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'adoption_weights_state.json')

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
        
        # Load persisted weights if available (survives Flask restarts)
        self._load_weights_from_disk()
        
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
        # Map workSchedule (actual MongoDB field) to a time-availability bucket.
        # Falls back to the legacy 'availableTime' field if explicitly set; otherwise
        # 'available_time' was never stored — this caused grooming scoring to always
        # default to 'moderate' regardless of the user's actual work schedule.
        _schedule_time_map = {
            'full_time':   'limited',  'part_time': 'moderate',
            'flexible':    'flexible', 'remote':    'moderate',
            'student':     'moderate', 'retired':   'flexible',
            'unemployed':  'flexible', 'freelance': 'moderate',
        }
        _work_schedule = str(user_profile.get('workSchedule', '')).lower()
        user_time = (
            _schedule_time_map.get(_work_schedule)
            or str(user_profile.get('availableTime', 'moderate')).lower()
        )
        grooming = str(pet_profile.get('groomingNeeds', 'moderate')).lower()
        
        time_scores = {
            'limited': {'low': 10, 'moderate': 5, 'high': 0},
            'moderate': {'low': 10, 'moderate': 10, 'high': 5},
            'flexible': {'low': 10, 'moderate': 10, 'high': 10}
        }
        
        score += time_scores.get(user_time, {}).get(grooming, 5)
        
        # ===== BUDGET SCORING (0-10 points) =====
        # Compare pet adoptionFee against user's stated monthly budget.
        # adoptionFee is a one-time cost; budget is monthly — use 2x monthly as proxy ceiling.
        adoption_fee = _num(pet_profile.get('adoptionFee'), 0)
        user_budget = _num(user_profile.get('monthlyBudget') or user_profile.get('budget'), 0)
        if user_budget > 0 and adoption_fee > 0:
            budget_ceiling = user_budget * 2   # user can typically afford 2 months' worth as one-time
            if adoption_fee <= user_budget:
                score += 10   # Well within budget
            elif adoption_fee <= budget_ceiling:
                score += 5    # Affordable stretch
            elif adoption_fee <= budget_ceiling * 1.5:
                score -= 5    # Over budget
            else:
                score -= 15   # Significantly over budget
        
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
                # FIX #9: Warming-up state — if user IS in SVD but has few interactions,
                # their mean will be close to global_mean (warmth ≈ 0), so we blend
                # cold_start and normal weights proportionally.  This prevents jumping
                # to full collaborative weight before SVD has meaningful signal on this user.
                warmth = self._get_user_warmth(user_id)
                if warmth < 1.0:
                    active_weights = {
                        k: round(self.cold_start_weights[k] * (1 - warmth) + self.weights[k] * warmth, 4)
                        for k in self.weights
                    }
                    logger.info(f"Warming-up user (warmth={warmth:.2f}), blended weights: {active_weights}")
                else:
                    active_weights = self.weights.copy()
            
            recommendations = []
            
            for pet in available_pets:
                try:
                    pet_id = str(pet.get('_id', pet.get('petId', '')))
                    compat_profile = pet.get('compatibilityProfile', {})

                    # ── compatibilityProfile quality gate ──────────────────────────────
                    # Count how many numeric fields have usable values.
                    # Profiles with <4 valid numeric fields degrade ML accuracy significantly.
                    _REQUIRED_NUMERIC_FIELDS = [
                        'energyLevel', 'childFriendlyScore', 'petFriendlyScore',
                        'strangerFriendlyScore', 'maxHoursAlone', 'estimatedMonthlyCost',
                        'trainedLevel',
                    ]
                    def _is_numeric_valid(v):
                        if v is None or v == '': return False
                        if isinstance(v, bool): return True
                        try:
                            return float(v) >= 0
                        except (TypeError, ValueError):
                            return False
                    _valid_count = sum(
                        1 for f in _REQUIRED_NUMERIC_FIELDS
                        if _is_numeric_valid(compat_profile.get(f))
                    ) if compat_profile else 0
                    _incomplete_profile = _valid_count < 4
                    # ──────────────────────────────────────────────────────────────────
                    
                    if not compat_profile:
                        # FIX #6: Don't silently skip pets with no compatibility profile.
                        # Include them with a capped score + warning so users still see them.
                        recommendations.append({
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
                            'compatibilityProfile': {},
                            'temperamentTags': pet.get('temperamentTags', []),
                            'status': pet.get('status', ''),
                            'hybridScore': 40.0,
                            'confidence': 30.0,
                            'algorithmScores': {'content': 0, 'collaborative': 0, 'success': 0, 'clustering': 0},
                            'weights': {},
                            'explanations': ['\u26a0\ufe0f Compatibility profile not set - limited matching available'],
                            'algorithmUsed': algorithm,
                            'isColdStart': True,
                            'noProfileWarning': True
                        })
                        continue
                    
                    # Initialize scores
                    scores = {
                        'content': 0.0,
                        'collaborative': 0.0,
                        'success': 0.0,
                        'clustering': 0.0
                    }
                    
                    explanations = []
                    
                    # FIX #4: Merge root-level temperamentTags with compat_profile tags
                    # so aggressive pets are penalised whether tags live in the root
                    # document OR inside compatibilityProfile.
                    root_tags = pet.get('temperamentTags', [])
                    compat_tags = compat_profile.get('temperamentTags', [])
                    all_tags = list({str(t).lower() for t in (root_tags if isinstance(root_tags, list) else []) + (compat_tags if isinstance(compat_tags, list) else [])})
                    merged_compat = {**compat_profile}
                    if all_tags:
                        merged_compat['temperamentTags'] = all_tags
                    # Budget: include adoptionFee so calculate_content_score can score it
                    merged_compat['adoptionFee'] = pet.get('adoptionFee', 0)

                    # Flag incomplete profiles in explanations
                    if _incomplete_profile:
                        explanations.append(
                            f'\u26a0\ufe0f Partial profile ({_valid_count}/7 fields) \u2014 scores may be less accurate'
                        )

                    # 1. Content-Based Score (always available)
                    if algorithm in ['hybrid', 'content']:
                        content_score = self.calculate_content_score(user_profile, merged_compat)
                        # Cap incomplete-profile pets at 35 to avoid false high scores
                        if _incomplete_profile:
                            content_score = min(content_score, 35.0)
                        scores['content'] = content_score
                        
                        if content_score >= 80:
                            explanations.append(f"Excellent profile match ({content_score:.0f}%)")
                        elif content_score >= 60:
                            explanations.append(f"Good compatibility ({content_score:.0f}%)")
                    
                    # 2. Collaborative Filtering Score
                    cf_result_raw = None  # Track for per-pet weight adjustment
                    if algorithm in ['hybrid', 'collaborative'] and self.algorithm_availability['collaborative']:
                        try:
                            # Pass breed+species so SVD can use breed-level fallback
                            # for real MongoDB pets not in the training data
                            _pet_meta = {'breed': pet.get('breed', ''), 'species': pet.get('species', '')}
                            cf_result_raw = self.cf_model.predict_rating(user_id, pet_id, pet_metadata=_pet_meta)
                            # predict_rating returns dict: {predicted_rating, score, confidence, was_impossible}
                            cf_rating = cf_result_raw.get('predicted_rating', 2.5) if isinstance(cf_result_raw, dict) else float(cf_result_raw)
                            cf_score = cf_result_raw.get('score', 50.0) if isinstance(cf_result_raw, dict) else (float(cf_result_raw) / 5.0) * 100
                            cf_impossible = cf_result_raw.get('was_impossible', False) if isinstance(cf_result_raw, dict) else False
                            cf_confidence = cf_result_raw.get('confidence', 25.0) if isinstance(cf_result_raw, dict) else 25.0
                            scores['collaborative'] = cf_score
                            logger.info(
                                f"CF [{pet.get('breed','?')}] score={cf_score:.1f} "
                                f"rating={cf_rating:.2f} impossible={cf_impossible} "
                                f"conf={cf_confidence:.0f}% "
                                f"breed_idx_size={len(getattr(self.cf_model, 'pet_breed_index', {}))}"
                            )
                            
                            if cf_rating >= 4.0:
                                explanations.append(f"Highly rated by similar users ({cf_rating:.1f}/5)")
                            elif cf_rating >= 3.0:
                                explanations.append(f"Liked by users with similar preferences ({cf_rating:.1f}/5)")
                        except Exception as e:
                            logger.warning(f"CF prediction failed for pet {pet_id}: {str(e)}")
                    
                    # 3. Success Prediction Score
                    if algorithm in ['hybrid', 'success'] and self.algorithm_availability['success']:
                        try:
                            # FIX #3: Pass neutral 50.0 instead of content_score to prevent
                            # double-counting (content score already has its own 30% weight).
                            # XGBoost should predict success from raw user+pet features alone.
                            xgb_result = self.xgb_model.predict_success_probability(
                                user_profile,
                                compat_profile,
                                50.0  # Neutral — decouple XGBoost from content score bias
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
                            cluster_info = self.kmeans_model.assign_pet_to_cluster(merged_compat)
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
                        # FIX #7: Also apply species-specific weight tuning
                        pet_weights = self._adjust_weights_for_species(pet_weights, pet.get('species', ''))
                        hybrid_score = sum(
                            scores[algo] * pet_weights[algo]
                            for algo in scores.keys()
                        )
                    else:
                        # Single algorithm mode
                        pet_weights = {algorithm: 1.0}
                        hybrid_score = scores.get(algorithm, scores['content'])
                    
                    # FIX #2: Use Coefficient of Variation (CV) for confidence.
                    # CV = std / mean measures relative disagreement between algorithms.
                    # CV=0 (all agree) → 100% confidence. CV=1 (huge spread) → 0% confidence.
                    # Old formula (100 - std) was wrong: same std means diff things at different scales.
                    available_scores = [s for s in scores.values() if s > 0]
                    if len(available_scores) > 1:
                        mean_score = np.mean(available_scores)
                        cv = np.std(available_scores) / (mean_score + 1e-10)  # avoid div-by-zero
                        confidence = round(max(0.0, min(100.0, (1.0 - cv) * 100)), 1)
                    else:
                        confidence = 60.0  # Single algorithm — moderate confidence
                    
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

                    # FIX #3: Populate match_details.score_breakdown in ML mode.
                    # Previously this was only filled by the Node.js content-based fallback,
                    # so the Details dialog score breakdown section was always blank in ML mode.
                    def _compat_label(score):
                        if score >= 85: return 'Excellent Match'
                        if score >= 70: return 'Great Match'
                        if score >= 55: return 'Good Match'
                        return 'Fair Match'

                    recommendation['match_details'] = {
                        'overall_score': round(hybrid_score, 1),
                        'compatibility_level': _compat_label(hybrid_score),
                        'match_reasons': explanations,
                        'warnings': [],
                        'score_breakdown': {
                            'Content Matching':        round(scores['content'], 1),
                            'Collaborative Filtering': round(scores['collaborative'], 1),
                            'Success Prediction':      round(scores['success'], 1),
                            'Personality Clustering':  round(scores['clustering'], 1),
                        },
                        'success_probability': round(scores['success'] / 100, 3) if scores['success'] else 0
                    }

                    # Add success probability if available
                    if scores['success'] > 0:
                        recommendation['successProbability'] = round(scores['success'] / 100, 3)

                    # Add cluster info if available
                    if scores['clustering'] > 0:
                        try:
                            cluster_info = self.kmeans_model.assign_pet_to_cluster(merged_compat)
                            recommendation['clusterName'] = cluster_info.get('clusterName', 'Unknown')
                        except:
                            pass
                    
                    recommendations.append(recommendation)
                    
                except Exception as e:
                    logger.warning(f"Error processing pet {pet.get('name', 'Unknown')}: {str(e)}")
                    continue
            
            # Sort by hybrid score
            recommendations.sort(key=lambda x: x['hybridScore'], reverse=True)
            
            # FIX #5: Apply breed diversity — respects user's preferredBreed preference
            diverse_recommendations = self._apply_diversity(recommendations, user_profile=user_profile, max_per_breed=3)
            top_recommendations = diverse_recommendations[:top_n]
            
            logger.info(f"Generated {len(top_recommendations)} recommendations using {algorithm} (diversity applied)")
            
            return top_recommendations
            
        except Exception as e:
            logger.error(f"Error generating hybrid recommendations: {str(e)}")
            raise
    
    def update_weights_from_feedback(self, feedback_data: List[Dict]) -> bool:
        """
        FIX #7: Simple online weight adaptation using adoption application feedback.
        Called periodically from Flask with compiled feedback records.

        Algorithm:
          - For each algorithm, compute mean score on applied vs not-applied pets.
          - If algorithm scored applied pets higher on average, nudge its weight up.
          - Weights are always re-normalised to sum to 1.0.
          - Changes are capped at \u00b10.05 per call to prevent over-fitting.

        Args:
            feedback_data: list of {algorithmScores: {content,collaborative,success,clustering},
                                    wasApplied: bool}
        Returns:
            bool: True if weights were updated, False if not enough data.
        """
        if not feedback_data or len(feedback_data) < 5:
            logger.info('Weight update skipped — not enough feedback data (need >=5 records)')
            return False

        LEARNING_RATE = 0.01
        MAX_CHANGE    = 0.05

        # FIX #3: Use adoption outcomes as a 3× stronger signal than mere applications.
        # adopted=5.0 rating is ground truth; applied (not yet adopted) = 1.5×; not applied = 1×.
        # This prevents the weight adapter being tuned only on noisy application signals while
        # ignoring the hardest, most committed positive signal: a completed adoption.
        def _weighted_avg(records, algo):
            ws, ws_sum = 0.0, 0.0
            for f in records:
                s = f.get('algorithmScores', {}).get(algo, 50)
                w = 3.0 if f.get('wasAdopted') else (1.5 if f.get('wasApplied') else 1.0)
                ws_sum += s * w
                ws += w
            return ws_sum / ws if ws > 0 else 50.0

        positive  = [f for f in feedback_data if f.get('wasApplied') or f.get('wasAdopted')]
        negative  = [f for f in feedback_data if not f.get('wasApplied') and not f.get('wasAdopted')]
        n_adopted = sum(1 for f in positive if f.get('wasAdopted'))

        if not positive:
            logger.info('Weight update skipped — no applied/adopted pets in feedback')
            return False

        old_weights = dict(self.weights)

        for algo in list(self.weights.keys()):
            avg_positive = _weighted_avg(positive, algo)
            avg_negative = _weighted_avg(negative, algo) if negative else 50.0

            # Positive delta → algorithm scores positive-outcome pets higher → boost weight
            delta = (avg_positive - avg_negative) / 100.0 * LEARNING_RATE
            delta = max(-MAX_CHANGE, min(MAX_CHANGE, delta))
            self.weights[algo] = max(0.05, min(0.60, self.weights[algo] + delta))

        # Re-normalise: weights must always sum to 1.0
        total = sum(self.weights.values())
        self.weights = {k: round(v / total, 4) for k, v in self.weights.items()}

        logger.info(f'Weights updated from {len(feedback_data)} feedback records '
                    f'({len(positive)} positive [{n_adopted} adopted], {len(negative)} negative)')
        logger.info(f'Old: {old_weights} → New: {self.weights}')
        self._save_weights()  # Persist so weights survive Flask restarts
        return True

    def _save_weights(self):
        """Persist current adapted weights to JSON so they survive Flask restarts."""
        try:
            state = {}
            if os.path.exists(_WEIGHTS_STATE_PATH):
                with open(_WEIGHTS_STATE_PATH, 'r') as f:
                    state = json.load(f)
            state['weights'] = self.weights
            state['updatedAt'] = datetime.now().isoformat()
            with open(_WEIGHTS_STATE_PATH, 'w') as f:
                json.dump(state, f, indent=2)
            logger.info(f'Weights persisted to disk: {self.weights}')
        except Exception as e:
            logger.warning(f'Could not save weights to disk: {e}')

    def _load_weights_from_disk(self):
        """Load adapted weights from disk if they exist (called in __init__)."""
        try:
            if os.path.exists(_WEIGHTS_STATE_PATH):
                with open(_WEIGHTS_STATE_PATH, 'r') as f:
                    state = json.load(f)
                saved = state.get('weights', {})
                required = {'content', 'collaborative', 'success', 'clustering'}
                if required.issubset(saved.keys()):
                    total = sum(saved.values())
                    if 0.95 <= total <= 1.05:
                        self.weights = {k: float(v) for k, v in saved.items() if k in required}
                        logger.info(f'Weights restored from disk: {self.weights}')
        except Exception as e:
            logger.warning(f'Could not load weights from disk (using defaults): {e}')

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

    def _get_user_warmth(self, user_id: str) -> float:
        """
        FIX #9: Returns 0.0 (cold) → 1.0 (fully warm) based on how much the
        user's SVD mean rating deviates from the global average.
        - Small deviation → user has few / weak interactions → stay closer to cold_start weights
        - Deviation ≥ 0.5 on 0-5 scale → user has a clear taste signal → use normal weights
        This prevents users with a handful of interactions immediately jumping to
        full collaborative-filter weighting before SVD has enough signal on them.
        """
        if not self.cf_model or not self.cf_model.trained:
            return 0.0
        user_mean = self.cf_model.user_means.get(str(user_id))
        if user_mean is None:
            return 0.0
        deviation = abs(user_mean - self.cf_model.global_mean)
        # 0.5+ deviation on 0-5 scale = user has a distinctive taste = fully warm
        return min(1.0, deviation / 0.5)

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

        # FIX #6: Redistribute lost SVD weight to content (50%), XGBoost success (30%),
        # and clustering (20%).  Previously success got nothing even though XGBoost
        # is purely feature-based and works perfectly for brand-new users/pets outside
        # the SVD training set — it's the most reliable algorithm when SVD has no data.
        adjusted['content']   = adjusted.get('content',   0.0) + redistributed * 0.50
        adjusted['success']   = adjusted.get('success',   0.0) + redistributed * 0.30
        adjusted['clustering'] = adjusted.get('clustering', 0.0) + redistributed * 0.20
        
        logger.debug(
            f"SVD was_impossible (conf={cf_confidence:.0f}%), weights adjusted: "
            f"collab {original_cf_weight:.2f}→{reduced_cf_weight:.2f}, "
            f"content +{redistributed*0.65:.2f}, cluster +{redistributed*0.35:.2f}"
        )
        
        return adjusted

    def _adjust_weights_for_species(self, weights: Dict, species: str) -> Dict:
        """
        FIX #7: Adjust algorithm weights based on species.
        - Dogs: activity match is critical → boost content weight slightly
        - Cats: personality/independence matters more → boost clustering weight
        Weights are re-normalized to always sum to 1.0.
        """
        adjusted = weights.copy()
        species_lower = str(species).lower()

        if species_lower == 'dog':
            # Dogs need strong activity match — content scoring captures this best
            delta = 0.05
            adjusted['content'] = adjusted.get('content', 0.30) + delta
            adjusted['clustering'] = max(0.05, adjusted.get('clustering', 0.15) - delta)
        elif species_lower == 'cat':
            # Cats are independent — personality cluster match matters more than raw activity
            delta = 0.05
            adjusted['clustering'] = adjusted.get('clustering', 0.15) + delta
            adjusted['content'] = max(0.15, adjusted.get('content', 0.30) - delta)

        # Re-normalize so weights always sum to 1.0
        total = sum(adjusted.values())
        if total > 0:
            adjusted = {k: v / total for k, v in adjusted.items()}

        return adjusted

    def _apply_diversity(
        self,
        recommendations: List[Dict],
        user_profile: Optional[Dict] = None,
        max_per_breed: int = 3
    ) -> List[Dict]:
        """
        FIX #5: Prevent all top results being the same breed.
        Caps any single breed to max_per_breed occurrences in the final list.
        Exception: if the user explicitly states a preferredBreed, that breed
        gets a higher cap (5 instead of 3) so the diversity filter doesn't work
        against users who know exactly what breed they want.
        Overflow pets are appended at the end (still visible, just lower priority).
        """
        # Honour user's stated breed preference with a relaxed cap
        raw_pref = (user_profile or {}).get('preferredBreed', '')
        preferred_breed_lower = str(raw_pref).strip().lower() if raw_pref else ''

        breed_counts: Dict[str, int] = {}
        primary: List[Dict] = []
        overflow: List[Dict] = []

        for rec in recommendations:
            breed = str(rec.get('breed', 'Unknown')).strip().lower()
            # Preferred breed gets relaxed cap (5); all others use default (3)
            cap = 5 if (preferred_breed_lower and breed == preferred_breed_lower) else max_per_breed
            count = breed_counts.get(breed, 0)
            if count < cap:
                primary.append(rec)
                breed_counts[breed] = count + 1
            else:
                overflow.append(rec)

        diverse = primary + overflow
        top5_breeds = dict(list(breed_counts.items())[:5])
        logger.info(f"Diversity re-ranking: {len(primary)} primary + {len(overflow)} overflow | top breeds: {top5_breeds}")
        return diverse

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
