import { ActivityLog } from '../models/ActivityLog.js';

const sanitizePayload = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  const sanitized = { ...obj };
  const sensitiveKeys = [
    'password',
    'confirmPassword',
    'refreshToken',
    'accessToken',
    'token',
    'secret',
    'authorization',
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      delete sanitized[key];
    }
  }

  return sanitized;
};

export const logActivity = async (action, req, customDetails = {}) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = req.user?.id || req.user?._id || null;
    const userEmail = req.user?.email || req.body?.email || null;

    const details = sanitizePayload({
      ...customDetails,
      params: req.params,
      method: req.method,
      path: req.originalUrl,
    });

    await ActivityLog.create({
      action,
      user: userId,
      userEmail,
      ip: typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown',
      userAgent,
      details,
    });
  } catch (err) {
    console.error(`Failed to log activity '${action}':`, err.message);
  }
};

export const recordActivity = (actionName) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity(actionName, req);
      }
    });
    next();
  };
};
