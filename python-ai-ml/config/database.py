"""
MongoDB Database Connection for Python ML Service
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')

_client = None
_db = None


def get_db():
    """Get MongoDB database instance"""
    global _client, _db
    
    if _db is None:
        try:
            if not MONGODB_URI:
                raise ValueError("MONGODB_URI environment variable is not set")
            
            logger.info(f"🔄 Connecting to MongoDB...")
            _client = MongoClient(MONGODB_URI)
            
            # Extract database name from URI
            # Format: mongodb+srv://user:pass@host/DATABASE?params
            if '/' in MONGODB_URI:
                db_name = MONGODB_URI.split('/')[-1].split('?')[0]
            else:
                db_name = 'PetWelfare'  # Default
            
            _db = _client[db_name]
            
            # Test connection
            _client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB database: {db_name}")
            
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {e}")
            raise
    
    return _db


def close_db():
    """Close MongoDB connection"""
    global _client, _db
    
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")
