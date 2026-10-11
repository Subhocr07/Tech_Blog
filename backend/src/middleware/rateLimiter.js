import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
});
