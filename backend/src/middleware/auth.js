import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication token missing. Please sign in.', 'NO_TOKEN');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expired. Please refresh your session.', 'TOKEN_EXPIRED');
      }
      throw ApiError.unauthorized('Invalid authentication token.', 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated.', 'ACCOUNT_DEACTIVATED');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Unauthenticated user', 'NOT_AUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
};
