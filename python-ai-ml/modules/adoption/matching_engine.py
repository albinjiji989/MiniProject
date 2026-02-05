"""
Smart Pet-Adopter Matching Engine
Uses content-based filtering to match users with compatible pets
"""
import numpy as np
from typing import Dict, List, Tuple, Optional


class PetAdopterMatcher:
    """
    Intelligent matching system for pet adoption
    Calculates compatibility scores based on lifestyle, living situation, and preferences
    """
    
    def __init__(self):
        self.weights = {
            'living_space': 0.20,
            'activity_compatibility': 0.25,
            'experience_match': 0.15,
            'family_safety': 0.20,
            'budget': 0.10,
            'preferences': 0.10
        }
    
    def calculate_match_score(self, user_profile: Dict, pet_profile: Dict) -> Dict:
        """
        Calculate overall compatibility score between user and pet
        
        Args:
            user_profile: User's adoption profile data
            pet_profile: Pet's compatibility profile data
            
        Returns:
            Dictionary with score and breakdown
        """
        scores = {}
        reasons = []
        warnings = []
        
        # 1. Living Space Compatibility (20 points)
        living_score, living_reasons = self._score_living_space(user_profile, pet_profile)
        scores['living_space'] = living_score
        reasons.extend(living_reasons)
        
        # 2. Activity Level Match (25 points)
        activity_score, activity_reasons = self._score_activity_match(user_profile, pet_profile)
        scores['activity'] = activity_score
        reasons.extend(activity_reasons)
        
        # 3. Experience Match (15 points)
        experience_score, exp_reasons = self._score_experience(user_profile, pet_profile)
        scores['experience'] = experience_score
        reasons.extend(exp_reasons)
        
        # 4. Family Safety (20 points)
        family_score, family_reasons, family_warnings = self._score_family_compatibility(user_profile, pet_profile)
        scores['family'] = family_score
        reasons.extend(family_reasons)
        warnings.extend(family_warnings)
        
        # 5. Budget Match (10 points)
        budget_score, budget_reasons = self._score_budget(user_profile, pet_profile)
        scores['budget'] = budget_score
        reasons.extend(budget_reasons)
        
        # 6. Preference Match (10 points)
        pref_score, pref_reasons = self._score_preferences(user_profile, pet_profile)
        scores['preferences'] = pref_score
        reasons.extend(pref_reasons)
        
        # Calculate weighted total
        total_score = sum(scores.values())
        
        # Determine compatibility level
        if total_score >= 85:
            compatibility = "Excellent Match"
            color = "green"
        elif total_score >= 70:
            compatibility = "Great Match"
            color = "blue"
        elif total_score >= 55:
            compatibility = "Good Match"
            color = "yellow"
        else:
            compatibility = "Fair Match"
            color = "orange"
        
        return {
            'overall_score': round(total_score, 1),
            'compatibility_level': compatibility,
            'color': color,
            'score_breakdown': scores,
            'match_reasons': reasons[:5],  # Top 5 reasons
            'warnings': warnings,
            'success_probability': self._predict_success_probability(total_score, user_profile, pet_profile)
        }
    
    def _score_living_space(self, user: Dict, pet: Dict) -> Tuple[float, List[str]]:
        """Score based on living space compatibility"""
        score = 0
        reasons = []
        max_score = 20
        
        adoption_profile = user.get('adoptionProfile', {})
        compat_profile = pet.get('compatibilityProfile', {})
        
        # Check if compatibility profile exists
        if not compat_profile:
            reasons.append(f"⚠️ Pet compatibility profile not set - using neutral scoring")
            return 10, reasons  # Return neutral score
        
        home_type = adoption_profile.get('homeType')
        home_size = adoption_profile.get('homeSize', 0)
        has_yard = adoption_profile.get('hasYard', False)
        
        # NO DEFAULTS - use actual values only
        pet_size = compat_profile.get('size')
        needs_yard = compat_profile.get('needsYard')
        can_apartment = compat_profile.get('canLiveInApartment')
        min_home_size = compat_profile.get('minHomeSize', 0)
        
        # Skip if critical fields are missing
        if pet_size is None or needs_yard is None or can_apartment is None:
            reasons.append(f"⚠️ Incomplete pet profile - living space compatibility unknown")
            return 10, reasons  # Neutral score
        
        # Home type compatibility
        if home_type == 'apartment':
            if can_apartment and pet_size == 'small':
                score += 10
                reasons.append(f"✓ {pet.get('breed', 'Pet')} is perfect for apartment living")
            elif can_apartment and pet_size == 'medium':
                score += 7
                reasons.append(f"✓ {pet.get('breed', 'Pet')} can adapt to apartment life")
            elif not can_apartment:
                score += 2
                reasons.append(f"⚠️ {pet.get('breed', 'Pet')} may struggle in apartment")
        elif home_type in ['house', 'farm']:
            score += 10
            reasons.append(f"✓ Your {home_type} provides great space")
        
        # Yard requirement
        if needs_yard:
            if has_yard:
                score += 10
                reasons.append(f"✓ You have a yard - perfect for {pet.get('breed', 'Pet')}!")
            else:
                score += 3
                reasons.append(f"⚠️ {pet.get('breed', 'Pet')} really needs a yard")
        else:
            score += 10
        
        # Home size check
        if home_size and home_size >= min_home_size:
            reasons.append(f"✓ Your home size ({home_size} sq ft) is adequate")
        elif min_home_size > 0:
            score = score * 0.8  # Reduce score slightly
        
        return min(score, max_score), reasons
    
    def _score_activity_match(self, user: Dict, pet: Dict) -> Tuple[float, List[str]]:
        """Score based on activity level compatibility"""
        score = 0
        reasons = []
        max_score = 25
        
        adoption_profile = user.get('adoptionProfile', {})
        compat_profile = pet.get('compatibilityProfile', {})
        
        # Check if compatibility profile exists
        if not compat_profile:
            reasons.append(f"⚠️ Pet activity profile not set")
            return 12, reasons  # Neutral score
        
        user_activity = adoption_profile.get('activityLevel', 3)
        
        # NO DEFAULTS - use actual values only
        pet_energy = compat_profile.get('energyLevel')
        hours_alone = adoption_profile.get('hoursAlonePerDay', 8)
        max_hours_alone = compat_profile.get('maxHoursAlone')
        can_be_alone = compat_profile.get('canBeLeftAlone')
        
        # Skip if critical fields are missing
        if pet_energy is None or max_hours_alone is None or can_be_alone is None:
            reasons.append(f"⚠️ Incomplete activity profile - using neutral scoring")
            return 12, reasons  # Neutral score
        
        # Activity level match
        activity_diff = abs(user_activity - pet_energy)
        if activity_diff == 0:
            score += 15
            reasons.append(f"✓ Perfect activity match - you're both level {user_activity}")
        elif activity_diff == 1:
            score += 12
            reasons.append(f"✓ Great activity compatibility")
        elif activity_diff == 2:
            score += 8
            reasons.append(f"~ Activity levels mostly aligned")
        else:
            score += 4
            reasons.append(f"⚠️ Different activity levels may require adjustment")
        
        # Alone time compatibility
        if not can_be_alone and hours_alone > 4:
            score += 2
            reasons.append(f"⚠️ {pet.get('breed', 'Pet')} doesn't like being alone for long")
        elif hours_alone <= max_hours_alone:
            score += 10
            reasons.append(f"✓ Your schedule works well for {pet.get('breed', 'Pet')}")
        else:
            score += 5
            reasons.append(f"~ {pet.get('breed', 'Pet')} might need a pet sitter sometimes")
        
        return min(score, max_score), reasons
    
    def _score_experience(self, user: Dict, pet: Dict) -> Tuple[float, List[str]]:
        """Score based on experience level match"""
        score = 0
        reasons = []
        max_score = 15
        
        adoption_profile = user.get('adoptionProfile', {})
        compat_profile = pet.get('compatibilityProfile', {})
        
        # Check if compatibility profile exists
        if not compat_profile:
            return 7, [f"⚠️ Pet experience requirements not set"]  # Neutral score
        
        experience = adoption_profile.get('experienceLevel', 'first_time')
        
        # NO DEFAULTS - use actual values only
        requires_experienced = compat_profile.get('requiresExperiencedOwner')
        training_needs = compat_profile.get('trainingNeeds')
        willing_to_train = adoption_profile.get('willingToTrainPet', True)
        
        # Skip if critical fields are missing
        if requires_experienced is None or training_needs is None:
            return 7, [f"⚠️ Incomplete experience profile - using neutral scoring"]  # Neutral score
        
        experience_levels = {'first_time': 1, 'some_experience': 2, 'experienced': 3, 'expert': 4}
        user_exp_level = experience_levels.get(experience, 1)
        
        # Experience requirement
        if requires_experienced:
            if user_exp_level >= 3:
                score += 10
                reasons.append(f"✓ Your experience level is perfect for this pet")
            elif user_exp_level == 2:
                score += 5
                reasons.append(f"~ This pet may be challenging but manageable")
            else:
                score += 2
                reasons.append(f"⚠️ This pet needs an experienced owner")
        else:
            score += 10
            reasons.append(f"✓ Great for your experience level")
        
        # Training needs
        if training_needs == 'high':
            if willing_to_train and user_exp_level >= 2:
                score += 5
                reasons.append(f"✓ You're ready to train {pet.get('breed', 'Pet')}")
            elif willing_to_train:
                score += 3
            else:
                score += 1
                reasons.append(f"⚠️ This pet needs training commitment")
        else:
            score += 5
        
        return min(score, max_score), reasons
    
    def _score_family_compatibility(self, user: Dict, pet: Dict) -> Tuple[float, List[str], List[str]]:
        """Score based on family safety and compatibility"""
        score = 0
        reasons = []
        warnings = []
        max_score = 20
        
        adoption_profile = user.get('adoptionProfile', {})
        compat_profile = pet.get('compatibilityProfile', {})
        
        # Check if compatibility profile exists
        if not compat_profile:
            return 10, [f"⚠️ Pet family compatibility not set"], []  # Neutral score
        
        has_children = adoption_profile.get('hasChildren', False)
        children_ages = adoption_profile.get('childrenAges', [])
        has_other_pets = adoption_profile.get('hasOtherPets', False)
        
        # NO DEFAULTS - use actual values only
        child_friendly = compat_profile.get('childFriendlyScore')
        pet_friendly = compat_profile.get('petFriendlyScore')
        
        # Skip if critical fields are missing
        if child_friendly is None or pet_friendly is None:
            return 10, [f"⚠️ Incomplete family compatibility profile"], []  # Neutral score
        
        # Children compatibility
        if has_children:
            youngest = min(children_ages) if children_ages else 0
            if child_friendly >= 8:
                score += 10
                reasons.append(f"✓ Excellent with children!")
            elif child_friendly >= 6:
                score += 7
                reasons.append(f"✓ Good with children")
            elif child_friendly >= 4:
                score += 4
                reasons.append(f"~ May need supervision with young children")
                if youngest < 5:
                    warnings.append(f"Careful supervision needed with children under 5")
            else:
                score += 1
                warnings.append(f"Not recommended for homes with children")
        else:
            score += 10
        
        # Other pets compatibility
        if has_other_pets:
            if pet_friendly >= 8:
                score += 10
                reasons.append(f"✓ Gets along great with other pets")
            elif pet_friendly >= 6:
                score += 7
                reasons.append(f"✓ Can live with other pets")
            elif pet_friendly >= 4:
                score += 4
                reasons.append(f"~ Slow introduction to other pets recommended")
            else:
                score += 1
                warnings.append(f"Prefers to be the only pet")
        else:
            score += 10
        
        return min(score, max_score), reasons, warnings
    
    def _score_budget(self, user: Dict, pet: Dict) -> Tuple[float, List[str]]:
        """Score based on budget compatibility"""
        score = 0
        reasons = []
        max_score = 10
        
        adoption_profile = user.get('adoptionProfile', {})
        compat_profile = pet.get('compatibilityProfile', {})
        
        # Check if compatibility profile exists
        if not compat_profile:
            return 5, [f"⚠️ Pet cost information not set"]  # Neutral score
        
        monthly_budget = adoption_profile.get('monthlyBudget')
        max_adoption_fee = adoption_profile.get('maxAdoptionFee')
        
        adoption_fee = pet.get('adoptionFee', 0)
        # NO DEFAULTS - use actual value only
        estimated_monthly = compat_profile.get('estimatedMonthlyCost')
        
        # Skip if critical field is missing
        if estimated_monthly is None:
            estimated_monthly = 100  # Only for budget, use minimum estimate
            reasons.append(f"⚠️ Monthly cost not set - assuming ${estimated_monthly}")
        
        # Adoption fee check
        if max_adoption_fee is not None:
            if adoption_fee <= max_adoption_fee:
                score += 5
                reasons.append(f"✓ Adoption fee (${adoption_fee}) within budget")
            else:
                score += 1
                reasons.append(f"⚠️ Adoption fee (${adoption_fee}) above your max")
        else:
            score += 5
        
        # Monthly cost check
        if monthly_budget is not None:
            if estimated_monthly <= monthly_budget:
                score += 5
                reasons.append(f"✓ Monthly costs (~${estimated_monthly}) fit your budget")
            elif estimated_monthly <= monthly_budget * 1.2:
                score += 3
                reasons.append(f"~ Monthly costs slightly above budget")
            else:
                score += 1
                reasons.append(f"⚠️ Monthly costs may strain your budget")
        else:
            score += 5
        
        return min(score, max_score), reasons
    
    def _score_preferences(self, user: Dict, pet: Dict) -> Tuple[float, List[str]]:
        """Score based on user preferences"""
        score = 0
        reasons = []
        max_score = 10
        
        adoption_profile = user.get('adoptionProfile', {})
        compat_profile = pet.get('compatibilityProfile', {})
        
        # Check if compatibility profile exists
        if not compat_profile:
            return 5, [f"⚠️ Pet preferences profile not set"]  # Neutral score
        
        preferred_species = adoption_profile.get('preferredSpecies', [])
        preferred_size = adoption_profile.get('preferredSize', [])
        preferred_energy = adoption_profile.get('preferredEnergyLevel')
        
        pet_species = pet.get('species', '').lower()
        # NO DEFAULTS - use actual values only
        pet_size = compat_profile.get('size')
        pet_energy = compat_profile.get('energyLevel')
        
        # Skip if critical fields are missing
        if pet_size is None or pet_energy is None:
            return 5, [f"⚠️ Incomplete preference profile - using neutral scoring"]  # Neutral score
        
        # Species preference
        if preferred_species:
            if pet_species in [s.lower() for s in preferred_species]:
                score += 4
                reasons.append(f"✓ Matches your species preference")
            else:
                score += 1
        else:
            score += 4
        
        # Size preference
        if preferred_size:
            if pet_size in preferred_size:
                score += 3
                reasons.append(f"✓ {pet_size.capitalize()} size as preferred")
            else:
                score += 1
        else:
            score += 3
        
        # Energy preference
        if preferred_energy:
            energy_diff = abs(preferred_energy - pet_energy)
            if energy_diff <= 1:
                score += 3
                reasons.append(f"✓ Energy level matches preference")
            else:
                score += 1
        else:
            score += 3
        
        return min(score, max_score), reasons
    
    def _predict_success_probability(self, match_score: float, user: Dict, pet: Dict) -> float:
        """
        Predict adoption success probability based on match score and other factors
        Simple rule-based for now, can be replaced with ML model trained on historical data
        """
        base_probability = match_score
        
        # Adjust based on specific risk factors
        adoption_profile = user.get('adoptionProfile', {})
        
        # First-time owners with high-need pets = slight risk
        if (adoption_profile.get('experienceLevel') == 'first_time' and 
            pet.get('compatibilityProfile', {}).get('requiresExperiencedOwner', False)):
            base_probability *= 0.85
        
        # Profile completeness indicates serious adopter
        if adoption_profile.get('profileComplete', False):
            base_probability *= 1.05
        
        return min(round(base_probability, 1), 100)
    
    def rank_pets_for_user(self, user_profile: Dict, pets: List[Dict]) -> List[Dict]:
        """
        Rank all available pets by compatibility for a specific user
        
        Args:
            user_profile: User's profile data
            pets: List of pet profiles
            
        Returns:
            List of pets with match scores, sorted by compatibility
        """
        scored_pets = []
        
        for pet in pets:
            match_result = self.calculate_match_score(user_profile, pet)
            pet_with_score = {
                **pet,
                'match_score': match_result['overall_score'],
                'match_details': match_result
            }
            scored_pets.append(pet_with_score)
        
        # Sort by match score (highest first)
        scored_pets.sort(key=lambda x: x['match_score'], reverse=True)
        
        return scored_pets
    
    def get_top_matches(self, user_profile: Dict, pets: List[Dict], top_n: int = 5) -> List[Dict]:
        """Get top N best matches for user"""
        ranked = self.rank_pets_for_user(user_profile, pets)
        return ranked[:top_n]


# Singleton instance
matcher = PetAdopterMatcher()
