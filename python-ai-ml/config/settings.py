"""
Configuration settings for AI/ML service
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    
    # Server Configuration
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # Model Configuration
    MODEL_TYPE = os.getenv('MODEL_TYPE', 'MobileNetV2')
    MODEL_WEIGHTS = os.getenv('MODEL_WEIGHTS', 'imagenet')
    CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', 0.5))
    
    # Image Processing
    MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', 1024))
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    TARGET_SIZE = (224, 224)  # MobileNetV2 input size
    SAVE_IMAGES_TO_DISK = os.getenv('SAVE_IMAGES_TO_DISK', 'false').lower() == 'true'
    
    # Cloudinary Configuration (Optional)
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')
    CLOUDINARY_UPLOAD_PRESET = os.getenv('CLOUDINARY_UPLOAD_PRESET', 'ai_identified_pets')
    CLOUDINARY_FOLDER = os.getenv('CLOUDINARY_FOLDER', 'ai-ml/identified-pets')
    
    # Backend Integration
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
    BACKEND_API_KEY = os.getenv('BACKEND_API_KEY', '')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'ai_service.log')
    
    # Performance
    ENABLE_GPU = os.getenv('ENABLE_GPU', 'false').lower() == 'true'
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 1))
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODELS_DIR = os.path.join(BASE_DIR, 'models')
    UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
    
    @staticmethod
    def init_app(app):
        """Initialize application with config"""
        # Create necessary directories
        os.makedirs(Config.MODELS_DIR, exist_ok=True)
        os.makedirs(Config.UPLOAD_DIR, exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
