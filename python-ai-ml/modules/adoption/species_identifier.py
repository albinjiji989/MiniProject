"""
Species identification service for Adoption module
"""
import logging
from utils.image_processor import ImageProcessor
from utils.model_loader import ModelLoader

logger = logging.getLogger(__name__)

class AdoptionSpeciesIdentifier:
    """Identify species for adoption center pets"""
    
    def __init__(self):
        self.model_loader = ModelLoader()
        self.image_processor = ImageProcessor()
        self.model = None
    
    def initialize(self):
        """Initialize the model"""
        self.model = self.model_loader.load_mobilenet_v2()
    
    def identify(self, image_source):
        """Identify species and breed for adoption pets"""
        if self.model is None:
            self.initialize()
        
        img_array = self.image_processor.load_and_preprocess_image(image_source)
        predictions = self.model.predict(img_array, verbose=0)
        decoded = self.model_loader.decode_predictions(predictions, top=5)
        pet_info = self.model_loader.map_to_pet_info(decoded)
        
        return {
            'success': True,
            'predictions': pet_info,
            'module': 'adoption'
        }
