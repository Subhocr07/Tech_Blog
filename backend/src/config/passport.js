import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { User } from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';

export const handleOAuthUser = async (profile, provider) => {
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : null;
  const rawName = (profile.displayName || profile.name?.givenName || `${provider} User`).trim();
  const name = rawName.slice(0, 50) || `${provider} User`;
  const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
  const providerId = profile.id;

  if (!email) {
    throw new Error(`Email permission required for ${provider} authentication`);
  }

  let user = await User.findOne({
    $or: [{ provider, providerId }, { email }],
  });

  if (user) {
    if (user.provider !== provider) {
      if (user.provider === 'local') {
        throw new Error('An account already exists with this email address. Please sign in with your email and password.');
      } else {
        const existingProvider = user.provider === 'google' ? 'Google' : user.provider === 'facebook' ? 'Facebook' : user.provider;
        throw new Error(`An account already exists with this email address using ${existingProvider}. Please sign in with ${existingProvider}.`);
      }
    }
    if (avatar && !user.avatar) {
      user.avatar = avatar;
    }
  } else {
    user = new User({
      name,
      email,
      provider,
      providerId,
      avatar: avatar || undefined,
      role: 'user',
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

export const configurePassport = () => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim() || 'http://localhost:5000/api/v1/auth/google/callback';

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const authResult = await handleOAuthUser(profile, 'google');
            return done(null, authResult);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }

  const fbClientId = process.env.FACEBOOK_CLIENT_ID?.trim();
  const fbClientSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim();
  const fbCallbackUrl = process.env.FACEBOOK_CALLBACK_URL?.trim() || 'http://localhost:5000/api/v1/auth/facebook/callback';

  if (fbClientId && fbClientSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: fbClientId,
          clientSecret: fbClientSecret,
          callbackURL: fbCallbackUrl,
          profileFields: ['id', 'displayName', 'photos', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const authResult = await handleOAuthUser(profile, 'facebook');
            return done(null, authResult);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  return passport;
};
