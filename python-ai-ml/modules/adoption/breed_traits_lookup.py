"""
Breed Traits Lookup for PetFinder Dataset
==========================================
Maps PetFinder BreedID → personality/compatibility traits
matching the EXACT field names and enum values of AdoptionPet.js schema.

Enum reference (from AdoptionPet.js):
  size:           'small' | 'medium' | 'large'
  energyLevel:    1-5  (1=very low, 5=very high)
  exerciseNeeds:  'minimal' | 'moderate' | 'high' | 'very_high'
  trainingNeeds:  'low' | 'moderate' | 'high'
  trainedLevel:   'untrained' | 'basic' | 'intermediate' | 'advanced'
  childFriendlyScore:   0-10
  petFriendlyScore:     0-10
  strangerFriendlyScore: 0-10
  needsYard:       True | False
  canLiveInApartment: True | False
  groomingNeeds:   'low' | 'moderate' | 'high'
  estimatedMonthlyCost: number (USD)
  noiseLevel:      'quiet' | 'moderate' | 'vocal'
  canBeLeftAlone:  True | False
  maxHoursAlone:   number (hours)
  requiresExperiencedOwner: True | False

Sources: AKC breed standards, VetStreet breed profiles, PetMD,
         mirroring the existing breedDefaults.js in backend.
"""

import random
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# HELPER: Build a trait dict cleanly
# ============================================================================

def _t(size, energy, exercise, train_need, trained, child, pet_fr, stranger,
       yard, apartment, grooming, cost, noise, alone, max_alone, exp_owner):
    """Shorthand constructor for a trait profile."""
    return {
        'size': size,
        'energyLevel': energy,
        'exerciseNeeds': exercise,
        'trainingNeeds': train_need,
        'trainedLevel': trained,
        'childFriendlyScore': child,
        'petFriendlyScore': pet_fr,
        'strangerFriendlyScore': stranger,
        'needsYard': yard,
        'canLiveInApartment': apartment,
        'groomingNeeds': grooming,
        'estimatedMonthlyCost': cost,
        'noiseLevel': noise,
        'canBeLeftAlone': alone,
        'maxHoursAlone': max_alone,
        'requiresExperiencedOwner': exp_owner,
    }


# ============================================================================
# BREED TRAITS BY PETFINDER BREED ID
# Format: BreedID: _t(size, energy, exercise, train_need, trained,
#                      child, pet_fr, stranger,
#                      yard, apartment, grooming, cost, noise,
#                      alone, max_alone, exp_owner)
# ============================================================================

# --- Key for columns: ---
# size | nrg | exercise | train_need | trained | child | pet | stranger |
# yard | apt | groom | cost | noise | alone | max_h | exp

BREED_TRAITS = {
    # =========================================================================
    # DOG BREEDS (Type=1) — BreedID 1–240, 307
    # =========================================================================

    # 1  Affenpinscher
    1:   _t('small', 3, 'moderate',  'moderate', 'basic',        7, 5, 6,  False, True,  'moderate', 100, 'moderate', True,  7, False),
    # 2  Afghan Hound
    2:   _t('large', 3, 'high',      'high',     'intermediate', 5, 4, 4,  True,  False, 'high',     200, 'quiet',    True,  5, True),
    # 3  Airedale Terrier
    3:   _t('large', 4, 'high',      'high',     'intermediate', 7, 5, 6,  True,  False, 'moderate', 170, 'moderate', True,  5, True),
    # 4  Akbash
    4:   _t('large', 3, 'moderate',  'high',     'intermediate', 6, 5, 3,  True,  False, 'moderate', 180, 'moderate', True,  5, True),
    # 5  Akita
    5:   _t('large', 3, 'moderate',  'high',     'intermediate', 5, 3, 3,  True,  False, 'moderate', 200, 'moderate', True,  5, True),
    # 6  Alaskan Malamute
    6:   _t('large', 5, 'very_high', 'high',     'basic',        6, 5, 6,  True,  False, 'high',     220, 'vocal',    False, 3, True),
    # 7  American Bulldog
    7:   _t('large', 3, 'moderate',  'moderate', 'basic',        7, 5, 5,  True,  False, 'low',      170, 'moderate', True,  5, True),
    # 8  American Eskimo Dog
    8:   _t('medium',4, 'high',      'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 130, 'vocal',    True,  6, False),
    # 9  American Hairless Terrier
    9:   _t('small', 3, 'moderate',  'moderate', 'basic',        8, 7, 7,  False, True,  'low',      150, 'moderate', True,  7, False),
    # 10 American Staffordshire Terrier / AmStaff
    10:  _t('large', 4, 'high',      'high',     'intermediate', 7, 5, 6,  True,  False, 'low',      160, 'moderate', True,  5, True),
    # 11 American Water Spaniel
    11:  _t('medium',4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 140, 'moderate', True,  5, False),
    # 12 Anatolian Shepherd
    12:  _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'moderate', 190, 'moderate', True,  5, True),
    # 13 Appenzell Mountain Dog
    13:  _t('large', 4, 'high',      'high',     'intermediate', 7, 6, 5,  True,  False, 'moderate', 180, 'moderate', True,  5, True),
    # 14 Australian Cattle Dog / Blue Heeler
    14:  _t('medium',5, 'very_high', 'high',     'intermediate', 6, 5, 5,  True,  False, 'low',      150, 'moderate', False, 3, True),
    # 15 Australian Kelpie
    15:  _t('medium',5, 'very_high', 'high',     'intermediate', 7, 6, 6,  True,  False, 'low',      140, 'moderate', False, 3, True),
    # 16 Australian Shepherd
    16:  _t('medium',5, 'very_high', 'high',     'advanced',     7, 6, 5,  True,  False, 'moderate', 160, 'moderate', False, 3, True),
    # 17 Australian Terrier
    17:  _t('small', 4, 'high',      'moderate', 'basic',        7, 5, 6,  False, True,  'low',      110, 'vocal',    True,  6, False),
    # 18 Basenji
    18:  _t('medium',3, 'moderate',  'high',     'basic',        5, 4, 4,  False, True,  'low',      130, 'quiet',    True,  6, True),
    # 19 Basset Hound
    19:  _t('medium',2, 'moderate',  'moderate', 'basic',        8, 7, 7,  False, True,  'low',      130, 'vocal',    True,  6, False),
    # 20 Beagle
    20:  _t('medium',4, 'high',      'high',     'basic',        9, 8, 8,  True,  False, 'low',      120, 'vocal',    False, 4, False),
    # 21 Bearded Collie
    21:  _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'high',     170, 'moderate', True,  5, False),
    # 22 Beauceron
    22:  _t('large', 4, 'high',      'high',     'intermediate', 7, 6, 5,  True,  False, 'low',      180, 'moderate', True,  5, True),
    # 23 Bedlington Terrier
    23:  _t('medium',3, 'moderate',  'moderate', 'intermediate', 8, 6, 7,  False, True,  'moderate', 130, 'moderate', True,  7, False),
    # 24 Belgian Shepherd Sheepdog
    24:  _t('large', 5, 'very_high', 'high',     'advanced',     7, 5, 5,  True,  False, 'moderate', 180, 'moderate', False, 3, True),
    # 25 Belgian Shepherd Laekenois
    25:  _t('large', 5, 'very_high', 'high',     'advanced',     7, 5, 5,  True,  False, 'moderate', 180, 'moderate', False, 3, True),
    # 26 Belgian Shepherd Malinois
    26:  _t('large', 5, 'very_high', 'high',     'advanced',     6, 5, 4,  True,  False, 'low',      190, 'moderate', False, 3, True),
    # 27 Belgian Shepherd Tervuren
    27:  _t('large', 5, 'very_high', 'high',     'advanced',     7, 5, 5,  True,  False, 'moderate', 180, 'moderate', False, 3, True),
    # 28 Bernese Mountain Dog
    28:  _t('large', 3, 'moderate',  'moderate', 'intermediate', 9, 8, 8,  True,  False, 'moderate', 220, 'quiet',    True,  5, False),
    # 29 Bichon Frise
    29:  _t('small', 3, 'moderate',  'moderate', 'intermediate', 9, 8, 9,  False, True,  'high',     130, 'moderate', True,  8, False),
    # 30 Black and Tan Coonhound
    30:  _t('large', 4, 'high',      'moderate', 'basic',        7, 6, 6,  True,  False, 'low',      150, 'vocal',    True,  5, False),
    # 31 Black Labrador Retriever
    31:  _t('large', 4, 'high',      'moderate', 'intermediate', 10,9, 9,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 32 Black Mouth Cur
    32:  _t('large', 4, 'high',      'high',     'basic',        7, 6, 5,  True,  False, 'low',      140, 'moderate', True,  5, True),
    # 33 Black Russian Terrier
    33:  _t('large', 3, 'moderate',  'high',     'intermediate', 7, 5, 4,  True,  False, 'moderate', 200, 'moderate', True,  5, True),
    # 34 Bloodhound
    34:  _t('large', 3, 'moderate',  'moderate', 'basic',        8, 6, 7,  True,  False, 'low',      170, 'vocal',    True,  5, False),
    # 35 Blue Lacy
    35:  _t('medium',5, 'very_high', 'high',     'intermediate', 7, 6, 6,  True,  False, 'low',      140, 'moderate', False, 4, True),
    # 36 Bluetick Coonhound
    36:  _t('large', 4, 'high',      'moderate', 'basic',        7, 6, 6,  True,  False, 'low',      150, 'vocal',    True,  5, False),
    # 37 Boerboel
    37:  _t('large', 3, 'moderate',  'high',     'intermediate', 7, 5, 4,  True,  False, 'low',      200, 'moderate', True,  5, True),
    # 38 Bolognese
    38:  _t('small', 2, 'minimal',   'moderate', 'intermediate', 8, 7, 6,  False, True,  'high',     110, 'quiet',    True,  8, False),
    # 39 Border Collie
    39:  _t('medium',5, 'very_high', 'high',     'advanced',     7, 6, 5,  True,  False, 'moderate', 150, 'moderate', False, 3, True),
    # 40 Border Terrier
    40:  _t('small', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  False, True,  'low',      110, 'moderate', True,  6, False),
    # 41 Borzoi
    41:  _t('large', 3, 'moderate',  'high',     'basic',        5, 4, 4,  True,  False, 'high',     190, 'quiet',    True,  5, True),
    # 42 Boston Terrier
    42:  _t('small', 3, 'moderate',  'moderate', 'basic',        9, 8, 9,  False, True,  'low',      120, 'moderate', True,  7, False),
    # 43 Bouvier des Flanders
    43:  _t('large', 4, 'high',      'high',     'intermediate', 7, 6, 5,  True,  False, 'moderate', 200, 'moderate', True,  5, True),
    # 44 Boxer
    44:  _t('large', 4, 'high',      'moderate', 'intermediate', 9, 7, 7,  True,  False, 'low',      170, 'moderate', False, 4, False),
    # 45 Boykin Spaniel
    45:  _t('medium',4, 'high',      'moderate', 'intermediate', 9, 8, 8,  True,  False, 'moderate', 140, 'moderate', True,  5, False),
    # 46 Briard
    46:  _t('large', 3, 'moderate',  'high',     'intermediate', 7, 5, 4,  True,  False, 'high',     180, 'moderate', True,  5, True),
    # 47 Brittany Spaniel
    47:  _t('medium',5, 'very_high', 'moderate', 'intermediate', 9, 8, 8,  True,  False, 'moderate', 140, 'moderate', False, 4, False),
    # 48 Brussels Griffon
    48:  _t('small', 3, 'moderate',  'moderate', 'basic',        7, 6, 6,  False, True,  'moderate', 110, 'moderate', True,  7, False),
    # 49 Bull Terrier
    49:  _t('medium',4, 'high',      'high',     'intermediate', 7, 5, 6,  True,  False, 'low',      150, 'moderate', True,  5, True),
    # 50 Bullmastiff
    50:  _t('large', 3, 'moderate',  'moderate', 'intermediate', 7, 6, 5,  True,  False, 'low',      200, 'moderate', True,  5, True),
    # 51 Cairn Terrier
    51:  _t('small', 4, 'high',      'moderate', 'basic',        8, 6, 7,  False, True,  'moderate', 100, 'moderate', True,  7, False),
    # 52 Canaan Dog
    52:  _t('medium',4, 'high',      'high',     'intermediate', 6, 5, 4,  True,  False, 'low',      140, 'moderate', True,  5, True),
    # 53 Cane Corso Mastiff
    53:  _t('large', 3, 'moderate',  'high',     'intermediate', 6, 5, 4,  True,  False, 'low',      220, 'moderate', True,  5, True),
    # 54 Carolina Dog
    54:  _t('medium',4, 'high',      'high',     'basic',        6, 5, 4,  True,  False, 'low',      130, 'moderate', True,  5, True),
    # 55 Catahoula Leopard Dog
    55:  _t('large', 5, 'very_high', 'high',     'intermediate', 7, 5, 5,  True,  False, 'low',      150, 'moderate', False, 3, True),
    # 56 Cattle Dog
    56:  _t('medium',5, 'very_high', 'high',     'intermediate', 6, 5, 5,  True,  False, 'low',      140, 'moderate', False, 3, True),
    # 57 Caucasian Sheepdog
    57:  _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'moderate', 200, 'moderate', True,  4, True),
    # 58 Cavalier King Charles Spaniel
    58:  _t('small', 2, 'minimal',   'low',      'intermediate', 9, 8, 9,  False, True,  'moderate', 130, 'quiet',    True,  8, False),
    # 59 Chesapeake Bay Retriever
    59:  _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 170, 'moderate', True,  5, False),
    # 60 Chihuahua
    60:  _t('small', 3, 'moderate',  'high',     'basic',        5, 4, 4,  False, True,  'low',      80,  'vocal',    True,  8, False),
    # 61 Chinese Crested Dog
    61:  _t('small', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'low',      110, 'moderate', True,  8, False),
    # 62 Chinese Foo Dog
    62:  _t('medium',3, 'moderate',  'moderate', 'basic',        6, 5, 5,  False, True,  'moderate', 130, 'moderate', True,  6, False),
    # 63 Chinook
    63:  _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 180, 'moderate', True,  5, False),
    # 64 Chocolate Labrador Retriever
    64:  _t('large', 4, 'high',      'moderate', 'intermediate', 10,9, 9,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 65 Chow Chow
    65:  _t('large', 2, 'moderate',  'high',     'basic',        4, 3, 3,  True,  False, 'moderate', 160, 'quiet',    True,  5, True),
    # 66 Cirneco dell'Etna
    66:  _t('medium',4, 'high',      'moderate', 'intermediate', 7, 6, 6,  True,  False, 'low',      140, 'quiet',    True,  5, False),
    # 67 Clumber Spaniel
    67:  _t('large', 2, 'moderate',  'low',      'basic',        8, 7, 7,  False, True,  'high',     160, 'quiet',    True,  6, False),
    # 68 Cocker Spaniel
    68:  _t('medium',3, 'moderate',  'moderate', 'intermediate', 9, 8, 8,  False, True,  'high',     140, 'moderate', True,  6, False),
    # 69 Collie
    69:  _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'high',     160, 'moderate', True,  5, False),
    # 70 Coton de Tulear
    70:  _t('small', 2, 'minimal',   'moderate', 'intermediate', 9, 8, 9,  False, True,  'high',     120, 'quiet',    True,  8, False),
    # 71 Dachshund
    71:  _t('small', 3, 'moderate',  'moderate', 'basic',        6, 5, 6,  False, True,  'low',      100, 'vocal',    True,  7, False),
    # 72 Dalmatian
    72:  _t('large', 5, 'very_high', 'high',     'intermediate', 7, 5, 7,  True,  False, 'low',      160, 'moderate', False, 3, True),
    # 73 Deer Head Chihuahua
    73:  _t('small', 3, 'moderate',  'high',     'basic',        5, 4, 4,  False, True,  'low',      80,  'vocal',    True,  8, False),
    # 74 Doberman Pinscher
    74:  _t('large', 4, 'high',      'high',     'intermediate', 6, 5, 4,  True,  False, 'low',      190, 'moderate', True,  5, True),
    # 75 Dogo Argentino
    75:  _t('large', 4, 'high',      'high',     'intermediate', 6, 4, 5,  True,  False, 'low',      200, 'moderate', True,  5, True),
    # 76 Dutch Shepherd
    76:  _t('large', 5, 'very_high', 'high',     'advanced',     7, 6, 5,  True,  False, 'moderate', 180, 'moderate', False, 3, True),
    # 77 English Bulldog
    77:  _t('medium',2, 'minimal',   'moderate', 'basic',        8, 7, 8,  False, True,  'low',      180, 'moderate', True,  7, False),
    # 78 English Cocker Spaniel
    78:  _t('medium',3, 'moderate',  'moderate', 'intermediate', 9, 8, 8,  False, True,  'high',     140, 'moderate', True,  6, False),
    # 79 English Pointer
    79:  _t('large', 5, 'very_high', 'moderate', 'intermediate', 8, 7, 7,  True,  False, 'low',      150, 'moderate', False, 4, False),
    # 80 English Setter
    80:  _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 8,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 81 English Springer Spaniel
    81:  _t('medium',4, 'high',      'moderate', 'intermediate', 9, 8, 8,  True,  False, 'moderate', 150, 'moderate', True,  5, False),
    # 82 English Toy Spaniel
    82:  _t('small', 2, 'minimal',   'low',      'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'quiet',    True,  8, False),
    # 83 Entlebucher Mountain Dog
    83:  _t('large', 4, 'high',      'high',     'intermediate', 7, 6, 6,  True,  False, 'moderate', 170, 'moderate', True,  5, False),
    # 84 Field Spaniel
    84:  _t('medium',3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 140, 'moderate', True,  6, False),
    # 85 Finnish Spitz
    85:  _t('medium',4, 'high',      'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 130, 'vocal',    True,  6, False),
    # 86 Flat-coated Retriever
    86:  _t('large', 4, 'high',      'moderate', 'intermediate', 9, 8, 8,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 87 Fox Terrier
    87:  _t('small', 4, 'high',      'high',     'intermediate', 7, 5, 7,  False, True,  'low',      110, 'vocal',    True,  6, False),
    # 88 Foxhound
    88:  _t('large', 4, 'high',      'moderate', 'basic',        7, 7, 7,  True,  False, 'low',      140, 'vocal',    True,  5, False),
    # 89 French Bulldog
    89:  _t('small', 2, 'minimal',   'moderate', 'basic',        9, 7, 8,  False, True,  'low',      150, 'moderate', True,  6, False),
    # 90 German Pinscher
    90:  _t('medium',4, 'high',      'high',     'intermediate', 6, 5, 5,  True,  False, 'low',      160, 'moderate', True,  5, True),
    # 91 German Shepherd Dog
    91:  _t('large', 4, 'high',      'moderate', 'intermediate', 7, 5, 4,  True,  False, 'moderate', 180, 'moderate', True,  5, False),
    # 92 German Shorthaired Pointer
    92:  _t('large', 5, 'very_high', 'moderate', 'intermediate', 8, 7, 7,  True,  False, 'low',      160, 'moderate', False, 4, False),
    # 93 Giant Schnauzer
    93:  _t('large', 4, 'high',      'high',     'intermediate', 7, 5, 5,  True,  False, 'moderate', 200, 'moderate', True,  5, True),
    # 94 Glen of Imaal Terrier
    94:  _t('small', 3, 'moderate',  'moderate', 'basic',        7, 5, 6,  False, True,  'moderate', 110, 'moderate', True,  7, False),
    # 95 Golden Retriever
    95:  _t('large', 4, 'high',      'moderate', 'intermediate', 10,9, 9,  True,  False, 'high',     170, 'moderate', True,  5, False),
    # 96 Goldendoodle
    96:  _t('large', 4, 'high',      'moderate', 'intermediate', 10,9, 9,  False, True,  'high',     180, 'moderate', True,  5, False),
    # 97 Gordon Setter
    97:  _t('large', 4, 'high',      'moderate', 'intermediate', 7, 6, 6,  True,  False, 'moderate', 170, 'moderate', True,  5, False),
    # 98 Great Dane
    98:  _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'low',      250, 'moderate', True,  5, False),
    # 99 Great Pyrenees
    99:  _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 5,  True,  False, 'high',     220, 'moderate', True,  5, False),
    # 100 Greater Swiss Mountain Dog
    100: _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 210, 'moderate', True,  5, False),
    # 101 Greyhound
    101: _t('large', 3, 'moderate',  'moderate', 'intermediate', 7, 7, 6,  True,  False, 'low',      160, 'quiet',    True,  6, False),
    # 102 Harrier
    102: _t('medium',4, 'high',      'moderate', 'basic',        8, 8, 7,  True,  False, 'low',      140, 'vocal',    True,  5, False),
    # 103 Havanese
    103: _t('small', 3, 'moderate',  'moderate', 'intermediate', 9, 8, 9,  False, True,  'high',     120, 'moderate', True,  8, False),
    # 104 Ibizan Hound
    104: _t('large', 4, 'high',      'high',     'intermediate', 7, 6, 6,  True,  False, 'low',      150, 'quiet',    True,  5, True),
    # 105 Irish Setter
    105: _t('large', 5, 'very_high', 'moderate', 'intermediate', 9, 8, 8,  True,  False, 'moderate', 180, 'moderate', False, 3, False),
    # 106 Irish Terrier
    106: _t('medium',4, 'high',      'high',     'intermediate', 7, 5, 7,  True,  False, 'moderate', 150, 'moderate', True,  5, True),
    # 107 Irish Water Spaniel
    107: _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'high',     160, 'moderate', True,  5, False),
    # 108 Irish Wolfhound
    108: _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 250, 'quiet',    True,  5, False),
    # 109 Italian Greyhound
    109: _t('small', 3, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'low',      100, 'moderate', True,  7, False),
    # 110 Jack Russell Terrier
    110: _t('small', 5, 'very_high', 'high',     'intermediate', 7, 5, 7,  False, True,  'low',      100, 'vocal',    False, 4, True),
    # 111 Japanese Chin
    111: _t('small', 2, 'minimal',   'low',      'intermediate', 7, 7, 6,  False, True,  'moderate', 100, 'quiet',    True,  9, False),
    # 112 Jindo
    112: _t('medium',3, 'moderate',  'high',     'basic',        5, 4, 3,  True,  False, 'moderate', 130, 'moderate', True,  5, True),
    # 113 Keeshond
    113: _t('medium',3, 'moderate',  'moderate', 'intermediate', 8, 7, 8,  False, True,  'high',     140, 'moderate', True,  6, False),
    # 114 Kerry Blue Terrier
    114: _t('medium',4, 'high',      'high',     'intermediate', 7, 5, 7,  True,  False, 'moderate', 150, 'moderate', True,  5, True),
    # 115 Komondor
    115: _t('large', 3, 'moderate',  'high',     'intermediate', 6, 5, 3,  True,  False, 'high',     200, 'moderate', True,  5, True),
    # 116 Kuvasz
    116: _t('large', 4, 'high',      'high',     'intermediate', 7, 6, 4,  True,  False, 'moderate', 200, 'moderate', True,  5, True),
    # 117 Labrador Retriever
    117: _t('large', 4, 'high',      'moderate', 'intermediate', 10,9, 9,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 118 Lakeland Terrier
    118: _t('small', 4, 'high',      'high',     'intermediate', 7, 5, 7,  False, True,  'moderate', 110, 'moderate', True,  6, False),
    # 119 Leonberger
    119: _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'high',     250, 'moderate', True,  5, False),
    # 120 Lhasa Apso
    120: _t('small', 2, 'minimal',   'moderate', 'basic',        5, 5, 4,  False, True,  'high',     110, 'moderate', True,  8, False),
    # 121 Lowchen
    121: _t('small', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 8,  False, True,  'moderate', 110, 'moderate', True,  8, False),
    # 122 Maltese
    122: _t('small', 2, 'minimal',   'moderate', 'intermediate', 8, 7, 7,  False, True,  'high',     110, 'moderate', True,  8, False),
    # 123 Manchester Terrier
    123: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 5, 7,  False, True,  'low',      100, 'moderate', True,  6, False),
    # 124 Maremma Sheepdog
    124: _t('large', 3, 'moderate',  'high',     'intermediate', 6, 5, 3,  True,  False, 'high',     190, 'moderate', True,  5, True),
    # 125 Mastiff
    125: _t('large', 2, 'moderate',  'moderate', 'intermediate', 7, 6, 5,  True,  False, 'low',      250, 'moderate', True,  5, True),
    # 126 McNab
    126: _t('medium',5, 'very_high', 'high',     'advanced',     7, 6, 5,  True,  False, 'moderate', 150, 'moderate', False, 3, True),
    # 127 Miniature Pinscher
    127: _t('small', 4, 'high',      'moderate', 'intermediate', 6, 5, 6,  False, True,  'low',      100, 'vocal',    True,  7, False),
    # 128 Miniature Schnauzer
    128: _t('small', 4, 'high',      'moderate', 'intermediate', 8, 6, 7,  False, True,  'moderate', 120, 'vocal',    True,  6, False),
    # 129 Mountain Dog
    129: _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 210, 'moderate', True,  5, False),
    # 130 Munsterlander
    130: _t('large', 5, 'very_high', 'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 170, 'moderate', False, 4, False),
    # 131 Neapolitan Mastiff
    131: _t('large', 2, 'moderate',  'moderate', 'intermediate', 6, 5, 4,  True,  False, 'low',      230, 'moderate', True,  5, True),
    # 132 New Guinea Singing Dog
    132: _t('medium',4, 'high',      'high',     'basic',        5, 4, 3,  True,  False, 'low',      140, 'vocal',    False, 4, True),
    # 133 Newfoundland
    133: _t('large', 2, 'moderate',  'moderate', 'intermediate', 9, 8, 8,  True,  False, 'high',     250, 'moderate', True,  5, False),
    # 134 Norfolk Terrier
    134: _t('small', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'moderate', True,  7, False),
    # 135 Norwegian Buhund
    135: _t('medium',4, 'high',      'moderate', 'intermediate', 8, 7, 7,  False, True,  'moderate', 140, 'vocal',    True,  6, False),
    # 136 Norwegian Elk Hound
    136: _t('medium',4, 'high',      'moderate', 'intermediate', 7, 6, 6,  True,  False, 'moderate', 150, 'vocal',    True,  5, False),
    # 137 Norwich Terrier
    137: _t('small', 4, 'high',      'moderate', 'intermediate', 8, 6, 7,  False, True,  'moderate', 110, 'moderate', True,  7, False),
    # 138 Nova Scotia Duck Tolling Retriever
    138: _t('medium',5, 'very_high', 'moderate', 'intermediate', 8, 7, 6,  True,  False, 'moderate', 160, 'moderate', False, 4, False),
    # 139 Old English Sheepdog
    139: _t('large', 4, 'high',      'moderate', 'intermediate', 9, 7, 7,  True,  False, 'high',     200, 'moderate', True,  5, False),
    # 140 Otterhound
    140: _t('large', 4, 'high',      'moderate', 'basic',        8, 7, 7,  True,  False, 'moderate', 170, 'vocal',    True,  5, False),
    # 141 Labrador Retriever (alternative ID)
    141: _t('large', 4, 'high',      'moderate', 'intermediate', 10,9, 9,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 142 Papillon
    142: _t('small', 4, 'high',      'moderate', 'intermediate', 8, 7, 8,  False, True,  'moderate', 100, 'moderate', True,  7, False),
    # 143 Patterdale Terrier
    143: _t('small', 4, 'high',      'high',     'basic',        6, 5, 6,  False, True,  'low',      100, 'moderate', True,  6, False),
    # 144 Pekingese
    144: _t('small', 1, 'minimal',   'moderate', 'basic',        4, 4, 4,  False, True,  'high',     100, 'moderate', True,  9, False),
    # 145 Pharaoh Hound
    145: _t('large', 4, 'high',      'moderate', 'intermediate', 7, 7, 6,  True,  False, 'low',      160, 'moderate', True,  5, False),
    # 146 Pit Bull Terrier
    146: _t('large', 4, 'high',      'high',     'intermediate', 7, 5, 6,  True,  False, 'low',      150, 'moderate', True,  5, True),
    # 147 Plott Hound
    147: _t('large', 4, 'high',      'moderate', 'basic',        7, 6, 6,  True,  False, 'low',      140, 'vocal',    True,  5, False),
    # 148 Pointer
    148: _t('large', 5, 'very_high', 'moderate', 'intermediate', 8, 7, 7,  True,  False, 'low',      150, 'moderate', False, 4, False),
    # 149 Polish Lowland Sheepdog
    149: _t('medium',3, 'moderate',  'moderate', 'intermediate', 7, 6, 5,  False, True,  'high',     150, 'moderate', True,  6, False),
    # 150 Pomeranian
    150: _t('small', 3, 'moderate',  'moderate', 'intermediate', 6, 5, 6,  False, True,  'moderate', 100, 'vocal',    True,  8, False),
    # 151 Poodle (Miniature or Toy)
    151: _t('small', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'high',     130, 'moderate', True,  7, False),
    # 152 Portuguese Water Dog
    152: _t('medium',4, 'high',      'moderate', 'intermediate', 8, 7, 7,  False, True,  'moderate', 160, 'moderate', True,  5, False),
    # 153 Pug
    153: _t('small', 2, 'minimal',   'moderate', 'basic',        9, 8, 9,  False, True,  'low',      130, 'moderate', True,  7, False),
    # 154 Puli
    154: _t('medium',4, 'high',      'high',     'intermediate', 7, 6, 5,  True,  False, 'high',     160, 'moderate', True,  5, True),
    # 155 Rat Terrier
    155: _t('small', 4, 'high',      'moderate', 'intermediate', 8, 6, 7,  False, True,  'low',      100, 'moderate', True,  6, False),
    # 156 Redbone Coonhound
    156: _t('large', 4, 'high',      'moderate', 'basic',        7, 6, 6,  True,  False, 'low',      140, 'vocal',    True,  5, False),
    # 157 Rhodesian Ridgeback
    157: _t('large', 4, 'high',      'high',     'intermediate', 7, 5, 5,  True,  False, 'low',      180, 'moderate', True,  5, True),
    # 158 Rottweiler
    158: _t('large', 3, 'moderate',  'high',     'intermediate', 6, 4, 3,  True,  False, 'low',      190, 'moderate', True,  5, True),
    # 159 Saint Bernard
    159: _t('large', 2, 'moderate',  'moderate', 'intermediate', 9, 8, 8,  True,  False, 'high',     260, 'moderate', True,  5, False),
    # 160 Saluki
    160: _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 4,  True,  False, 'low',      170, 'quiet',    True,  5, True),
    # 161 Samoyed
    161: _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 8,  True,  False, 'high',     200, 'moderate', True,  5, False),
    # 162 Schipperke
    162: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 5, 6,  False, True,  'moderate', 110, 'moderate', True,  6, False),
    # 163 Schnauzer
    163: _t('medium',4, 'high',      'high',     'intermediate', 7, 5, 6,  True,  False, 'moderate', 160, 'moderate', True,  5, True),
    # 164 Scottish Deerhound
    164: _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 200, 'quiet',    True,  5, False),
    # 165 Scottish Terrier
    165: _t('small', 3, 'moderate',  'high',     'basic',        5, 4, 4,  False, True,  'moderate', 120, 'moderate', True,  7, True),
    # 166 Sealyham Terrier
    166: _t('small', 3, 'moderate',  'moderate', 'intermediate', 7, 5, 6,  False, True,  'moderate', 110, 'moderate', True,  7, False),
    # 167 Segugio Italiano
    167: _t('large', 4, 'high',      'moderate', 'basic',        7, 7, 6,  True,  False, 'low',      150, 'vocal',    True,  5, False),
    # 168 Shar Pei
    168: _t('medium',3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'low',      160, 'moderate', True,  5, True),
    # 169 Old English Sheepdog variant
    169: _t('large', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 6,  True,  False, 'high',     190, 'moderate', True,  5, False),
    # 170 Sheep Dog (general)
    170: _t('large', 3, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  True,  False, 'moderate', 170, 'moderate', True,  5, False),
    # 171 Shepherd (generic)
    171: _t('large', 4, 'high',      'moderate', 'intermediate', 7, 6, 5,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 172 Shepherd Dog (alternative)
    172: _t('large', 4, 'high',      'moderate', 'intermediate', 7, 6, 5,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 173 Shepherd (generic) — id varies
    173: _t('large', 4, 'high',      'moderate', 'intermediate', 7, 6, 5,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 174 Shetland Sheepdog (Sheltie)
    174: _t('small', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 6,  False, True,  'high',     130, 'vocal',    True,  6, False),
    # 175 something
    175: _t('medium',3, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 130, 'moderate', True,  6, False),
    # 176 Siberian Husky
    176: _t('large', 5, 'very_high', 'high',     'basic',        7, 6, 7,  True,  False, 'high',     200, 'vocal',    False, 3, True),
    # 177 Silky Terrier
    177: _t('small', 3, 'moderate',  'moderate', 'intermediate', 7, 5, 7,  False, True,  'moderate', 100, 'moderate', True,  7, False),
    # 178 Skye Terrier
    178: _t('medium',3, 'moderate',  'high',     'intermediate', 5, 4, 4,  False, True,  'moderate', 130, 'moderate', True,  6, True),
    # 179 Poodle (Standard)
    179: _t('large', 3, 'moderate',  'moderate', 'advanced',     8, 7, 7,  False, True,  'high',     160, 'moderate', True,  6, False),
    # 180 Sloughi
    180: _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'low',      160, 'quiet',    True,  5, True),
    # 181 Smooth Fox Terrier
    181: _t('small', 4, 'high',      'high',     'intermediate', 7, 5, 7,  False, True,  'low',      100, 'vocal',    True,  6, False),
    # 182 South Russian Ovtcharka
    182: _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'moderate', 190, 'moderate', True,  5, True),
    # 183 Spaniel (generic)
    183: _t('medium',3, 'moderate',  'moderate', 'intermediate', 8, 7, 8,  False, True,  'moderate', 140, 'moderate', True,  6, False),
    # 184 Spitz (generic)
    184: _t('medium',4, 'high',      'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 130, 'moderate', True,  6, False),
    # 185 Staffordshire Bull Terrier
    185: _t('medium',4, 'high',      'high',     'intermediate', 8, 5, 6,  True,  False, 'low',      150, 'moderate', True,  5, True),
    # 186 Standard Poodle
    186: _t('large', 3, 'moderate',  'moderate', 'advanced',     8, 7, 7,  False, True,  'high',     160, 'moderate', True,  6, False),
    # 187 Sussex Spaniel
    187: _t('medium',2, 'moderate',  'low',      'basic',        8, 7, 7,  False, True,  'moderate', 140, 'vocal',    True,  7, False),
    # 188 Swedish Vallhund
    188: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 120, 'vocal',    True,  6, False),
    # 189 Terrier (generic)
    189: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 5, 7,  False, True,  'low',      110, 'moderate', True,  6, False),
    # 190 Thai Ridgeback
    190: _t('large', 4, 'high',      'high',     'intermediate', 5, 4, 3,  True,  False, 'low',      160, 'moderate', True,  5, True),
    # 191 Tibetan Mastiff
    191: _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'high',     230, 'moderate', True,  5, True),
    # 192 Tibetan Spaniel
    192: _t('small', 2, 'minimal',   'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 110, 'moderate', True,  8, False),
    # 193 Tibetan Terrier
    193: _t('medium',3, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'high',     130, 'moderate', True,  6, False),
    # 194 Tosa Inu
    194: _t('large', 3, 'moderate',  'high',     'intermediate', 4, 3, 3,  True,  False, 'low',      210, 'moderate', True,  5, True),
    # 195 Toy Fox Terrier
    195: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 6, 7,  False, True,  'low',      100, 'moderate', True,  7, False),
    # 196 Treeing Walker Coonhound
    196: _t('large', 4, 'high',      'moderate', 'basic',        7, 7, 7,  True,  False, 'low',      140, 'vocal',    True,  5, False),
    # 197 Vizsla
    197: _t('large', 5, 'very_high', 'moderate', 'intermediate', 9, 8, 8,  True,  False, 'low',      170, 'moderate', False, 3, False),
    # 198 Weimaraner
    198: _t('large', 5, 'very_high', 'high',     'intermediate', 8, 6, 7,  True,  False, 'low',      180, 'moderate', False, 3, True),
    # 199 Setter (generic)
    199: _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 170, 'moderate', True,  5, False),
    # 200 Shar Pei
    200: _t('medium',3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'low',      160, 'moderate', True,  5, True),
    # 201 Sheep Dog
    201: _t('large', 3, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  True,  False, 'high',     180, 'moderate', True,  5, False),
    # 202 Shepherd (generic)
    202: _t('large', 4, 'high',      'moderate', 'intermediate', 7, 6, 5,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 203 Shetland Sheepdog Sheltie
    203: _t('small', 3, 'moderate',  'moderate', 'intermediate', 8, 7, 6,  False, True,  'high',     130, 'vocal',    True,  6, False),
    # 204 Shiba Inu
    204: _t('medium',3, 'moderate',  'high',     'intermediate', 5, 4, 4,  False, True,  'low',      140, 'moderate', True,  6, True),
    # 205 Shih Tzu
    205: _t('small', 2, 'minimal',   'moderate', 'basic',        8, 7, 8,  False, True,  'high',     110, 'quiet',    True,  8, False),
    # 206 Siberian Husky
    206: _t('large', 5, 'very_high', 'high',     'basic',        7, 6, 7,  True,  False, 'high',     200, 'vocal',    False, 3, True),
    # 207 Silky Terrier
    207: _t('small', 3, 'moderate',  'moderate', 'intermediate', 7, 5, 7,  False, True,  'high',     100, 'moderate', True,  7, False),
    # 208 Skye Terrier
    208: _t('medium',3, 'moderate',  'high',     'intermediate', 5, 4, 4,  False, True,  'moderate', 130, 'moderate', True,  6, True),
    # 209 Sloughi
    209: _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'low',      160, 'quiet',    True,  5, True),
    # 210 Smooth Fox Terrier
    210: _t('small', 4, 'high',      'high',     'intermediate', 7, 5, 7,  False, True,  'low',      100, 'vocal',    True,  6, False),
    # 211 South Russian Ovtcharka
    211: _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'moderate', 190, 'moderate', True,  5, True),
    # 212 Spaniel (generic)
    212: _t('medium',3, 'moderate',  'moderate', 'intermediate', 8, 7, 8,  False, True,  'moderate', 140, 'moderate', True,  6, False),
    # 213 Spitz (generic)
    213: _t('medium',4, 'high',      'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 130, 'moderate', True,  6, False),
    # 214 Staffordshire Bull Terrier
    214: _t('medium',4, 'high',      'high',     'intermediate', 8, 5, 6,  True,  False, 'low',      150, 'moderate', True,  5, True),
    # 215 Standard Poodle
    215: _t('large', 3, 'moderate',  'moderate', 'advanced',     8, 7, 7,  False, True,  'high',     160, 'moderate', True,  6, False),
    # 216 Sussex Spaniel
    216: _t('medium',2, 'moderate',  'low',      'basic',        8, 7, 7,  False, True,  'moderate', 140, 'vocal',    True,  7, False),
    # 217 Swedish Vallhund
    217: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 6, 7,  False, True,  'moderate', 120, 'vocal',    True,  6, False),
    # 218 Terrier (generic)
    218: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 5, 7,  False, True,  'low',      110, 'moderate', True,  6, False),
    # 219 Thai Ridgeback
    219: _t('large', 4, 'high',      'high',     'intermediate', 5, 4, 3,  True,  False, 'low',      160, 'moderate', True,  5, True),
    # 220 Tibetan Mastiff
    220: _t('large', 3, 'moderate',  'high',     'intermediate', 5, 4, 3,  True,  False, 'high',     230, 'moderate', True,  5, True),
    # 221 Tibetan Spaniel
    221: _t('small', 2, 'minimal',   'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 110, 'moderate', True,  8, False),
    # 222 Tibetan Terrier
    222: _t('medium',3, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'high',     130, 'moderate', True,  6, False),
    # 223 Tosa Inu
    223: _t('large', 3, 'moderate',  'high',     'intermediate', 4, 3, 3,  True,  False, 'low',      210, 'moderate', True,  5, True),
    # 224 Toy Fox Terrier
    224: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 6, 7,  False, True,  'low',      100, 'moderate', True,  7, False),
    # 225 Treeing Walker Coonhound
    225: _t('large', 4, 'high',      'moderate', 'basic',        7, 7, 7,  True,  False, 'low',      140, 'vocal',    True,  5, False),
    # 226 Vizsla
    226: _t('large', 5, 'very_high', 'moderate', 'intermediate', 9, 8, 8,  True,  False, 'low',      170, 'moderate', False, 3, False),
    # 227 Weimaraner
    227: _t('large', 5, 'very_high', 'high',     'intermediate', 8, 6, 7,  True,  False, 'low',      180, 'moderate', False, 3, True),
    # 228 Welsh Corgi
    228: _t('small', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  False, True,  'moderate', 120, 'vocal',    True,  6, False),
    # 229 Welsh Springer Spaniel
    229: _t('medium',4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 150, 'moderate', True,  5, False),
    # 230 Welsh Terrier
    230: _t('medium',4, 'high',      'high',     'intermediate', 7, 5, 7,  True,  False, 'moderate', 130, 'moderate', True,  5, True),
    # 231 West Highland White Terrier (Westie)
    231: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 5, 7,  False, True,  'moderate', 120, 'moderate', True,  6, False),
    # 232 Wheaten Terrier
    232: _t('medium',4, 'high',      'high',     'intermediate', 8, 6, 7,  False, True,  'moderate', 150, 'moderate', True,  5, True),
    # 233 Whippet
    233: _t('medium',3, 'moderate',  'moderate', 'intermediate', 7, 7, 6,  True,  False, 'low',      140, 'quiet',    True,  6, False),
    # 234 White German Shepherd
    234: _t('large', 4, 'high',      'moderate', 'intermediate', 7, 5, 5,  True,  False, 'moderate', 180, 'moderate', True,  5, False),
    # 235 Wire Fox Terrier
    235: _t('small', 4, 'high',      'high',     'intermediate', 7, 5, 7,  False, True,  'moderate', 110, 'vocal',    True,  6, False),
    # 236 Wire-haired Pointing Griffon
    236: _t('large', 4, 'high',      'moderate', 'intermediate', 8, 7, 7,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 237 Wirehaired Terrier
    237: _t('small', 4, 'high',      'moderate', 'intermediate', 7, 5, 7,  False, True,  'low',      110, 'moderate', True,  6, False),
    # 238 Xoloitzcuintle/Mexican Hairless
    238: _t('medium',3, 'moderate',  'moderate', 'intermediate', 6, 5, 5,  False, True,  'low',      130, 'moderate', True,  7, False),
    # 239 Yellow Labrador Retriever
    239: _t('large', 4, 'high',      'moderate', 'intermediate', 10,9, 9,  True,  False, 'moderate', 160, 'moderate', True,  5, False),
    # 240 Yorkshire Terrier (Yorkie)
    240: _t('small', 3, 'moderate',  'moderate', 'intermediate', 7, 5, 6,  False, True,  'high',     110, 'moderate', True,  7, False),
    # 307 Mixed Breed — imputed dynamically per size/age; these are averages
    307: _t('medium',3, 'moderate',  'moderate', 'basic',        7, 6, 6,  False, True,  'moderate', 120, 'moderate', True,  6, False),


    # =========================================================================
    # CAT BREEDS (Type=2) — BreedID 241–306
    # =========================================================================

    # 241 Abyssinian
    241: _t('medium',5, 'high',      'moderate', 'intermediate', 7, 6, 7,  False, True,  'low',      100, 'moderate', True,  8, False),
    # 242 American Curl
    242: _t('medium',3, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'moderate', 100, 'moderate', True,  8, False),
    # 243 American Shorthair
    243: _t('medium',3, 'moderate',  'low',      'basic',        8, 7, 7,  False, True,  'low',      90,  'moderate', True,  9, False),
    # 244 American Wirehair
    244: _t('medium',3, 'moderate',  'low',      'basic',        8, 7, 7,  False, True,  'low',      90,  'moderate', True,  9, False),
    # 245 Applehead Siamese
    245: _t('medium',4, 'moderate',  'moderate', 'basic',        7, 5, 6,  False, True,  'low',      100, 'vocal',    True,  8, False),
    # 246 Balinese
    246: _t('medium',4, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'vocal',    True,  8, False),
    # 247 Bengal
    247: _t('medium',5, 'high',      'moderate', 'basic',        7, 5, 5,  False, True,  'low',      120, 'vocal',    True,  6, True),
    # 248 Birman
    248: _t('medium',2, 'minimal',   'low',      'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'quiet',    True,  9, False),
    # 249 Bobtail
    249: _t('medium',3, 'moderate',  'low',      'basic',        8, 7, 7,  False, True,  'low',      100, 'moderate', True,  8, False),
    # 250 Bombay
    250: _t('medium',3, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'low',      100, 'moderate', True,  8, False),
    # 251 British Shorthair
    251: _t('medium',2, 'minimal',   'low',      'basic',        8, 7, 6,  False, True,  'moderate', 100, 'quiet',    True,  10,False),
    # 252 Burmese
    252: _t('medium',4, 'moderate',  'moderate', 'intermediate', 9, 7, 8,  False, True,  'low',      100, 'vocal',    True,  8, False),
    # 253 Burmilla
    253: _t('medium',3, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'moderate', True,  8, False),
    # 254 Calico (color pattern, not a breed — use DSH traits)
    254: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 255 Canadian Hairless (Sphynx-like)
    255: _t('medium',4, 'moderate',  'moderate', 'intermediate', 8, 7, 8,  False, True,  'low',      130, 'vocal',    True,  7, False),
    # 256 Chartreux
    256: _t('medium',3, 'moderate',  'low',      'intermediate', 7, 7, 6,  False, True,  'low',      110, 'quiet',    True,  9, False),
    # 257 Chausie
    257: _t('large', 5, 'high',      'moderate', 'intermediate', 6, 5, 5,  False, True,  'low',      130, 'moderate', True,  6, True),
    # 258 Chinchilla
    258: _t('medium',2, 'minimal',   'low',      'intermediate', 6, 5, 5,  False, True,  'high',     120, 'quiet',    True,  9, False),
    # 259 Cornish Rex
    259: _t('medium',4, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'low',      110, 'moderate', True,  7, False),
    # 260 Cymric (longhaired Manx)
    260: _t('medium',3, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'high',     110, 'moderate', True,  8, False),
    # 261 Devon Rex
    261: _t('medium',4, 'moderate',  'moderate', 'intermediate', 9, 8, 8,  False, True,  'low',      110, 'moderate', True,  7, False),
    # 262 Dilute Calico (color pattern)
    262: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 263 Dilute Tortoiseshell (color pattern)
    263: _t('medium',3, 'moderate',  'low',      'basic',        6, 5, 5,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 264 Domestic Long Hair — most common cat in shelters
    264: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'high',     80,  'quiet',    True,  9, False),
    # 265 Domestic Medium Hair
    265: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'moderate', 80,  'moderate', True,  9, False),
    # 266 Domestic Short Hair — MOST COMMON in dataset (3634 pets)
    266: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 267 Egyptian Mau
    267: _t('medium',4, 'moderate',  'moderate', 'intermediate', 6, 5, 5,  False, True,  'low',      110, 'moderate', True,  7, False),
    # 268 Exotic Shorthair
    268: _t('medium',2, 'minimal',   'low',      'intermediate', 8, 7, 6,  False, True,  'low',      100, 'quiet',    True,  9, False),
    # 269 Extra-Toes Cat (Hemingway Polydactyl)
    269: _t('medium',3, 'moderate',  'low',      'basic',        8, 7, 7,  False, True,  'moderate', 90,  'moderate', True,  9, False),
    # 270 Havana
    270: _t('medium',4, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'low',      110, 'moderate', True,  8, False),
    # 271 Himalayan
    271: _t('medium',2, 'minimal',   'low',      'intermediate', 7, 6, 5,  False, True,  'high',     120, 'quiet',    True,  9, False),
    # 272 Japanese Bobtail
    272: _t('medium',4, 'moderate',  'moderate', 'intermediate', 8, 7, 8,  False, True,  'low',      100, 'moderate', True,  8, False),
    # 273 Javanese
    273: _t('medium',4, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'vocal',    True,  8, False),
    # 274 Korat
    274: _t('medium',3, 'moderate',  'low',      'intermediate', 7, 6, 6,  False, True,  'low',      100, 'moderate', True,  8, False),
    # 275 LaPerm
    275: _t('medium',3, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'moderate', True,  8, False),
    # 276 Maine Coon
    276: _t('large', 3, 'moderate',  'moderate', 'basic',        9, 8, 7,  False, True,  'high',     140, 'moderate', True,  8, False),
    # 277 Manx
    277: _t('medium',3, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'moderate', 100, 'moderate', True,  8, False),
    # 278 Munchkin
    278: _t('small', 3, 'moderate',  'low',      'intermediate', 8, 7, 8,  False, True,  'moderate', 100, 'moderate', True,  9, False),
    # 279 Nebelung
    279: _t('medium',3, 'moderate',  'low',      'intermediate', 6, 5, 4,  False, True,  'moderate', 110, 'quiet',    True,  9, False),
    # 280 Norwegian Forest Cat
    280: _t('large', 3, 'moderate',  'low',      'basic',        8, 7, 6,  False, True,  'high',     130, 'moderate', True,  8, False),
    # 281 Ocicat
    281: _t('medium',4, 'moderate',  'moderate', 'intermediate', 7, 7, 7,  False, True,  'low',      110, 'moderate', True,  7, False),
    # 282 Oriental Long Hair
    282: _t('medium',4, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 100, 'vocal',    True,  7, False),
    # 283 Oriental Short Hair
    283: _t('medium',4, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'low',      100, 'vocal',    True,  7, False),
    # 284 Oriental Tabby
    284: _t('medium',4, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'low',      100, 'vocal',    True,  7, False),
    # 285 Persian — 221 in dataset
    285: _t('medium',1, 'minimal',   'low',      'basic',        6, 6, 4,  False, True,  'high',     120, 'quiet',    True,  10,False),
    # 286 Pixie-Bob
    286: _t('medium',3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'moderate', 110, 'moderate', True,  8, False),
    # 287 Ragamuffin
    287: _t('large', 2, 'minimal',   'low',      'intermediate', 9, 8, 8,  False, True,  'high',     130, 'quiet',    True,  9, False),
    # 288 Ragdoll
    288: _t('large', 2, 'minimal',   'low',      'intermediate', 9, 8, 8,  False, True,  'high',     130, 'quiet',    True,  9, False),
    # 289 Russian Blue
    289: _t('medium',2, 'minimal',   'low',      'intermediate', 7, 6, 4,  False, True,  'low',      100, 'quiet',    True,  9, False),
    # 290 Scottish Fold
    290: _t('medium',2, 'minimal',   'low',      'intermediate', 8, 7, 7,  False, True,  'moderate', 120, 'quiet',    True,  9, False),
    # 291 Selkirk Rex
    291: _t('medium',3, 'moderate',  'low',      'intermediate', 9, 8, 8,  False, True,  'moderate', 110, 'moderate', True,  8, False),
    # 292 Siamese — 264 in dataset
    292: _t('medium',4, 'moderate',  'moderate', 'basic',        7, 5, 5,  False, True,  'low',      100, 'vocal',    True,  8, False),
    # 293 Siberian
    293: _t('large', 3, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'high',     130, 'moderate', True,  8, False),
    # 294 Silver (color pattern)
    294: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 295 Singapura
    295: _t('small', 4, 'moderate',  'low',      'intermediate', 8, 7, 7,  False, True,  'low',      100, 'moderate', True,  8, False),
    # 296 Snowshoe
    296: _t('medium',3, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'low',      100, 'moderate', True,  8, False),
    # 297 Somali
    297: _t('medium',4, 'moderate',  'moderate', 'intermediate', 7, 6, 6,  False, True,  'moderate', 110, 'moderate', True,  7, False),
    # 298 Sphynx (hairless)
    298: _t('medium',4, 'moderate',  'moderate', 'intermediate', 9, 8, 8,  False, True,  'low',      130, 'vocal',    True,  7, False),
    # 299 Tabby (color pattern — use DSH) — 342 in dataset
    299: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 300 Tiger (color pattern)
    300: _t('medium',3, 'moderate',  'low',      'basic',        6, 5, 5,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 301 Tonkinese
    301: _t('medium',4, 'moderate',  'moderate', 'intermediate', 8, 7, 7,  False, True,  'low',      110, 'vocal',    True,  7, False),
    # 302 Torbie (color pattern)
    302: _t('medium',3, 'moderate',  'low',      'basic',        6, 5, 5,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 303 Tortoiseshell (color pattern)
    303: _t('medium',3, 'moderate',  'low',      'basic',        5, 5, 4,  False, True,  'low',      80,  'moderate', True,  9, False),
    # 304 Turkish Angora
    304: _t('medium',3, 'moderate',  'low',      'intermediate', 7, 6, 6,  False, True,  'high',     110, 'moderate', True,  8, False),
    # 305 Turkish Van
    305: _t('large', 4, 'moderate',  'moderate', 'intermediate', 7, 5, 5,  False, True,  'moderate', 120, 'moderate', True,  7, False),
    # 306 Tuxedo (color pattern — use DSH)
    306: _t('medium',3, 'moderate',  'low',      'basic',        7, 6, 6,  False, True,  'low',      80,  'moderate', True,  9, False),
}


# ============================================================================
# SPECIES-LEVEL FALLBACKS (used if BreedID not in BREED_TRAITS)
# ============================================================================

SPECIES_FALLBACK = {
    1: _t('medium',3, 'moderate', 'moderate', 'basic', 6, 5, 6, False, True,  'moderate', 140, 'moderate', True, 6, False),  # Dog
    2: _t('medium',3, 'moderate', 'low',      'basic', 7, 6, 5, False, True,  'moderate', 90,  'moderate', True, 9, False),  # Cat
}


# ============================================================================
# SIZE OVERRIDE TABLE (MaturitySize from PetFinder → our size enum)
# Used to override base breed size based on actual measured size
# ============================================================================

MATURITY_SIZE_MAP = {
    1: 'small',
    2: 'medium',
    3: 'large',
    4: 'large',   # XLarge → also large in our 3-tier system
    0: 'medium',  # Not specified
}


# ============================================================================
# FUR-LENGTH → GROOMING OVERRIDE
# PetFinder FurLength overrides breed's default grooming when available
# ============================================================================

FUR_GROOMING_MAP = {
    1: 'low',      # Short
    2: 'moderate', # Medium
    3: 'high',     # Long
    0: None,       # NA — keep breed default
}


# ============================================================================
# AGE-BASED ENERGY ADJUSTMENT
# Young pets are more energetic; senior pets need adjustment
# ============================================================================

def _age_energy_adjustment(base_energy: int, age_months: int) -> int:
    """Adjust energy level based on age. Returns int 1-5."""
    if age_months <= 6:       # Puppy/kitten — boost energy
        adj = base_energy + 1
    elif age_months <= 18:    # Adolescent
        adj = base_energy
    elif age_months <= 72:    # Adult (1.5-6 years)
        adj = base_energy
    elif age_months <= 120:   # Senior (6-10 years)
        adj = base_energy - 1
    else:                     # Geriatric (10+)
        adj = base_energy - 2
    return max(1, min(5, adj))


def _age_exercise_adjustment(base_exercise: str, age_months: int) -> str:
    """Adjust exercise needs based on age."""
    order = ['minimal', 'moderate', 'high', 'very_high']
    idx = order.index(base_exercise) if base_exercise in order else 1
    if age_months <= 6:
        idx = min(len(order)-1, idx + 1)
    elif age_months > 84:    # 7+ years
        idx = max(0, idx - 1)
    return order[idx]


def _age_max_alone_adjustment(base_max: int, age_months: int) -> int:
    """Puppies/kittens can't be left alone as long."""
    if age_months <= 3:
        return min(base_max, 2)
    elif age_months <= 6:
        return min(base_max, 4)
    return base_max


# ============================================================================
# MAIN IMPUTATION FUNCTION
# ============================================================================

def impute_traits(breed_id: int, species_type: int, maturity_size: int,
                  fur_length: int, age_months: int,
                  noise_factor: float = 0.15) -> dict:
    """
    Get full trait profile for a PetFinder pet.

    Args:
        breed_id:      PetFinder Breed1 ID
        species_type:  1=Dog, 2=Cat
        maturity_size: PetFinder MaturitySize (1=Sm, 2=Med, 3=Lg, 4=XLg)
        fur_length:    PetFinder FurLength (1=Short, 2=Med, 3=Long, 0=NA)
        age_months:    Age in months
        noise_factor:  Random noise magnitude (0.15 = ±15% of range)

    Returns:
        dict with all fields matching AdoptionPet.js compatibilityProfile schema
    """
    # 1. Get base traits from breed lookup (or species fallback)
    base = BREED_TRAITS.get(breed_id, SPECIES_FALLBACK.get(species_type, SPECIES_FALLBACK[1]))
    traits = base.copy()

    # 2. Override size based on actual MaturitySize measurement
    if maturity_size in MATURITY_SIZE_MAP:
        traits['size'] = MATURITY_SIZE_MAP[maturity_size]

    # 3. Override grooming based on actual fur length
    groom_override = FUR_GROOMING_MAP.get(fur_length)
    if groom_override:
        traits['groomingNeeds'] = groom_override

    # 4. Adjust energy + exercise based on age
    traits['energyLevel'] = _age_energy_adjustment(traits['energyLevel'], age_months)
    traits['exerciseNeeds'] = _age_exercise_adjustment(traits['exerciseNeeds'], age_months)
    traits['maxHoursAlone'] = _age_max_alone_adjustment(traits['maxHoursAlone'], age_months)

    # 5. Add controlled noise to numeric scores (keeps values realistic, not identical)
    #    Only noisy on the 0-10 scores, NOT on energy (rounded int) or booleans
    def _noisy_score(val, lo=0, hi=10):
        """Add small noise to a 0-10 score."""
        noise = random.gauss(0, noise_factor * (hi - lo))
        return round(max(lo, min(hi, val + noise)))

    traits['childFriendlyScore']    = _noisy_score(traits['childFriendlyScore'])
    traits['petFriendlyScore']      = _noisy_score(traits['petFriendlyScore'])
    traits['strangerFriendlyScore'] = _noisy_score(traits['strangerFriendlyScore'])

    # 6. Derive canLiveInApartment / needsYard from size if not already set
    #    Small pets in breed lookup may have been bumped to large by maturity size
    if traits['size'] == 'large' and traits['canLiveInApartment']:
        # Large pets: downgrade apartment suitability
        if traits['exerciseNeeds'] in ('high', 'very_high'):
            traits['canLiveInApartment'] = False
            traits['needsYard'] = True

    # 7. Derive canBeLeftAlone from maxHoursAlone
    traits['canBeLeftAlone'] = traits['maxHoursAlone'] >= 6

    return traits


def get_traits_batch(df) -> list:
    """
    Apply impute_traits to every row of a PetFinder DataFrame.

    Args:
        df: DataFrame with columns [Breed1, Type, MaturitySize, FurLength, Age]

    Returns:
        List of trait dicts, one per row
    """
    results = []
    for _, row in df.iterrows():
        traits = impute_traits(
            breed_id=int(row.get('Breed1', 0)),
            species_type=int(row.get('Type', 1)),
            maturity_size=int(row.get('MaturitySize', 2)),
            fur_length=int(row.get('FurLength', 0)),
            age_months=int(row.get('Age', 12)),
        )
        results.append(traits)
    return results
