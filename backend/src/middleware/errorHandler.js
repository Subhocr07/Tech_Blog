import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid format for field: ${err.path}`, 'INVALID_ID_FORMAT');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`An item with this ${field} already exists`, 'DUPLICATE_KEY_ERROR');
  }

  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token', 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired', 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';

  const response = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.error.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error(`${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};
