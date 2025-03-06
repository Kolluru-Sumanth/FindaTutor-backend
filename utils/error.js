class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'NotFoundError';
      this.statusCode = 404;
    }
  }
  
  class ConflictError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ConflictError';
      this.statusCode = 409;
    }
  }
  
  class UnauthorizedError extends Error {
    constructor(message) {
      super(message);
      this.name = 'UnauthorizedError';
      this.statusCode = 403;
    }
  }
  
  module.exports = { NotFoundError, ConflictError, UnauthorizedError };