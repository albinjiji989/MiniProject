"""
Custom India-Focused Pet Adoption Dataset Generator
====================================================
Generates a realistic CSV dataset of dogs and cats
with Indian + international breeds, using the EXACT
field schema of AdoptionPet.js compatibilityProfile.

NO IMAGES NEEDED — this powers XGBoost + K-Means only.

Run once to generate:
    python generate_custom_dataset.py

Output:
    data/custom_adoption_dataset.csv  (~800 records)

Breeds covered:
  Dogs: 13 Indian breeds + 15 international breeds common in India
  Cats:  9 cat breeds available in Indian shelters
"""

import os
import csv
import random
import math
from datetime import datetime, timedelta

random.seed(42)

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           'data', 'custom_adoption_dataset.csv')

# ============================================================================
# BREED MASTER PROFILES
# Every field matches AdoptionPet.js compatibilityProfile schema exactly.
#
# Fields:
#   size                    : small | medium | large
#   energy_level            : 1-5
#   exercise_needs          : minimal | moderate | high | very_high
#   training_needs          : low | moderate | high
#   trained_level           : untrained | basic | intermediate | advanced
#   child_friendly_score    : 0-10
#   pet_friendly_score      : 0-10
#   stranger_friendly_score : 0-10
#   needs_yard              : True | False
#   can_live_in_apartment   : True | False
#   grooming_needs          : low | moderate | high
#   estimated_monthly_cost  : INR (₹) — Indian context
#   noise_level             : quiet | moderate | vocal
#   can_be_left_alone       : True | False
#   max_hours_alone         : 1-12
#   requires_experienced_owner : True | False
#   temperament_tags        : comma-separated string
# ============================================================================

# ────────────────────────────────────────────────────────────────────────────
# INDIAN DOG BREEDS
# ────────────────────────────────────────────────────────────────────────────
INDIAN_DOG_BREEDS = {

    'Indian Pariah Dog': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 7, 'pet_friendly_score': 6, 'stranger_friendly_score': 4,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1500,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 7,
        'requires_experienced_owner': False,
        'temperament_tags': 'alert,loyal,intelligent,independent,hardy',
        'description': 'Ancient landrace breed, extremely hardy and healthy. Highly adaptable to Indian climate. Intelligent and loyal to family.'
    },

    'Rajapalayam': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'large', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'high', 'trained_level': 'intermediate',
        'child_friendly_score': 5, 'pet_friendly_score': 3, 'stranger_friendly_score': 2,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 2500,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'loyal,protective,independent,brave,reserved',
        'description': 'Royal Tamil Nadu sighthound. One-person dog — extremely loyal to owner, aloof with strangers. Needs experienced handler.'
    },

    'Mudhol Hound': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'large', 'energy_level': 5, 'exercise_needs': 'very_high',
        'training_needs': 'high', 'trained_level': 'intermediate',
        'child_friendly_score': 5, 'pet_friendly_score': 3, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 2000,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'agile,fast,independent,reserved,athletic',
        'description': 'Karnataka sighthound used by Indian Army. Needs vast space and daily running. Not suited for apartment or first-time owners.'
    },

    'Chippiparai': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 5, 'exercise_needs': 'very_high',
        'training_needs': 'high', 'trained_level': 'basic',
        'child_friendly_score': 5, 'pet_friendly_score': 4, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1800,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'fast,agile,elegant,reserved,hunter',
        'description': 'Madurai sighthound, bred for hunting. Very fast. Better with experienced owners who can provide structured exercise.'
    },

    'Kanni': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 5, 'pet_friendly_score': 4, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1800,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'gentle,loyal,agile,reserved,graceful',
        'description': 'Rare Tamil Nadu breed. Gentle with family once bonded. Requires open space and an experienced owner.'
    },

    'Combai': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'high', 'trained_level': 'basic',
        'child_friendly_score': 5, 'pet_friendly_score': 3, 'stranger_friendly_score': 2,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1600,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'brave,aggressive,protective,powerful,loyal',
        'description': 'Bear-hunting dog from Tamil Nadu. Powerful guardian. Requires firm training, socialization, and an experienced handler.'
    },

    'Rampur Greyhound': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'large', 'energy_level': 5, 'exercise_needs': 'very_high',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 6, 'pet_friendly_score': 4, 'stranger_friendly_score': 4,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 2200,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'fast,independent,agile,royal,reserved',
        'description': 'Cross between Afghan Hound and English Greyhound, bred for royalty in Rampur. Extremely fast, needs vast open space.'
    },

    'Bakharwal Dog': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'large', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'high', 'trained_level': 'basic',
        'child_friendly_score': 6, 'pet_friendly_score': 4, 'stranger_friendly_score': 2,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'high', 'estimated_monthly_cost': 3000,
        'noise_level': 'vocal', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'protective,brave,independent,sturdy,herding',
        'description': 'Ancient Himalayan livestock guardian. Thick double coat. Protective of family. Thrives in cold climates, needs experienced owner.'
    },

    'Gaddi Kutta': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'large', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'high', 'trained_level': 'intermediate',
        'child_friendly_score': 7, 'pet_friendly_score': 5, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'high', 'estimated_monthly_cost': 3000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'protective,gentle-with-family,brave,mountain-dog',
        'description': 'Himalayan sheepdog. Excellent family protector. Good with children in family but suspicious of strangers.'
    },

    'Jonangi': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 7, 'pet_friendly_score': 6, 'stranger_friendly_score': 5,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1500,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 6,
        'requires_experienced_owner': False,
        'temperament_tags': 'quiet,one-owner,loyal,agile,unusual-vocalization',
        'description': "Andhra Pradesh duck-herding dog. Uniquely doesn't bark — yodels instead. Low maintenance. Can be aloof with strangers."
    },

    'Pandikona': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 6, 'pet_friendly_score': 5, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1500,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 6,
        'requires_experienced_owner': True,
        'temperament_tags': 'protective,primitive,loyal,independent',
        'description': 'Andhra Pradesh primitive breed. Loyal to owner, wary of strangers. Hardy, low maintenance, suited to rural areas.'
    },

    'Indian Spitz': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'small', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 8, 'pet_friendly_score': 7, 'stranger_friendly_score': 6,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 2000,
        'noise_level': 'vocal', 'can_be_left_alone': True, 'max_hours_alone': 7,
        'requires_experienced_owner': False,
        'temperament_tags': 'playful,loyal,alert,vocal,adaptable',
        'description': 'Most popular Indian apartment dog. Fluffy, affectionate, highly adaptable. Barks frequently — good watchdog.'
    },

    'Himalayan Sheepdog': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'large', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'high', 'trained_level': 'basic',
        'child_friendly_score': 7, 'pet_friendly_score': 5, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'high', 'estimated_monthly_cost': 2800,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'protective,loyal,mountain,sturdy,guardian',
        'description': 'North Indian mountain guardian. Dense thick coat. Needs cooler climate or air-conditioned space in summer.'
    },
}

# ────────────────────────────────────────────────────────────────────────────
# INTERNATIONAL DOG BREEDS (commonly available in Indian shelters/breeders)
# ────────────────────────────────────────────────────────────────────────────
INTERNATIONAL_DOG_BREEDS = {

    'Labrador Retriever': {
        'species': 'Dog', 'origin': 'International',
        'size': 'large', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 10, 'pet_friendly_score': 9, 'stranger_friendly_score': 9,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'moderate', 'estimated_monthly_cost': 4000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': False,
        'temperament_tags': 'friendly,outgoing,gentle,trainable,family-dog',
        'description': 'Most popular family dog in India. Excellent with children. Needs daily exercise and mental stimulation.'
    },

    'German Shepherd': {
        'species': 'Dog', 'origin': 'International',
        'size': 'large', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 7, 'pet_friendly_score': 5, 'stranger_friendly_score': 4,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'moderate', 'estimated_monthly_cost': 5000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': False,
        'temperament_tags': 'loyal,protective,intelligent,versatile,brave',
        'description': 'Highly intelligent working dog. Loyal protector. Needs consistent training and daily exercise.'
    },

    'Golden Retriever': {
        'species': 'Dog', 'origin': 'International',
        'size': 'large', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 10, 'pet_friendly_score': 9, 'stranger_friendly_score': 9,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'high', 'estimated_monthly_cost': 5000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': False,
        'temperament_tags': 'gentle,friendly,patient,trainable,playful',
        'description': 'Outstanding family companion. Excellent with children and other pets. Heavy shedder — needs regular grooming.'
    },

    'Beagle': {
        'species': 'Dog', 'origin': 'International',
        'size': 'medium', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'high', 'trained_level': 'basic',
        'child_friendly_score': 9, 'pet_friendly_score': 8, 'stranger_friendly_score': 8,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 3500,
        'noise_level': 'vocal', 'can_be_left_alone': False, 'max_hours_alone': 4,
        'requires_experienced_owner': False,
        'temperament_tags': 'curious,merry,friendly,vocal,scent-driven',
        'description': 'Popular family dog. Follows nose everywhere — needs secure yard. Vocal breed, can disturb neighbors.'
    },

    'Pomeranian': {
        'species': 'Dog', 'origin': 'International',
        'size': 'small', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 5, 'pet_friendly_score': 5, 'stranger_friendly_score': 5,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 3000,
        'noise_level': 'vocal', 'can_be_left_alone': True, 'max_hours_alone': 7,
        'requires_experienced_owner': False,
        'temperament_tags': 'alert,bold,fluffy,vocal,attention-seeking',
        'description': 'Popular apartment dog. Fluffy and bold. Not ideal with very young children. Vocal watchdog.'
    },

    'Shih Tzu': {
        'species': 'Dog', 'origin': 'International',
        'size': 'small', 'energy_level': 2, 'exercise_needs': 'minimal',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 8, 'pet_friendly_score': 7, 'stranger_friendly_score': 8,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 3500,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 8,
        'requires_experienced_owner': False,
        'temperament_tags': 'affectionate,calm,adaptable,gentle,lap-dog',
        'description': 'Excellent apartment dog. Loves attention. Needs extensive daily grooming. Good with children.'
    },

    'Pug': {
        'species': 'Dog', 'origin': 'International',
        'size': 'small', 'energy_level': 2, 'exercise_needs': 'minimal',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 9, 'pet_friendly_score': 8, 'stranger_friendly_score': 9,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 3500,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 7,
        'requires_experienced_owner': False,
        'temperament_tags': 'charming,mischievous,loving,calm,social',
        'description': 'Made famous by Indian TV ads. Great apartment dog. Brachycephalic — avoid exercise in peak summer heat.'
    },

    'Rottweiler': {
        'species': 'Dog', 'origin': 'International',
        'size': 'large', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'high', 'trained_level': 'intermediate',
        'child_friendly_score': 6, 'pet_friendly_score': 4, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 5500,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'loyal,confident,protective,powerful,calm',
        'description': 'Powerful guardian. Needs early socialization and firm training. Devoted to family. Not for first-time owners.'
    },

    'Doberman Pinscher': {
        'species': 'Dog', 'origin': 'International',
        'size': 'large', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'high', 'trained_level': 'intermediate',
        'child_friendly_score': 6, 'pet_friendly_score': 5, 'stranger_friendly_score': 3,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 5000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': True,
        'temperament_tags': 'intelligent,alert,protective,energetic,loyal',
        'description': 'Popular guard dog in India. Highly intelligent and trainable. Needs extensive exercise and mental stimulation.'
    },

    'Great Dane': {
        'species': 'Dog', 'origin': 'International',
        'size': 'large', 'energy_level': 2, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 8, 'pet_friendly_score': 7, 'stranger_friendly_score': 7,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 7000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 5,
        'requires_experienced_owner': False,
        'temperament_tags': 'friendly,patient,gentle-giant,calm,devoted',
        'description': 'Gentle giant. Calm indoors but needs space due to size. High food and vet costs. Short lifespan 7-10 years.'
    },

    'Cocker Spaniel': {
        'species': 'Dog', 'origin': 'International',
        'size': 'medium', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 9, 'pet_friendly_score': 8, 'stranger_friendly_score': 8,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 4000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 6,
        'requires_experienced_owner': False,
        'temperament_tags': 'gentle,happy,adaptable,playful,affectionate',
        'description': 'Cheerful family dog. Adapts well to apartment life. Requires regular professional grooming and vet ear checkups.'
    },

    'Dachshund': {
        'species': 'Dog', 'origin': 'International',
        'size': 'small', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 6, 'pet_friendly_score': 5, 'stranger_friendly_score': 5,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 3000,
        'noise_level': 'vocal', 'can_be_left_alone': True, 'max_hours_alone': 7,
        'requires_experienced_owner': False,
        'temperament_tags': 'curious,lively,stubborn,playful,vocal',
        'description': 'Compact apartment dog. Stubborn but charming. Avoid stairs climbing — prone to spinal issues.'
    },

    'Boxer': {
        'species': 'Dog', 'origin': 'International',
        'size': 'large', 'energy_level': 4, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 9, 'pet_friendly_score': 7, 'stranger_friendly_score': 6,
        'needs_yard': True, 'can_live_in_apartment': False,
        'grooming_needs': 'low', 'estimated_monthly_cost': 4500,
        'noise_level': 'moderate', 'can_be_left_alone': False, 'max_hours_alone': 4,
        'requires_experienced_owner': False,
        'temperament_tags': 'playful,loyal,energetic,funny,protective',
        'description': 'Playful family dog. Excellent with children. Brachycephalic — needs shade in Indian summers. Very energetic.'
    },

    'Mixed Breed (Indian Street)': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 7, 'pet_friendly_score': 6, 'stranger_friendly_score': 5,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1500,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 7,
        'requires_experienced_owner': False,
        'temperament_tags': 'resilient,adaptable,loyal,intelligent,low-maintenance',
        'description': 'Rescued street dog. Extremely resilient and healthy. Deeply loyal once they trust you. Most affordable to maintain.'
    },

    'Indie (Rescued)': {
        'species': 'Dog', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'untrained',
        'child_friendly_score': 6, 'pet_friendly_score': 6, 'stranger_friendly_score': 4,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1500,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 6,
        'requires_experienced_owner': False,
        'temperament_tags': 'resilient,loyal,shy-at-first,adaptable,grateful',
        'description': 'Shelter/rescue Indie. May take time to trust. Once bonded, extremely loyal. Very healthy and low maintenance.'
    },
}

# ────────────────────────────────────────────────────────────────────────────
# CAT BREEDS (available in India)
# Note: 'Persian Cats' is the exact name used in MongoDB Breed table.
#       'Persian' is kept as an alias for internal use; both are included.
# ────────────────────────────────────────────────────────────────────────────
CAT_BREEDS = {

    'Indian Domestic Short Hair': {
        'species': 'Cat', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'low', 'trained_level': 'basic',
        'child_friendly_score': 7, 'pet_friendly_score': 6, 'stranger_friendly_score': 5,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1200,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 10,
        'requires_experienced_owner': False,
        'temperament_tags': 'adaptable,independent,hardy,curious,low-maintenance',
        'description': 'Most common cat in Indian homes. Hardy, healthy, and extremely adaptable. Perfect for first-time cat owners.'
    },

    'Indian Street Cat (Rescued)': {
        'species': 'Cat', 'origin': 'Indian',
        'size': 'medium', 'energy_level': 3, 'exercise_needs': 'minimal',
        'training_needs': 'low', 'trained_level': 'basic',
        'child_friendly_score': 6, 'pet_friendly_score': 5, 'stranger_friendly_score': 4,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 1000,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 10,
        'requires_experienced_owner': False,
        'temperament_tags': 'independent,cautious,adaptable,resilient,gentle',
        'description': 'Rescued street cat. Takes time to adjust indoors. Very hardy. Lowest cost cat to maintain in India.'
    },

    'Persian': {
        'species': 'Cat', 'origin': 'International',
        'size': 'medium', 'energy_level': 1, 'exercise_needs': 'minimal',
        'training_needs': 'low', 'trained_level': 'basic',
        'child_friendly_score': 6, 'pet_friendly_score': 6, 'stranger_friendly_score': 4,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 4000,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 10,
        'requires_experienced_owner': False,
        'temperament_tags': 'calm,gentle,quiet,affectionate,lap-cat',
        'description': 'Most popular purebred cat in India. Calm and gentle. Requires daily grooming and AC in Indian summers.'
    },

    # ── MongoDB exact name: "Persian Cats" ──────────────────────────────────
    # Same profile as Persian — added so the ML dataset contains the exact
    # breed name stored in the MongoDB Breed collection.
    'Persian Cats': {
        'species': 'Cat', 'origin': 'International',
        'size': 'medium', 'energy_level': 1, 'exercise_needs': 'minimal',
        'training_needs': 'low', 'trained_level': 'basic',
        'child_friendly_score': 6, 'pet_friendly_score': 6, 'stranger_friendly_score': 4,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 4000,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 10,
        'requires_experienced_owner': False,
        'temperament_tags': 'calm,gentle,quiet,affectionate,lap-cat',
        'description': 'Most popular purebred cat in India. Calm and gentle. Daily grooming and AC required in Indian summers.'
    },

    'Siamese': {
        'species': 'Cat', 'origin': 'International',
        'size': 'medium', 'energy_level': 4, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'intermediate',
        'child_friendly_score': 7, 'pet_friendly_score': 5, 'stranger_friendly_score': 5,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 3500,
        'noise_level': 'vocal', 'can_be_left_alone': True, 'max_hours_alone': 8,
        'requires_experienced_owner': False,
        'temperament_tags': 'vocal,social,intelligent,demanding,affectionate',
        'description': 'Very chatty and social. Demands attention. Dislikes being alone long. Bonds deeply with one person.'
    },

    'Maine Coon': {
        'species': 'Cat', 'origin': 'International',
        'size': 'large', 'energy_level': 3, 'exercise_needs': 'moderate',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 9, 'pet_friendly_score': 8, 'stranger_friendly_score': 7,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 5000,
        'noise_level': 'moderate', 'can_be_left_alone': True, 'max_hours_alone': 8,
        'requires_experienced_owner': False,
        'temperament_tags': 'gentle-giant,dog-like,playful,friendly,social',
        'description': 'Largest domestic cat breed. Dog-like personality. Loves water. Needs AC in Indian summers due to long coat.'
    },

    'British Shorthair': {
        'species': 'Cat', 'origin': 'International',
        'size': 'medium', 'energy_level': 2, 'exercise_needs': 'minimal',
        'training_needs': 'low', 'trained_level': 'basic',
        'child_friendly_score': 8, 'pet_friendly_score': 7, 'stranger_friendly_score': 6,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'moderate', 'estimated_monthly_cost': 4500,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 10,
        'requires_experienced_owner': False,
        'temperament_tags': 'calm,easygoing,independent,gentle,round-face',
        'description': 'Very easy-going and calm. Tolerates being alone well. Does not demand constant attention — ideal for working adults.'
    },

    'Bengal': {
        'species': 'Cat', 'origin': 'International',
        'size': 'medium', 'energy_level': 5, 'exercise_needs': 'high',
        'training_needs': 'moderate', 'trained_level': 'basic',
        'child_friendly_score': 7, 'pet_friendly_score': 5, 'stranger_friendly_score': 5,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 5500,
        'noise_level': 'vocal', 'can_be_left_alone': True, 'max_hours_alone': 6,
        'requires_experienced_owner': True,
        'temperament_tags': 'wild-look,energetic,playful,mischievous,athletic',
        'description': 'Wild-looking cat with leopard spots. Extremely active and curious. Not a lap cat. Needs vertical space to climb.'
    },

    'Ragdoll': {
        'species': 'Cat', 'origin': 'International',
        'size': 'large', 'energy_level': 2, 'exercise_needs': 'minimal',
        'training_needs': 'low', 'trained_level': 'intermediate',
        'child_friendly_score': 9, 'pet_friendly_score': 8, 'stranger_friendly_score': 8,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 6000,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 8,
        'requires_experienced_owner': False,
        'temperament_tags': 'docile,gentle,floppy,affectionate,calm',
        'description': 'Goes limp when held — hence Ragdoll. Extremely gentle. Perfect for families with children. Needs regular brushing.'
    },

    'Russian Blue': {
        'species': 'Cat', 'origin': 'International',
        'size': 'medium', 'energy_level': 2, 'exercise_needs': 'minimal',
        'training_needs': 'low', 'trained_level': 'intermediate',
        'child_friendly_score': 7, 'pet_friendly_score': 6, 'stranger_friendly_score': 3,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'low', 'estimated_monthly_cost': 4500,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 10,
        'requires_experienced_owner': False,
        'temperament_tags': 'shy,gentle,loyal,quiet,independent',
        'description': 'Elegant blue-coated cat. Shy with strangers but deeply loyal to family. Dislikes loud environments.'
    },

    'Himalayan': {
        'species': 'Cat', 'origin': 'International',
        'size': 'medium', 'energy_level': 1, 'exercise_needs': 'minimal',
        'training_needs': 'low', 'trained_level': 'basic',
        'child_friendly_score': 7, 'pet_friendly_score': 6, 'stranger_friendly_score': 4,
        'needs_yard': False, 'can_live_in_apartment': True,
        'grooming_needs': 'high', 'estimated_monthly_cost': 4500,
        'noise_level': 'quiet', 'can_be_left_alone': True, 'max_hours_alone': 9,
        'requires_experienced_owner': False,
        'temperament_tags': 'calm,gentle,affectionate,quiet,lap-cat',
        'description': 'Persian-Siamese cross. Calm like Persian, slightly more playful. Requires daily grooming and AC in summer.'
    },
}

ALL_BREEDS = {**INDIAN_DOG_BREEDS, **INTERNATIONAL_DOG_BREEDS, **CAT_BREEDS}

# ────────────────────────────────────────────────────────────────────────────
# AGE RANGES PER BREED (in months)
# ────────────────────────────────────────────────────────────────────────────
AGE_RANGES = {
    'Dog': {'puppy':  (1,  5), 'young': (6, 18), 'adult': (19,  72), 'senior': (73, 144)},
    'Cat': {'kitten': (1,  5), 'young': (6, 18), 'adult': (19,  84), 'senior': (85, 156)},
}

GENDER_OPTIONS = ['male', 'female']

INDIAN_PET_NAMES = {
    'Dog': [
        'Moti', 'Tommy', 'Bruno', 'Jimmy', 'Raja', 'Sheru', 'Tiger', 'Kalu',
        'Rani', 'Laila', 'Sona', 'Chiku', 'Golu', 'Bhola', 'Chhotu', 'Kali',
        'Hero', 'Arjun', 'Simba', 'Max', 'Rocky', 'Buddy', 'Charlie', 'Leo',
        'Mocha', 'Pudding', 'Brownie', 'Shadow', 'Storm', 'Diesel',
    ],
    'Cat': [
        'Mimi', 'Bijli', 'Cheeni', 'Sundari', 'Gattu', 'Billi', 'Luna',
        'Kitty', 'Nala', 'Jasmine', 'Cleo', 'Mango', 'Mishti', 'Pari',
        'Whiskers', 'Socks', 'Mittens', 'Oreo', 'Shadow', 'Pearl',
    ],
}

VACCINATION_STATUS = ['up_to_date', 'partial', 'not_vaccinated']
HEALTH_STATUS = ['healthy', 'minor_condition', 'serious_condition']

# ────────────────────────────────────────────────────────────────────────────
# NOISE HELPER: add small variation to numeric values
# ────────────────────────────────────────────────────────────────────────────

def _jitter_int(val, lo, hi, sigma=0.5):
    return max(lo, min(hi, round(val + random.gauss(0, sigma))))

def _jitter_float(val, lo, hi, sigma=1.0):
    return max(lo, min(hi, round(val + random.gauss(0, sigma), 1)))

def _maybe_flip(val, prob=0.05):
    """Flip a boolean with small probability."""
    return (not val) if random.random() < prob else val

def _pick_age(species):
    ranges = AGE_RANGES.get(species, AGE_RANGES['Dog'])
    stage = random.choices(
        list(ranges.keys()),
        weights=[0.25, 0.30, 0.35, 0.10]
    )[0]
    lo, hi = ranges[stage]
    return random.randint(lo, hi)

# ────────────────────────────────────────────────────────────────────────────
# SUCCESS LABEL: realistic rule-based assignment
# Mirrors the real-world pattern — health, age, breed sociability matter
# ────────────────────────────────────────────────────────────────────────────

def _compute_success(breed_data, age_months, health, vaccinated, record):
    """Return True if this pet would likely be adopted successfully."""
    score = 0.55  # base probability

    # Age effect — puppies/kittens get adopted faster
    if age_months <= 5:
        score += 0.15
    elif age_months <= 18:
        score += 0.08
    elif age_months > 84:
        score -= 0.10

    # Sociability boost
    child_fr = record['child_friendly_score']
    stranger_fr = record['stranger_friendly_score']
    score += (child_fr - 5) * 0.02
    score += (stranger_fr - 5) * 0.01

    # Experienced-owner penalty (fewer eligible adopters)
    if record['requires_experienced_owner']:
        score -= 0.12

    # Health effect
    if health == 'healthy':
        score += 0.08
    elif health == 'serious_condition':
        score -= 0.15

    # Vaccination
    if vaccinated == 'up_to_date':
        score += 0.05
    elif vaccinated == 'not_vaccinated':
        score -= 0.05

    # Cost effect
    if record['estimated_monthly_cost'] > 5000:
        score -= 0.07

    # Noise — vocal breeds less likely in apartment context
    if record['noise_level'] == 'vocal' and not record['needs_yard']:
        score -= 0.04

    # Origin Indian breeds — higher adoption in local context
    if breed_data['origin'] == 'Indian':
        score += 0.06

    score = max(0.05, min(0.95, score))
    return random.random() < score


# ────────────────────────────────────────────────────────────────────────────
# RECORD GENERATOR
# ────────────────────────────────────────────────────────────────────────────

def generate_record(breed_name, breed_data):
    species = breed_data['species']
    age     = _pick_age(species)
    gender  = random.choice(GENDER_OPTIONS)
    health  = random.choices(
        HEALTH_STATUS, weights=[0.75, 0.18, 0.07]
    )[0]
    vaccinated = random.choices(
        VACCINATION_STATUS, weights=[0.50, 0.30, 0.20]
    )[0]

    names = INDIAN_PET_NAMES.get(species, INDIAN_PET_NAMES['Dog'])
    name  = random.choice(names)

    # Jitter numeric traits slightly for variety within same breed
    child_fr    = _jitter_int(breed_data['child_friendly_score'],    0, 10, 0.8)
    pet_fr      = _jitter_int(breed_data['pet_friendly_score'],      0, 10, 0.8)
    stranger_fr = _jitter_int(breed_data['stranger_friendly_score'], 0, 10, 0.8)
    energy      = _jitter_int(breed_data['energy_level'],            1,  5, 0.4)
    cost        = max(500, round(breed_data['estimated_monthly_cost'] * random.uniform(0.85, 1.15), -2))
    max_alone   = _jitter_int(breed_data['max_hours_alone'],         1, 12, 0.5)

    # Age-based energy adjustment
    if age <= 5:
        energy = min(5, energy + 1)
    elif age > 84:
        energy = max(1, energy - 1)

    record = {
        'name':                      name,
        'species':                   species,
        'breed':                     breed_name,
        'origin':                    breed_data['origin'],
        'age_months':                age,
        'gender':                    gender,
        'health_status':             health,
        'vaccination_status':        vaccinated,
        'size':                      breed_data['size'],
        'energy_level':              energy,
        'exercise_needs':            breed_data['exercise_needs'],
        'training_needs':            breed_data['training_needs'],
        'trained_level':             breed_data['trained_level'],
        'child_friendly_score':      child_fr,
        'pet_friendly_score':        pet_fr,
        'stranger_friendly_score':   stranger_fr,
        'needs_yard':                breed_data['needs_yard'],
        'can_live_in_apartment':     breed_data['can_live_in_apartment'],
        'grooming_needs':            breed_data['grooming_needs'],
        'estimated_monthly_cost':    cost,
        'noise_level':               breed_data['noise_level'],
        'can_be_left_alone':         breed_data['can_be_left_alone'],
        'max_hours_alone':           max_alone,
        'requires_experienced_owner': breed_data['requires_experienced_owner'],
        'temperament_tags':          breed_data['temperament_tags'],
        'description':               breed_data['description'],
        'adoption_success':          None,  # filled below
    }

    record['adoption_success'] = _compute_success(breed_data, age, health, vaccinated, record)
    return record


# ────────────────────────────────────────────────────────────────────────────
# HOW MANY RECORDS PER BREED
# Common breeds get more records to reflect real shelter populations.
# ────────────────────────────────────────────────────────────────────────────

BREED_COUNTS = {
    # ── MongoDB-matched breeds (exact names from Breed collection) ──────────
    # British Shorthair, German Shepherd, Golden Retriever already have counts below.
    # Persian Cats — exact MongoDB Breed name (avoids 'Persian' vs 'Persian Cats' mismatch)
    'Persian Cats':                 30,

    # Indian dogs — more records for most common
    'Indian Pariah Dog':            60,
    'Mixed Breed (Indian Street)':  55,
    'Indie (Rescued)':              50,
    'Indian Spitz':                 40,
    'Rajapalayam':                  20,
    'Mudhol Hound':                 20,
    'Chippiparai':                  15,
    'Kanni':                        12,
    'Combai':                       12,
    'Rampur Greyhound':             12,
    'Bakharwal Dog':                10,
    'Gaddi Kutta':                  10,
    'Jonangi':                      10,
    'Pandikona':                    10,
    'Himalayan Sheepdog':           10,
    # International dogs
    'Labrador Retriever':           40,
    'German Shepherd':              35,
    'Golden Retriever':             30,
    'Beagle':                       25,
    'Pomeranian':                   25,
    'Shih Tzu':                     20,
    'Pug':                          20,
    'Rottweiler':                   15,
    'Doberman Pinscher':            15,
    'Great Dane':                   10,
    'Cocker Spaniel':               15,
    'Dachshund':                    15,
    'Boxer':                        15,
    # Cats
    'Indian Domestic Short Hair':   50,
    'Indian Street Cat (Rescued)':  40,
    'Persian':                      35,
    'Siamese':                      20,
    'Maine Coon':                   15,
    'British Shorthair':            15,
    'Bengal':                       12,
    'Ragdoll':                      12,
    'Russian Blue':                 10,
    'Himalayan':                    10,
}


# ────────────────────────────────────────────────────────────────────────────
# MAIN: GENERATE AND SAVE CSV
# ────────────────────────────────────────────────────────────────────────────

def generate_dataset():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    all_records = []
    for breed_name, breed_data in ALL_BREEDS.items():
        n = BREED_COUNTS.get(breed_name, 15)
        for _ in range(n):
            all_records.append(generate_record(breed_name, breed_data))

    random.shuffle(all_records)

    # Field order for CSV
    fieldnames = [
        'name', 'species', 'breed', 'origin', 'age_months', 'gender',
        'health_status', 'vaccination_status',
        'size', 'energy_level', 'exercise_needs', 'training_needs', 'trained_level',
        'child_friendly_score', 'pet_friendly_score', 'stranger_friendly_score',
        'needs_yard', 'can_live_in_apartment',
        'grooming_needs', 'estimated_monthly_cost', 'noise_level',
        'can_be_left_alone', 'max_hours_alone', 'requires_experienced_owner',
        'temperament_tags', 'description', 'adoption_success',
    ]

    with open(OUTPUT_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)

    total   = len(all_records)
    dogs    = sum(1 for r in all_records if r['species'] == 'Dog')
    cats    = sum(1 for r in all_records if r['species'] == 'Cat')
    indian  = sum(1 for r in all_records if r['origin'] == 'Indian')
    success = sum(1 for r in all_records if r['adoption_success'])

    # MongoDB Breed collection — exact names that must appear in the dataset
    mongo_breeds = ['British Shorthair', 'German Shepherd', 'Golden Retriever', 'Persian Cats']
    mongo_present = [b for b in mongo_breeds if any(r['breed'] == b for r in all_records)]

    # Verify species values are consistent — must be exactly 'Dog' or 'Cat', nothing else
    species_values = set(r['species'] for r in all_records)
    species_ok = species_values <= {'Dog', 'Cat'}

    print(f"\n{'='*60}")
    print(f"  Custom Adoption Dataset Generated")
    print(f"{'='*60}")
    print(f"  Output:        {OUTPUT_PATH}")
    print(f"  Total records: {total:,}")
    print(f"  Dogs:          {dogs:,}  ({100*dogs/total:.1f}%)")
    print(f"  Cats:          {cats:,}  ({100*cats/total:.1f}%)")
    print(f"  Indian breeds: {indian:,} ({100*indian/total:.1f}%)")
    print(f"  Adopted:       {success:,} ({100*success/total:.1f}%)")
    print(f"  Not adopted:   {total-success:,} ({100*(total-success)/total:.1f}%)")
    print(f"  Species check: {sorted(species_values)}  {'OK' if species_ok else 'ERROR!'}")
    print(f"\n  Breeds covered:")
    print(f"    Indian dog breeds:        {len(INDIAN_DOG_BREEDS)}")
    print(f"    International dog breeds: {len(INTERNATIONAL_DOG_BREEDS)}")
    print(f"    Cat breeds:               {len(CAT_BREEDS)}")
    print(f"\n  MongoDB Breed collection coverage:")
    for b in mongo_breeds:
        status = 'OK' if b in mongo_present else 'MISSING'
        cnt = sum(1 for r in all_records if r['breed'] == b)
        print(f"    [{status}]  {b}  ({cnt} records)")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    generate_dataset()
