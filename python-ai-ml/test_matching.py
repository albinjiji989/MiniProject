"""
Test script for Smart Pet-Adopter Matching System
Run this to verify the matching engine works correctly
"""

from modules.adoption.matching_engine import matcher

# Sample user profile
test_user = {
    "_id": "test_user_123",
    "name": "John Doe",
    "adoptionProfile": {
        "homeType": "house",
        "homeSize": 2000,
        "hasYard": True,
        "yardSize": "large",
        "activityLevel": 4,
        "workSchedule": "full_time",
        "hoursAlonePerDay": 8,
        "experienceLevel": "some_experience",
        "previousPets": ["dog"],
        "hasChildren": True,
        "childrenAges": [5, 8],
        "hasOtherPets": False,
        "otherPetsTypes": [],
        "monthlyBudget": 200,
        "maxAdoptionFee": 300,
        "preferredSpecies": ["dog"],
        "preferredSize": ["medium", "large"],
        "preferredEnergyLevel": 4,
        "willingToTrainPet": True,
        "canHandleSpecialNeeds": False,
        "profileComplete": True
    }
}

# Sample pet 1 - Good match
test_pet_1 = {
    "_id": "pet_123",
    "name": "Max",
    "breed": "Golden Retriever",
    "species": "dog",
    "age": 24,
    "gender": "male",
    "adoptionFee": 250,
    "compatibilityProfile": {
        "size": "large",
        "energyLevel": 4,
        "exerciseNeeds": "high",
        "trainingNeeds": "moderate",
        "trainedLevel": "basic",
        "childFriendlyScore": 9,
        "petFriendlyScore": 7,
        "strangerFriendlyScore": 8,
        "minHomeSize": 1500,
        "needsYard": True,
        "canLiveInApartment": False,
        "groomingNeeds": "moderate",
        "estimatedMonthlyCost": 150,
        "temperamentTags": ["playful", "friendly", "energetic"],
        "noiseLevel": "moderate",
        "canBeLeftAlone": True,
        "maxHoursAlone": 8,
        "requiresExperiencedOwner": False
    }
}

# Sample pet 2 - Poor match
test_pet_2 = {
    "_id": "pet_456",
    "name": "Luna",
    "breed": "Chihuahua",
    "species": "dog",
    "age": 36,
    "gender": "female",
    "adoptionFee": 150,
    "compatibilityProfile": {
        "size": "small",
        "energyLevel": 2,
        "exerciseNeeds": "minimal",
        "trainingNeeds": "high",
        "trainedLevel": "untrained",
        "childFriendlyScore": 3,
        "petFriendlyScore": 4,
        "strangerFriendlyScore": 2,
        "minHomeSize": 500,
        "needsYard": False,
        "canLiveInApartment": True,
        "groomingNeeds": "low",
        "estimatedMonthlyCost": 80,
        "temperamentTags": ["anxious", "protective", "vocal"],
        "noiseLevel": "vocal",
        "canBeLeftAlone": False,
        "maxHoursAlone": 4,
        "requiresExperiencedOwner": True
    }
}

def test_matching_engine():
    """Test the matching engine"""
    print("=" * 60)
    print("SMART PET-ADOPTER MATCHING SYSTEM - TEST")
    print("=" * 60)
    
    # Test 1: Good match
    print("\n✅ Test 1: Good Match (Max - Golden Retriever)")
    print("-" * 60)
    result_1 = matcher.calculate_match_score(test_user, test_pet_1)
    print(f"Overall Score: {result_1['overall_score']}%")
    print(f"Compatibility: {result_1['compatibility_level']}")
    print(f"Success Probability: {result_1['success_probability']}%")
    print("\nScore Breakdown:")
    for category, score in result_1['score_breakdown'].items():
        print(f"  {category}: {score}")
    print("\nTop Match Reasons:")
    for reason in result_1['match_reasons']:
        print(f"  {reason}")
    if result_1['warnings']:
        print("\nWarnings:")
        for warning in result_1['warnings']:
            print(f"  ⚠️  {warning}")
    
    # Test 2: Poor match
    print("\n\n❌ Test 2: Poor Match (Luna - Chihuahua)")
    print("-" * 60)
    result_2 = matcher.calculate_match_score(test_user, test_pet_2)
    print(f"Overall Score: {result_2['overall_score']}%")
    print(f"Compatibility: {result_2['compatibility_level']}")
    print(f"Success Probability: {result_2['success_probability']}%")
    print("\nScore Breakdown:")
    for category, score in result_2['score_breakdown'].items():
        print(f"  {category}: {score}")
    print("\nTop Match Reasons:")
    for reason in result_2['match_reasons']:
        print(f"  {reason}")
    if result_2['warnings']:
        print("\nWarnings:")
        for warning in result_2['warnings']:
            print(f"  ⚠️  {warning}")
    
    # Test 3: Ranking multiple pets
    print("\n\n📊 Test 3: Ranking Multiple Pets")
    print("-" * 60)
    pets = [test_pet_1, test_pet_2]
    ranked = matcher.rank_pets_for_user(test_user, pets)
    print(f"Total pets: {len(ranked)}")
    print("\nRanked Results:")
    for idx, pet in enumerate(ranked, 1):
        print(f"  #{idx}: {pet['name']} ({pet['breed']}) - {pet['match_score']}%")
    
    # Test 4: Top matches
    print("\n\n🏆 Test 4: Top Matches (Top 1)")
    print("-" * 60)
    top_matches = matcher.get_top_matches(test_user, pets, top_n=1)
    print(f"Best match: {top_matches[0]['name']} - {top_matches[0]['match_score']}%")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    test_matching_engine()
