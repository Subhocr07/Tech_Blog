import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';

export class AuthService {
  static async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.provider === 'google') {
        throw ApiError.conflict(
          'An account already exists with this email address using Google. Please sign in with Google.',
          'ACCOUNT_EXISTS_WITH_GOOGLE'
        );
      }
      if (existingUser.provider === 'facebook') {
        throw ApiError.conflict(
          'An account already exists with this email address using Facebook. Please sign in with Facebook.',
          'ACCOUNT_EXISTS_WITH_FACEBOOK'
        );
      }
      throw ApiError.conflict(
        'An account already exists with this email address. Please sign in with your email and password.',
        'EMAIL_ALREADY_EXISTS'
      );
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      provider: 'local',
    });

    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  static async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshToken');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED');
    }

    if (user.provider && user.provider !== 'local') {
      const providerLabel = user.provider === 'google' ? 'Google' : user.provider === 'facebook' ? 'Facebook' : user.provider;
      throw ApiError.badRequest(
        `This account was registered using ${providerLabel}. Please sign in with ${providerLabel}.`,
        'OAUTH_ACCOUNT_USE_OAUTH'
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(incomingRefreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw ApiError.unauthorized('Refresh token is invalid or has been revoked', 'REVOKED_REFRESH_TOKEN');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: user.toJSON(),
    };
  }

  static async logout(userId) {
    if (!userId) return;
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user.toJSON();
  }

  static async updateProfile(userId, { name, bio, avatar, currentPassword, newPassword } = {}) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    if (bio !== undefined && typeof bio === 'string') {
      user.bio = bio.trim();
    }

    if (avatar && typeof avatar === 'string') {
      user.avatar = avatar;
    }

    if (newPassword) {
      if (user.provider !== 'local') {
        throw ApiError.badRequest('Password change is not supported for Google/Facebook accounts', 'OAUTH_PASSWORD_CHANGE_NOT_SUPPORTED');
      }

      if (!currentPassword) {
        throw ApiError.badRequest('Current password is required to update your password', 'CURRENT_PASSWORD_REQUIRED');
      }

      const isCurrentValid = await user.comparePassword(currentPassword);
      if (!isCurrentValid) {
        throw ApiError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }

      if (newPassword.length < 6) {
        throw ApiError.badRequest('New password must be at least 6 characters long', 'PASSWORD_TOO_SHORT');
      }

      user.password = newPassword;
    }

    await user.save();
    return user.toJSON();
  }
}
