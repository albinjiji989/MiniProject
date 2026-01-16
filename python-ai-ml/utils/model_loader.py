"""
Model loading and management utilities
"""
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import decode_predictions
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    """Load and manage AI models"""
    
    _instance = None
    _model = None
    
    def __new__(cls):
        """Singleton pattern to load model only once"""
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
        return cls._instance
    
    def load_mobilenet_v2(self, weights='imagenet'):
        """
        Load MobileNetV2 model
        
        Args:
            weights: Pre-trained weights to use
            
        Returns:
            Loaded model
        """
        if self._model is not None:
            logger.info("Using cached MobileNetV2 model")
            return self._model
        
        try:
            logger.info("Loading MobileNetV2 model...")
            
            # Load pre-trained MobileNetV2
            self._model = MobileNetV2(
                weights=weights,
                include_top=True,
                input_shape=(224, 224, 3)
            )
            
            logger.info("✅ MobileNetV2 model loaded successfully")
            logger.info(f"Model size: ~14 MB")
            logger.info(f"Parameters: {self._model.count_params():,}")
            
            return self._model
            
        except Exception as e:
            logger.error(f"❌ Error loading model: {str(e)}")
            raise
    
    def get_model(self):
        """Get loaded model or load if not loaded"""
        if self._model is None:
            return self.load_mobilenet_v2()
        return self._model
    
    @staticmethod
    def decode_predictions(predictions, top=5):
        """
        Decode model predictions to readable format
        
        Args:
            predictions: Model output
            top: Number of top predictions to return
            
        Returns:
            List of (class_id, class_name, probability) tuples
        """
        try:
            decoded = decode_predictions(predictions, top=top)
            return decoded[0]  # Return first batch
        except Exception as e:
            logger.error(f"Error decoding predictions: {str(e)}")
            return []
    
    @staticmethod
    def map_to_pet_info(predictions):
        """
        Map ImageNet predictions to pet breed/species information
        
        Args:
            predictions: Decoded predictions from model
            
        Returns:
            List of pet information dictionaries
        """
        # ImageNet class mapping to pet species
        dog_breeds = [
            'golden_retriever', 'labrador_retriever', 'german_shepherd',
            'beagle', 'bulldog', 'poodle', 'rottweiler', 'yorkshire_terrier',
            'boxer', 'dachshund', 'siberian_husky', 'great_dane', 'doberman',
            'shih-tzu', 'boston_bull', 'chihuahua', 'pug', 'pomeranian',
            'saint_bernard', 'collie', 'malamute', 'chow', 'keeshond',
            'samoyed', 'afghan_hound', 'basset', 'bloodhound', 'bluetick',
            'borzoi', 'bouvier_des_flandres', 'briard', 'bull_mastiff',
            'cairn', 'cardigan', 'chesapeake_bay_retriever', 'cocker_spaniel',
            'border_collie', 'border_terrier', 'english_setter', 'english_springer',
            'flat-coated_retriever', 'german_short-haired_pointer', 'gordon_setter',
            'groenendael', 'ibizan_hound', 'irish_setter', 'irish_terrier',
            'irish_water_spaniel', 'irish_wolfhound', 'italian_greyhound',
            'japanese_spaniel', 'kelpie', 'kerry_blue_terrier', 'komondor',
            'kuvasz', 'lakeland_terrier', 'leonberg', 'lhasa', 'maltese_dog',
            'mexican_hairless', 'newfoundland', 'norfolk_terrier', 'norwegian_elkhound',
            'norwich_terrier', 'old_english_sheepdog', 'otterhound', 'papillon',
            'pekinese', 'pembroke', 'pomeranian', 'pug', 'redbone',
            'rhodesian_ridgeback', 'saluki', 'schipperke', 'scotch_terrier',
            'scottish_deerhound', 'sealyham_terrier', 'shetland_sheepdog',
            'shih-tzu', 'silky_terrier', 'soft-coated_wheaten_terrier',
            'staffordshire_bullterrier', 'sussex_spaniel', 'tibetan_mastiff',
            'tibetan_terrier', 'toy_poodle', 'toy_terrier', 'vizsla',
            'walker_hound', 'weimaraner', 'welsh_springer_spaniel',
            'west_highland_white_terrier', 'whippet', 'wire-haired_fox_terrier',
            'yorkshire_terrier'
        ]
        
        cat_breeds = [
            'tabby', 'tiger_cat', 'persian_cat', 'siamese_cat',
            'egyptian_cat', 'cougar', 'lynx', 'leopard'
        ]
        
        bird_species = [
            'cock', 'hen', 'ostrich', 'brambling', 'goldfinch',
            'house_finch', 'junco', 'indigo_bunting', 'robin',
            'bulbul', 'jay', 'magpie', 'chickadee', 'water_ouzel',
            'kite', 'bald_eagle', 'vulture', 'great_grey_owl',
            'european_fire_salamander', 'common_newt', 'eft',
            'spotted_salamander', 'axolotl', 'bullfrog', 'tree_frog',
            'tailed_frog', 'loggerhead', 'leatherback_turtle',
            'mud_turtle', 'terrapin', 'box_turtle', 'banded_gecko',
            'common_iguana', 'american_chameleon', 'whiptail',
            'agama', 'frilled_lizard', 'alligator_lizard',
            'gila_monster', 'green_lizard', 'african_chameleon',
            'komodo_dragon', 'african_crocodile', 'american_alligator',
            'triceratops', 'thunder_snake', 'ringneck_snake',
            'hognose_snake', 'green_snake', 'king_snake',
            'garter_snake', 'water_snake', 'vine_snake',
            'night_snake', 'boa_constrictor', 'rock_python',
            'indian_cobra', 'green_mamba', 'sea_snake',
            'horned_viper', 'diamondback', 'sidewinder'
        ]
        
        results = []
        
        for pred in predictions:
            class_id, class_name, probability = pred
            
            # Determine species with better logic
            species = 'Unknown'
            breed = class_name.replace('_', ' ').title()
            
            # Check if it's a dog breed
            if class_name in dog_breeds:
                species = 'Dog'
            # Check if it's a cat breed
            elif class_name in cat_breeds:
                species = 'Cat'
                if 'cat' in class_name.lower():
                    breed = breed.replace(' Cat', '')
            # Check if it's a bird
            elif class_name in bird_species:
                species = 'Bird'
            # Fallback: Check for common keywords in the class name
            else:
                class_lower = class_name.lower()
                # Dog-related keywords
                if any(keyword in class_lower for keyword in ['dog', 'hound', 'terrier', 'retriever', 'shepherd', 'spaniel', 'poodle', 'bulldog', 'mastiff', 'collie']):
                    species = 'Dog'
                # Cat-related keywords
                elif any(keyword in class_lower for keyword in ['cat', 'feline']):
                    species = 'Cat'
                    if 'cat' in class_name.lower():
                        breed = breed.replace(' Cat', '')
                # Bird-related keywords
                elif any(keyword in class_lower for keyword in ['bird', 'parrot', 'eagle', 'owl', 'finch', 'sparrow']):
                    species = 'Bird'
                # If still unknown, try to infer from ImageNet class structure
                # Most dog breeds in ImageNet don't have 'dog' in the name
                # So if it's not explicitly a cat or bird, assume it's a dog
                elif probability > 0.3:  # Only if confidence is reasonable
                    species = 'Dog'  # Default to Dog for unknown high-confidence predictions
            
            results.append({
                'breed': breed,
                'species': species,
                'confidence': float(probability),
                'class_id': class_id,
                'raw_class': class_name
            })
        
        return results
