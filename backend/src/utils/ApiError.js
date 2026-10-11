export class ApiError extends Error {
  constructor(
    statusCode,
    message = 'Something went wrong',
    errorCode = 'INTERNAL_ERROR',
    errors = null,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.success = false;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message, errorCode = 'BAD_REQUEST', errors = null) {
    return new ApiError(400, message, errorCode, errors);
  }

  static unauthorized(message = 'Unauthorized access', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = 'Forbidden resource', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message = 'Resource already exists', errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static unprocessable(message = 'Validation failed', errors = null, errorCode = 'VALIDATION_ERROR') {
    return new ApiError(422, message, errorCode, errors);
  }

  static tooManyRequests(message = 'Too many requests, please try again later', errorCode = 'RATE_LIMIT_EXCEEDED') {
    return new ApiError(429, message, errorCode);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_SERVER_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}
