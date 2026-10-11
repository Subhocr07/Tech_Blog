import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { recordActivity } from '../middleware/activityLogger.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator.js';
import { setRefreshTokenCookie } from '../utils/token.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();
const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  recordActivity('USER_REGISTER'),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  recordActivity('USER_LOGIN'),
  AuthController.login
);

router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema),
  AuthController.refresh
);

router.post(
  '/logout',
  authenticate,
  recordActivity('USER_LOGOUT'),
  AuthController.logout
);

router.get('/me', authenticate, AuthController.getMe);

router.patch(
  '/profile',
  authenticate,
  uploadAvatar.single('avatar'),
  recordActivity('USER_UPDATE_PROFILE'),
  AuthController.updateProfile
);

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID?.trim() || !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent('Google OAuth is not configured with credentials in backend/.env')}`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (req.query.error) {
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(`Google authentication cancelled: ${req.query.error}`)}`);
  }

  passport.authenticate('google', { session: false }, (err, authData, info) => {
    if (err || !authData) {
      const msg = err?.message || info?.message || 'Google authentication failed';
      return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(msg)}`);
    }

    setRefreshTokenCookie(res, authData.refreshToken);
    return res.redirect(`${getClientUrl()}/oauth-callback?token=${authData.accessToken}`);
  })(req, res, next);
});

router.get('/facebook', (req, res, next) => {
  if (!process.env.FACEBOOK_CLIENT_ID?.trim() || !process.env.FACEBOOK_CLIENT_SECRET?.trim()) {
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent('Facebook OAuth is not configured with credentials in backend/.env')}`);
  }
  passport.authenticate('facebook', { scope: ['email'], session: false })(req, res, next);
});

router.get('/facebook/callback', (req, res, next) => {
  if (req.query.error) {
    return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(`Facebook authentication cancelled: ${req.query.error}`)}`);
  }

  passport.authenticate('facebook', { session: false }, (err, authData, info) => {
    if (err || !authData) {
      const msg = err?.message || info?.message || 'Facebook authentication failed';
      return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(msg)}`);
    }

    setRefreshTokenCookie(res, authData.refreshToken);
    return res.redirect(`${getClientUrl()}/oauth-callback?token=${authData.accessToken}`);
  })(req, res, next);
});

export default router;
