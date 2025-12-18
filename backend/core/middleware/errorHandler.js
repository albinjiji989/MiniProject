const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err);

  // Check if it's an operational error we created
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message,
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({
      success: false,
      message,
      errorCode: 'DUPLICATE_FIELD'
    });
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return res.status(404).json({
      success: false,
      message,
      errorCode: 'RESOURCE_NOT_FOUND'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return res.status(401).json({
      success: false,
      message,
      errorCode: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return res.status(401).json({
      success: false,
      message,
      errorCode: 'TOKEN_EXPIRED'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    errorCode: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err.toString()
    })
  });
};

module.exports = errorHandler;