"""
Image processing utilities for AI/ML models
"""
import numpy as np
from PIL import Image
import cv2
import io
from tensorflow.keras.preprocessing import image as keras_image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

class ImageProcessor:
    """Handle image preprocessing for AI models"""
    
    @staticmethod
    def load_and_preprocess_image(image_source, target_size=(224, 224)):
        """
        Load and preprocess image for MobileNetV2
        
        Args:
            image_source: Can be file path, file object, or bytes
            target_size: Target size tuple (height, width)
            
        Returns:
            Preprocessed image array ready for model input
        """
        try:
            # Handle different input types
            if isinstance(image_source, bytes):
                # Image as bytes
                img = Image.open(io.BytesIO(image_source))
            elif isinstance(image_source, str):
                # Image path
                img = Image.open(image_source)
            elif hasattr(image_source, 'read'):
                # File-like object
                img = Image.open(image_source)
            else:
                raise ValueError("Invalid image source type")
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            
            # Convert to array
            img_array = keras_image.img_to_array(img)
            
            # Expand dimensions for batch
            img_array = np.expand_dims(img_array, axis=0)
            
            # Preprocess for MobileNetV2
            img_array = preprocess_input(img_array)
            
            return img_array
            
        except Exception as e:
            raise ValueError(f"Error processing image: {str(e)}")
    
    @staticmethod
    def validate_image(file):
        """
        Validate uploaded image file
        
        Args:
            file: Uploaded file object
            
        Returns:
            bool: True if valid, raises exception otherwise
        """
        try:
            # Check if file exists
            if not file:
                raise ValueError("No file provided")
            
            # Check file extension
            filename = file.filename.lower()
            allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
            
            if not any(filename.endswith(ext) for ext in allowed_extensions):
                raise ValueError(f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
            
            # Try to open image
            file.seek(0)  # Reset file pointer
            img = Image.open(file)
            img.verify()
            
            # Reset file pointer for further processing
            file.seek(0)
            
            return True
            
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")
    
    @staticmethod
    def get_image_bytes(file):
        """
        Get image as bytes from file object
        
        Args:
            file: File object
            
        Returns:
            bytes: Image data
        """
        file.seek(0)
        return file.read()
    
    @staticmethod
    def resize_image_bytes(image_bytes, max_size=1024):
        """
        Resize image if too large (in memory)
        
        Args:
            image_bytes: Image data as bytes
            max_size: Maximum dimension size
            
        Returns:
            bytes: Resized image data
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # Check if resize needed
            if max(img.size) <= max_size:
                return image_bytes
            
            # Calculate new size maintaining aspect ratio
            ratio = max_size / max(img.size)
            new_size = tuple([int(dim * ratio) for dim in img.size])
            
            # Resize
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85)
            output.seek(0)
            
            return output.read()
            
        except Exception as e:
            raise ValueError(f"Error resizing image: {str(e)}")
    
    @staticmethod
    def extract_features(image_array, model):
        """
        Extract features from image using model
        
        Args:
            image_array: Preprocessed image array
            model: Keras model
            
        Returns:
            Feature vector
        """
        try:
            features = model.predict(image_array, verbose=0)
            return features
        except Exception as e:
            raise ValueError(f"Error extracting features: {str(e)}")

