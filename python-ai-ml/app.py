"""
Pet Care AI/ML Service - Main Application
Flask REST API for pet breed and species identification
"""
import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import time

from config.settings import config
from modules.petshop.breed_identifier import PetshopBreedIdentifier
from modules.adoption.species_identifier import AdoptionSpeciesIdentifier
from utils.image_processor import ImageProcessor
from utils.cloudinary_uploader import CloudinaryUploader
from routes.recommendation_routes import recommendation_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(config['development'])
CORS(app)  # Enable CORS for Node.js backend integration

# Initialize AI services
petshop_identifier = PetshopBreedIdentifier()
adoption_identifier = AdoptionSpeciesIdentifier()
image_processor = ImageProcessor()
cloudinary_uploader = CloudinaryUploader()

# Check if we should save images to disk (default: false)
SAVE_TO_DISK = app.config.get('SAVE_IMAGES_TO_DISK', False)

# Create upload directory only if saving to disk
if SAVE_TO_DISK:
    UPLOAD_FOLDER = app.config['UPLOAD_DIR']
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    logger.info(f"📁 Saving images to disk: {UPLOAD_FOLDER}")
else:
    logger.info("💾 Processing images in memory only (not saving to disk)")

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Pet Care AI/ML Service is running',
        'version': '1.0.0',
        'model': 'MobileNetV2',
        'endpoints': {
            'petshop_breed': '/api/petshop/identify-breed',
            'petshop_species': '/api/petshop/identify-species',
            'adoption_identify': '/api/adoption/identify',
            'health': '/health'
        }
    })

@app.route('/health', methods=['GET'])
def health():
    """Detailed health check"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': time.time(),
        'services': {
            'petshop_identifier': 'ready',
            'adoption_identifier': 'ready'
        }
    })

@app.route('/api/petshop/identify-breed', methods=['POST'])
def petshop_identify_breed():
    """
    Identify pet breed for petshop module
    
    Request:
        - image: Image file (multipart/form-data)
        - top_k: Number of predictions (optional, default=5)
        - upload_to_cloudinary: Upload to Cloudinary (optional, default=false)
        
    Response:
        - predictions: List of breed predictions with confidence
        - primary_breed: Most likely breed
        - primary_species: Most likely species
        - processing_time: Time taken for inference
        - cloudinary_url: URL if uploaded to Cloudinary
    """
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type. Allowed: jpg, jpeg, png, webp'
            }), 400
        
        # Validate image
        try:
            image_processor.validate_image(file)
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
        
        # Get image as bytes (process in memory)
        image_bytes = image_processor.get_image_bytes(file)
        
        # Get top_k parameter
        top_k = request.form.get('top_k', 5, type=int)
        upload_to_cloudinary = request.form.get('upload_to_cloudinary', 'false').lower() == 'true'
        
        # Identify breed (using in-memory image)
        logger.info(f"Processing breed identification request (in-memory)")
        result = petshop_identifier.identify_breed(image_bytes, top_k=top_k)
        
        # Optionally upload to Cloudinary
        cloudinary_url = None
        if upload_to_cloudinary and result['success'] and result['predictions']:
            top_prediction = result['predictions'][0]
            metadata = {
                'breed': top_prediction['breed'],
                'species': top_prediction['species'],
                'confidence': top_prediction['confidence'],
                'model': 'MobileNetV2'
            }
            
            cloudinary_result = cloudinary_uploader.upload_image(
                image_bytes,
                file.filename,
                metadata
            )
            
            if cloudinary_result:
                cloudinary_url = cloudinary_result['url']
                logger.info(f"✅ Image uploaded to Cloudinary: {cloudinary_url}")
        
        if result['success']:
            response_data = result.copy()
            if cloudinary_url:
                response_data['cloudinary_url'] = cloudinary_url
            
            return jsonify({
                'success': True,
                'data': response_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Identification failed')
            }), 500
            
    except Exception as e:
        logger.error(f"Error in breed identification: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/petshop/identify-species', methods=['POST'])
def petshop_identify_species():
    """
    Identify only species (Dog, Cat, Bird, etc.) for petshop
    
    Request:
        - image: Image file
        
    Response:
        - species: Identified species
        - confidence: Confidence score
    """
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type'
            }), 400
        
        # Get image as bytes (process in memory)
        image_bytes = image_processor.get_image_bytes(file)
        
        # Identify species
        result = petshop_identifier.identify_species_only(image_bytes)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Identification failed')
            }), 500
            
    except Exception as e:
        logger.error(f"Error in species identification: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/adoption/identify', methods=['POST'])
def adoption_identify():
    """
    Identify species and breed for adoption module
    
    Request:
        - image: Image file
        
    Response:
        - predictions: List of species/breed predictions
    """
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type'
            }), 400
        
        # Get image as bytes (process in memory)
        image_bytes = image_processor.get_image_bytes(file)
        
        # Identify
        result = adoption_identifier.identify(image_bytes)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
            
    except Exception as e:
        logger.error(f"Error in adoption identification: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/petshop/breed-suggestions', methods=['POST'])
def breed_suggestions():
    """
    Get breed suggestions filtered by species
    
    Request:
        - image: Image file
        - species: Filter by species (optional)
        
    Response:
        - predictions: Filtered breed suggestions
    """
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        species_filter = request.form.get('species', None)
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type'
            }), 400
        
        # Get image as bytes (process in memory)
        image_bytes = image_processor.get_image_bytes(file)
        
        # Get suggestions
        result = petshop_identifier.get_breed_suggestions(image_bytes, species_filter)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to get suggestions')
            }), 500
            
    except Exception as e:
        logger.error(f"Error getting breed suggestions: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Register ML Recommendation Blueprint
app.register_blueprint(recommendation_bp)

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("🤖 Pet Care AI/ML Service Starting...")
    logger.info("=" * 60)
    
    # Initialize models on startup
    try:
        logger.info("Initializing AI models...")
        petshop_identifier.initialize()
        adoption_identifier.initialize()
        logger.info("✅ All models initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize models: {str(e)}")
        logger.error("Service will start but models will load on first request")
    
    logger.info("=" * 60)
    logger.info(f"🚀 Server starting on http://{app.config['FLASK_HOST']}:{app.config['FLASK_PORT']}")
    logger.info("=" * 60)
    
    app.run(
        host=app.config['FLASK_HOST'],
        port=app.config['FLASK_PORT'],
        debug=app.config['DEBUG']
    )