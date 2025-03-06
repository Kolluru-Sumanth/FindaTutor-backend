import { 
    NotFoundError, 
    ForbiddenError, 
    UnauthorizedError, 
    ConflictError 
  } from '../utils/error';
  
  const errorHandler = (err, req, res, next) => {
    // Default error response
    let error = { 
      message: err.message || 'Internal Server Error',
      statusCode: err.statusCode || 500
    };
  
    // Handle specific error types
    if (err instanceof NotFoundError) {
      error.statusCode = 404;
    } else if (err instanceof ForbiddenError) {
      error.statusCode = 403;
    } else if (err instanceof UnauthorizedError) {
      error.statusCode = 401;
    } else if (err instanceof ConflictError) {
      error.statusCode = 409;
    }
  
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      error.statusCode = 400;
      error.message = Object.values(err.errors)
        .map(val => val.message)
        .join('. ');
    }
  
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      error.statusCode = 409;
      error.message = 'Duplicate field value entered';
    }
  
    // Handle invalid MongoDB ID errors
    if (err.name === 'CastError') {
      error.statusCode = 404;
      error.message = 'Resource not found';
    }
  
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'Token expired';
    }
  
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
      error.stack = err.stack;
    }
  
    // Send response
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  };

  class ConflictError extends Error {
    constructor(message = 'Conflict occurred') {
      super(message);
      this.name = 'ConflictError';
      this.statusCode = 409;
    }
  }
  
  class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
      super(message);
      this.name = 'ForbiddenError';
      this.statusCode = 403;
    }
  }
  
  // Export all errors and the error handler
  export {
    NotFoundError,
    ForbiddenError,
    UnauthorizedError,
    ConflictError,
    errorHandler as default
  };