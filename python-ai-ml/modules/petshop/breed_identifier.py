"""
Pet breed identification service for Petshop module
Uses MobileNetV2 for real-time breed recognition
"""
import logging
import time
from utils.image_processor import ImageProcessor
from utils.model_loader import ModelLoader

logger = logging.getLogger(__name__)

class PetshopBreedIdentifier:
    """Identify pet breeds for petshop inventory"""
    
    def __init__(self):
        self.model_loader = ModelLoader()
        self.image_processor = ImageProcessor()
        self.model = None
    
    def initialize(self):
        """Initialize the model"""
        try:
            logger.info("Initializing Petshop Breed Identifier...")
            self.model = self.model_loader.load_mobilenet_v2()
            logger.info("✅ Petshop Breed Identifier ready")
        except Exception as e:
            logger.error(f"❌ Failed to initialize: {str(e)}")
            raise
    
    def identify_breed(self, image_source, top_k=5):
        """
        Identify pet breed from image
        
        Args:
            image_source: Image as bytes, file path, or file object
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary with predictions and metadata
        """
        start_time = time.time()
        
        try:
            # Ensure model is loaded
            if self.model is None:
                self.initialize()
            
            # Preprocess image (works with bytes, path, or file object)
            logger.info("Processing image in memory...")
            img_array = self.image_processor.load_and_preprocess_image(image_source)
            
            # Make prediction
            logger.info("Running inference...")
            predictions = self.model.predict(img_array, verbose=0)
            
            # Decode predictions
            decoded = self.model_loader.decode_predictions(predictions, top=top_k)
            
            # Map to pet information
            pet_info = self.model_loader.map_to_pet_info(decoded)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Filter results with confidence threshold
            filtered_results = [
                result for result in pet_info 
                if result['confidence'] >= 0.1  # 10% minimum confidence
            ]
            
            # Determine primary species
            primary_species = 'Unknown'
            if filtered_results:
                primary_species = filtered_results[0]['species']
            
            logger.info(f"✅ Identification complete in {processing_time:.3f}s")
            logger.info(f"Top prediction: {filtered_results[0]['breed'] if filtered_results else 'Unknown'} "
                       f"({filtered_results[0]['confidence']*100:.1f}%)" if filtered_results else "No confident predictions")
            
            return {
                'success': True,
                'predictions': filtered_results,
                'primary_species': primary_species,
                'primary_breed': filtered_results[0]['breed'] if filtered_results else 'Unknown',
                'confidence': filtered_results[0]['confidence'] if filtered_results else 0.0,
                'processing_time': f"{processing_time:.3f}s",
                'model': 'MobileNetV2',
                'timestamp': time.time()
            }
            
        except Exception as e:
            logger.error(f"❌ Error identifying breed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'predictions': [],
                'processing_time': f"{time.time() - start_time:.3f}s"
            }
    
    def identify_species_only(self, image_source):
        """
        Identify only the species (Dog, Cat, Bird, etc.)
        
        Args:
            image_source: Image as bytes, file path, or file object
            
        Returns:
            Dictionary with species information
        """
        try:
            result = self.identify_breed(image_source, top_k=3)
            
            if result['success']:
                return {
                    'success': True,
                    'species': result['primary_species'],
                    'confidence': result['confidence'],
                    'processing_time': result['processing_time']
                }
            else:
                return result
                
        except Exception as e:
            logger.error(f"Error identifying species: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def batch_identify(self, image_sources):
        """
        Identify breeds for multiple images
        
        Args:
            image_sources: List of image sources (bytes, paths, or file objects)
            
        Returns:
            List of identification results
        """
        results = []
        
        for image_source in image_sources:
            result = self.identify_breed(image_source)
            results.append(result)
        
        return {
            'success': True,
            'results': results,
            'total_processed': len(image_sources)
        }
    
    def get_breed_suggestions(self, image_source, species_filter=None):
        """
        Get breed suggestions filtered by species
        
        Args:
            image_source: Image as bytes, file path, or file object
            species_filter: Filter results by species (e.g., 'Dog', 'Cat')
            
        Returns:
            Filtered breed suggestions
        """
        result = self.identify_breed(image_source, top_k=10)
        
        if not result['success']:
            return result
        
        if species_filter:
            filtered_predictions = [
                pred for pred in result['predictions']
                if pred['species'].lower() == species_filter.lower()
            ]
            
            result['predictions'] = filtered_predictions
            result['filtered_by'] = species_filter
        
        return result
