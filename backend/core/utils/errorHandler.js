/**
 * Standardized error response formatter
 */
class ErrorHandler {
  /**
   * Handle controller errors consistently
   * @param {Object} res - Express response object
   * @param {Error} error - The error object
   * @param {String} context - Context where error occurred (e.g., 'pet_creation', 'user_authentication')
   * @param {Number} statusCode - HTTP status code (default: 500)
   */
  static handleControllerError(res, error, context, statusCode = 500) {
    // Log the actual error for debugging
    console.error(`[${context}] Error:`, error);
    
    // For validation errors, provide more specific feedback
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
        context
      });
    }
    
    // For cast errors (e.g., invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        context
      });
    }
    
    // For duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry detected',
        context
      });
    }
    
    // Default error response
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'An unexpected error occurred',
      context
    });
  }
  
  /**
   * Create a standardized success response
   * @param {Object} res - Express response object
   * @param {Object} data - Data to send in response
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code (default: 200)
   */
  static sendSuccess(res, data = {}, message = 'Operation completed successfully', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
  
  /**
   * Create a standardized error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code (default: 400)
   * @param {Object} additionalData - Additional data to include in response
   */
  static sendError(res, message = 'Operation failed', statusCode = 400, additionalData = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...additionalData
    });
  }
}

module.exports = ErrorHandler;