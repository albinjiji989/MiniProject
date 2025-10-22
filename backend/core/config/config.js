require('dotenv').config();

module.exports = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  
  // MongoDB configuration
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/petshop',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE || 30,
  
  // Email configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_EMAIL: process.env.SMTP_EMAIL || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@petshop.com',
  FROM_NAME: process.env.FROM_NAME || 'PetShop',
  
  // File upload
  MAX_FILE_UPLOAD: process.env.MAX_FILE_UPLOAD || 1000000, // 1MB
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || 'public/uploads',
  
  // Geocoder configuration
  GEOCODER_PROVIDER: process.env.GEOCODER_PROVIDER || 'mapquest',
  GEOCODER_API_KEY: process.env.GEOCODER_API_KEY || 'your_geocoder_api_key',
  
  // Razorpay configuration
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Cache
  CACHE_ENABLED: process.env.CACHE_ENABLED === 'true' || false,
  CACHE_TTL: process.env.CACHE_TTL || 300, // 5 minutes
  
  // Security
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
  XSS_ENABLED: process.env.XSS_ENABLED !== 'false',
  HPP_ENABLED: process.env.HPP_ENABLED !== 'false',
  
  // API documentation
  API_DOCS_ENABLED: process.env.NODE_ENV !== 'production' || process.env.API_DOCS_ENABLED === 'true',
  
  // Debug mode
  DEBUG_MODE: process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV !== 'production'
};
