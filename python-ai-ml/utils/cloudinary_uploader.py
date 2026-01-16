"""
Cloudinary integration for AI/ML service
Upload identified pet images to Cloudinary (optional)
"""
import os
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

class CloudinaryUploader:
    """Handle Cloudinary uploads for identified pet images"""
    
    def __init__(self):
        self.enabled = False
        self.cloudinary = None
        
        # Check if Cloudinary is configured
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '')
        api_key = os.getenv('CLOUDINARY_API_KEY', '')
        api_secret = os.getenv('CLOUDINARY_API_SECRET', '')
        
        if cloud_name and api_key and api_secret:
            try:
                import cloudinary
                import cloudinary.uploader
                
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret
                )
                
                self.cloudinary = cloudinary
                self.enabled = True
                logger.info("✅ Cloudinary integration enabled")
            except ImportError:
                logger.warning("⚠️ Cloudinary package not installed. Install with: pip install cloudinary")
            except Exception as e:
                logger.error(f"❌ Failed to configure Cloudinary: {str(e)}")
        else:
            logger.info("ℹ️ Cloudinary not configured (optional)")
    
    def upload_image(self, image_bytes, filename, metadata=None):
        """
        Upload image to Cloudinary
        
        Args:
            image_bytes: Image data as bytes
            filename: Original filename
            metadata: Dict with breed, species, confidence, etc.
            
        Returns:
            Dict with Cloudinary URL and public_id, or None if failed
        """
        if not self.enabled:
            return None
        
        try:
            folder = os.getenv('CLOUDINARY_FOLDER', 'ai-ml/identified-pets')
            
            # Prepare upload options
            upload_options = {
                'folder': folder,
                'resource_type': 'image',
                'format': 'jpg',
                'quality': 'auto',
                'fetch_format': 'auto'
            }
            
            # Add metadata as context
            if metadata:
                context = {
                    'breed': metadata.get('breed', 'Unknown'),
                    'species': metadata.get('species', 'Unknown'),
                    'confidence': str(metadata.get('confidence', 0)),
                    'model': metadata.get('model', 'MobileNetV2')
                }
                upload_options['context'] = '|'.join([f"{k}={v}" for k, v in context.items()])
            
            # Upload to Cloudinary
            result = self.cloudinary.uploader.upload(
                image_bytes,
                **upload_options
            )
            
            logger.info(f"✅ Image uploaded to Cloudinary: {result['secure_url']}")
            
            return {
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'format': result['format'],
                'width': result['width'],
                'height': result['height']
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to upload to Cloudinary: {str(e)}")
            return None
    
    def delete_image(self, public_id):
        """
        Delete image from Cloudinary
        
        Args:
            public_id: Cloudinary public ID
            
        Returns:
            bool: True if successful
        """
        if not self.enabled:
            return False
        
        try:
            result = self.cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            logger.error(f"❌ Failed to delete from Cloudinary: {str(e)}")
            return False
